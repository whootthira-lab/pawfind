// app/api/cron/send-reminders/route.ts
// ── รันทุกวัน 08:00 ─ ส่ง notification สำหรับ reminder ที่ถึงกำหนด ──
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  for (const reminder of dueReminders || []) {
    // ── สร้าง notification ──────────────────────────────────
    await supabase.from('notifications').insert({
      user_id:     reminder.user_id,
      type:        'reminder_due',
      title:       reminder.title,
      body:        reminder.body || 'แจ้งเตือนที่ตั้งไว้',
      link:        reminder.pet_id ? `/pets/${reminder.pet_id}` : '/dashboard/reminders',
      is_read:     false,
      reminder_id: reminder.id,
      is_pushed:   false,
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
