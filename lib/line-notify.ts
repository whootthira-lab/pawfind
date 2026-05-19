// lib/line-notify.ts
// ── ส่ง LINE Push Notification เฉพาะ Member plan ──────────────

import { createClient } from '@/lib/supabase/server'

const LINE_API = 'https://api.line.me/v2/bot/message/push'

// ── ประเภทข้อความ ─────────────────────────────────────────────
export interface LineTextMessage {
  type:  'text'
  text:  string
}
export interface LineFlexMessage {
  type:     'flex'
  altText:  string
  contents: object
}
export type LineMessage = LineTextMessage | LineFlexMessage

// ══════════════════════════════════════════════════════════════
// Push ข้อความหาผู้ใช้ 1 คน
// ══════════════════════════════════════════════════════════════
export async function pushToUser(
  userId:   string,
  messages: LineMessage[]
): Promise<{ success: boolean; reason?: string }> {

  const supabase = createClient()
  const token    = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return { success: false, reason: 'Missing LINE_CHANNEL_ACCESS_TOKEN' }

  // ── เช็ค Member + line_user_id ────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('line_user_id')
    .eq('id', userId)
    .single()

  if (!profile?.line_user_id) {
    return { success: false, reason: 'User has no LINE account linked' }
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, expires_at')
    .eq('user_id', userId)
    .single()

  const isMember = sub?.plan === 'member'
    && sub?.expires_at
    && new Date(sub.expires_at) > new Date()

  if (!isMember) {
    return { success: false, reason: 'User is not a Member' }
  }

  // ── ตรวจสอบ push limit (สูงสุด 30 ครั้ง/เดือน) ───────────
  const { data: subFull } = await supabase
    .from('subscriptions')
    .select('line_push_count, line_push_reset')
    .eq('user_id', userId)
    .single()

  const now            = new Date()
  const resetDate      = subFull?.line_push_reset
    ? new Date(subFull.line_push_reset)
    : null
  const sameMonth      = resetDate
    && resetDate.getMonth() === now.getMonth()
    && resetDate.getFullYear() === now.getFullYear()
  const currentCount   = sameMonth ? (subFull?.line_push_count || 0) : 0
  const MONTHLY_LIMIT  = 30

  if (currentCount >= MONTHLY_LIMIT) {
    return { success: false, reason: `Monthly LINE push limit reached (${MONTHLY_LIMIT})` }
  }

  // ── ส่งข้อความ ───────────────────────────────────────────
  const res = await fetch(LINE_API, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${token}`,
    },
    body: JSON.stringify({
      to:       profile.line_user_id,
      messages: messages.slice(0, 5), // LINE จำกัดสูงสุด 5 ข้อความต่อครั้ง
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    console.error('[LINE Push]', err)
    return { success: false, reason: err.message }
  }

  // ── อัปเดต push count ─────────────────────────────────────
  await supabase.from('subscriptions').update({
    line_push_count: currentCount + 1,
    line_push_reset: sameMonth
      ? subFull?.line_push_reset
      : now.toISOString().split('T')[0],
  }).eq('user_id', userId)

  return { success: true }
}

// ══════════════════════════════════════════════════════════════
// Preset messages
// ══════════════════════════════════════════════════════════════

// แจ้งเตือน AI Match พบสัตว์คล้ายกัน
export function buildMatchAlert(params: {
  petName:    string
  matchScore: number
  reportUrl:  string
  baseUrl:    string
}): LineFlexMessage {
  return {
    type:    'flex',
    altText: `🐾 AI พบสัตว์ที่อาจเป็น${params.petName}! (${params.matchScore}% match)`,
    contents: {
      type: 'bubble',
      header: {
        type:   'box',
        layout: 'vertical',
        contents: [{
          type:  'text',
          text:  '🐾 AI พบสัตว์ที่น่าสนใจ!',
          weight: 'bold',
          size:   'lg',
          color:  '#FFFFFF',
        }],
        backgroundColor: '#FF9F66',
        paddingAll: '16px',
      },
      body: {
        type:   'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type:   'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'น้อง:', size: 'sm', color: '#888888', flex: 1 },
              { type: 'text', text: params.petName, size: 'sm', weight: 'bold', flex: 2 },
            ],
          },
          {
            type:   'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'ความคล้าย:', size: 'sm', color: '#888888', flex: 1 },
              { type: 'text', text: `${params.matchScore}%`, size: 'sm', weight: 'bold', color: '#1D9E75', flex: 2 },
            ],
          },
          {
            type:   'separator',
            margin: 'md',
          },
          {
            type:  'text',
            text:  'กด "ดูรูปเปรียบเทียบ" เพื่อยืนยันว่าใช่น้องของคุณไหม',
            size:  'sm',
            color: '#555555',
            wrap:  true,
          },
        ],
      },
      footer: {
        type:   'box',
        layout: 'vertical',
        contents: [{
          type:   'button',
          style:  'primary',
          color:  '#1A1208',
          action: {
            type:  'uri',
            label: 'ดูรูปเปรียบเทียบ →',
            uri:   `${params.baseUrl}${params.reportUrl}`,
          },
        }],
      },
    },
  }
}

// แจ้งเตือนวัคซีน / ยา
export function buildHealthReminder(params: {
  petName:   string
  title:     string
  dueDate:   string
  baseUrl:   string
}): LineFlexMessage {
  return {
    type:    'flex',
    altText: `💉 ถึงเวลา${params.title}ให้น้อง${params.petName}แล้วค่ะ`,
    contents: {
      type: 'bubble',
      header: {
        type:   'box',
        layout: 'vertical',
        contents: [{
          type:   'text',
          text:   '💉 แจ้งเตือนสุขภาพน้อง',
          weight: 'bold',
          size:   'lg',
          color:  '#FFFFFF',
        }],
        backgroundColor: '#A0522D',
        paddingAll: '16px',
      },
      body: {
        type:   'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'text', text: `น้อง ${params.petName}`, weight: 'bold', size: 'md' },
          { type: 'text', text: `ถึงเวลา ${params.title} แล้วค่ะ`, size: 'sm', color: '#555555' },
          { type: 'text', text: `ก่อนวันที่ ${params.dueDate}`, size: 'sm', color: '#D85A30', weight: 'bold' },
        ],
      },
      footer: {
        type:   'box',
        layout: 'vertical',
        contents: [{
          type:   'button',
          style:  'primary',
          color:  '#A0522D',
          action: {
            type:  'uri',
            label: 'ดูโปรไฟล์น้อง →',
            uri:   `${params.baseUrl}/dashboard/pets`,
          },
        }],
      },
    },
  }
}

// ── แจ้งเตือน Subscription หมดอายุ ──────────────────────────
export function buildSubExpiredMessage(daysLeft: number, baseUrl: string): LineTextMessage {
  return {
    type: 'text',
    text: daysLeft > 0
      ? `⚠️ แพ็คเกจ Member ของคุณจะหมดอายุในอีก ${daysLeft} วันนะคะ\n\nต่ออายุที่: ${baseUrl}/pricing`
      : `🔔 แพ็คเกจ Member ของคุณหมดอายุแล้วค่ะ\n\nต่ออายุได้ที่: ${baseUrl}/pricing`,
  }
}
