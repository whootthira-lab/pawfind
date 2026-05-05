// app/api/generate-og/route.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createAdminClient } from '@/lib/supabase/admin'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawfind-eta.vercel.app'

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

// โหลดฟอนต์ภาษาไทย
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

// 💡 1. สร้าง Layout แบบเรียบง่าย: รูปเต็มจอ + แถบข้อความด้านล่าง
function buildOverlaySvg(opts: {
  name: string; status: string; fontB64: string
}): string {
  const nameStr = opts.name || 'ไม่ระบุชื่อ'
  let bannerText = ''
  let bannerColor = '#D94F1E' // สีแดง (สำหรับหาย/พบ)

  // 💡 2. กำหนดข้อความตามเงื่อนไขเป๊ะๆ
  if (opts.status === 'lost') {
    bannerText = `🚨 ประกาศตามหาสัตว์หาย (${nameStr})`
  } else if (opts.status === 'found') {
    bannerText = `🚨 ประกาศพบสัตว์หลง`
  } else {
    bannerText = `💖 ประกาศตามหาบ้านให้น้อง (${nameStr})`
    bannerColor = '#1A5EA8' // สีน้ำเงิน (สำหรับหาบ้าน)
  }

  return `
  <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        @font-face {
          font-family: 'NotoSansThai';
          src: url('data:font/truetype;charset=utf-8;base64,${opts.fontB64}');
        }
        .text-banner {
          font-family: 'NotoSansThai', Tahoma, sans-serif;
          font-size: 56px;
          font-weight: bold;
          fill: white;
        }
      </style>
    </defs>

    <!-- แถบสีด้านล่าง ความสูง 150px -->
    <rect x="0" y="480" width="1200" height="150" fill="${bannerColor}"/>

    <!-- ข้อความตรงกลางแถบ -->
    <text x="600" y="575" class="text-banner" text-anchor="middle">${bannerText}</text>
  </svg>`
}

export async function POST(req: NextRequest) {
  try {
    const { petId } = await req.json()
    if (!petId) return NextResponse.json({ error: 'petId required' }, { status: 400 })

    const admin = createAdminClient()
    const { data: pet, error: petErr } = await admin
      .from('pets')
      .select('id, name, status, pet_images(storage_url, is_primary), image_url')
      .eq('id', petId)
      .single()

    if (petErr || !pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })

    const images = (pet.pet_images as any[]) || []
    const primaryRaw = images.find((i:any) => i.is_primary)?.storage_url || images[0]?.storage_url || pet.image_url || ''
    const imageUrl = primaryRaw.startsWith('http') ? primaryRaw : ''

    const petImageBuf = imageUrl ? await fetchPetImage(imageUrl) : null
    const fontB64 = await getThaiFontBase64()

    const W = 1200, H = 630

    // สร้าง SVG Overlay (แถบสี + ข้อความ)
    const svgOverlay = buildOverlaySvg({
      name: pet.name || '',
      status: pet.status,
      fontB64
    })

    const overlayBuffer = await sharp(Buffer.from(svgOverlay)).png().toBuffer()

    let finalBuffer: Buffer

    if (petImageBuf) {
      // 💡 3. วาดรูปสัตว์เลี้ยงเต็มจอ (1200x630) แล้วแปะ SVG แถบข้อความทับ
      const petBase = await sharp(petImageBuf)
        .resize(W, H, { fit: 'cover', position: 'center' })
        .png()
        .toBuffer()

      finalBuffer = await sharp(petBase)
        .composite([{ input: overlayBuffer, top: 0, left: 0 }])
        .png()
        .toBuffer()
    } else {
      // กรณีไม่มีรูป ให้ใช้สีเทาเป็นพื้นหลัง
      const bg = await sharp({ create: { width: W, height: H, channels: 4, background: '#E0E0E0' } }).png().toBuffer()
      finalBuffer = await sharp(bg).composite([{ input: overlayBuffer, top: 0, left: 0 }]).png().toBuffer()
    }

    const fileName = `og/${petId}.png`
    const { error: uploadErr } = await admin.storage
      .from('pet-images')
      .upload(fileName, finalBuffer, { contentType: 'image/png', upsert: true })

    if (uploadErr) throw uploadErr

    const { data: urlData } = admin.storage.from('pet-images').getPublicUrl(fileName)
    const ogUrl = urlData.publicUrl

    await admin.from('pets').update({ og_image_url: ogUrl }).eq('id', petId)

    return NextResponse.json({ ok: true, url: ogUrl })
  } catch (err) {
    console.error('❌ OG Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}