// app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const userId = session.user.id

        // ── 1. สร้าง Free Subscription ถ้ายังไม่มี ──────────
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id, plan')
          .eq('user_id', userId)
          .single()

        if (!existingSub) {
          await supabase.from('subscriptions').insert({
            user_id:   userId,
            plan:      'free',
            is_active: true,
          })
        }

        // ── 2. เช็ค profile ครบไหม (สำหรับ LINE Login) ──────
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone_number, occupation, interests')
          .eq('id', userId)
          .single()

        const isLineUser   = session.user.app_metadata?.provider === 'line'
        const isIncomplete = !profile?.phone_number
          || !profile?.occupation
          || !profile?.interests?.length

        if (isLineUser && isIncomplete) {
          return NextResponse.redirect(`${origin}/profile/complete`)
        }

        // ── 3. เช็ค subscription หมดอายุ → grace period ─────
        if (existingSub && existingSub.plan === 'member') {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('expires_at, grace_until, is_active')
            .eq('user_id', userId)
            .single()

          const now = new Date()

          if (sub?.expires_at && new Date(sub.expires_at) < now) {
            const graceUntil = sub.grace_until
              ? new Date(sub.grace_until)
              : null

            // Grace period หมดแล้ว → downgrade
            if (!graceUntil || graceUntil < now) {
              await supabase
                .from('subscriptions')
                .update({ plan: 'free', is_active: false })
                .eq('user_id', userId)

              // แจ้งเตือนให้ต่ออายุ
              await supabase.from('notifications').insert({
                user_id: userId,
                type:    'subscription_expired',
                title:   'แพ็คเกจของคุณหมดอายุแล้ว',
                body:    'ต่ออายุเพื่อใช้งาน LINE OA และฟีเจอร์เพิ่มเติม',
                link:    '/pricing',
                is_read: false,
              })
            }
          }
        }
      }

      // ── 4. Redirect พร้อม welcome flag ─────────────────────
      const redirectUrl = new URL(next, origin)
      redirectUrl.searchParams.set('welcome', 'true')
      return NextResponse.redirect(redirectUrl.toString())
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
