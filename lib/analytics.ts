// lib/analytics.ts
// ── PobPet Analytics — บันทึกพฤติกรรมผู้ใช้ทุก Event ──────
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ══════════════════════════════════════════════════════════════
// CORE TRACK FUNCTION
// ══════════════════════════════════════════════════════════════
export async function trackEvent(
  eventName: string,
  params: {
    targetId?: string
    platform?: string
    metadata?: Record<string, unknown>
  } = {}
) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('user_events').insert({
      event_name: eventName,
      user_id:    session?.user?.id ?? null,
      target_id:  params.targetId  ?? null,
      platform:   params.platform  ?? null,
      metadata:   params.metadata  ?? null,
    })
  } catch (err) {
    // Analytics ไม่ควร crash app หลัก
    console.warn('[Analytics] trackEvent failed silently:', err)
  }
}

// ══════════════════════════════════════════════════════════════
// 1. SHARE & VIRALITY — สร้าง URL พร้อม UTM + ref layer
// ══════════════════════════════════════════════════════════════
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawfind-eta.vercel.app'

/**
 * สร้าง share URL พร้อม UTM parameters
 * ตัวอย่าง: /pet/123?utm_source=facebook&utm_medium=share&ref=user_abc
 */
export function buildShareUrl(
  petId: string,
  platform: string,
  userId?: string | null
): string {
  const url = new URL(`${BASE_URL}/pet/${petId}`)
  url.searchParams.set('utm_source',  platform)
  url.searchParams.set('utm_medium',  'share')
  url.searchParams.set('utm_campaign','pet_share')
  // ref layer: ถ้ามี userId ใส่ไว้เพื่อ trace virality chain
  if (userId) url.searchParams.set('ref', `user_${userId.slice(0, 8)}`)
  return url.toString()
}

/**
 * อ่าน UTM จาก URL ปัจจุบัน (เรียกใน useEffect ฝั่ง client)
 * ใช้บันทึกว่า user มาจาก share ของใคร
 */
export function captureUtmOnLoad(petId: string) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const source = params.get('utm_source')
  const ref    = params.get('ref')
  if (source) {
    trackEvent('pet_view_from_share', {
      targetId: petId,
      platform: source,
      metadata: { ref, campaign: params.get('utm_campaign') },
    })
  }
}

// ══════════════════════════════════════════════════════════════
// 2. CTA TRACKING — การ์ด view, click รายละเอียด, แชร์จากการ์ด
// ══════════════════════════════════════════════════════════════
export function trackCardView(petId: string, position?: number) {
  trackEvent('card_viewed', {
    targetId: petId,
    metadata: { position },
  })
}

export function trackCardClick(petId: string, action: 'view_detail' | 'share_from_card') {
  trackEvent('card_cta_clicked', {
    targetId: petId,
    platform: action,
    metadata: { timestamp: Date.now() },
  })
}

// ══════════════════════════════════════════════════════════════
// 3. FORM FUNNEL TRACKING — วัด Drop-off แต่ละขั้นตอน
// ══════════════════════════════════════════════════════════════
export type FormStep =
  | 'form_started'        // เปิดหน้า report
  | 'images_uploaded'     // อัปโหลดรูปเสร็จ
  | 'location_added'      // กด GPS สำเร็จ
  | 'details_filled'      // กรอกข้อมูลหลักเสร็จ
  | 'form_submitted'      // กด submit
  | 'form_success'        // บันทึกสำเร็จ
  | 'form_abandoned'      // ออกจากหน้าก่อน submit

export function trackFormStep(step: FormStep, metadata?: Record<string, unknown>) {
  trackEvent(step, {
    platform: 'report_form',
    metadata: { ...metadata, timestamp: Date.now() },
  })
}

// ══════════════════════════════════════════════════════════════
// 4. DELETE REASON TRACKING — วัด Success Rate จริง
// ══════════════════════════════════════════════════════════════
export type DeleteReason =
  | 'found_pet'       // เจอน้องแล้ว ✅ (success!)
  | 'owner_contacted' // เจ้าของติดต่อมาแล้ว ✅
  | 'cancel_post'     // ยกเลิกประกาศ
  | 'duplicate'       // ลงซ้ำ
  | 'other'           // อื่นๆ

export const DELETE_REASON_OPTIONS: { value: DeleteReason; label: string; isSuccess: boolean }[] = [
  { value: 'found_pet',       label: '🎉 เจอน้องแล้ว!',           isSuccess: true  },
  { value: 'owner_contacted', label: '📞 เจ้าของติดต่อมาแล้ว',    isSuccess: true  },
  { value: 'cancel_post',     label: '📝 ต้องการยกเลิกประกาศ',    isSuccess: false },
  { value: 'duplicate',       label: '🔁 ลงประกาศซ้ำ',            isSuccess: false },
  { value: 'other',           label: '🗑 เหตุผลอื่น',              isSuccess: false },
]

export function trackDeleteReason(petId: string, reason: DeleteReason) {
  const opt = DELETE_REASON_OPTIONS.find(o => o.value === reason)
  trackEvent('pet_deleted', {
    targetId: petId,
    platform: reason,
    metadata: {
      is_success: opt?.isSuccess ?? false,
      label:      opt?.label,
      timestamp:  Date.now(),
    },
  })
}

// ══════════════════════════════════════════════════════════════
// 5. RETURN FREQUENCY — เจ้าของกลับมาเช็คบ่อยแค่ไหน
// ══════════════════════════════════════════════════════════════
export function trackOwnerReturn(petId: string) {
  trackEvent('owner_returned', {
    targetId: petId,
    metadata: { timestamp: Date.now() },
  })
}
