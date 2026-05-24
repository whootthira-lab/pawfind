// app/api/cron/send-reminders/route.ts
// ── รันทุกวัน 08:00 ─ ส่งการแจ้งเตือนร่วมกับ Web Push เด้งขึ้นคอมพิวเตอร์และมือถือฟรี ──
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@pobpet.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

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
    let pushSuccess = false

    // ── 1. ค้นหา Token รับสิทธิ์ Web Push ประจำเบราว์เซอร์ของผู้ใช้รายบุคคล ──
    const { data: profile } = await supabase
      .from('profiles')
      .select('web_push_subscription')
      .eq('id', reminder.user_id)
      .maybeSingle()

    // ── 2. หากเบราว์เซอร์ผู้ใช้เปิดสิทธิ์รับพุชไว้ ให้ทำการยิงสัญญาณ Web Push เด้งขึ้นหน้าจอทันที ──
    if (profile?.web_push_subscription) {
      try {
        const subscription = JSON.parse(profile.web_push_subscription)
        
        const payload = JSON.stringify({
          title: reminder.title,
          body: reminder.body || 'แจ้งเตือนนัดหมายจาก PobPet 🐾',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: {
            link: reminder.pet_id ? `/pets/${reminder.pet_id}` : '/dashboard/reminders'
          }
        })

        await webpush.sendNotification(subscription, payload)
        pushSuccess = true
      } catch (err) {
        console.error('[Web Push Cron Trigger Error]', err)
      }
    }

    // ── 3. บันทึกประวัติ notification ลงตารางในเว็บตามปกติ (พร้อมล็อกสัญญาณพุชสำเร็จ) ──
    await supabase.from('notifications').insert({
      user_id:     reminder.user_id,
      type:        'reminder_due',
      title:       reminder.title,
      body:        reminder.body || 'แจ้งเตือนที่ตั้งไว้',
      link:        reminder.pet_id ? `/pets/${reminder.pet_id}` : '/dashboard/reminders',
      is_read:     false,
      reminder_id: reminder.id,
      is_pushed:   pushSuccess,
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