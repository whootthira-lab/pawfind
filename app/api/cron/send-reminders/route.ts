// app/api/cron/send-reminders/route.ts
// ── รันทุกวัน 08:00 ─ ส่ง notification และยิง LINE Push Message สำหรับ reminder ที่ถึงกำหนด ──
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const LINE_PUSH_API = 'https://api.line.me/v2/bot/message/push'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  const now      = new Date()
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1)

  // ── หา reminders ที่ next_remind_at อยู่ในช่วงวันนี้ ────
  const { data: dueReminders } = await supabase
    .from('reminders')
    .select('id, user_id, pet_id, title, body, remind_at, repeat_type, next_remind_at')
    .eq('is_done', false)
    .lte('next_remind_at', tomorrow.toISOString())
    .gte('next_remind_at', now.toISOString())

  let sent = 0
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN

  for (const reminder of dueReminders || []) {
    let linePushed = false

    // ── 🟢 1. ค้นหา line_user_id ของเจ้าของน้องจากโปรไฟล์เพื่อเตรียมยิง LINE ──
    const { data: profile } = await supabase
      .from('profiles')
      .select('line_user_id')
      .eq('id', reminder.user_id)
      .maybeSingle()

    // ── 🟢 2. หากผู้ใช้ผูกไอดี LINE ไว้ และระบบตั้งค่า Token เรียบร้อย ให้ทำการยิง Push Message ตรงเข้ามือถือ ──
    if (profile?.line_user_id && token) {
      try {
        const messageText = `🔔 แจ้งเตือนนัดหมายจาก PobPet 🐾\n\n📌 เรื่อง: ${reminder.title}\n📝 รายละเอียด: ${reminder.body || 'แจ้งเตือนที่ตั้งไว้'}\n\nท่านสามารถเปิดดูข้อมูลและบันทึกสมุดสุขภาพเพิ่มเติมได้ทางหน้าเว็บไซต์นะคะ`
        
        const lineResp = await fetch(LINE_PUSH_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: profile.line_user_id,
            messages: [
              {
                type: 'text',
                text: messageText,
              },
            ],
          }),
        })

        if (lineResp.ok) {
          linePushed = true
        } else {
          console.error(`[LINE Push Error] Status: ${lineResp.status}`)
        }
      } catch (err) {
        console.error('[LINE Push Exception]', err)
      }
    }

    // ── 3. สร้าง notification ลงตารางในเว็บ (พร้อมบันทึกสถานะการยิง LINE) ─────────────────
    await supabase.from('notifications').insert({
      user_id:     reminder.user_id,
      type:        'reminder_due',
      title:       reminder.title,
      body:        reminder.body || 'แจ้งเตือนที่ตั้งไว้',
      link:        reminder.pet_id ? `/pets/${reminder.pet_id}` : '/dashboard/reminders',
      is_read:     false,
      reminder_id: reminder.id,
      is_pushed:   linePushed, // ← บันทึกค่าจริงตามที่ส่งสำเร็จสำเร็จ
    })

    // ── Update last_sent_at (trigger จะคำนวณ next_remind_at ใหม่อัตโนมัติ) ──
    await supabase
      .from('reminders')
      .update({ last_sent_at: now.toISOString() })
      .eq('id', reminder.id)

    sent++
  }

  return NextResponse.json({ ok: true, sent })
}