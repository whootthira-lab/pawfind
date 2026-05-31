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

    const { data: pet, error: petErr } = await admin
      .from('pets')
      .select('*, pet_images(storage_url, is_primary)')
      .eq('id', petId)
      .single()

    if (petErr || !pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })

    const name     = pet.name || 'ไม่ทราบชื่อ'
    const status   = pet.status || 'lost'
    const breed    = pet.breed || ''
    const province = pet.province || ''
    const district = pet.district || ''
    const color    = pet.color || ''
    const reward   = pet.reward_amount || '0'
    const hasReward = parseInt(reward) > 0

    const getFeaturesText = (rawFeatures: any, aiCap: any, aiDesc: any) => {
      if (!rawFeatures) return aiCap || aiDesc || 'ไม่ระบูลักษณะพิเศษ'
      let text = String(rawFeatures)
      if (text.startsWith('[')) {
        try {
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed)) {
            text = parsed.map((item: any) => item.description).filter(Boolean).join(', ')
          }
        } catch (e) {
          // ignore
        }
      }
      if (!text.trim() || text === '[]') return aiCap || aiDesc || 'ไม่ระบูลักษณะพิเศษ'
      return text
    }

    const distinctiveFeaturesText = getFeaturesText(
      pet.distinctive_features,
      pet.ai_caption,
      pet.ai_description
    ).substring(0, 75) + (getFeaturesText(pet.distinctive_features, pet.ai_caption, pet.ai_description).length > 75 ? '...' : '')

    const images = pet.pet_images || []
    const primaryRaw = images.find((i: any) => i.is_primary)?.storage_url || pet.image_url || ''
    const safeImageUrl = primaryRaw.startsWith('http') 
      ? primaryRaw 
      : primaryRaw ? `${supabaseUrl}/storage/v1/object/public/pet-images/${primaryRaw}` : ''

    const fontData = await fetchFont()
    const statusConfig: Record<string, { label: string; bg: string; border: string; accent: string }> = {
      lost:     { label: '🔔ประกาศหาสัตว์เลี้ยง', bg: '#FDE8ED', border: '#C07080', accent: '#D94F1E' },
      found:    { label: '👀แจ้งพบสัตว์หลง', bg: '#E4F0E5', border: '#4A7D50', accent: '#2D6A2D' },
      adoption: { label: '🏠หาบ้านให้น้อง',   bg: '#E2EFF8', border: '#3A6A8A', accent: '#1A5EA8' },
      mating:   { label: '❤️ เข้าดูประกาศหาคู่ให้น้อง', bg: '#FFF0F5', border: '#FFB6C1', accent: '#C71585' },
    }
    const cfg = statusConfig[status] || statusConfig.lost

    let footerText = 'ช่วยแชร์ให้น้องได้กลับบ้าน 🏠'
    if (status === 'adoption') {
      footerText = 'ช่วยแชร์เพื่อมอบบ้านที่อบอุ่น 🏠'
    } else if (status === 'mating') {
      footerText = 'ช่วยแชร์หาคู่ให้เจ้านาย 💖'
    } else if (status === 'found') {
      footerText = 'ช่วยแชร์เพื่อตามหาเจ้าของ 🏠'
    }

    const speciesLabel = pet.species === 'dog' ? 'สุนัข' : pet.species === 'cat' ? 'แมว' : pet.species || 'ไม่ระบุ'

    const imgResponse = new ImageResponse(
      (
        <div style={{ width: '1200px', height: '630px', display: 'flex', backgroundColor: '#F5EDD8', fontFamily: '"Noto Sans Thai"', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: '600px', height: '100%', display: 'flex', borderRight: '6px solid #1A1208', position: 'relative', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5EDD8' }}>
            {safeImageUrl ? (
              <div style={{ width: '460px', height: '460px', display: 'flex', border: '6px solid #1A1208', borderRadius: '24px', overflow: 'hidden', boxShadow: '15px 15px 0px #1A1208' }}>
                <img src={safeImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ width: '460px', height: '460px', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '120px', border: '6px solid #1A1208', borderRadius: '24px', boxShadow: '15px 15px 0px #1A1208' }}>🐾</div>
            )}
          </div>
          <div style={{ width: '600px', height: '100%', padding: '40px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#F5EDD8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', backgroundColor: cfg.bg, border: `3.5px solid ${cfg.border}`, borderRadius: '50px', padding: '10px 20px', fontSize: '22px', fontWeight: 'bold', color: cfg.accent }}>
                {cfg.label}
              </div>
              <div style={{ display: 'flex', fontSize: '26px', fontWeight: 'bold', color: '#1A1208' }}>PobPet.com</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', fontSize: '72px', fontWeight: '900', color: '#1A1208', lineHeight: 1.1 }}>
                {name}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '2px dashed #1A1208', borderBottom: '2px dashed #1A1208', padding: '12px 0' }}>
                <div style={{ display: 'flex', fontSize: '24px', color: '#1A1208' }}>
                  <span style={{ fontWeight: 'bold', width: '140px', color: '#5A4E46' }}>ประเภทสัตว์:</span>
                  <span style={{ fontWeight: 'bold' }}>{speciesLabel} {breed ? `(${breed})` : ''}</span>
                </div>
                <div style={{ display: 'flex', fontSize: '24px', color: '#1A1208' }}>
                  <span style={{ fontWeight: 'bold', width: '140px', color: '#5A4E46' }}>สีของน้อง:</span>
                  <span style={{ fontWeight: 'bold' }}>{color || 'ไม่ระบุ'}</span>
                </div>
                <div style={{ display: 'flex', fontSize: '24px', color: '#1A1208' }}>
                  <span style={{ fontWeight: 'bold', width: '140px', color: '#5A4E46' }}>ลักษณะเด่น:</span>
                  <span style={{ display: 'flex', width: '370px', fontWeight: 'bold' }}>{distinctiveFeaturesText}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', border: '3.5px solid #1A1208', borderRadius: '50px', padding: '10px 22px', fontSize: '22px', fontWeight: 'bold', color: '#1A1208', alignSelf: 'flex-start' }}>
                  📍 {district ? `อ.${district} ` : ''}จ.{province || 'ไม่ระบุพื้นที่'}
                </div>
                {hasReward && (
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FDF3DC', border: '3.5px solid #E8C87A', borderRadius: '50px', padding: '10px 22px', fontSize: '22px', fontWeight: 'bold', color: '#966A1A', alignSelf: 'flex-start' }}>
                    💰 รางวัล: {parseInt(reward).toLocaleString()} บาท
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', backgroundColor: '#1A1208', color: '#F5EDD8', borderRadius: '16px', padding: '16px 20px', fontSize: '26px', fontWeight: 'bold', alignItems: 'center', justifyContent: 'center' }}>
                {footerText}
              </div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts: [{ name: 'Noto Sans Thai', data: fontData, weight: 700, style: 'normal' }] }
    )

    const imageBlob = await imgResponse.blob()
    const imageBuffer = await imageBlob.arrayBuffer()
    const fileName = `${petId}.png`
    const timestamp = Date.now()

    const { error: uploadErr } = await admin.storage
      .from('og-images') 
      .upload(fileName, imageBuffer, { contentType: 'image/png', upsert: true })

    if (uploadErr) {
      console.error('Upload Error:', uploadErr)
      throw uploadErr
    }

    const { data: urlData } = admin.storage.from('og-images').getPublicUrl(fileName)
    const finalOgUrl = `${urlData.publicUrl}?v=${timestamp}`

    const { error: updateErr } = await admin.from('pets').update({ og_image_url: finalOgUrl }).eq('id', petId)
    if (updateErr) throw updateErr

    return NextResponse.json({ ok: true, url: finalOgUrl })
  } catch (err) {
    console.error('❌ OG Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}