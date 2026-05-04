// app/api/og/route.tsx
// ── Dynamic OG Image — รองรับ Facebook, X, LINE, Instagram ──
// ต้องติดตั้ง: npm install @vercel/og

import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const name     = searchParams.get('name')     || 'ไม่ทราบชื่อ'
  const status   = searchParams.get('status')   || 'lost'
  const breed    = searchParams.get('breed')    || ''
  const province = searchParams.get('province') || ''
  const imageUrl = searchParams.get('image')    || ''  // ต้องเป็น https URL
  const reward   = searchParams.get('reward')   || '0'

  const statusConfig: Record<string, { label: string; bg: string; border: string }> = {
    lost:     { label: '🚨 ตามหาเจ้าของ',   bg: '#FDE8ED', border: '#C07080' },
    found:    { label: '👀 พบน้องหลงทาง',   bg: '#E4F0E5', border: '#4A7D50' },
    adoption: { label: '💖 หาบ้านใหม่',     bg: '#E2EFF8', border: '#3A6A8A' },
  }
  const cfg = statusConfig[status] || statusConfig.lost

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          fontFamily: 'sans-serif',
          background: '#FAF7F2',
          border: '8px solid #2A2018',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Left — Pet Image */}
        <div style={{ width: '480px', flexShrink: 0, position: 'relative', display: 'flex' }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              alt={name}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: '#F5F0E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '120px',
            }}>
              🐾
            </div>
          )}
          {/* Status badge overlay */}
          <div style={{
            position: 'absolute', bottom: '20px', left: '20px',
            background: cfg.bg,
            border: `3px solid ${cfg.border}`,
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '22px',
            fontWeight: 700,
            boxShadow: `4px 4px 0 ${cfg.border}`,
          }}>
            {cfg.label}
          </div>
        </div>

        {/* Right — Info */}
        <div style={{
          flex: 1,
          padding: '48px 48px 40px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderLeft: '4px solid #2A2018',
        }}>
          {/* Top */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Brand */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              fontSize: '20px', fontWeight: 700, color: '#9A8E86',
              letterSpacing: '0.1em',
            }}>
              <span>🐾</span>
              <span>POBPET · ตามหาน้อง</span>
            </div>

            {/* Name */}
            <div style={{
              fontSize: name.length > 8 ? '60px' : '72px',
              fontWeight: 900,
              color: '#2A2018',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}>
              {name}
            </div>

            {/* Breed */}
            {breed && (
              <div style={{
                fontSize: '28px', color: '#5A4E46', fontWeight: 500,
              }}>
                {breed}
              </div>
            )}

            {/* Location */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '26px', fontWeight: 700, color: '#2A2018',
              background: '#F5F0E8',
              border: '2px solid #E2D8CE',
              borderRadius: '8px',
              padding: '10px 18px',
              width: 'fit-content',
            }}>
              <span>📍</span>
              <span>{province || 'ไม่ระบุพื้นที่'}</span>
            </div>

            {/* Reward */}
            {parseInt(reward) > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '24px', fontWeight: 700,
                background: '#FDF3DC',
                border: '2px solid #E8C87A',
                borderRadius: '8px',
                padding: '10px 18px',
                width: 'fit-content',
                color: '#966A1A',
              }}>
                💰 รางวัล {parseInt(reward).toLocaleString('th-TH')} บาท
              </div>
            )}
          </div>

          {/* Bottom CTA */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            <div style={{
              background: '#2A2018',
              color: '#FAF7F2',
              borderRadius: '8px',
              padding: '16px 24px',
              fontSize: '24px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}>
              <span>ช่วยแชร์เพื่อส่งน้องกลับบ้าน 🏠</span>
            </div>
            <div style={{
              fontSize: '18px', color: '#9A8E86', textAlign: 'center',
            }}>
              pobpet.com
            </div>
          </div>
        </div>

        {/* Corner decoration */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: '120px', height: '120px',
          background: '#F2AABF',
          borderLeft: '4px solid #2A2018',
          borderBottom: '4px solid #2A2018',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '48px',
        }}>
          🐾
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
