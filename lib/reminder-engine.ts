// lib/reminder-engine.ts
// ── สร้างและจัดการ Reminder ─────────────────────────────────

import { createClient } from '@/lib/supabase/server'

export interface ReminderInput {
  title:       string
  pet_name?:   string | null
  remind_at:   string          // 'YYYY-MM-DD HH:MM' หรือ natural language ที่ parse แล้ว
  repeat_type?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  body?:       string | null
}

export interface ReminderResult {
  success:   boolean
  title?:    string
  remind_at?: string
  reason?:   string
}

export async function createReminder(
  userId: string,
  input:  ReminderInput
): Promise<ReminderResult> {
  const supabase = createClient()

  // ── หา pet_id ถ้าระบุชื่อ ─────────────────────────────────
  let petId: string | null = null
  if (input.pet_name) {
    const { data: pets } = await supabase
      .from('pets')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .ilike('name', `%${input.pet_name.trim()}%`)
      .limit(1)
    if (pets?.length) petId = pets[0].id
  }

  // ── Parse remind_at ────────────────────────────────────────
  let remindDate: Date
  try {
    // รองรับ format: 'YYYY-MM-DD', 'YYYY-MM-DD HH:MM'
    remindDate = new Date(input.remind_at)
    if (isNaN(remindDate.getTime())) throw new Error('Invalid date')
  } catch {
    return { success: false, reason: 'ไม่สามารถตีความวันที่ได้ กรุณาระบุเป็น ปี-เดือน-วัน' }
  }

  // ── INSERT reminder ────────────────────────────────────────
  const { data: reminder, error } = await supabase.from('reminders').insert({
    user_id:       userId,
    pet_id:        petId,
    title:         input.title,
    body:          input.body || null,
    remind_at:     remindDate.toISOString(),
    next_remind_at: remindDate.toISOString(),
    repeat_type:   input.repeat_type || 'none',
    source:        'chat',
  }).select('id').single()

  if (error) {
    console.error('[reminder-engine]', error)
    return { success: false, reason: 'ตั้งแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่' }
  }

  // ── INSERT notification ────────────────────────────────────
  await supabase.from('notifications').insert({
    user_id:     userId,
    type:        'reminder',
    title:       input.title,
    body:        input.body || 'แจ้งเตือนที่ตั้งไว้',
    link:        '/dashboard/reminders',
    is_read:     false,
    scheduled_at: remindDate.toISOString(),
    reminder_id: reminder.id,
  })

  return {
    success:   true,
    title:     input.title,
    remind_at: remindDate.toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }),
  }
}

// ── Get upcoming reminders ─────────────────────────────────────
export async function getUpcomingReminders(userId: string, limit = 5) {
  const supabase = createClient()
  const { data } = await supabase
    .from('reminders')
    .select('id, title, remind_at, pet_id, repeat_type')
    .eq('user_id', userId)
    .eq('is_done', false)
    .gte('next_remind_at', new Date().toISOString())
    .order('next_remind_at', { ascending: true })
    .limit(limit)
  return data || []
}
