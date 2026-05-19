// scripts/setup-line-rich-menu.ts
// ── รัน 1 ครั้งเพื่อสร้าง Rich Menu ใน LINE OA ────────────────
//
// วิธีใช้:
//   npx ts-node scripts/setup-line-rich-menu.ts
//
// ต้องมี ENV:
//   LINE_CHANNEL_ACCESS_TOKEN
// ─────────────────────────────────────────────────────────────

const TOKEN   = process.env.LINE_CHANNEL_ACCESS_TOKEN
const BASE    = 'https://api.line.me/v2/bot'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pobpet.com'

if (!TOKEN) {
  console.error('Missing LINE_CHANNEL_ACCESS_TOKEN')
  process.exit(1)
}

const headers = {
  'Content-Type': 'application/json',
  Authorization:  `Bearer ${TOKEN}`,
}

// ── Rich Menu Layout (6 ปุ่ม, 2 แถว) ─────────────────────────
const RICH_MENU = {
  size:       { width: 2500, height: 1686 },
  selected:   true,
  name:       'PobPet Main Menu',
  chatBarText: 'เมนู PobPet 🐾',
  areas: [
    // แถวบน
    {
      bounds: { x: 0,    y: 0, width: 833, height: 843 },
      action: { type: 'postback', data: 'action=report_lost',  displayText: 'ลงประกาศสัตว์หาย' },
    },
    {
      bounds: { x: 833,  y: 0, width: 834, height: 843 },
      action: { type: 'postback', data: 'action=report_found', displayText: 'แจ้งพบสัตว์' },
    },
    {
      bounds: { x: 1667, y: 0, width: 833, height: 843 },
      action: { type: 'postback', data: 'action=search',       displayText: 'ค้นหาสัตว์' },
    },
    // แถวล่าง
    {
      bounds: { x: 0,    y: 843, width: 833, height: 843 },
      action: { type: 'postback', data: 'action=my_pets',   displayText: 'โปรไฟล์น้อง' },
    },
    {
      bounds: { x: 833,  y: 843, width: 834, height: 843 },
      action: { type: 'postback', data: 'action=reminders', displayText: 'แจ้งเตือน' },
    },
    {
      bounds: { x: 1667, y: 843, width: 833, height: 843 },
      action: { type: 'postback', data: 'action=help',      displayText: 'ช่วยเหลือ' },
    },
  ],
}

async function main() {
  console.log('🔧 Setting up LINE Rich Menu...')

  // ── 1. สร้าง Rich Menu ────────────────────────────────────
  const createRes = await fetch(`${BASE}/richmenu`, {
    method:  'POST',
    headers,
    body:    JSON.stringify(RICH_MENU),
  })

  if (!createRes.ok) {
    const err = await createRes.json()
    console.error('❌ Failed to create rich menu:', err)
    process.exit(1)
  }

  const { richMenuId } = await createRes.json()
  console.log(`✅ Rich Menu created: ${richMenuId}`)

  // ── 2. Set เป็น Default Rich Menu ────────────────────────
  const setDefaultRes = await fetch(
    `${BASE}/user/all/richmenu/${richMenuId}`,
    { method: 'POST', headers }
  )

  if (setDefaultRes.ok) {
    console.log('✅ Set as default rich menu for all users')
  } else {
    console.warn('⚠️  Could not set as default, set manually in LINE Console')
  }

  console.log(`
╔══════════════════════════════════════════════╗
║  Rich Menu ID: ${richMenuId}
║
║  ขั้นตอนต่อไป:
║  1. ไปที่ LINE Official Account Manager
║  2. เลือก Rich Menu → ตกแต่งรูปภาพ
║  3. วาดปุ่ม 6 ช่อง (2 แถว 3 คอลัมน์)
║  4. บันทึกและ Publish
╚══════════════════════════════════════════════╝
  `)
}

main().catch(console.error)
