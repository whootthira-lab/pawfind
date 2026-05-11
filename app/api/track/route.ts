// app/api/track/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { target_id, target_type, metadata } = body
    
    const supabase = createClient()
    
    // เช็กว่าผู้ใช้ล็อกอินอยู่ไหม (ถ้ามีก็เก็บ user_id ด้วย)
    const { data: { session } } = await supabase.auth.getSession()

    // แอบบันทึกข้อมูลลงฐานข้อมูล
    await supabase.from('interaction_logs').insert({
      user_id: session?.user?.id || null,
      target_id,
      target_type,
      metadata: metadata || {}
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // ถึงพังก็ไม่ต้องโวยวาย ให้หน้าเว็บทำงานต่อไป
    return NextResponse.json({ success: false }, { status: 500 })
  }
}