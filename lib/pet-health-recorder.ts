// lib/pet-health-recorder.ts
// ── บันทึกสุขภาพสัตว์ + ตั้ง reminder อัตโนมัติ ──────────────

import { createClient } from '@/lib/supabase/server'

// ── Next due days per event type ─────────────────────────────
const NEXT_DUE_DAYS: Record<string, number> = {
  vaccine:          365,   // วัคซีนรวม ฉีดปีละครั้ง
  rabies_vaccine:   365,   // พิษสุนัขบ้า ฉีดปีละครั้ง
  deworming:         90,   // ถ่ายพยาธิ ทุก 3 เดือน
  flea_treatment:    30,   // หยอดหมัด/เห็บ ทุกเดือน
  checkup:          180,   // ตรวจสุขภาพ ทุก 6 เดือน
  treatment:          0,   // รักษาโรค — ไม่มี next due อัตโนมัติ
  award:              0,
  other:              0,
}

export interface HealthEventInput {
  pet_name?:      string | null
  event_type:     string
  medicine_name?: string | null
  event_date:     string          // 'YYYY-MM-DD' หรือ 'today'
  notes?:         string | null
  next_due_days?: number | null   // override อัตโนมัติ
}

export interface HealthEventResult {
  success:    boolean
  pet_name?:  string
  event_date?: string
  next_due?:  string | null
  reason?:    string
}

// ── Main function ─────────────────────────────────────────────
export async function recordHealthEvent(
  userId: string,
  input:  HealthEventInput
): Promise<HealthEventResult> {
  const supabase = createClient()

  // ── หา pet จากชื่อ ────────────────────────────────────────
  if (!input.pet_name) {
    return { success: false, reason: 'ไม่ระบุชื่อน้อง' }
  }

  const { data: pets } = await supabase
    .from('pets')
    .select('id, name')
    .eq('user_id', userId)
    .eq('status', 'active')
    .ilike('name', `%${input.pet_name.trim()}%`)
    .limit(1)

  if (!pets?.length) {
    return {
      success: false,
      reason:  `ไม่พบน้องชื่อ "${input.pet_name}" ในระบบ ลองตรวจสอบชื่อในโปรไฟล์น้องนะคะ`,
    }
  }

  const pet = pets[0]

  // ── normalize date ─────────────────────────────────────────
  const eventDate = input.event_date === 'today'
    ? new Date().toISOString().split('T')[0]
    : input.event_date

  // ── INSERT health event ────────────────────────────────────
  const { error: evErr } = await supabase.from('pet_health_events').insert({
    pet_id:      pet.id,
    user_id:     userId,
    event_type:  input.event_type,
    title:       input.medicine_name || input.event_type,
    description: input.notes         || null,
    event_date:  eventDate,
  })

  if (evErr) {
    console.error('[health-recorder]', evErr)
    return { success: false, reason: 'บันทึกไม่สำเร็จ กรุณาลองใหม่' }
  }

  // ── คำนวณ next_due ─────────────────────────────────────────
  const nextDueDays = input.next_due_days
    ?? NEXT_DUE_DAYS[input.event_type]
    ?? 0

  let nextDueDate: string | null = null

  if (nextDueDays > 0) {
    const d = new Date(eventDate)
    d.setDate(d.getDate() + nextDueDays)
    nextDueDate = d.toISOString().split('T')[0]

    // ── INSERT reminder (แจ้งเตือนล่วงหน้า 30 วัน) ────────
    const remindAt = new Date(d)
    remindAt.setDate(remindAt.getDate() - 30)

    const reminderTitle = input.medicine_name
      ? `ถึงเวลา${input.medicine_name}ให้น้อง${pet.name}แล้วค่ะ`
      : `ถึงเวลา${input.event_type}ให้น้อง${pet.name}แล้วค่ะ`

    const { data: reminder } = await supabase.from('reminders').insert({
      user_id:       userId,
      pet_id:        pet.id,
      title:         reminderTitle,
      body:          `น้อง${pet.name} ควรได้รับ${input.medicine_name || ''} ก่อน ${nextDueDate}`,
      remind_at:     remindAt.toISOString(),
      next_remind_at: remindAt.toISOString(),
      repeat_type:   'none',
      source:        'chat',
    }).select('id').single()

    // ── INSERT notification (แสดงตอนเปิด chat) ────────────
    if (reminder) {
      await supabase.from('notifications').insert({
        user_id:     userId,
        type:        'health_reminder',
        content:     `${reminderTitle}: น้อง${pet.name} ควรได้รับ${input.medicine_name || ''} ภายใน 30 วัน`,
        link:        `/pets/${pet.id}`,
        is_read:     false,
        scheduled_at: remindAt.toISOString(),
        reminder_id: reminder.id,
      })
    }
  }

  return {
    success:    true,
    pet_name:   pet.name,
    event_date: eventDate,
    next_due:   nextDueDate
      ? new Date(nextDueDate).toLocaleDateString('th-TH', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
      : null,
  }
}
