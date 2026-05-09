// app/api/og/route.tsx
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const fetchFont = async () => {
  // 💡 เปลี่ยนมาใช้ raw.githubusercontent เพื่อดึงไฟล์ตรงๆ ไม่ให้ติด Redirect
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

    // รอโหลดฟอนต์
    const fontData = await fetchFont()

    // ธีมสีแบบปลอดภัย
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
          }}
        >
          {/* ฝั่งซ้าย: รูปภาพสัตว์เลี้ยง */}
          <div style={{ width: '460px', height: '100%', display: 'flex', borderRight: '4px solid #1A1208', backgroundColor: cfg.bg, position: 'relative' }}>
            {safeImageUrl ? (
              <img src={safeImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '100px' }}>
                🐾
              </div>
            )}
            
            {/* ป้ายสถานะ */}
            <div style={{ position: 'absolute', bottom: '30px', left: '30px', backgroundColor: cfg.bg, border: `3px solid ${cfg.border}`, borderRadius: '50px', padding: '12px 24px', fontSize: '26px', color: cfg.accent, display: 'flex', alignItems: 'center' }}>
              {cfg.label}
            </div>
          </div>

          {/* ฝั่งขวา: รายละเอียด */}
          <div style={{ flex: 1, padding: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '26px', color: '#7A6A50', display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                PobPet · ศูนย์รวมประกาศสัตว์หาย
              </div>
              <div style={{ fontSize: name.length > 10 ? '56px' : '72px', color: '#1A1208', lineHeight: 1.1 }}>
                {name}
              </div>
              {breed ? <div style={{ fontSize: '30px', color: '#5A4E46', marginTop: '10px' }}>{breed}</div> : null}
              
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', border: '3px solid #1A1208', borderRadius: '50px', padding: '12px 24px', fontSize: '26px', color: '#1A1208', marginTop: '24px', width: '60%' }}>
                📍 พิกัด: {province || 'ไม่ระบุพื้นที่'}
              </div>
              
              {parseInt(reward) > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FDF3DC', border: '3px solid #E8C87A', borderRadius: '50px', padding: '12px 24px', fontSize: '26px', color: '#966A1A', marginTop: '16px', width: '60%' }}>
                  💰 มีรางวัล {parseInt(reward).toLocaleString()} บาท
                </div>
              ) : null}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ backgroundColor: '#1A1208', color: '#F5EDD8', borderRadius: '16px', padding: '20px', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ช่วยแชร์เพื่อส่งน้องกลับบ้าน 🏠
              </div>
              <div style={{ fontSize: '20px', color: '#9A8E86', textAlign: 'center' }}>
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
    console.error('[OG Error]', err)
    // 💡 ระบบดักจับ Error: ถ้าพัง จะคืนค่ารูปสีแดงพร้อมคำอธิบายแทนหน้าขาว
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