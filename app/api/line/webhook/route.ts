// app/api/line/webhook/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto           from 'crypto'

const LINE_REPLY_API = 'https://api.line.me/v2/bot/message/reply'
const BASE_URL       = process.env.NEXT_PUBLIC_BASE_URL || 'https://pobpet.com'

// ── Verify LINE signature ─────────────────────────────────────
function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET
  if (!secret) return false
  return crypto.createHmac('SHA256', secret).update(body).digest('base64') === signature
}

// ── Reply to LINE ─────────────────────────────────────────────
async function replyMessage(replyToken: string, messages: object[]) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return
  await fetch(LINE_REPLY_API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ replyToken, messages }),
  })
}

// ── Get user from line_user_id ────────────────────────────────
async function getUserByLineId(lineUserId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('line_user_id', lineUserId)
    .single()
  return data
}

// ── Check Member plan ─────────────────────────────────────────
async function checkMember(userId: string): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, expires_at')
    .eq('user_id', userId)
    .single()
  return !!(data?.plan === 'member' && data?.expires_at && new Date(data.expires_at) > new Date())
}

// ── Forward to AI (พร้อม userId สำหรับ Function Calling) ──────
async function getAIReplyWithTools(
  message:     string,
  characterId: string,
  userId:      string,
  history:     { role: string; text: string }[] = []
): Promise<{ reply: string; action_buttons?: { label: string; link: string }[] }> {
  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        // ส่ง header พิเศษให้ route.ts รู้ว่ามาจาก LINE
        'x-line-user-id': userId,
      },
      body: JSON.stringify({
        message,
        characterId,
        pageContext:  '/line',
        history,
        line_user_id: userId,   // ← ส่ง userId โดยตรงให้ bypass session check
      }),
    })
    const data = await res.json()
    return {
      reply:          data.reply          || 'ขออภัย ระบบขัดข้องชั่วคราวค่ะ',
      action_buttons: data.action_buttons || [],
    }
  } catch {
    return { reply: 'ขออภัย ระบบขัดข้องชั่วคราวค่ะ' }
  }
}

// ── Build action buttons text (แปลง action_buttons → ข้อความ LINE) ──
function buildActionText(
  buttons: { label: string; link: string }[] | undefined
): string {
  if (!buttons?.length) return ''
  return '\n\n' + buttons.map(b => `→ ${b.label}\n${BASE_URL}${b.link}`).join('\n\n')
}

// ── Rich Menu Postback ────────────────────────────────────────
const POSTBACK_ACTIONS: Record<string, { text: string; url?: string }> = {
  'action=report_lost':  { text: '📋 ลงประกาศสัตว์หาย',    url: `${BASE_URL}/report` },
  'action=report_found': { text: '👀 แจ้งพบสัตว์หลงทาง',   url: `${BASE_URL}/report?status=found` },
  'action=search':       { text: '🔍 ค้นหาสัตว์',           url: `${BASE_URL}/search` },
  'action=my_pets':      { text: '🐾 โปรไฟล์น้องของฉัน',    url: `${BASE_URL}/dashboard/pets` },
  'action=reminders':    { text: '🔔 แจ้งเตือนของฉัน',      url: `${BASE_URL}/dashboard/reminders` },
  'action=subscription': { text: '💎 จัดการแพ็คเกจ',        url: `${BASE_URL}/account/subscription` },
  'action=help':         { text: '❓ ต้องการความช่วยเหลือ'                                           },
}

// ── Conversation history (in-memory per LINE userId) ──────────
// ใช้ Map เพื่อจำประวัติสนทนาสั้นๆ ใน 1 session
const conversationHistory = new Map<string, { role: string; text: string }[]>()
const MAX_HISTORY = 6

// ══════════════════════════════════════════════════════════════
// WEBHOOK HANDLER
// ══════════════════════════════════════════════════════════════
export async function POST(req: Request) {
  try {
    const rawBody   = await req.text()
    const signature = req.headers.get('x-line-signature') || ''

    if (!verifySignature(rawBody, signature)) {
      console.warn('[LINE Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body   = JSON.parse(rawBody)
    const events = body.events || []

    for (const event of events) {
      const lineUserId = event.source?.userId
      const replyToken = event.replyToken

      // ── Follow ──────────────────────────────────────────
      if (event.type === 'follow') {
        await replyMessage(replyToken, [{
          type: 'text',
          text: `สวัสดีค่ะ! ยินดีต้อนรับสู่ PobPet 🐾\n\nฉันคือลักกี้ ผู้ช่วย AI พร้อมช่วยตามหาน้องค่ะ\n\n🌐 ${BASE_URL}\n\nพิมพ์ถามได้เลยนะคะ`,
        }])
        continue
      }

      if (event.type === 'unfollow') {
        conversationHistory.delete(lineUserId)
        continue
      }

      // ── Text message ─────────────────────────────────────
      if (event.type === 'message' && event.message?.type === 'text') {
        const text = event.message.text.trim()
        const user = await getUserByLineId(lineUserId)

        if (!user) {
          // ยังไม่ได้ login → แนะนำให้ไปสมัคร
          await replyMessage(replyToken, [{
            type: 'text',
            text: `สวัสดีค่ะ 🐾\n\nต้องสมัครบัญชีก่อนนะคะ\n\nสมัครได้ที่: ${BASE_URL}/login`,
          }])
          continue
        }

        const isMember = await checkMember(user.id)

        if (!isMember) {
          // Free user
          await replyMessage(replyToken, [{
            type: 'text',
            text: `สวัสดีค่ะ ${user.display_name || ''} 🐾\n\nฟีเจอร์แชทผ่าน LINE ใช้ได้เฉพาะ Member นะคะ\n\n💎 Member ฿399/ปี ได้:\n• แชท AI ผ่าน LINE\n• บันทึกสุขภาพน้อง\n• รับแจ้งเตือน Match ด่วน\n• สมุดสุขภาพน้อง\n\nอัปเกรด: ${BASE_URL}/pricing`,
          }])
          continue
        }

        // ── Member: ส่งไป AI พร้อม history ──────────────────
        const history = conversationHistory.get(lineUserId) || []
        const { reply, action_buttons } = await getAIReplyWithTools(
          text, 'cat', user.id, history
        )

        // อัปเดต history
        const newHistory = [
          ...history,
          { role: 'user', text },
          { role: 'bot',  text: reply },
        ].slice(-MAX_HISTORY)
        conversationHistory.set(lineUserId, newHistory)

        // สร้างข้อความ reply รวม action buttons
        const fullReply = reply + buildActionText(action_buttons)
        const truncated = fullReply.length > 4900
          ? fullReply.substring(0, 4900) + '...'
          : fullReply

        await replyMessage(replyToken, [{ type: 'text', text: truncated }])
        continue
      }

      // ── Postback (Rich Menu) ──────────────────────────────
      if (event.type === 'postback') {
        const data   = event.postback?.data || ''
        const action = POSTBACK_ACTIONS[data]

        if (action?.url) {
          await replyMessage(replyToken, [{
            type: 'text',
            text: `${action.text}\n\n${action.url}`,
          }])
        } else if (data === 'action=help') {
          await replyMessage(replyToken, [{
            type: 'text',
            text: `PobPet ช่วยคุณได้ดังนี้ค่ะ 🐾\n\n1️⃣ ลงประกาศสัตว์หาย\n2️⃣ แจ้งพบสัตว์หลงทาง\n3️⃣ บันทึกสุขภาพน้อง\n4️⃣ รับแจ้งเตือนวัคซีน\n5️⃣ จัดการแพ็คเกจ\n\nพิมพ์ถามอะไรก็ได้เลยค่ะ หรือเข้าเว็บ ${BASE_URL}`,
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

export async function GET() {
  return NextResponse.json({ status: 'LINE Webhook active — pobpet.com' })
}
