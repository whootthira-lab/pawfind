import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const fetchFont = async () => {
  try {
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
    const petName = searchParams.get('petName') || 'น้อง'
    const activity = searchParams.get('activity') || 'ตรวจสุขภาพ'
    const petUrl = searchParams.get('petUrl')

    // 1. ดักจับความปลอดภัยและดึงภาพของน้องด้วย Fetch
    let safeImageUrl = ''
    if (petUrl && petUrl.startsWith('http')) {
      try {
        const imageRes = await fetch(petUrl, { 
          next: { revalidate: 3600 },
          headers: { 'Accept': 'image/*' }
        })
        if (imageRes.ok) {
          const buffer = await imageRes.arrayBuffer()
          // แปลงเป็น Base64 Data URL เพื่อความเสถียรและเร็วใน Satori Engine
          const contentType = imageRes.headers.get('content-type') || 'image/jpeg'
          const base64String = Buffer.from(buffer).toString('base64')
          safeImageUrl = `data:${contentType};base64,${base64String}`
        }
      } catch (err) {
        console.error('Failed to pre-fetch petUrl:', err)
      }
    }

    // 2. โหลดฟอนต์ภาษาไทยสำหรับภาษาไทยสระไม่ลอย
    const fontData = await fetchFont()

    // 3. กำหนดธีมสีและการ์ดแบบไดนามิกอัจฉริยะตามประเภทกิจกรรม (Rich Aesthetics)
    let cardBg = '#E2EFF8' // ฟ้าพาสเทลเริ่มต้น
    let cardBorder = '#3A6A8A'
    let badgeText = '📅 ตารางนัดหมาย'
    let accentColor = '#1A5EA8'

    const activityLower = activity.toLowerCase()
    if (activityLower.includes('วัคซีน') || activityLower.includes('ฉีด') || activityLower.includes('พิษสุนัขบ้า')) {
      cardBg = '#E4F0E5' // เขียวพาสเทล
      cardBorder = '#4A7D50'
      badgeText = '🩺 วัคซีน & การป้องกัน'
      accentColor = '#2D6A2D'
    } else if (activityLower.includes('หมัด') || activityLower.includes('เห็บ') || activityLower.includes('ยา') || activityLower.includes('หยอด')) {
      cardBg = '#FFF3CD' // เหลืองทองพาสเทล
      cardBorder = '#D9A74A'
      badgeText = '💊 การดูแลและกำจัดพยาธิ'
      accentColor = '#A06D00'
    } else if (activityLower.includes('ผ่าตัด') || activityLower.includes('ทำหมัน') || activityLower.includes('รักษา')) {
      cardBg = '#FDE8ED' // ชมพูพาสเทล
      cardBorder = '#C07080'
      badgeText = '🚨 การดูแลเป็นพิเศษ'
      accentColor = '#B23B53'
    }

    return new ImageResponse(
      (
        <div style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'row',
          backgroundColor: '#F4F1EA',
          fontFamily: '"Noto Sans Thai"',
          position: 'relative',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          gap: '40px',
          border: '8px solid #000000'
        }}>
          {/* ตกแต่งแบ็คกราวน์ด้านหลังตามสไตล์ Origami */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '200px',
            height: '200px',
            backgroundColor: '#E8E4D9',
            borderRadius: '100px',
            display: 'flex'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-60px',
            left: '-60px',
            width: '250px',
            height: '250px',
            backgroundColor: '#E8E4D9',
            borderRadius: '125px',
            display: 'flex'
          }} />

          {/* ฝั่งซ้าย: โชว์รูปน้องสัตว์เลี้ยง ตัดกรอบมนสวยงามสไตล์ Neubrutalism */}
          <div style={{
            width: '480px',
            height: '480px',
            display: 'flex',
            border: '6px solid #000000',
            borderRadius: '32px',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            boxShadow: '16px 16px 0px #000000',
            position: 'relative'
          }}>
            {safeImageUrl ? (
              <img 
                src={safeImageUrl} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover' 
                }} 
              />
            ) : (
              /* Fallback: กรณีโหลดรูปน้องไม่สำเร็จ หรือไม่มี URL */
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#FFF9E6',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '15px'
              }}>
                <span style={{ fontSize: '160px', filter: 'drop-shadow(5px 5px 0px rgba(0,0,0,0.15))' }}>🐾</span>
                <span style={{ 
                  fontSize: '28px', 
                  fontWeight: '900', 
                  color: '#1A1208',
                  border: '3px solid #000000',
                  padding: '6px 16px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  boxShadow: '4px 4px 0px #000000'
                }}>
                  PobPet Companion
                </span>
              </div>
            )}
          </div>

          {/* ฝั่งขวา: กล่องข้อความสไตล์พาสเทล Neubrutalism จัดวางอย่างมีมิติ */}
          <div style={{
            width: '560px',
            height: '480px',
            backgroundColor: cardBg,
            border: '6px solid #000000',
            borderRadius: '32px',
            padding: '40px',
            boxShadow: '16px 16px 0px #000000',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            
            {/* Header Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '4px solid #000000',
                borderRadius: '50px',
                padding: '8px 20px',
                fontSize: '22px',
                fontWeight: '900',
                color: accentColor,
                boxShadow: '4px 4px 0px #000000',
                display: 'flex'
              }}>
                {badgeText}
              </div>
              <div style={{ 
                fontSize: '22px', 
                fontWeight: '900', 
                color: '#1A1208',
                display: 'flex' 
              }}>
                🐾 pobpet.com
              </div>
            </div>

            {/* Content Body: ข้อความกำกับหนาชัดเจน */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <span style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: '#5A4E46',
                display: 'flex'
              }}>
                📢 การแจ้งเตือนสุขภาพถึงคุณ...
              </span>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'row',
                flexWrap: 'wrap', 
                fontSize: '40px', 
                fontWeight: '900', 
                color: '#000000', 
                lineHeight: '1.4'
              }}>
                นัดหมาย: 
                <span style={{ 
                  color: '#FFFFFF', 
                  backgroundColor: accentColor, 
                  padding: '2px 14px', 
                  borderRadius: '16px', 
                  border: '4px solid #000000', 
                  marginLeft: '8px', 
                  marginRight: '8px',
                  boxShadow: '5px 5px 0px #000000',
                  display: 'flex'
                }}>
                  {activity}
                </span> 
                ของน้อง 
                <span style={{ 
                  color: '#1A1208',
                  textDecoration: 'underline',
                  marginLeft: '8px',
                  display: 'flex'
                }}>
                  {petName}
                </span>
              </div>
            </div>

            {/* Footer Tip Section */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              borderTop: '3px dashed #000000',
              paddingTop: '20px'
            }}>
              <span style={{ fontSize: '32px' }}>🩺</span>
              <span style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: '#4A3E3D' 
              }}>
                อย่าลืมพาน้องไปตามเวลานัดหมายเพื่อสุขภาพที่ดีของสัตว์เลี้ยงแสนรัก
              </span>
            </div>

          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [{ name: 'Noto Sans Thai', data: fontData, weight: 700, style: 'normal' }],
        headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200' },
      }
    )
  } catch (err: any) {
    return new ImageResponse(
      (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: '#FDE8ED', 
          color: '#B23B53', 
          padding: '40px', 
          textAlign: 'center',
          border: '8px solid #000000',
          fontFamily: 'sans-serif'
        }}>
          <div style={{ fontSize: '50px', fontWeight: '900', marginBottom: '20px' }}>⚠️ Health Banner Generation Failed</div>
          <div style={{ fontSize: '26px', fontWeight: 'bold' }}>{String(err.message || err)}</div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }
}
