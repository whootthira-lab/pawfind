// app/api/generate-og/route.ts
// ── Node.js runtime (ไม่ใช่ Edge) → รองรับ Sharp + Thai font เต็มรูปแบบ ──
//
// Flow:
//   POST { petId } → ดึงข้อมูล pet → วาดรูป 1200×630 → upload Supabase Storage
//   → update pets.og_image_url → return { url }
//
// เรียกใช้หลัง report สัตว์สำเร็จ:
//   await fetch('/api/generate-og', { method:'POST', body: JSON.stringify({ petId }) })

export const runtime = 'nodejs'   // ← สำคัญ: ต้อง Node.js ไม่ใช่ edge

import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import path from 'path'
import fs from 'fs/promises'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawfind-eta.vercel.app'

// ── สี Origami Papercraft ──────────────────────────────────
const COLORS = {
  cream:     '#F5EDD8',
  ink:       '#1A1208',
  inkRgb:    { r:26,  g:18,  b:8   },
  creamRgb:  { r:245, g:237, b:216 },
  lost:      { bg:'#FDEEE8', text:'#D94F1E', rgb:{r:217,g:79,b:30}   },
  found:     { bg:'#E8F3E8', text:'#2D6A2D', rgb:{r:45, g:106,b:45}  },
  adoption:  { bg:'#E3EEF8', text:'#1A5EA8', rgb:{r:26, g:94, b:168} },
}

// ── hex → RGB ─────────────────────────────────────────────
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return {r,g,b}
}

// ── Fetch รูปสัตว์ → Buffer ────────────────────────────────
async function fetchPetImage(url: string): Promise<Buffer | null> {
  if (!url || !url.startsWith('http')) return null
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    return Buffer.from(buf)
  } catch {
    return null
  }
}

// ── SVG text wrapper (รองรับ Thai ผ่าน fontFamily) ─────────
function svgText(opts: {
  text: string; x: number; y: number;
  size: number; weight?: number; color?: string; anchor?: string
}) {
  const anchor = opts.anchor || 'start'
  const color  = opts.color  || '#1A1208'
  const weight = opts.weight || 400
  return `<text
    x="${opts.x}" y="${opts.y}"
    font-size="${opts.size}"
    font-weight="${weight}"
    font-family="Noto Sans Thai, sans-serif"
    fill="${color}"
    text-anchor="${anchor}"
    dominant-baseline="auto"
  >${opts.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</text>`
}

// ── สร้าง SVG overlay (ข้อมูลสัตว์ทั้งหมด) ─────────────────
function buildSvg(opts: {
  name: string; breed: string; province: string
  status: string; reward: number; hasImage: boolean
}): string {
  const cfg = (COLORS as any)[opts.status] || COLORS.lost
  const statusLabel: Record<string,string> = {
    lost:'ตามหาเจ้าของ', found:'พบน้องหลงทาง', adoption:'หาบ้านใหม่'
  }
  const label = statusLabel[opts.status] || opts.status
  const leftW = opts.hasImage ? 460 : 0
  const rightX = leftW + 48

  // ตัดชื่อถ้ายาวเกิน
  const displayName = opts.name.length > 12
    ? opts.name.slice(0,11) + '…'
    : opts.name

  return `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;700;900&amp;display=swap');
    </style>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="${COLORS.cream}"/>

  <!-- Grid paper pattern -->
  <defs>
    <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
      <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(100,80,40,.08)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#grid)"/>

  ${opts.hasImage ? `<!-- Divider line -->
  <line x1="${leftW}" y1="0" x2="${leftW}" y2="630" stroke="${COLORS.ink}" stroke-width="4"/>` : ''}

  <!-- Right panel info -->

  <!-- Brand row -->
  <text x="${rightX}" y="68"
    font-size="20" font-weight="700"
    font-family="Noto Sans Thai, sans-serif"
    fill="#7A6A50">🐾 PobPet · ตามหาน้อง</text>

  <!-- Pet Name -->
  <text x="${rightX}" y="${opts.name.length > 8 ? 158 : 170}"
    font-size="${opts.name.length > 10 ? 62 : 74}"
    font-weight="900"
    font-family="Noto Sans Thai, sans-serif"
    fill="${COLORS.ink}">${displayName}</text>

  <!-- Breed -->
  ${opts.breed ? `<text x="${rightX}" y="210"
    font-size="26" font-weight="600"
    font-family="Noto Sans Thai, sans-serif"
    fill="#5A4E46">${opts.breed.slice(0,20)}</text>` : ''}

  <!-- Location pill -->
  <rect x="${rightX}" y="228" width="${Math.min(opts.province.length * 18 + 80, 360)}" height="50"
    rx="25" fill="white" stroke="${COLORS.ink}" stroke-width="2.5"/>
  <text x="${rightX + 44}" y="260"
    font-size="24" font-weight="700"
    font-family="Noto Sans Thai, sans-serif"
    fill="${COLORS.ink}">📍 ${opts.province || 'ไม่ระบุพื้นที่'}</text>

  <!-- Status pill -->
  <rect x="${rightX}" y="296" width="240" height="46"
    rx="23" fill="${cfg.bg}" stroke="${cfg.text}" stroke-width="2.5"/>
  <text x="${rightX + 20}" y="326"
    font-size="22" font-weight="700"
    font-family="Noto Sans Thai, sans-serif"
    fill="${cfg.text}">${label}</text>

  ${opts.reward > 0 ? `<!-- Reward pill -->
  <rect x="${rightX}" y="356" width="280" height="46"
    rx="23" fill="#FEF8DC" stroke="#E8B800" stroke-width="2.5"/>
  <text x="${rightX + 20}" y="386"
    font-size="22" font-weight="700"
    font-family="Noto Sans Thai, sans-serif"
    fill="#A07800">💰 มีรางวัล ${opts.reward.toLocaleString()} บาท</text>` : ''}

  <!-- CTA box -->
  <rect x="${rightX}" y="490" width="${1200 - rightX - 48}" height="72"
    rx="12" fill="${COLORS.ink}"/>
  <!-- CTA shadow -->
  <rect x="${rightX + 4}" y="494" width="${1200 - rightX - 48}" height="72"
    rx="12" fill="rgba(0,0,0,.15)" style="z-index:-1"/>
  <text x="${rightX + (1200 - rightX - 48)/2}" y="535"
    font-size="26" font-weight="700"
    font-family="Noto Sans Thai, sans-serif"
    fill="#F5EDD8"
    text-anchor="middle">ช่วยแชร์เพื่อส่งน้องกลับบ้าน 🏠</text>

  <!-- Domain -->
  <text x="${rightX + (1200 - rightX - 48)/2}" y="590"
    font-size="18" font-weight="500"
    font-family="Noto Sans Thai, sans-serif"
    fill="#9A8E86"
    text-anchor="middle">pawfind-eta.vercel.app</text>

  <!-- Corner badge -->
  <rect x="1100" y="0" width="100" height="100"
    fill="${cfg.text}"
    stroke="${COLORS.ink}" stroke-width="4"/>
  <line x1="1100" y1="0" x2="1100" y2="100" stroke="${COLORS.ink}" stroke-width="4"/>
  <line x1="1100" y1="100" x2="1200" y2="100" stroke="${COLORS.ink}" stroke-width="4"/>
  <text x="1150" y="62"
    font-size="40" text-anchor="middle">🐾</text>
</svg>`
}

// ════════════════════════════════════════════════════════
// POST handler
// ════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const { petId } = await req.json()
    if (!petId) return NextResponse.json({ error: 'petId required' }, { status: 400 })

    // ── 1. ดึงข้อมูล pet ────────────────────────────────
    const supabase = await createClient()
    const { data: pet, error: petErr } = await supabase
      .from('pets')
      .select('id, name, status, breed, province, reward_amount, pet_images(storage_url, is_primary), image_url')
      .eq('id', petId)
      .single()

    if (petErr || !pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    // ── 2. หา primary image URL ──────────────────────────
    const images     = (pet.pet_images as any[]) || []
    const primaryRaw = images.find((i:any) => i.is_primary)?.storage_url
                    || images[0]?.storage_url
                    || pet.image_url
                    || ''
    const imageUrl = primaryRaw.startsWith('http') ? primaryRaw : ''

    // ── 3. โหลดรูปสัตว์ ──────────────────────────────────
    const petImageBuf = imageUrl ? await fetchPetImage(imageUrl) : null
    const hasImage    = !!petImageBuf

    // ── 4. สร้าง Canvas 1200×630 ──────────────────────────
    const W = 1200, H = 630
    const leftW = hasImage ? 460 : 0

    // สร้าง SVG overlay ก่อน
    const svgOverlay = buildSvg({
      name:     pet.name || 'ไม่ทราบชื่อ',
      breed:    pet.breed || '',
      province: pet.province || '',
      status:   pet.status,
      reward:   pet.reward_amount || 0,
      hasImage,
    })

    // Base canvas จาก SVG
    const baseImage = await sharp(Buffer.from(svgOverlay))
      .resize(W, H)
      .png()
      .toBuffer()

    let finalBuffer: Buffer

    if (hasImage && petImageBuf) {
      // Resize รูปสัตว์เป็น 460×630 แล้ว composite
      const petResized = await sharp(petImageBuf)
        .resize(leftW, H, { fit: 'cover', position: 'center' })
        .png()
        .toBuffer()

      finalBuffer = await sharp(baseImage)
        .composite([
          { input: petResized, top: 0, left: 0 },   // รูปสัตว์ทับ
        ])
        .png()
        .toBuffer()
    } else {
      finalBuffer = baseImage
    }

    // ── 5. Upload ไปยัง Supabase Storage ─────────────────
    const admin    = createAdminClient()
    const fileName = `og/${petId}.png`

    const { error: uploadErr } = await admin.storage
      .from('pet-images')
      .upload(fileName, finalBuffer, {
        contentType: 'image/png',
        upsert: true,          // overwrite ถ้ามีอยู่แล้ว
      })

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr)
      return NextResponse.json({ error: uploadErr.message }, { status: 500 })
    }

    // ── 6. ดึง public URL ─────────────────────────────────
    const { data: urlData } = admin.storage
      .from('pet-images')
      .getPublicUrl(fileName)

    const ogUrl = urlData.publicUrl

    // ── 7. บันทึก URL กลับใน pets table ──────────────────
    await admin.from('pets')
      .update({ og_image_url: ogUrl })
      .eq('id', petId)

    return NextResponse.json({ ok: true, url: ogUrl })

  } catch (err) {
    console.error('[generate-og] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
