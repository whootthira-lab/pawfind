import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/profile'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ 
              name, 
              value, 
              ...options,
              // 💡 จุดสำคัญ: ช่วยให้เบราว์เซอร์จดจำสถานะล็อกอินบน HTTPS ได้ดีขึ้น
              secure: true,
              sameSite: 'lax',
              path: '/',
            })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    
    // แลก Code จากอีเมลเป็น Session (สถานะล็อกอิน)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 💡 จุดที่แก้ไข: สร้าง URL ปลายทาง และแนบ welcome=true เข้าไปเพื่อให้ป๊อปอัปเด้ง
      const redirectUrl = new URL(next, origin)
      redirectUrl.searchParams.set('welcome', 'true')
      
      // ✅ ส่งผู้ใช้ไปยังหน้า Profile (หรือหน้าก่อนหน้า) พร้อมคำสั่งเปิดป๊อปอัป
      return NextResponse.redirect(redirectUrl.toString())
    }
  }

  // กรณี Code ผิดพลาดหรือหมดอายุ
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}