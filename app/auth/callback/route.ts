import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // 'next' คือหน้าที่เราต้องการให้ผู้ใช้เด้งไปหลังจาก Login สำเร็จ (ค่าเริ่มต้นคือหน้าแรก)
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    
    // 💡 ขั้นตอนสำคัญ: แลก Code ที่ได้จากอีเมลเป็น Session จริง
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // ถ้าไม่มี Error ให้ส่งผู้ใช้ไปที่หน้า 'next' (ปกติคือหน้าแรก)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // หากเกิดข้อผิดพลาด ให้ส่งกลับไปหน้าแรก หรือหน้าที่คุณวุฒิชัยเตรียมไว้สำหรับ Error
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`)
}