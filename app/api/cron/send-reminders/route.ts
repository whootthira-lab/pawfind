// app/api/cron/send-reminders/route.ts
// ── รันทุกวัน 08:00 ─ ส่งการแจ้งเตือนร่วมกับ Web Push เด้งขึ้นคอมพิวเตอร์และมือถือฟรี ──
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 🟢 [ปรับปรุง] เปลี่ยนโครงสร้างจาก LINE ไปเรียกใช้คลัง Web Push Service หลังบ้าน
// พี่สามารถใช้ Library เช่น 'web-push' ในการเข้ารหัส VAPID Keys หรือส่งผ่าน Endpoint ดิบได้เลยครับ
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })[cite: 24]
  }

  const supabase = createClient()[cite: 24]
  const now      = new Date()[cite: 24]
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1)[cite: 24]

  // ── หา reminders ที่ next_remind_at อยู่ในช่วงวันนี้ ────
  const { data: dueReminders } = await supabase[cite: 24]
    .from('reminders')[cite: 24]
    .select('id, user_id, pet_id, title, body, remind_at, repeat_type, next_remind_at')[cite: 24]
    .eq('is_done', false)[cite: 24]
    .lte('next_remind_at', tomorrow.toISOString())[cite: 24]
    .gte('next_remind_at', now.toISOString())[cite: 24]

  let sent = 0[cite: 24]

  for (const reminder of dueReminders || []) {[cite: 24]
    let pushSuccess = false

    // ── 🟢 1. ค้นหา Token รับสิทธิ์ Web Push ประจำเบราว์เซอร์ของผู้ใช้รายบุคคล ──
    const { data: profile } = await supabase
      .from('profiles')
      .select('web_push_subscription') // ฟิลด์ข้อมูลจัดเก็บ Token ประจำเครื่องนุดฟรี
      .eq('id', reminder.user_id)
      .maybeSingle()

    // ── 🟢 2. หากเบราว์เซอร์ผู้ใช้เปิดสิทธิ์รับพุชไว้ ให้ทำการยิงสัญญาณ Web Push เด้งขึ้นหน้าจอทันที ──
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

    // ── 3. บันทึกประวัติ notification ลงตารางในเว็บตามปกติ (พร้อมล็อกสัญญาณพุชสำเร็จ) ─────────────────
    await supabase.from('notifications').insert({[cite: 24]
      user_id:     reminder.user_id,[cite: 24]
      type:        'reminder_due',[cite: 24]
      title:       reminder.title,[cite: 24]
      body:        reminder.body || 'แจ้งเตือนที่ตั้งไว้',[cite: 24]
      link:        reminder.pet_id ? `/pets/${reminder.pet_id}` : '/dashboard/reminders',[cite: 24]
      is_read:     false,[cite: 24]
      reminder_id: reminder.id,[cite: 24]
      is_pushed:   pushSuccess, // ← เปลี่ยนมาเซฟค่าพุชสำเร็จจริงผ่านระบบเบราว์เซอร์ฟรี
    })[cite: 24]

    // ── Update last_sent_at (trigger จะคำนวณ next_remind_at ใหม่อัตโนมัติ) ──
    await supabase[cite: 24]
      .from('reminders')[cite: 24]
      .update({ last_sent_at: now.toISOString() })[cite: 24]
      .eq('id', reminder.id)[cite: 24]

    sent++[cite: 24]
  }

  return NextResponse.json({ ok: true, sent })[cite: 24]
}