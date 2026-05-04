import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// ── 1. โหลดฟอนต์ภาษาไทยไว้นอก GET (Module Level) ──────────────────────
// การทำแบบนี้จะทำให้ Vercel โหลดฟอนต์แค่ครั้งเดียวตอนเริ่มทำงาน (Cold Start) 
// และใช้ซ้ำได้ทันทีในครั้งต่อไป ทำให้รูปขึ้นเร็วขึ้นมาก
const fontDataPromise = fetch(
  new URL('https://fonts.gstatic.com/s/notosansthai/v25/iJWnBXeUZi_OHPqn4wq6hQ2_hbJ1xyN9wd43SofCRmo.woff', import.meta.url)
).then((res) => res.arrayBuffer())

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    // รับค่า Parameters
    const name     = searchParams.get('name')     || 'ไม่ทราบชื่อ'
    const status   = searchParams.get('status')   || 'lost'
    const breed    = searchParams.get('breed')    || ''
    const province = searchParams.get('province') || ''
    const imageUrl = searchParams.get('image')    || ''
    const reward   = searchParams.get('reward')   || '0'

    // รอให้ฟอนต์โหลดเสร็จ
    const fontData = await fontDataPromise

    // ตั้งค่าธีมตามสถานะ
    const statusConfig: Record<string, { label: string; bg: string; border: string; accent: string }> = {
      lost:     { label: 'ตามหาเจ้าของ', bg: '#FDE8ED', border: '#C07080', accent: '#D94F1E' },
      found:    { label: 'พบน้องหลงทาง', bg: '#E4F0E5', border: '#4A7D50', accent: '#2D6A2D' },
      adoption: { label: 'หาบ้านใหม่',   bg: '#E2EFF8', border: '#3A6A8A', accent: '#1A5EA8' },
    }
    const cfg = statusConfig[status] || statusConfig.lost

    // ตรวจสอบความปลอดภัยของ URL รูปภาพ
    const safeImageUrl = imageUrl.startsWith('https://') ? imageUrl : ''

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            background: '#F5EDD8',
            fontFamily: 'NotoSansThai',
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: 'radial-gradient(circle, #C4A87880 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        >
          {/* ── ส่วนซ้าย: รูปภาพสัตว์เลี้ยง ── */}
          <div
            style={{
              width: '460px',
              flexShrink: 0,
              display: 'flex',
              position: 'relative',
              borderRight: '4px solid #1A1208',
            }}
          >
            {safeImageUrl ? (
              <img
                src={safeImageUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt={name}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #FDE8ED, #E4F0E5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '140px',
                }}
              >
                🐾
              </div>
            )}

            {/* ป้ายสถานะ */}
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                background: cfg.bg,
                border: `3px solid ${cfg.border}`,
                borderRadius: '999px',
                padding: '10px 24px',
                fontSize: '24px',
                fontWeight: 700,
                color: cfg.accent,
                display: 'flex',
                boxShadow: `4px 4px 0 ${cfg.border}`,
              }}
            >
              {cfg.label}
            </div>
          </div>

          {/* ── ส่วนขวา: รายละเอียด ── */}
          <div
            style={{
              flex: 1,
              padding: '44px 48px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* ชื่อแบรนด์ */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#7A6A50',
                }}
              >
                <span>🐾</span>
                <span>PobPet · ตามหาน้อง</span>
              </div>

              {/* ชื่อสัตว์เลี้ยง */}
              <div
                style={{
                  fontSize: name.length > 10 ? '56px' : '72px',
                  fontWeight: 900,
                  color: '#1A1208',
                  lineHeight: 1.1,
                }}
              >
                {name}
              </div>

              {/* สายพันธุ์ */}
              {breed && (
                <div style={{ fontSize: '28px', color: '#5A4E46', fontWeight: 600 }}>
                  {breed}
                </div>
              )}

              {/* พื้นที่ */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#FFFFFF',
                  border: '2.5px solid #1A1208',
                  borderRadius: '999px',
                  padding: '10px 20px',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#1A1208',
                  boxShadow: '3px 3px 0 #1A1208',
                  width: 'fit-content',
                }}
              >
                <span>📍</span>
                <span>{province || 'ไม่ระบุพื้นที่'}</span>
              </div>

              {/* รางวัล */}
              {parseInt(reward) > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#FDF3DC',
                    border: '2.5px solid #E8C87A',
                    borderRadius: '999px',
                    padding: '10px 20px',
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#966A1A',
                    boxShadow: '3px 3px 0 #A07800',
                    width: 'fit-content',
                  }}
                >
                  <span>💰</span>
                  <span>มีรางวัล {parseInt(reward).toLocaleString('th-TH')} บาท</span>
                </div>
              )}
            </div>

            {/* ส่วนท้าย (CTA) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  background: '#1A1208',
                  color: '#F5EDD8',
                  borderRadius: '16px',
                  padding: '18px 28px',
                  fontSize: '26px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: '4px 4px 0 #5A4E46',
                }}
              >
                <span>ช่วยแชร์เพื่อส่งน้องกลับบ้าน 🏠</span>
              </div>
              <div style={{ fontSize: '18px', color: '#9A8E86', textAlign: 'center' }}>
                pobpet.com
              </div>
            </div>
          </div>

          {/* ตกแต่งมุมขวาบน */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: cfg.accent,
              borderLeft: '4px solid #1A1208',
              borderBottom: '4px solid #1A1208',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '44px',
            }}
          >
            🐾
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'NotoSansThai',
            data: fontData,
            weight: 700, // ตั้งเป็น 700 เพื่อให้รองรับดีไซน์ตัวหนาของคุณ
            style: 'normal',
          },
        ],
      }
    )
  } catch (err) {
    console.error('OG Image Error:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to generate image', details: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}