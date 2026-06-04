// app/api/access-location/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
    }

    const userId = session.user.id
    const { petId } = await req.json()

    if (!petId) {
      return NextResponse.json({ error: 'กรุณาระบุรหัสสัตว์เลี้ยงค่ะ', success: false }, { status: 400 })
    }

    // 1. Verify that the user is verified
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('is_verified')
      .eq('id', userId)
      .single()

    if (profileErr || !profile?.is_verified) {
      return NextResponse.json({ 
        error: 'คุณยังไม่ได้ผ่านการยืนยันตัวตน กรุณายืนยันตัวตนก่อนเพื่อรับพิกัดค่ะ', 
        success: false 
      }, { status: 403 })
    }

    // 2. Add entry to pet_location_access_logs
    const { error: insertError } = await supabase
      .from('pet_location_access_logs')
      .upsert({
        user_id: userId,
        pet_id: petId,
        accessed_at: new Date().toISOString()
      }, { onConflict: 'user_id,pet_id' })

    if (insertError) {
      console.error('Error inserting access log:', insertError)
      return NextResponse.json({ 
        error: `บันทึกประวัติล้มเหลว: ${insertError.message}`, 
        success: false 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'บันทึกประวัติการขอเข้าถึงเรียบร้อยแล้ว' })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown'
    return NextResponse.json({ success: false, reason: `ระบบขอพิกัดขัดข้อง: ${msg}` }, { status: 500 })
  }
}
