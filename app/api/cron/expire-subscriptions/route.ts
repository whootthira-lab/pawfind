// app/api/cron/expire-subscriptions/route.ts
// ── รันทุกวัน ตี 1 ────────────────────────────────────────────
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  // ── Verify cron secret ────────────────────────────────────
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  const now      = new Date()
  const   results  = {
    notified_day1:  0,
    notified_day15: 0,
    notified_day25: 0,
    locked:         0,
    archived:       0,
    warned_delete:  0,
    deleted:        0,
  }

  // ════════════════════════════════════════════════════════
  // 1. Member ที่เพิ่งหมดอายุวันนี้ → ตั้ง grace 30 วัน + แจ้ง Day 1
  // ════════════════════════════════════════════════════════
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)

  const { data: justExpired } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('plan', 'member')
    .eq('is_active', true)
    .gte('expires_at', yesterday.toISOString())
    .lt('expires_at', now.toISOString())
    .is('grace_until', null)

  if (justExpired?.length) {
    const graceUntil = new Date(now)
    graceUntil.setDate(graceUntil.getDate() + 30)

    for (const s of justExpired) {
      await supabase.from('subscriptions')
        .update({ grace_until: graceUntil.toISOString() })
        .eq('user_id', s.user_id)

      await supabase.from('notifications').insert({
        user_id: s.user_id,
        type:    'subscription_expired',
        title:   'แพ็คเกจของคุณหมดอายุแล้วนะคะ 🐾',
        body:    'ยังไม่ต้องรีบค่ะ มีเวลา 30 วัน ต่ออายุได้ตลอดเพื่อรักษาข้อมูลน้องไว้',
        link:    '/pricing',
        is_read: false,
      })
    }
    results.notified_day1 = justExpired.length
  }

  // ════════════════════════════════════════════════════════
  // 2. แจ้งเตือน Day 15 (grace เหลือ 15 วัน)
  // ════════════════════════════════════════════════════════
  const grace15From = new Date(now); grace15From.setDate(grace15From.getDate() + 14)
  const grace15To   = new Date(now); grace15To.setDate(grace15To.getDate() + 15)

  const { data: day15Users } = await supabase
    .from('subscriptions')
    .select('user_id')
    .not('grace_until', 'is', null)
    .gte('grace_until', grace15From.toISOString())
    .lt('grace_until', grace15To.toISOString())

  for (const s of day15Users || []) {
    await supabase.from('notifications').insert({
      user_id: s.user_id,
      type:    'subscription_warning_15',
      title:   'เหลืออีก 15 วันนะคะ 🔔',
      body:    'ถ้ายังไม่ต่ออายุ จะต้องเลือกว่าจะเก็บโปรไฟล์น้องตัวไหนไว้ก่อน ข้อมูลตัวอื่นจะซ่อนไว้ ไม่ลบนะคะ',
      link:    '/pricing',
      is_read: false,
    })
  }
  results.notified_day15 = day15Users?.length || 0

  // ════════════════════════════════════════════════════════
  // 3. แจ้งเตือน Day 25 (grace เหลือ 5 วัน)
  // ════════════════════════════════════════════════════════
  const grace5From = new Date(now); grace5From.setDate(grace5From.getDate() + 4)
  const grace5To   = new Date(now); grace5To.setDate(grace5To.getDate() + 5)

  const { data: day25Users } = await supabase
    .from('subscriptions')
    .select('user_id')
    .not('grace_until', 'is', null)
    .gte('grace_until', grace5From.toISOString())
    .lt('grace_until', grace5To.toISOString())

  for (const s of day25Users || []) {
    await supabase.from('notifications').insert({
      user_id: s.user_id,
      type:    'subscription_warning_5',
      title:   'เหลือ 5 วันสุดท้ายแล้วค่ะ ⚠️',
      body:    'ต่ออายุตอนนี้ หรือเลือกโปรไฟล์ที่จะเก็บไว้ได้เลยค่ะ',
      link:    '/pricing',
      is_read: false,
    })
  }
  results.notified_day25 = day25Users?.length || 0

  // ════════════════════════════════════════════════════════
  // 4. Grace หมดแล้ว → Archive โปรไฟล์ส่วนเกิน (เก็บไว้ 1 ตัว)
  // ════════════════════════════════════════════════════════
  const { data: graceExpired } = await supabase
    .from('subscriptions')
    .select('user_id')
    .not('grace_until', 'is', null)
    .lt('grace_until', now.toISOString())
    .eq('is_active', true)

  for (const s of graceExpired || []) {
    // Downgrade subscription
    await supabase.from('subscriptions')
      .update({ plan: 'free', is_active: false, grace_until: null })
      .eq('user_id', s.user_id)

    // ดึง pets ที่ active เรียงตาม created_at (เก่าสุดก่อน)
    const { data: pets } = await supabase
      .from('pets')
      .select('id')
      .eq('user_id', s.user_id)
      .eq('status', 'active')
      .order('created_at', { ascending: true })

    if (pets && pets.length > 1) {
      // เก็บตัวแรก (เก่าสุด) archive ที่เหลือ
      const toArchive  = pets.slice(1)
      const deleteDate = new Date(now)
      deleteDate.setDate(deleteDate.getDate() + 60)

      await supabase.from('pets')
        .update({
          status:       'archived',
          archived_at:  now.toISOString(),
          delete_after: deleteDate.toISOString(),
          // ปิด mode ทั้งหมด
          mode_lost:      false,
          mode_mating:    false,
          mode_adoption:  false,
          mode_showcase:  false,
          is_public:      false,
        })
        .in('id', toArchive.map(p => p.id))

      results.archived += toArchive.length
    }

    results.locked++
  }

  // ════════════════════════════════════════════════════════
  // 5. แจ้งเตือนก่อนลบถาวร 7 วัน (archived + delete_after ใกล้มา)
  // ════════════════════════════════════════════════════════
  const warn7From = new Date(now); warn7From.setDate(warn7From.getDate() + 6)
  const warn7To   = new Date(now); warn7To.setDate(warn7To.getDate() + 7)

  const { data: soonDelete } = await supabase
    .from('pets')
    .select('user_id, name')
    .eq('status', 'archived')
    .gte('delete_after', warn7From.toISOString())
    .lt('delete_after', warn7To.toISOString())

  const userPetMap = new Map<string, string[]>()
  for (const p of soonDelete || []) {
    const arr = userPetMap.get(p.user_id) || []
    arr.push(p.name)
    userPetMap.set(p.user_id, arr)
  }

  for (const [userId, petNames] of Array.from(userPetMap.entries())) {
    await supabase.from('notifications').insert({
      user_id: userId,
      type:    'pet_delete_warning',
      title:   'ข้อมูลน้องจะถูกลบใน 7 วัน',
      body:    `น้อง ${petNames.join(', ')} จะถูกลบถาวร ต่ออายุตอนนี้เพื่อดึงข้อมูลกลับมาได้ค่ะ`,
      link:    '/pricing',
      is_read: false,
    })
  }
  results.warned_delete = userPetMap.size

  // ════════════════════════════════════════════════════════
  // 6. ลบถาวร (archived + delete_after ผ่านมาแล้ว)
  // ════════════════════════════════════════════════════════
  const { data: toDelete, error: deleteErr } = await supabase
    .from('pets')
    .delete()
    .eq('status', 'archived')
    .lt('delete_after', now.toISOString())
    .select('id')

  if (!deleteErr) results.deleted = toDelete?.length || 0

  return NextResponse.json({ ok: true, results })
}
