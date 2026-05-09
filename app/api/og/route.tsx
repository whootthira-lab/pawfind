// app/api/og/route.tsx
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const fetchFont = async () => {
  const response = await fetch(
    'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansThai/NotoSansThai-Bold.ttf'
  )
  return await response.arrayBuffer()
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const name     = searchParams.get('name')     || 'ไม่ทราบชื่อ'
    const status   = searchParams.get('status')   || 'lost'
    const breed    = searchParams.get('breed')    || ''
    const province = searchParams.get('province') || ''
    const imageUrl = searchParams.get('image')    || ''
    const reward   = searchParams.get('reward')   || '0'

    const fontData = await fetchFont()

    // ธีมสี
    const statusConfig: Record<string, { label: string; bg: string; border: string; accent: string }> = {
      lost:     { label: '🚨 ตามหาเจ้าของ', bg: '#FDE8ED', border: '#C07080', accent: '#D94F1E' },
      found:    { label: '👀 พบน้องหลงทาง', bg: '#E4F0E5', border: '#4A7D50', accent: '#2D6A2D' },
      adoption: { label: '💖 หาบ้านใหม่',   bg: '#E2EFF8', border: '#3A6A8A', accent: '#1A5EA8' },
    }
    const cfg = statusConfig[status] || statusConfig.lost
    const safeImageUrl = imageUrl.startsWith('https://') ? imageUrl : ''

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
          {/* 1. ฝั่งซ้าย: รูปภาพสัตว์เลี้ยง (ปรับเป็น 50% หรือ 600px) */}
          <div style={{ width: '600px', height: '100%', display: 'flex', borderRight: '6px solid #1A1208', position: 'relative' }}>
            {safeImageUrl ? (
              <img 
                src={safeImageUrl} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <div style={{ width: '100%', height: '100%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '120px' }}>
                🐾
              </div>
            )}
            
            {/* ป้ายสถานะ (ย้ายมาไว้ฝั่งรูปภาพเพื่อให้ดูสมดุล) */}
            <div style={{ position: 'absolute', bottom: '40px', left: '40px', backgroundColor: cfg.bg, border: `4px solid ${cfg.border}`, borderRadius: '50px', padding: '14px 28px', fontSize: '28px', fontWeight: 'bold', color: cfg.accent, display: 'flex' }}>
              {cfg.label}
            </div>
          </div>

          {/* 2. ฝั่งขวา: รายละเอียด (600px) */}
          <div style={{ width: '600px', padding: '60px 50px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            
            {/* โลโก้ PobPet ที่มุมขวาบน */}
            <div style={{ position: 'absolute', top: '40px', right: '50px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* 💡 แนะนำให้คุณวุฒิ์นำไฟล์โลโก้ไปวางที่ public/logo-og.png แล้วใช้ URL จริงที่นี่ครับ */}
              <img 
                src="https://ajjvtazuncdtxjwcplcv.supabase.co/storage/v1/object/public/posters/httpspobpet.comlogo-og.png" 
                style={{ width: '60px', height: '60px', borderRadius: '12px' }} 
              />
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1A1208' }}>PobPet</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '40px' }}>
              <div style={{ fontSize: '30px', color: '#7A6A50', fontWeight: 'bold' }}>
            🐾 PobPet(พบเพ็ท) ศูนย์รวมประกาศสัตว์หายและค้นหาด้วย AI
              </div>
              <div style={{ fontSize: name.length > 8 ? '70px' : '90px', fontWeight: 'bold', color: '#1A1208', lineHeight: 1.0 }}>
                {name}
              </div>
              {breed ? <div style={{ fontSize: '34px', color: '#5A4E46', fontWeight: 'bold' }}>พันธุ์: {breed}</div> : null}
              
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', border: '3.5px solid #1A1208', borderRadius: '50px', padding: '14px 28px', fontSize: '28px', fontWeight: 'bold', color: '#1A1208', marginTop: '30px', width: 'fit-content' }}>
                📍 {province || 'ไม่ระบุพื้นที่'}
              </div>
              
              {parseInt(reward) > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FDF3DC', border: '3.5px solid #E8C87A', borderRadius: '50px', padding: '14px 28px', fontSize: '28px', fontWeight: 'bold', color: '#966A1A', marginTop: '20px', width: 'fit-content' }}>
                  💰 รางวัล {parseInt(reward).toLocaleString()} บาท
                </div>
              ) : null}
            </div>

            {/* ส่วนท้ายของการ์ด */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ backgroundColor: '#1A1208', color: '#F5EDD8', borderRadius: '16px', padding: '22px', fontSize: '32px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ช่วยแชร์ให้น้องได้กลับบ้าน 🏠
              </div>
              <div style={{ fontSize: '22px', color: '#9A8E86', textAlign: 'center', fontWeight: 'bold' }}>
                pobpet.com
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [{
          name: 'Noto Sans Thai',
          data: fontData,
          weight: 700,
          style: 'normal',
        }],
      }
    )
  } catch (err: any) {
    return new Response(`Error: ${err.message}`, { status: 500 })
  }
}