// lib/subscription.ts
// ── ตรวจสอบ plan และ feature gate ────────────────────────────

import { createClient } from '@/lib/supabase/server'

// ── Feature map ───────────────────────────────────────────────
const FREE_FEATURES = [
  'report_lost',        // ลงประกาศหาย
  'report_found',       // แจ้งพบ
  'ai_match',           // AI Matching
  'chatbot_basic',      // Chatbot จำกัด
  'web_push',           // Web Push
  'pet_profile_1',      // Profile 1 ตัว
  'search',             // ค้นหาประกาศ
  'view_public_pets',   // ดู Public Profile
]

const MEMBER_FEATURES = [
  ...FREE_FEATURES,
  'pet_profile_3',          // Profile 3 ตัว
  'pet_photo_10',           // รูป 10 รูป/ตัว
  'ai_caption',             // AI Caption รูป
  'health_record',          // ประวัติสุขภาพ
  'chatbot_full',           // Chatbot ไม่จำกัด
  'chatbot_health_recorder',// บันทึกผ่าน Chat
  'health_reminder',        // แจ้งเตือนวัคซีน
  'qr_code',                // QR Code
  'export_pdf',             // Export PDF
  'mode_mating',            // Mode หาคู่
  'mode_adoption',          // Mode หาบ้าน
  'mode_showcase',          // Mode โชว์
  'line_oa',                // LINE OA
  'pet_family_tree',        // ประวัติพ่อ-แม่
  'all_modes',              // ทุก Mode
]

// ── Types ─────────────────────────────────────────────────────
export type Plan = 'free' | 'member'

export interface SubscriptionInfo {
  plan:        Plan
  expires_at:  string | null
  grace_until: string | null
  is_active:   boolean
  is_expired:  boolean
  in_grace:    boolean
  days_left:   number
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

  // member แต่หมดอายุแล้ว → downgrade
  if (data.plan === 'member' && data.expires_at) {
    const expired = new Date(data.expires_at) < new Date()
    if (expired) {
      await supabase
        .from('subscriptions')
        .update({ plan: 'free', is_active: false })
        .eq('user_id', userId)
      return 'free'
    }
  }

  return (data.plan as Plan) || 'free'
}

// ── Get subscription info (ละเอียด) ─────────────────────────
export async function getSubscriptionInfo(
  userId: string
): Promise<SubscriptionInfo> {
  const supabase  = createClient()
  const now       = new Date()

  const { data } = await supabase
    .from('subscriptions')
    .select('plan, expires_at, grace_until, is_active')
    .eq('user_id', userId)
    .single()

  if (!data) {
    return {
      plan: 'free', expires_at: null, grace_until: null,
      is_active: true, is_expired: false, in_grace: false, days_left: 0,
    }
  }

  const expires   = data.expires_at  ? new Date(data.expires_at)  : null
  const grace     = data.grace_until ? new Date(data.grace_until) : null
  const isExpired = expires ? expires < now : false
  const inGrace   = isExpired && grace ? grace > now : false

  const daysLeft = (() => {
    if (inGrace && grace) return Math.ceil((grace.getTime() - now.getTime()) / 86400000)
    if (!isExpired && expires) return Math.ceil((expires.getTime() - now.getTime()) / 86400000)
    return 0
  })()

  return {
    plan:        (data.plan as Plan) || 'free',
    expires_at:  data.expires_at,
    grace_until: data.grace_until,
    is_active:   data.is_active,
    is_expired:  isExpired,
    in_grace:    inGrace,
    days_left:   daysLeft,
  }
}

// ── Feature gate ──────────────────────────────────────────────
export async function canUseFeature(
  userId:  string,
  feature: string
): Promise<boolean> {
  const plan = await getUserPlan(userId)

  if (plan === 'member') return MEMBER_FEATURES.includes(feature)
  return FREE_FEATURES.includes(feature)
}

// ── Pet profile limit ─────────────────────────────────────────
export function getPetLimit(plan: Plan): number {
  return plan === 'member' ? 3 : 1
}

// ── Check pet limit before creating ──────────────────────────
export async function canCreatePet(userId: string): Promise<{
  allowed: boolean
  current: number
  limit:   number
  plan:    Plan
}> {
  const supabase = createClient()
  const plan     = await getUserPlan(userId)
  const limit    = getPetLimit(plan)

  const { count } = await supabase
    .from('pets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active')

  const current = count || 0

  return {
    allowed: current < limit,
    current,
    limit,
    plan,
  }
}
