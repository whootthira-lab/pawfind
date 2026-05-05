// app/api/generate-og/route.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createAdminClient } from '@/lib/supabase/admin'

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

export async function POST(req: NextRequest) {
  try {
    const { petId } = await req.json()
    if (!petId) return NextResponse.json({ error: 'petId required' }, { status: 400 })

    const admin = createAdminClient()
    const { data: pet, error: petErr } = await admin
      .from('pets')
      .select('id, pet_images(storage_url, is_primary), image_url')
      .eq('id', petId)
      .single()

    if (petErr || !pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })

    const images = (pet.pet_images as any[]) || []
    const primaryRaw = images.find((i:any) => i.is_primary)?.storage_url || images[0]?.storage_url || pet.image_url || ''
    const imageUrl = primaryRaw.startsWith('http') ? primaryRaw : ''

    const petImageBuf = imageUrl ? await fetchPetImage(imageUrl) : null
    const W = 1200, H = 630

    let finalBuffer: Buffer

    // 💡 วาดแค่รูปภาพเต็มจอ (Cover) ไร้ส่วนเกิน
    if (petImageBuf) {
      finalBuffer = await sharp(petImageBuf)
        .resize(W, H, { fit: 'cover', position: 'center' })
        .png()
        .toBuffer()
    } else {
      // ถ้าไม่มีรูป ให้ใส่สีเทาอ่อนๆ เป็นพื้นหลังแทน
      finalBuffer = await sharp({ create: { width: W, height: H, channels: 4, background: '#E0E0E0' } })
        .png()
        .toBuffer()
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