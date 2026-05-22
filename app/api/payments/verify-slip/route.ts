// app/api/payments/verify-slip/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse }            from 'next/server'
import { createClient }            from '@/lib/supabase/server'
import { GoogleGenerativeAI }      from '@google/generative-ai'

const EXPECTED_RECEIVER_KEYWORDS = ['พบเพ็ต', 'pobpet', 'pob pet']
const MAX_SLIP_AGE_HOURS         = 48

const SLIP_AMOUNTS: Record<string, number> = {
  member:  399,
  addon_1:  79,
  addon_3: 199,
}
const ADDON_SLOTS: Record<string, number> = {
  addon_1: 1,
  addon_3: 3,
}

function buildPrompt(expectedAmount: number): string {
  return `
วิเคราะห์ภาพสลิปการโอนเงินนี้แล้วตอบเป็น JSON เท่านั้น ห้ามมี text อื่น:
{
  "is_valid_slip": boolean,
  "amount": number,
  "transfer_date": "YYYY-MM-DD",
  "transfer_time": "HH:MM",
  "reference_no": "string",
  "sender_name": "string หรือ null",
  "receiver_name": "string หรือ null",
  "bank": "string",
  "confidence": number (0-100),
  "is_suspicious": boolean,
  "suspicious_reason": "string หรือ null",
  "issues": ["string"] หรือ []
}
กฎ:
1. ยอดเงินต้องตรงกับ ${expectedAmount} บาท
2. ชื่อผู้รับควรมีคำว่า: ${EXPECTED_RECEIVER_KEYWORDS.join(', ')}
3. ตรวจหาร่องรอยการแก้ไข Photoshop
4. วันที่ต้องไม่เกิน ${MAX_SLIP_AGE_HOURS} ชั่วโมงจากปัจจุบัน
5. ต้องมีเลขอ้างอิงชัดเจน
ตอบ JSON เท่านั้น
  `.trim()
}

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const {
      imageBase64,
      slip_type = 'member',  
      line_id
    } = await req.json()

    const expectedAmount = SLIP_AMOUNTS[slip_type] ?? 399
    const isAddon        = slip_type.startsWith('addon_')

    if (!imageBase64) {
      return NextResponse.json({ error: 'กรุณาแนบรูปสลิป', success: false }, { status: 400 })
    }

    if (isAddon) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan, expires_at')
        .eq('user_id', userId)
        .single()
      const isMember = sub?.plan === 'member'
        && sub?.expires_at
        && new Date(sub.expires_at) > new Date()
      if (!isMember) {
        return NextResponse.json({
          success: false,
          reason:  'ต้องเป็น Member ก่อนถึงจะซื้อ Add-on ได้ค่ะ',
        })
      }
    }

    if (!isAddon) {
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('plan, expires_at')
        .eq('user_id', userId)
        .single()
      if (existingSub?.plan === 'member' && existingSub.expires_at) {
        const exp = new Date(existingSub.expires_at)
        if (exp > new Date()) {
          return NextResponse.json({
            success: false,
            reason:  'คุณเป็น Member อยู่แล้วค่ะ ต่ออายุได้เมื่อใกล้หมดอายุนะคะ',
          })
        }
      }
    }

    // ── Gemini Vision Configuration ───────────────────────────
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

    const genAI = new GoogleGenerativeAI(apiKey)
    
    // 🟢 [แก้ไขสำเร็จเรียบร้อย] ปรับชื่อ Engine Model เป็นเวอร์ชัน gemini-2.5-flash เพื่อปลดล็อกพอร์ต v1 อย่างเป็นทางการ
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent([
      buildPrompt(expectedAmount),
      { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
    ])

    const rawText = result.response.text()
    const cleaned = rawText.replace(/```json|```/g, '').trim()

    let parsed: Record<string, any>
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({
        success: false,
        reason:  'ไม่สามารถอ่านข้อมูลจากสลิปได้ กรุณาถ่ายรูปให้ชัดขึ้น',
      })
    }

    const { is_valid_slip, amount, transfer_date, transfer_time,
            reference_no, confidence, is_suspicious } = parsed

    if (reference_no) {
      const { data: dup } = await supabase
        .from('payment_slips')
        .select('id')
        .eq('reference_no', reference_no)
        .single()
      if (dup) {
        return NextResponse.json({ success: false, reason: 'สลิปนี้เคยใช้ไปแล้วค่ะ' })
      }
    }

    if (transfer_date) {
      const slipTime  = new Date(`${transfer_date}T${transfer_time || '00:00'}`)
      const diffHours = (Date.now() - slipTime.getTime()) / 3_600_000
      if (diffHours > MAX_SLIP_AGE_HOURS) {
        return NextResponse.json({
          success: false,
          reason:  `สลิปเกิน ${MAX_SLIP_AGE_HOURS} ชั่วโมงแล้ว กรุณาโอนใหม่ค่ะ`,
        })
      }
    }

    const slipStatus = (!is_valid_slip || is_suspicious) ? 'rejected'
      : confidence >= 90 ? 'auto_approved'
      : confidence >= 60 ? 'pending'
      : 'rejected'

    await supabase.from('payment_slips').insert({
      user_id:       userId,
      reference_no:  reference_no || `NREF-${Date.now()}`,
      amount,
      transfer_date: transfer_date || null,
      confidence,
      is_suspicious,
      slip_type,
      status:        slipStatus,
      raw_result:    parsed,
    })

    // ── APPROVED ──
    if (is_valid_slip && !is_suspicious && confidence >= 90 && amount >= expectedAmount) {
      
      if (line_id) {
        await supabase
          .from('profiles')
          .update({ line_id: line_id })
          .eq('id', userId)
      }

      if (isAddon) {
        const addSlots = ADDON_SLOTS[slip_type] || 1
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('pet_slots_addon')
          .eq('user_id', userId)
          .single()
        const currentAddon = sub?.pet_slots_addon || 0

        await supabase.from('subscriptions')
          .update({ pet_slots_addon: currentAddon + addSlots })
          .eq('user_id', userId)

        await supabase.from('notifications').insert({
          user_id: userId,
          type:    'addon_activated',
          title:   `เพิ่ม slot น้องอีก ${addSlots} ตัวแล้วค่ะ! 🐾`,
          body:    `ตอนนี้มีพื้นที่เก็บโปรไฟล์น้องทั้งหมด ${3 + currentAddon + addSlots} ตัวแล้วค่ะ`,
          link:    '/dashboard/pets',
          is_read: false,
        })

      } else {
        const expiresAt = new Date()
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)

        await supabase.from('subscriptions').upsert({
          user_id:        userId,
          plan:           'member',
          expires_at:     expiresAt.toISOString(),
          grace_until:    null,
          is_active:      true,
          payment_method: 'manual_transfer',
          payment_ref:    reference_no || null,
        }, { onConflict: 'user_id' })

        await supabase.from('notifications').insert({
          user_id: userId,
          type:    'subscription_activated',
          title:   'ยินดีต้อนรับสู่ Member! 🎉',
          body:    'แพ็คเกจของคุณเปิดใช้งานแล้วค่ะ สามารถสแกนเข้าใช้ระบบแชทบน LINE OA ได้ทันทีค่ะ',
          link:    '/account/subscription',
          is_read: false,
        })
      }

      return NextResponse.json({ success: true, auto_activated: true, slip_type })
    }

    if (is_valid_slip && !is_suspicious && confidence >= 60) {
      return NextResponse.json({
        success: false, pending: true,
        message: 'กำลังตรวจสอบอยู่นะคะ ทีมงานจะยืนยันภายใน 1-2 ชั่วโมงค่ะ',
      })
    }

    const rejectReason = is_suspicious
      ? parsed.suspicious_reason || 'พบสิ่งผิดปกติในสลิป'
      : !is_valid_slip ? 'ไม่ใช่สลิปการโอนเงิน'
      : amount < expectedAmount ? `ยอดโอน ฿${amount} ไม่ถึง ฿${expectedAmount}`
      : 'ภาพไม่ชัดเจนพอ กรุณาถ่ายใหม่'

    return NextResponse.json({ success: false, reason: rejectReason })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown'
    return NextResponse.json({ success: false, reason: `ระบบขัดข้องชั่วคราวค่ะ: ${msg}` }, { status: 500 })
  }
}