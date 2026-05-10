// app/api/og/route.tsx
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const fetchFont = async () => {
  try {
    // 💡 ใช้ลิงก์จาก CDN ที่รวดเร็วและเสถียรกว่า Github ป้องกันปัญหาหน้าขาว
    const res = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-thai@5.0.8/files/noto-sans-thai-thai-700-normal.woff')
    if (!res.ok) throw new Error(`โหลดฟอนต์ไม่สำเร็จ (HTTP ${res.status})`)
    return await res.arrayBuffer()
  } catch (error) {
    throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ฟอนต์ได้')
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) throw new Error('Missing ID: ไม่พบรหัสสัตว์เลี้ยงในลิงก์')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) throw new Error('Env Error: ตั้งค่า Supabase ไม่ครบถ้วน')

    // ดึงข้อมูล
    const petRes = await fetch(`${supabaseUrl}/rest/v1/pets?id=eq.${id}&select=*,pet_images(storage_url,is_primary)`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    })
    
    if (!petRes.ok) throw new Error(`Supabase Error: ดึงข้อมูลไม่ได้ (Status ${petRes.status})`)
    
    const petData = await petRes.json()
    const pet = petData[0]

    if (!pet) throw new Error('Not Found: ไม่พบสัตว์เลี้ยงตัวนี้ใน Database')

    // เตรียมตัวแปร
    const name     = pet.name || 'ไม่ทราบชื่อ'
    const status   = pet.status || 'lost'
    const breed    = pet.breed || ''
    const province = pet.province || ''
    const reward   = pet.reward_amount || '0'

    const images = pet.pet_images || []
    const primaryRaw = images.find((i: any) => i.is_primary)?.storage_url || pet.image_url || ''
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

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px', height: '630px',
            display: 'flex',
            backgroundColor: '#F5EDD8',
            fontFamily: '"Noto Sans Thai"',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* ฝั่งซ้าย */}
          <div style={{ width: '600px', height: '100%', display: 'flex', borderRight: '6px solid #1A1208', position: 'relative' }}>
            {safeImageUrl ? (
              <img 
                src={safeImageUrl} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <div style={{ width: '100%', height: '100%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '120px' }}>🐾</div>
            )}
            
            <div style={{ position: 'absolute', bottom: '40px', left: '40px', backgroundColor: cfg.bg, border: `4px solid ${cfg.border}`, borderRadius: '50px', padding: '14px 28px', fontSize: '28px', fontWeight: 'bold', color: cfg.accent, display: 'flex' }}>
              {cfg.label}
            </div>
          </div>

          {/* ฝั่งขวา */}
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
              
              <div style={{ fontSize: name.length > 8 ? '70px' : '90px', fontWeight: 'bold', color: '#1A1208', lineHeight: 1.0, marginTop: '10px' }}>
                {name}
              </div>
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
              <div style={{ backgroundColor: '#1A1208', color: '#F5EDD8', borderRadius: '16px', padding: '22px', fontSize: '32px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ช่วยแชร์ให้น้องได้กลับบ้าน 🏠
              </div>
              <div style={{ fontSize: '22px', color: '#9A8E86', textAlign: 'center', fontWeight: 'bold' }}>pobpet.com</div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [{ name: 'Noto Sans Thai', data: fontData, weight: 700, style: 'normal' }],
        // ✅ ระบบจดจำรูปภาพอยู่ที่นี่ (อุ่นเครื่อง Cache)
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
        },
      }
    )
  } catch (err: any) {
    // โชว์การ์ดสีแดงถ้าเกิดข้อผิดพลาด
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', color: '#991b1b', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚠️ OG Generation Failed</div>
          <div style={{ fontSize: '30px' }}>{String(err.message || err)}</div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }
}