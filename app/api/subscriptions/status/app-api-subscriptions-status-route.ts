// app/api/subscriptions/status/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ plan: 'free', limit: 1, current: 0 })

    const userId = session.user.id

    // Get subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, expires_at, grace_until, is_active')
      .eq('user_id', userId)
      .single()

    // Determine effective plan
    let plan = sub?.plan || 'free'
    if (plan === 'member' && sub?.expires_at) {
      const expired = new Date(sub.expires_at) < new Date()
      if (expired) plan = 'free'
    }

    const limit = plan === 'member' ? 3 : 1

    // Count active pets
    const { count } = await supabase
      .from('pets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active')

    return NextResponse.json({
      plan,
      limit,
      current:     count || 0,
      expires_at:  sub?.expires_at  || null,
      grace_until: sub?.grace_until || null,
    })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
