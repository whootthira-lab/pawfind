// app/auth/callback/route.ts
// ── เพิ่ม LINE sync + subscription init ──────────────────────

import { NextResponse }   from 'next/server'
import { createClient }   from '@/lib/supabase/server'

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
        const userId   = session.user.id
        const provider = session.user.app_metadata?.provider
        const meta     = session.user.user_metadata || {}

        // ── 1. สร้าง/upsert profile ────────────────────────
        const fallbackName = meta.full_name
          || meta.name
          || session.user.email?.split('@')[0]
          || ''

        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, phone_number, occupation, interests, line_user_id')
          .eq('id', userId)
          .single()

        if (!existingProfile) {
          // สร้าง profile ใหม่
          await supabase.from('profiles').upsert({
            id:           userId,
            email:        session.user.email,
            display_name: fallbackName,
            avatar_url:   meta.avatar_url || null,
            // บันทึก line_user_id ถ้า login ด้วย LINE
            ...(provider === 'line' && meta.provider_id
              ? { line_user_id: meta.provider_id }
              : {}
            ),
            created_at: new Date().toISOString(),
          })
        } else if (provider === 'line' && meta.provider_id && !existingProfile.line_user_id) {
          // Profile มีอยู่แล้ว แต่ยังไม่ได้ link LINE
          await supabase.from('profiles')
            .update({ line_user_id: meta.provider_id })
            .eq('id', userId)
        }

        // ── 2. สร้าง Free Subscription ถ้ายังไม่มี ─────────
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id, plan, expires_at, grace_until')
          .eq('user_id', userId)
          .single()

        if (!existingSub) {
          await supabase.from('subscriptions').insert({
            user_id:   userId,
            plan:      'free',
            is_active: true,
          })
        } else if (existingSub.plan === 'member') {
          // ── 3. เช็ค Member หมดอายุ → downgrade ─────────
          const now       = new Date()
          const expires   = existingSub.expires_at ? new Date(existingSub.expires_at) : null
          const grace     = existingSub.grace_until ? new Date(existingSub.grace_until) : null
          const isExpired = expires ? expires < now : false
          const graceOver = !grace || grace < now

          if (isExpired && graceOver) {
            await supabase.from('subscriptions')
              .update({ plan: 'free', is_active: false })
              .eq('user_id', userId)

            await supabase.from('notifications').insert({
              user_id: userId,
              type:    'subscription_expired',
              title:   'แพ็คเกจของคุณหมดอายุแล้วนะคะ 🐾',
              body:    'ต่ออายุได้ที่ /pricing เพื่อใช้ LINE OA และฟีเจอร์เพิ่มเติม',
              link:    '/pricing',
              is_read: false,
            })
          }
        }

        // ── 4. LINE user → redirect /profile/complete ถ้าข้อมูลไม่ครบ ──
        const profileNow = existingProfile || { phone_number: null, occupation: null, interests: null }
        const isLineUser = provider === 'line'
        const isIncomplete = !profileNow.phone_number
          || !profileNow.occupation
          || !profileNow.interests?.length

        if (isLineUser && isIncomplete) {
          return NextResponse.redirect(`${origin}/profile/complete`)
        }
      }

      // ── 5. Redirect พร้อม welcome flag ───────────────────
      const redirectUrl = new URL(next, origin)
      redirectUrl.searchParams.set('welcome', 'true')
      return NextResponse.redirect(redirectUrl.toString())
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
