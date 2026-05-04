// app/api/og/route.tsx
import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawfind-eta.vercel.app'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const name     = searchParams.get('name')     || 'ไม่ทราบชื่อ'
    const status   = searchParams.get('status')   || 'lost'
    const breed    = searchParams.get('breed')    || ''
    const province = searchParams.get('province') || ''
    const imageUrl = searchParams.get('image')    || ''
    const reward   = searchParams.get('reward')   || '0'

    // ── โหลด font จาก /public/fonts/ ซึ่งอยู่ใน repo ──────
    const fontRes = await fetch(new URL('/fonts/NotoSansThai.woff', BASE_URL))
    if (!fontRes.ok) throw new Error(`Font fetch failed: ${fontRes.status} ${fontRes.url}`)
    const fontData = await fontRes.arrayBuffer()

    const statusConfig: Record<string, { label: string; bg: string; border: string; accent: string }> = {
      lost:     { label: 'ตามหาเจ้าของ', bg: '#FDE8ED', border: '#C07080', accent: '#D94F1E' },
      found:    { label: 'พบน้องหลงทาง', bg: '#E4F0E5', border: '#4A7D50', accent: '#2D6A2D' },
      adoption: { label: 'หาบ้านใหม่',   bg: '#E2EFF8', border: '#3A6A8A', accent: '#1A5EA8' },
    }
    const cfg = statusConfig[status] || statusConfig.lost
    const safeImageUrl = imageUrl.startsWith('https://') ? imageUrl : ''

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px', height: '630px',
            display: 'flex',
            background: '#F5EDD8',
            fontFamily: 'NotoSansThai',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Left: Pet Image */}
          <div style={{ width: '460px', flexShrink: 0, display: 'flex', position: 'relative', borderRight: '4px solid #1A1208' }}>
            {safeImageUrl ? (
              <img src={safeImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#FDE8ED,#E4F0E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '140px' }}>
                🐾
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: cfg.bg, border: `3px solid ${cfg.border}`, borderRadius: '999px', padding: '10px 22px', fontSize: '24px', fontWeight: 700, color: cfg.accent, display: 'flex', alignItems: 'center', boxShadow: `4px 4px 0 ${cfg.border}` }}>
              {cfg.label}
            </div>
          </div>

          {/* Right: Info */}
          <div style={{ flex: 1, padding: '44px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Brand */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px', fontWeight: 700, color: '#7A6A50' }}>
                <span>🐾</span><span>PobPet · ตามหาน้อง</span>
              </div>

              {/* Name */}
              <div style={{ fontSize: name.length > 10 ? '56px' : '68px', fontWeight: 900, color: '#1A1208', lineHeight: 1.1 }}>
                {name}
              </div>

              {/* Breed */}
              {breed ? <div style={{ fontSize: '26px', color: '#5A4E46', fontWeight: 600 }}>{breed}</div> : null}

              {/* Location */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', border: '2.5px solid #1A1208', borderRadius: '999px', padding: '10px 22px', fontSize: '24px', fontWeight: 700, color: '#1A1208', boxShadow: '3px 3px 0 #1A1208' }}>
                <span>📍</span><span>{province || 'ไม่ระบุพื้นที่'}</span>
              </div>

              {/* Reward */}
              {parseInt(reward) > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FDF3DC', border: '2.5px solid #E8C87A', borderRadius: '999px', padding: '10px 22px', fontSize: '22px', fontWeight: 700, color: '#966A1A', boxShadow: '3px 3px 0 #A07800' }}>
                  <span>💰</span><span>มีรางวัล {parseInt(reward).toLocaleString()} บาท</span>
                </div>
              ) : null}
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: '#1A1208', color: '#F5EDD8', borderRadius: '16px', padding: '18px 28px', fontSize: '26px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '4px 4px 0 #5A4E46' }}>
                <span>ช่วยแชร์เพื่อส่งน้องกลับบ้าน</span><span>🏠</span>
              </div>
              <div style={{ fontSize: '18px', color: '#9A8E86', textAlign: 'center', fontWeight: 500 }}>
                pawfind-eta.vercel.app
              </div>
            </div>
          </div>

          {/* Corner accent */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: cfg.accent, borderLeft: '4px solid #1A1208', borderBottom: '4px solid #1A1208', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '44px' }}>
            🐾
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [{
          name: 'NotoSansThai',
          data: fontData,
          weight: 400,
          style: 'normal',
        }],
      }
    )
  } catch (err) {
    console.error('[OG Error]', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
