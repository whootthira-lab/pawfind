// app/auth/callback/route.ts
// ── เพิ่ม redirect ไป /profile/complete ถ้าข้อมูลยังไม่ครบ ──

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // ── ตรวจว่า profile ครบไหม ──────────────────────────
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone_number, occupation, interests')
          .eq('id', session.user.id)
          .single()

        // ถ้า login ด้วย LINE และยังไม่มีเบอร์โทร/อาชีพ/ความสนใจ
        const isLineUser   = session.user.app_metadata?.provider === 'line'
        const isIncomplete = !profile?.phone_number
          || !profile?.occupation
          || !profile?.interests?.length

        if (isLineUser && isIncomplete) {
          return NextResponse.redirect(`${origin}/profile/complete`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // ถ้า error → redirect กลับ login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
