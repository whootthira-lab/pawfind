// app/api/payments/verify-slip/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const EXPECTED_RECEIVING_ACCOUNT = ['010753700088205', 'MH116010MG0160333S']

const SLIP_AMOUNTS: Record<string, number> = {
  member:  399,
  addon_1:  79,
  addon_3: 199,
}
const ADDON_SLOTS: Record<string, number> = {
  addon_1: 1,
  addon_3: 3,
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
        return NextResponse.json({ success: false, reason: 'ต้องเป็น Member ก่อนถึงจะซื้อ Add-on ได้ค่ะ' })
      }
    }

    if (!isAddon) {
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('plan, expires_at')
        .eq('user_id', userId)
        .single()
      if (existingSub?.plan === 'member' && existingSub.expires_at) {
        if (new Date(existingSub.expires_at) > new Date()) {
          return NextResponse.json({ success: false, reason: 'คุณเป็น Member อยู่แล้วค่ะ ต่ออายุได้เมื่อใกล้หมดอายุนะคะ' })
        }
      }
    }

    const apiKey   = process.env.SLIPOK_API_KEY
    const branchId = process.env.SLIPOK_BRANCH_ID
    
    if (!apiKey || !branchId) {
      return NextResponse.json({ 
        success: false, 
        reason: 'ระบบตรวจสอบสลิปยังตั้งค่า Key บน Vercel ไม่สำเร็จ หรือเซิร์ฟเวอร์ยังบิวด์ไม่เสร็จสมบูรณ์ค่ะ' 
      })
    }

    const cleanBase64 = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1] 
      : imageBase64

    const response = await fetch('https://api.slipok.com/api/v1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lib-api-key': apiKey
      },
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${cleanBase64}`,
        branch_id: branchId,
        log: true
      })
    })

    const slipOkResult = await response.json()

    // 🟢 [แก้ไขสำเร็จ] ครอบเครื่องหมาย backtick สำหรับข้อความ String ฟอลแบ็คเรียบร้อยแล้วครับ
    if (!response.ok || !slipOkResult.success) {
      return NextResponse.json({
        success: false,
        reason: slipOkResult.message || `SlipOK ตอบกลับสถานะปฏิเสธ: ${response.status}`
      })
    }

    const slipData = slipOkResult.data
    const reference_no = slipData.transRef || slipData.sendingBank
    const amountTransferred = slipData.amount

    if (reference_no) {
      const { data: dup } = await supabase
        .from('payment_slips')
        .select('id')
        .eq('reference_no', reference_no)
        .maybeSingle()
      if (dup) {
        return NextResponse.json({ success: false, reason: 'สลิปนี้เคยใช้เปิดใช้งานในระบบไปแล้วค่ะ' })
      }
    }

    if (amountTransferred < expectedAmount) {
      return NextResponse.json({
        success: false,
        reason: `ยอดเงินโอนไม่ถูกต้อง โอนมา ฿${amountTransferred} แต่แพ็คเกจนี้ราคา ฿${expectedAmount} ค่ะ`
      })
    }

    await supabase.from('payment_slips').insert({
      user_id:       userId,
      reference_no:  reference_no || `SLIPOK-${Date.now()}`,
      amount:        amountTransferred,
      transfer_date: slipData.transDate || null,
      confidence:    100, 
      is_suspicious: false,
      slip_type,
      status:        'auto_approved', 
      raw_result:    slipData,
    })

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
        .eq('id', userId)

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

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown'
    return NextResponse.json({ success: false, reason: `ระบบขัดข้องชั่วคราวค่ะ: ${msg}` }, { status: 500 })
  }
}