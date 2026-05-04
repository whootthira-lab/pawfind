// app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = cookies()
    
    // สร้าง Supabase Client และบังคับให้เขียน Cookie ลงเบราว์เซอร์ทันที
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    // แลก Code เป็น Session พร้อมฝัง Cookie
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // แลกสำเร็จ + ฝังคุกกี้สำเร็จ -> พาไปหน้าแรก
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('Auth Callback Error:', error.message)
    }
  }

  // ถ้าไม่มี Code หรือเกิด Error ระหว่างแลกเปลี่ยน
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`)
}