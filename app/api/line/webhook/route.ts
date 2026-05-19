// app/api/line/webhook/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse }  from 'next/server'
import { createClient }  from '@/lib/supabase/server'
import { pushToUser, buildMatchAlert } from '@/lib/line-notify'
import crypto            from 'crypto'

const LINE_REPLY_API = 'https://api.line.me/v2/bot/message/reply'
const BASE_URL       = process.env.NEXT_PUBLIC_BASE_URL || 'https://pobpet.com'

// ── Verify LINE signature ─────────────────────────────────────
function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET
  if (!secret) return false
  const hash = crypto
    .createHmac('SHA256', secret)
    .update(body)
    .digest('base64')
  return hash === signature
}

// ── Reply to LINE ─────────────────────────────────────────────
async function replyMessage(replyToken: string, messages: object[]) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return

  await fetch(LINE_REPLY_API, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  })
}

// ── Get userId จาก line_user_id ───────────────────────────────
async function getUserByLineId(lineUserId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('line_user_id', lineUserId)
    .single()
  return data
}

// ── Forward to AI Chatbot ─────────────────────────────────────
async function getAIReply(
  message:     string,
  characterId: string,
  userId:      string | null
): Promise<string> {
  try {
    // เรียก internal chat API
    const res  = await fetch(`${BASE_URL}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        characterId,
        pageContext: '/line',
        history:     [],
        // ถ้า userId มี จะตรวจ Member plan ใน route.ts
      }),
    })
    const data = await res.json()
    return data.reply || 'ขออภัย ระบบขัดข้องชั่วคราวค่ะ'
  } catch {
    return 'ขออภัย ระบบขัดข้องชั่วคราวค่ะ'
  }
}

// ── Rich Menu Postback actions ─────────────────────────────────
const POSTBACK_ACTIONS: Record<string, { text: string; url?: string }> = {
  'action=report_lost': {
    text: '📋 ลงประกาศสัตว์หาย',
    url:  `${BASE_URL}/report`,
  },
  'action=report_found': {
    text: '👀 แจ้งพบสัตว์หลงทาง',
    url:  `${BASE_URL}/report?status=found`,
  },
  'action=search': {
    text: '🔍 ค้นหาสัตว์',
    url:  `${BASE_URL}/search`,
  },
  'action=my_pets': {
    text: '🐾 โปรไฟล์น้องของฉัน',
    url:  `${BASE_URL}/dashboard/pets`,
  },
  'action=reminders': {
    text: '🔔 แจ้งเตือนของฉัน',
    url:  `${BASE_URL}/dashboard/reminders`,
  },
  'action=help': {
    text: '❓ ต้องการความช่วยเหลือ',
  },
}

// ══════════════════════════════════════════════════════════════
// WEBHOOK HANDLER
// ══════════════════════════════════════════════════════════════
export async function POST(req: Request) {
  try {
    const rawBody  = await req.text()
    const signature = req.headers.get('x-line-signature') || ''

    // ── Verify signature ──────────────────────────────────
    if (!verifySignature(rawBody, signature)) {
      console.warn('[LINE Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body   = JSON.parse(rawBody)
    const events = body.events || []

    for (const event of events) {
      const lineUserId = event.source?.userId
      const replyToken = event.replyToken

      // ── Follow event (ผู้ใช้ add LINE OA) ────────────────
      if (event.type === 'follow') {
        await replyMessage(replyToken, [{
          type: 'text',
          text: `สวัสดีค่ะ! ยินดีต้อนรับสู่ PobPet 🐾\n\nฉันคือลักกี้ ผู้ช่วย AI ที่พร้อมช่วยคุณตามหาน้องที่หายค่ะ\n\n📱 เข้าใช้งานเว็บไซต์: ${BASE_URL}\n\nถ้ามีอะไรให้ช่วยพิมพ์มาได้เลยนะคะ`,
        }])
        continue
      }

      // ── Unfollow event ───────────────────────────────────
      if (event.type === 'unfollow') {
        // log แต่ไม่ต้อง reply
        console.log(`[LINE] User unfollowed: ${lineUserId}`)
        continue
      }

      // ── Text message ─────────────────────────────────────
      if (event.type === 'message' && event.message?.type === 'text') {
        const text    = event.message.text.trim()
        const user    = await getUserByLineId(lineUserId)

        // เช็ค Member plan
        let characterId = 'cat'
        if (user) {
          const supabase = createClient()
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('plan, expires_at')
            .eq('user_id', user.id)
            .single()
          const isMember = sub?.plan === 'member' && new Date(sub.expires_at) > new Date()

          if (!isMember) {
            // Free user: แจ้งว่าต้องอัปเกรดเพื่อใช้ LINE OA
            await replyMessage(replyToken, [{
              type: 'text',
              text: `สวัสดีค่ะ ${user.display_name || ''} 🐾\n\nฟีเจอร์ LINE ให้บริการเฉพาะ Member เท่านั้นนะคะ\n\n💎 อัปเกรด Member ฿399/ปี เพื่อ:\n• แชทกับ AI ผ่าน LINE\n• รับแจ้งเตือน Match ด่วน\n• สมุดสุขภาพน้อง\n\nอัปเกรดได้ที่: ${BASE_URL}/pricing`,
            }])
            continue
          }
        }

        // ส่งข้อความไป AI แล้ว reply กลับ
        const aiReply = await getAIReply(text, characterId, user?.id || null)

        // จำกัดความยาว LINE message ไม่เกิน 5000 chars
        const truncated = aiReply.length > 4900
          ? aiReply.substring(0, 4900) + '...'
          : aiReply

        await replyMessage(replyToken, [{ type: 'text', text: truncated }])
        continue
      }

      // ── Postback (Rich Menu buttons) ──────────────────────
      if (event.type === 'postback') {
        const data   = event.postback?.data || ''
        const action = POSTBACK_ACTIONS[data]

        if (action?.url) {
          // ส่งลิงก์ LIFF
          await replyMessage(replyToken, [{
            type: 'text',
            text: `${action.text}\n\n${action.url}`,
          }])
        } else if (action?.text === '❓ ต้องการความช่วยเหลือ') {
          await replyMessage(replyToken, [{
            type: 'text',
            text: `PobPet ช่วยคุณได้ดังนี้ค่ะ 🐾\n\n1. ลงประกาศสัตว์หาย\n2. แจ้งพบสัตว์หลงทาง\n3. บันทึกสุขภาพน้อง\n4. รับแจ้งเตือนวัคซีน\n\nพิมพ์ถามอะไรก็ได้เลยค่ะ หรือเข้าเว็บ ${BASE_URL}`,
          }])
        }
        continue
      }
    }

    return NextResponse.json({ ok: true })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown'
    console.error('[LINE Webhook]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET สำหรับ verify webhook URL ใน LINE Console
export async function GET() {
  return NextResponse.json({ status: 'LINE Webhook is active' })
}
