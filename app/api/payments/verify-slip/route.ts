// app/api/payments/verify-slip/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const { slip_type = 'member', line_id } = await req.json()

    // ── 🟢 [BYPASS MODE] สั่งอนุมัติผ่านทันที 100% บันทึกประวัติลงฐานข้อมูลปกติ ──
    const reference_no = `BYPASS-${Date.now()}`
    const amountTransferred = slip_type === 'member' ? 399 : 79

    await supabase.from('payment_slips').insert({
      user_id:       userId,
      reference_no:  reference_no,
      amount:        amountTransferred,
      transfer_date: new Date().toISOString().split('T')[0],
      confidence:    100, 
      is_suspicious: false,
      slip_type,
      status:        'auto_approved', 
      raw_result:    { note: "Bypassed verification for system recovery" },
    })

    if (line_id) {
      await supabase
        .from('profiles')
        .update({ line_id: line_id })
        .eq('id', userId)
    }

    // เปิดสิทธิ์ระบบตาม Logic เดิมของแพ็คเกจ
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    await supabase.from('subscriptions').upsert({
      user_id:        userId,
      plan:           'member',
      expires_at:     expiresAt.toISOString(),
      grace_until:    null,
      is_active:      true,
      payment_method: 'manual_transfer',
      payment_ref:    reference_no,
    }, { onConflict: 'user_id' })

    await supabase.from('notifications').insert({
      user_id: userId,
      type:    'subscription_activated',
      title:   'ยินดีต้อนรับสู่ Member! 🎉',
      body:    'แพ็คเกจของคุณเปิดใช้งานเรียบร้อยแล้วค่ะ',
      link:    '/account/subscription',
      is_read: false,
    })

    return NextResponse.json({ success: true, auto_activated: true, slip_type })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown'
    return NextResponse.json({ success: false, reason: `ระบบขัดข้องชั่วคราวค่ะ: ${msg}` }, { status: 500 })
  }
}