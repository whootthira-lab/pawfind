// app/api/og/route.tsx
import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// ── โหลด Noto Sans Thai font (รองรับภาษาไทย) ──────────────
async function loadThaiFont() {
  // ใช้ Google Fonts API โหลด Noto Sans Thai weight 700
  const url = 'https://fonts.gstatic.com/s/notosansthai/v20/iJWnBXeUZi_OHPqn4wq6hQ2_hbJ1xyN9wd43SofCRgo.woff'
  const res  = await fetch(url)
  return res.arrayBuffer()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const name     = searchParams.get('name')     || 'ไม่ทราบชื่อ'
  const status   = searchParams.get('status')   || 'lost'
  const breed    = searchParams.get('breed')    || ''
  const province = searchParams.get('province') || ''
  const imageUrl = searchParams.get('image')    || ''
  const reward   = searchParams.get('reward')   || '0'

  // โหลด font ก่อน render
  const fontData = await loadThaiFont()

  const statusConfig: Record<string, { label: string; bg: string; border: string; accent: string }> = {
    lost:     { label: 'ตามหาเจ้าของ', bg: '#FDE8ED', border: '#C07080', accent: '#D94F1E' },
    found:    { label: 'พบน้องหลงทาง', bg: '#E4F0E5', border: '#4A7D50', accent: '#2D6A2D' },
    adoption: { label: 'หาบ้านใหม่',   bg: '#E2EFF8', border: '#3A6A8A', accent: '#1A5EA8' },
  }
  const cfg = statusConfig[status] || statusConfig.lost

  // ตรวจสอบว่า imageUrl ใช้ได้ไหม (ต้องเป็น https)
  const validImage = imageUrl.startsWith('https://') ? imageUrl : ''

  return new ImageResponse(
    (
      <div
        style={{
          width:  '1200px',
          height: '630px',
          display: 'flex',
          fontFamily: '"NotoSansThai"',
          background: '#F5EDD8',
          // Grid paper background
          backgroundImage: 'radial-gradient(circle, #C8B89060 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          border: '0px solid transparent',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ── Left color zone — Green (Lost) or Blue (Found) ── */}
        <div style={{
          width: '420px', flexShrink: 0,
          background: status === 'lost' ? '#E8F3E8' : status === 'found' ? '#E3EEF8' : '#FDE8F4',
          borderRight: '4px solid #1A1208',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Status label top */}
          <div style={{
            position: 'absolute', top: '24px', left: '20px',
            background: cfg.accent, color: '#fff',
            border: '2.5px solid #1A1208',
            borderRadius: '999px',
            padding: '8px 20px',
            fontSize: '20px', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: `3px 3px 0 #1A1208`,
          }}>
            {status === 'lost' ? '🔔' : status === 'found' ? '👀' : '💖'} {cfg.label}
          </div>

          {/* Pet image or emoji fallback */}
          {validImage ? (
            <img
              src={validImage}
              style={{
                width: '320px', height: '320px',
                objectFit: 'cover',
                borderRadius: '16px',
                border: '4px solid #1A1208',
                boxShadow: '6px 6px 0 #1A1208',
              }}
              alt={name}
            />
          ) : (
            <div style={{
              width: '280px', height: '280px',
              background: '#fff',
              border: '4px solid #1A1208',
              borderRadius: '16px',
              boxShadow: '6px 6px 0 #1A1208',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              fontSize: '120px',
            }}>
              🐾
            </div>
          )}

          {/* Paw decoration bottom */}
          <div style={{
            position: 'absolute', bottom: '16px',
            display: 'flex', gap: '12px', opacity: 0.25, fontSize: '24px',
          }}>
            🐾🐾🐾
          </div>
        </div>

        {/* ── Right — Info panel ── */}
        <div style={{
          flex: 1,
          padding: '40px 44px',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          position: 'relative',
        }}>
          {/* Brand top */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '36px', height: '36px',
              background: '#D94F1E',
              border: '2px solid #1A1208',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '2px 2px 0 #1A1208',
            }}>🐾</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#9A8E86', letterSpacing: '0.08em' }}>
              POBPET · ตามหาน้อง
            </div>
          </div>

          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'center' }}>
            {/* Name */}
            <div style={{
              fontSize: name.length > 10 ? '56px' : name.length > 6 ? '68px' : '80px',
              fontWeight: 900,
              color: '#1A1208',
              lineHeight: 1.1,
            }}>
              {name}
            </div>

            {/* Breed */}
            {breed && (
              <div style={{ fontSize: '26px', color: '#5A4E46', fontWeight: 600 }}>
                {breed}
              </div>
            )}

            {/* Location chip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#F5EDD8',
              border: '2.5px solid #1A1208',
              borderRadius: '999px',
              padding: '10px 20px',
              fontSize: '22px', fontWeight: 700,
              width: 'fit-content',
              boxShadow: '3px 3px 0 #1A1208',
            }}>
              📍 {province || 'ไม่ระบุพื้นที่'}
            </div>

            {/* Reward chip */}
            {parseInt(reward) > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#FDF3DC',
                border: '2.5px solid #E8C87A',
                borderRadius: '999px',
                padding: '10px 20px',
                fontSize: '22px', fontWeight: 700,
                width: 'fit-content',
                color: '#966A1A',
                boxShadow: '3px 3px 0 #A07800',
              }}>
                💰 รางวัล {parseInt(reward).toLocaleString()} บาท
              </div>
            )}
          </div>

          {/* CTA bottom */}
          <div style={{
            background: '#1A1208',
            color: '#FAF6EE',
            borderRadius: '12px',
            padding: '18px 24px',
            fontSize: '22px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: '16px',
            boxShadow: '4px 4px 0 #5A4E46',
          }}>
            ช่วยแชร์เพื่อส่งน้องกลับบ้าน 🏠
          </div>

          {/* Domain */}
          <div style={{
            fontSize: '16px', color: '#CBBFB4',
            textAlign: 'center', marginTop: '10px',
            fontWeight: 600,
          }}>
            pobpet.com
          </div>
        </div>
      </div>
    ),
    {
      width:  1200,
      height: 630,
      fonts: [
        {
          name: 'NotoSansThai',
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  )
}