// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  // 1. ใช้ BASE_URL จาก ENV ที่คุณตั้งไว้ (หรือ Fallback) แทน origin ของ request
  // วิธีนี้ชัวร์ที่สุดเวลา Deploy บน Vercel
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawfind-eta.vercel.app'

  if (code) {
    const supabase = createClient()
    
    // แลก Code ที่ได้จากอีเมลเป็น Session 
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 2. Redirect กลับไปที่ BASE_URL เสมอ
      // ลบ origin เดิมออก แล้วใช้ BASE_URL แบบชัวร์ๆ
      return NextResponse.redirect(`${BASE_URL}${next}`)
    } else {
      console.error('Auth Callback Error:', error.message)
    }
  }

  // หากเกิดข้อผิดพลาด ให้ส่งกลับไปหน้า Login พร้อมแนบ Error
  return NextResponse.redirect(`${BASE_URL}/login?error=auth-callback-failed`)
}