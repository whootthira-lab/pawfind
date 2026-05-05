// app/api/generate-og/route.ts
// ── Node.js runtime (ไม่ใช่ Edge) → รองรับ Sharp + Thai font เต็มรูปแบบ ──

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createAdminClient } from '@/lib/supabase/admin'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawfind-eta.vercel.app'

// ── สี Origami Papercraft ──────────────────────────────────
const COLORS = {
  cream:     '#F5EDD8',
  ink:       '#1A1208',
  lost:      { bg:'#FDEEE8', text:'#D94F1E' },
  found:     { bg:'#E8F3E8', text:'#2D6A2D' },
  adoption:  { bg:'#E3EEF8', text:'#1A5EA8' },
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

// 💡 1. ฟังก์ชันโหลดฟอนต์ภาษาไทย (ตัวหนา) และแปลงเป็น Base64 (แก้ปัญหาสระลอย/กล่องสี่เหลี่ยม)
let cachedFontBase64: string | null = null
async function getThaiFontBase64(): Promise<string> {
  if (cachedFontBase64) return cachedFontBase64
  try {
    const res = await fetch('https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSansThai/NotoSansThai-Bold.ttf')
    if (!res.ok) throw new Error('Failed to fetch font')
    const buf = await res.arrayBuffer()
    cachedFontBase64 = Buffer.from(buf).toString('base64')
    return cachedFontBase64
  } catch (err) {
    console.error('❌ Error loading Thai font:', err)
    return ''
  }
}

// ── สร้าง SVG overlay (ข้อมูลสัตว์ทั้งหมด) ─────────────────
function buildSvg(opts: {
  name: string; breed: string; province: string
  status: string; reward: number; hasImage: boolean
  fontB64: string // 💡 รับค่าฟอนต์ Base64
}): string {
  const cfg = (COLORS as any)[opts.status] || COLORS.lost
  const statusLabel: Record<string,string> = {
    lost:'ตามหาเจ้าของ', found:'พบน้องหลงทาง', adoption:'หาบ้านใหม่'
  }
  const label = statusLabel[opts.status] || opts.status
  
  // 💡 ปรับสัดส่วนรูปภาพให้กินพื้นที่ "ครึ่งหนึ่ง" ของความกว้างทั้งหมด (1200 / 2 = 600)[cite: 6]
  const leftW = opts.hasImage ? 600 : 0
  const rightX = leftW + 48 // ขยับข้อความไปทางขวาให้พ้นรูป

  const displayName = opts.name.length > 12
    ? opts.name.slice(0,11) + '…'
    : opts.name

  return `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      /* 💡 ฝังฟอนต์ลงไปตรงนี้เลย! */
      @font-face {
        font-family: 'Noto Sans Thai';
        src: url(data:font/truetype;charset=utf-8;base64,${opts.fontB64}) format('truetype');
      }
      text {
        font-family: 'Noto Sans Thai', sans-serif;
      }
    </style>
    <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
      <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(100,80,40,.08)" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="${COLORS.cream}"/>
  <rect width="1200" height="630" fill="url(#grid)"/>

  ${opts.hasImage ? `<!-- Divider line -->
  <line x1="${leftW}" y1="0" x2="${leftW}" y2="630" stroke="${COLORS.ink}" stroke-width="4"/>` : ''}

  <!-- Right panel info -->
  <text x="${rightX}" y="68"
    font-size="20" fill="#7A6A50">🐾 PobPet · ตามหาน้อง</text>

  <text x="${rightX}" y="${opts.name.length > 8 ? 158 : 170}"
    font-size="${opts.name.length > 10 ? 56 : 64}" 
    fill="${COLORS.ink}">${displayName}</text>

  ${opts.breed ? `<text x="${rightX}" y="210"
    font-size="24" fill="#5A4E46">${opts.breed.slice(0,20)}</text>` : ''}

  <rect x="${rightX}" y="238" width="${Math.min(opts.province.length * 18 + 80, 320)}" height="46"
    rx="23" fill="white" stroke="${COLORS.ink}" stroke-width="2.5"/>
  <text x="${rightX + 44}" y="268"
    font-size="22" fill="${COLORS.ink}">📍 ${opts.province || 'ไม่ระบุพื้นที่'}</text>

  <rect x="${rightX}" y="296" width="220" height="46"
    rx="23" fill="${cfg.bg}" stroke="${cfg.text}" stroke-width="2.5"/>
  <text x="${rightX + 20}" y="326"
    font-size="20" fill="${cfg.text}">${label}</text>

  ${opts.reward > 0 ? `
  <rect x="${rightX}" y="356" width="260" height="46"
    rx="23" fill="#FEF8DC" stroke="#E8B800" stroke-width="2.5"/>
  <text x="${rightX + 20}" y="386"
    font-size="20" fill="#A07800">💰 รางวัล ${opts.reward.toLocaleString()} บาท</text>` : ''}

  <rect x="${rightX}" y="490" width="${1200 - rightX - 48}" height="72" rx="12" fill="${COLORS.ink}"/>
  <rect x="${rightX + 4}" y="494" width="${1200 - rightX - 48}" height="72" rx="12" fill="rgba(0,0,0,.15)" style="z-index:-1"/>
  <text x="${rightX + (1200 - rightX - 48)/2}" y="535"
    font-size="24" fill="#F5EDD8" text-anchor="middle">ช่วยแชร์พาน้องกลับบ้าน 🏠</text>

  <text x="${rightX + (1200 - rightX - 48)/2}" y="590"
    font-size="16" fill="#9A8E86" text-anchor="middle">pawfind-eta.vercel.app</text>

  <rect x="1100" y="0" width="100" height="100" fill="${cfg.text}" stroke="${COLORS.ink}" stroke-width="4"/>
  <line x1="1100" y1="0" x2="1100" y2="100" stroke="${COLORS.ink}" stroke-width="4"/>
  <line x1="1100" y1="100" x2="1200" y2="100" stroke="${COLORS.ink}" stroke-width="4"/>
  <text x="1150" y="62" font-size="40" text-anchor="middle">🐾</text>
</svg>`
}

export async function POST(req: NextRequest) {
  try {
    const { petId } = await req.json()
    if (!petId) return NextResponse.json({ error: 'petId required' }, { status: 400 })

    const admin = createAdminClient()
    const { data: pet, error: petErr } = await admin
      .from('pets')
      .select('id, name, status, breed, province, reward_amount, pet_images(storage_url, is_primary), image_url')
      .eq('id', petId)
      .single()

    if (petErr || !pet) {
      console.error('❌ Pet fetch error:', petErr)
      return NextResponse.json({ error: 'Pet not found or RLS blocked' }, { status: 404 })
    }

    const images     = (pet.pet_images as any[]) || []
    const primaryRaw = images.find((i:any) => i.is_primary)?.storage_url
                    || images[0]?.storage_url
                    || pet.image_url
                    || ''
    const imageUrl = primaryRaw.startsWith('http') ? primaryRaw : ''

    const petImageBuf = imageUrl ? await fetchPetImage(imageUrl) : null
    const hasImage    = !!petImageBuf

    // 💡 โหลดฟอนต์ภาษาไทยมาก่อนวาด SVG
    const fontB64 = await getThaiFontBase64()

    const W = 1200, H = 630
    const leftW = hasImage ? 600 : 0 // 💡 ปรับขนาดรูปสัตว์ให้กว้างขึ้นเป็น 600px[cite: 6]

    const svgOverlay = buildSvg({
      name:     pet.name || 'ไม่ทราบชื่อ',
      breed:    pet.breed || '',
      province: pet.province || '',
      status:   pet.status,
      reward:   pet.reward_amount || 0,
      hasImage,
      fontB64 // 💡 ส่งฟอนต์เข้าไปใน SVG
    })

    const baseImage = await sharp(Buffer.from(svgOverlay))
      .resize(W, H)
      .png()
      .toBuffer()

    let finalBuffer: Buffer

    if (hasImage && petImageBuf) {
      // 💡 Resize รูปสัตว์ให้เข้ากับสัดส่วนใหม่ 600x630
      const petResized = await sharp(petImageBuf)
        .resize(leftW, H, { fit: 'cover', position: 'center' })
        .png()
        .toBuffer()

      finalBuffer = await sharp(baseImage)
        .composite([{ input: petResized, top: 0, left: 0 }])
        .png()
        .toBuffer()
    } else {
      finalBuffer = baseImage
    }

    const fileName = `og/${petId}.png`
    const { error: uploadErr } = await admin.storage
      .from('pet-images')
      .upload(fileName, finalBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadErr) {
      console.error('❌ Storage upload error:', uploadErr)
      return NextResponse.json({ error: uploadErr.message }, { status: 500 })
    }

    const { data: urlData } = admin.storage
      .from('pet-images')
      .getPublicUrl(fileName)

    const ogUrl = urlData.publicUrl

    const { error: updateErr } = await admin.from('pets')
      .update({ og_image_url: ogUrl })
      .eq('id', petId)
      
    if (updateErr) {
       console.error('❌ Table update error:', updateErr)
       return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, url: ogUrl })

  } catch (err) {
    console.error('❌ [generate-og] Critical Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}