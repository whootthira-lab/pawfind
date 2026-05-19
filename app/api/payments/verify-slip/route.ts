// app/api/payments/verify-slip/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse }  from 'next/server'
import { createClient }  from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const EXPECTED_RECEIVER_KEYWORDS = ['พบเพ็ต', 'pobpet', 'pob pet', 'พบ เพ็ต']
const MAX_SLIP_AGE_HOURS         = 48   // สลิปเก่าเกิน 48 ชม. ไม่รับ

// ── Gemini prompt ─────────────────────────────────────────────
function buildPrompt(expectedAmount: number): string {
  return `
วิเคราะห์ภาพสลิปการโอนเงินนี้อย่างละเอียด แล้วตอบเป็น JSON เท่านั้น ห้ามมี text อื่น:

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

กฎการตรวจสอบ:
1. ยอดเงินต้องตรงกับ ${expectedAmount} บาท (±0 บาท)
2. ชื่อผู้รับควรมีคำว่า: ${EXPECTED_RECEIVER_KEYWORDS.join(', ')}
3. ตรวจหาร่องรอยการแก้ไข Photoshop เช่น pixel ผิดปกติ font ไม่สม่ำเสมอ
4. วันที่ต้องไม่เกิน ${MAX_SLIP_AGE_HOURS} ชั่วโมงจากปัจจุบัน
5. ต้องมีเลขอ้างอิง (Reference No.) ที่ชัดเจน
6. ถ้าเป็นรูปที่ถ่าย screenshot ซ้อน screenshot ให้ is_suspicious = true

ตอบเป็น JSON เท่านั้น ห้ามมี markdown หรือ backtick
  `.trim()
}

export async function POST(req: Request) {
  try {
    const supabase = createClient()

    // ── Auth ────────────────────────────────────────────────
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { imageBase64, expectedAmount = 399 } = await req.json()

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'กรุณาแนบรูปสลิป', success: false },
        { status: 400 }
      )
    }

    // ── เช็คว่า member อยู่แล้วหรือยัง ────────────────────
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('plan, expires_at, is_active')
      .eq('user_id', userId)
      .single()

    if (existingSub?.plan === 'member' && existingSub.is_active) {
      const exp = existingSub.expires_at
        ? new Date(existingSub.expires_at)
        : null
      if (!exp || exp > new Date()) {
        return NextResponse.json({
          success: false,
          reason:  'คุณเป็น Member อยู่แล้วค่ะ',
        })
      }
    }

    // ── Gemini Vision ───────────────────────────────────────
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent([
      buildPrompt(expectedAmount),
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data:     imageBase64,
        },
      },
    ])

    const rawText = result.response.text()
    const cleaned = rawText.replace(/```json|```/g, '').trim()

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('[verify-slip] JSON parse error:', rawText)
      return NextResponse.json({
        success: false,
        reason:  'ไม่สามารถอ่านข้อมูลจากสลิปได้ กรุณาถ่ายรูปให้ชัดขึ้น',
      })
    }

    const {
      is_valid_slip,
      amount,
      transfer_date,
      transfer_time,
      reference_no,
      sender_name,
      receiver_name,
      bank,
      confidence,
      is_suspicious,
      suspicious_reason,
      issues,
    } = parsed as {
      is_valid_slip:     boolean
      amount:            number
      transfer_date:     string
      transfer_time:     string
      reference_no:      string
      sender_name:       string | null
      receiver_name:     string | null
      bank:              string
      confidence:        number
      is_suspicious:     boolean
      suspicious_reason: string | null
      issues:            string[]
    }

    // ── ตรวจสอบซ้ำ reference_no ───────────────────────────
    if (reference_no) {
      const { data: duplicate } = await supabase
        .from('payment_slips')
        .select('id, status')
        .eq('reference_no', reference_no)
        .single()

      if (duplicate) {
        await supabase.from('payment_slips').insert({
          user_id:      userId,
          reference_no: `DUPLICATE-${Date.now()}`,
          amount,
          confidence:   0,
          is_suspicious: true,
          status:       'rejected',
          raw_result:   { ...parsed, duplicate_of: duplicate.id },
        })
        return NextResponse.json({
          success: false,
          reason:  'สลิปนี้เคยใช้ไปแล้วค่ะ',
        })
      }
    }

    // ── เช็คอายุสลิป ────────────────────────────────────────
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

    // ── บันทึกสลิปทุกกรณี ───────────────────────────────────
    const slipStatus = (() => {
      if (!is_valid_slip || is_suspicious) return 'rejected'
      if ((confidence as number) >= 90)    return 'auto_approved'
      if ((confidence as number) >= 60)    return 'pending'
      return 'rejected'
    })()

    await supabase.from('payment_slips').insert({
      user_id:       userId,
      reference_no:  reference_no || `NREF-${Date.now()}`,
      amount,
      transfer_date: transfer_date || null,
      confidence,
      is_suspicious,
      status:        slipStatus,
      raw_result: {
        transfer_time,
        sender_name,
        receiver_name,
        bank,
        issues,
        suspicious_reason,
      },
    })

    // ── AUTO APPROVE ─────────────────────────────────────────
    if (
      is_valid_slip
      && !is_suspicious
      && (confidence as number) >= 90
      && (amount as number) >= expectedAmount
    ) {
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

      // แจ้งเตือนสำเร็จ
      await supabase.from('notifications').insert({
        user_id: userId,
        type:    'subscription_activated',
        title:   'ยินดีต้อนรับสู่ Member! 🎉',
        body:    'แพ็คเกจของคุณเปิดใช้งานแล้วค่ะ',
        link:    '/payment/success',
        is_read: false,
      })

      return NextResponse.json({ success: true, auto_activated: true })
    }

    // ── PENDING REVIEW ───────────────────────────────────────
    if (
      is_valid_slip
      && !is_suspicious
      && (confidence as number) >= 60
    ) {
      // แจ้ง Admin ผ่าน notifications table (Admin ดูใน dashboard)
      await supabase.from('notifications').insert({
        user_id: userId,
        type:    'slip_pending_review',
        title:   'สลิปรอการตรวจสอบ',
        body:    `confidence: ${confidence}% · จำนวน: ฿${amount} · ref: ${reference_no}`,
        link:    '/admin/payments',
        is_read: false,
      })

      return NextResponse.json({
        success: false,
        pending: true,
        message: 'กำลังตรวจสอบอยู่นะคะ ทีมงานจะยืนยันภายใน 1-2 ชั่วโมงค่ะ',
      })
    }

    // ── REJECTED ─────────────────────────────────────────────
    const rejectReason = (() => {
      if (is_suspicious)                        return suspicious_reason || 'พบสิ่งผิดปกติในสลิป'
      if (!is_valid_slip)                       return 'ไม่ใช่สลิปการโอนเงิน'
      if ((amount as number) < expectedAmount)  return `ยอดโอน ฿${amount} ไม่ถึง ฿${expectedAmount}`
      if ((confidence as number) < 60)          return 'ภาพไม่ชัดเจนพอ กรุณาถ่ายใหม่'
      return (issues as string[])?.[0] || 'ไม่สามารถยืนยันได้ กรุณาติดต่อทีมงาน'
    })()

    return NextResponse.json({
      success: false,
      reason:  rejectReason,
    })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[verify-slip]', msg)
    return NextResponse.json(
      { success: false, reason: `ระบบขัดข้องชั่วคราวค่ะ: ${msg}` },
      { status: 500 }
    )
  }
}
