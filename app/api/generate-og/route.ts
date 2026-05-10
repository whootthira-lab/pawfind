// app/api/generate-og/route.tsx
import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'edge'

const fetchFont = async () => {
  const res = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-thai@5.0.8/files/noto-sans-thai-thai-700-normal.woff')
  if (!res.ok) throw new Error('Failed to load font')
  return await res.arrayBuffer()
}

export async function POST(req: NextRequest) {
  try {
    const { petId } = await req.json()
    if (!petId) return NextResponse.json({ error: 'petId required' }, { status: 400 })

    const admin = createAdminClient()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

    // 1. ดึงข้อมูลน้องสัตว์เลี้ยง
    const { data: pet, error: petErr } = await admin
      .from('pets')
      .select('*, pet_images(storage_url, is_primary)')
      .eq('id', petId)
      .single()

    if (petErr || !pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })

    // 2. เตรียมข้อมูลวาดการ์ด
    const name     = pet.name || 'ไม่ทราบชื่อ'
    const status   = pet.status || 'lost'
    const breed    = pet.breed || ''
    const province = pet.province || ''
    const reward   = pet.reward_amount || '0'

    const images = pet.pet_images || []
    const primaryRaw = images.find((i: any) => i.is_primary)?.storage_url || pet.image_url || ''
    
    // 💡 แก้บั๊ก URL รูปภาพ
    const safeImageUrl = primaryRaw.startsWith('http') 
      ? primaryRaw 
      : primaryRaw ? `${supabaseUrl}/storage/v1/object/public/pet-images/${primaryRaw}` : ''

    const fontData = await fetchFont()
    const statusConfig: Record<string, { label: string; bg: string; border: string; accent: string }> = {
      lost:     { label: '🚨 ตามหาเจ้าของ', bg: '#FDE8ED', border: '#C07080', accent: '#D94F1E' },
      found:    { label: '👀 พบน้องหลงทาง', bg: '#E4F0E5', border: '#4A7D50', accent: '#2D6A2D' },
      adoption: { label: '💖 หาบ้านใหม่',   bg: '#E2EFF8', border: '#3A6A8A', accent: '#1A5EA8' },
    }
    const cfg = statusConfig[status] || statusConfig.lost

    // 3. วาดการ์ด 3 บรรทัดสวยๆ ด้วย Satori
    const imgResponse = new ImageResponse(
      (
        <div style={{ width: '1200px', height: '630px', display: 'flex', backgroundColor: '#F5EDD8', fontFamily: '"Noto Sans Thai"', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: '600px', height: '100%', display: 'flex', borderRight: '6px solid #1A1208', position: 'relative' }}>
            {safeImageUrl ? (
              <img src={safeImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '120px' }}>🐾</div>
            )}
            <div style={{ position: 'absolute', bottom: '40px', left: '40px', backgroundColor: cfg.bg, border: `4px solid ${cfg.border}`, borderRadius: '50px', padding: '14px 28px', fontSize: '28px', fontWeight: 'bold', color: cfg.accent, display: 'flex' }}>
              {cfg.label}
            </div>
          </div>
          <div style={{ width: '600px', padding: '60px 50px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ position: 'absolute', top: '40px', right: '50px', display: 'flex', alignItems: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1A1208' }}>PobPet</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '28px', color: cfg.accent, fontWeight: 'bold', lineHeight: 1.2 }}>PobPet (พบเพ็ท)</div>
                <div style={{ fontSize: '28px', color: cfg.accent, fontWeight: 'bold', lineHeight: 1.2 }}>ศูนย์รวมประกาศสัตว์หาย</div>
                <div style={{ fontSize: '28px', color: cfg.accent, fontWeight: 'bold', lineHeight: 1.2 }}>และค้นหาด้วย AI</div>
              </div>
              <div style={{ fontSize: name.length > 8 ? '70px' : '90px', fontWeight: 'bold', color: '#1A1208', lineHeight: 1.0, marginTop: '10px' }}>{name}</div>
              {breed ? <div style={{ fontSize: '34px', color: '#5A4E46', fontWeight: 'bold' }}>พันธุ์: {breed}</div> : null}
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', border: '3.5px solid #1A1208', borderRadius: '50px', padding: '14px 28px', fontSize: '28px', fontWeight: 'bold', color: '#1A1208', marginTop: '20px', width: 'fit-content' }}>
                📍 {province || 'ไม่ระบุพื้นที่'}
              </div>
              {parseInt(reward) > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FDF3DC', border: '3.5px solid #E8C87A', borderRadius: '50px', padding: '14px 28px', fontSize: '28px', fontWeight: 'bold', color: '#966A1A', marginTop: '10px', width: 'fit-content' }}>
                  💰 รางวัล {parseInt(reward).toLocaleString()} บาท
                </div>
              ) : null}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ backgroundColor: '#1A1208', color: '#F5EDD8', borderRadius: '16px', padding: '22px', fontSize: '32px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>ช่วยแชร์ให้น้องได้กลับบ้าน 🏠</div>
              <div style={{ fontSize: '22px', color: '#9A8E86', textAlign: 'center', fontWeight: 'bold' }}>pobpet.com</div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts: [{ name: 'Noto Sans Thai', data: fontData, weight: 700, style: 'normal' }] }
    )

    // 4. แปลงภาพเป็นไฟล์ แล้วอัปโหลดขึ้น Supabase Storage (ตามที่คุณวุฒิ์เตรียมไว้)
    const imageBlob = await imgResponse.blob()
    const imageBuffer = await imageBlob.arrayBuffer()
    const fileName = `og/${petId}.png`
    const timestamp = Date.now()

    const { error: uploadErr } = await admin.storage
      .from('pet-images') // บันทึกลง Bucket pet-images/og/ ตามโครงสร้างของคุณวุฒิ์เลยครับ
      .upload(fileName, imageBuffer, { contentType: 'image/png', upsert: true })

    if (uploadErr) throw uploadErr

    const { data: urlData } = admin.storage.from('pet-images').getPublicUrl(fileName)
    const finalOgUrl = `${urlData.publicUrl}?v=${timestamp}`

    // 5. บันทึกลิงก์รูปลง Database
    await admin.from('pets').update({ og_image_url: finalOgUrl }).eq('id', petId)

    return NextResponse.json({ ok: true, url: finalOgUrl })
  } catch (err) {
    console.error('❌ OG Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}