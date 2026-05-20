// lib/subscription.ts
import { createClient } from '@/lib/supabase/server'

// ── Feature map ───────────────────────────────────────────────
const FREE_FEATURES = [
  'report_lost', 'report_found', 'ai_match',
  'chatbot_basic', 'web_push', 'pet_profile_1',
  'search', 'view_public_pets',
]
const MEMBER_FEATURES = [
  ...FREE_FEATURES,
  'pet_profile_3', 'pet_photo_10', 'ai_caption',
  'health_record', 'chatbot_full', 'chatbot_health_recorder',
  'health_reminder', 'qr_code', 'export_pdf',
  'mode_mating', 'mode_adoption', 'mode_showcase',
  'line_oa', 'pet_family_tree', 'all_modes', 'pet_addon',
]

export type Plan = 'free' | 'member'

export interface SubscriptionInfo {
  plan:            Plan
  expires_at:      string | null
  grace_until:     string | null
  is_active:       boolean
  is_expired:      boolean
  in_grace:        boolean
  days_left:       number
  pet_slots_addon: number      // จำนวน slot ที่ซื้อเพิ่ม
  pet_limit:       number      // limit รวม (base + addon)
}

// ── Get user plan ─────────────────────────────────────────────
export async function getUserPlan(userId: string): Promise<Plan> {
  const supabase = createClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, expires_at, is_active')
    .eq('user_id', userId)
    .single()

  if (!data) return 'free'

  if (data.plan === 'member' && data.expires_at) {
    if (new Date(data.expires_at) < new Date()) {
      await supabase
        .from('subscriptions')
        .update({ plan: 'free', is_active: false })
        .eq('user_id', userId)
      return 'free'
    }
  }
  return (data.plan as Plan) || 'free'
}

// ── Get subscription info ─────────────────────────────────────
export async function getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
  const supabase = createClient()
  const now      = new Date()

  const { data } = await supabase
    .from('subscriptions')
    .select('plan, expires_at, grace_until, is_active, pet_slots_addon')
    .eq('user_id', userId)
    .single()

  if (!data) return {
    plan: 'free', expires_at: null, grace_until: null,
    is_active: true, is_expired: false, in_grace: false,
    days_left: 0, pet_slots_addon: 0, pet_limit: 1,
  }

  const expires   = data.expires_at  ? new Date(data.expires_at)  : null
  const grace     = data.grace_until ? new Date(data.grace_until) : null
  const isExpired = expires ? expires < now : false
  const inGrace   = isExpired && grace ? grace > now : false

  const daysLeft = (() => {
    if (inGrace && grace)    return Math.ceil((grace.getTime()   - now.getTime()) / 86400000)
    if (!isExpired && expires) return Math.ceil((expires.getTime() - now.getTime()) / 86400000)
    return 0
  })()

  const plan    = (data.plan as Plan) || 'free'
  const addon   = data.pet_slots_addon || 0
  const base    = plan === 'member' ? 3 : 1
  // addon ใช้ได้เฉพาะตอนเป็น Member และไม่ expired
  const petLimit = plan === 'member' && !isExpired ? base + addon : base

  return {
    plan,
    expires_at:      data.expires_at,
    grace_until:     data.grace_until,
    is_active:       data.is_active,
    is_expired:      isExpired,
    in_grace:        inGrace,
    days_left:       daysLeft,
    pet_slots_addon: addon,
    pet_limit:       petLimit,
  }
}

// ── Feature gate ──────────────────────────────────────────────
export async function canUseFeature(userId: string, feature: string): Promise<boolean> {
  const plan = await getUserPlan(userId)
  if (plan === 'member') return MEMBER_FEATURES.includes(feature)
  return FREE_FEATURES.includes(feature)
}

// ── Pet limit (รวม addon) ─────────────────────────────────────
export function getPetLimit(plan: Plan, addon = 0): number {
  const base = plan === 'member' ? 3 : 1
  return plan === 'member' ? base + addon : base
}

// ── Can create pet ────────────────────────────────────────────
export async function canCreatePet(userId: string): Promise<{
  allowed:    boolean
  current:    number
  limit:      number
  plan:       Plan
  addon_slots: number
}> {
  const supabase = createClient()
  const info     = await getSubscriptionInfo(userId)

  const { count } = await supabase
    .from('pets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active')

  const current = count || 0

  return {
    allowed:     current < info.pet_limit,
    current,
    limit:       info.pet_limit,
    plan:        info.plan,
    addon_slots: info.pet_slots_addon,
  }
}

// ── Renewal alert check ───────────────────────────────────────
// เรียกจาก Cron หรือ auth/callback เพื่อส่ง notification แจ้งเตือนต่ออายุ
export async function checkRenewalAlert(userId: string): Promise<void> {
  const supabase = createClient()
  const info     = await getSubscriptionInfo(userId)
  if (info.plan !== 'member' || info.is_expired) return

  const daysLeft = info.days_left
  let   title    = ''
  let   body     = ''
  let   type     = ''

  if (daysLeft === 30) {
    type  = 'renewal_30'
    title = '📅 แพ็คเกจจะหมดในอีก 30 วันนะคะ'
    body  = 'ต่ออายุตอนนี้เพื่อรักษาสิทธิ์ทุกอย่างไว้ครบ ฿399/ปี'
  } else if (daysLeft === 7) {
    type  = 'renewal_7'
    title = '⚠️ เหลืออีก 7 วัน!'
    body  = 'ต่ออายุเพื่อรักษาประวัติสุขภาพน้องและ LINE OA ไว้นะคะ'
  } else {
    return
  }

  // เช็คว่าส่งแจ้งเตือนประเภทนี้ไปแล้วในเดือนนี้หรือยัง
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', type)
    .gte('created_at', monthStart.toISOString())
    .single()

  if (existing) return // ส่งไปแล้ว

  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    link:    '/account/subscription',
    is_read: false,
  })
}
