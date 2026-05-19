// lib/liff-auth.ts
// ── LIFF Auth ที่รองรับ iOS (PKCE flow) ──────────────────────
// ต้องติดตั้ง: npm install @line/liff

import { createBrowserClient } from '@supabase/ssr'

export function isInLiff(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.location.href.includes('liff.line.me') ||
    navigator.userAgent.includes('Line') ||
    typeof (window as any).liff !== 'undefined'
  )
}

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export async function initLiffWithAuth(liffId?: string): Promise<{
  success:    boolean
  userId?:    string
  isNewUser?: boolean
  reason?:    string
}> {
  if (typeof window === 'undefined') {
    return { success: false, reason: 'Not in browser' }
  }

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // ── 1. ตรวจ session ปัจจุบันก่อน ─────────────────────
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      return { success: true, userId: session.user.id, isNewUser: false }
    }

    // ── 2. Load LIFF SDK ──────────────────────────────────
    const id = liffId || process.env.NEXT_PUBLIC_LIFF_ID
    if (!id) return { success: false, reason: 'Missing LIFF_ID' }

    // ตรวจว่า @line/liff ติดตั้งไว้ไหม
    let liff: any
    try {
      const liffModule = await import('@line/liff' as any)
      liff = liffModule.default
    } catch {
      console.warn('[LIFF] @line/liff not installed. Run: npm install @line/liff')
      return { success: false, reason: '@line/liff package not installed' }
    }

    await liff.init({ liffId: id })

    if (!liff.isLoggedIn()) {
      liff.login()
      return { success: false, reason: 'Redirecting to LINE Login' }
    }

    // ── 3. ดึง LINE profile ───────────────────────────────
    const lineProfile = await liff.getProfile()
    const lineToken   = liff.getAccessToken()

    if (!lineToken) {
      return { success: false, reason: 'Could not get LINE access token' }
    }

    // ── 4. Sign in กับ Supabase ────────────────────────────
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'line',
      options: {
        skipBrowserRedirect: true,  // iOS-safe
        queryParams: {
          access_type: 'offline',
          prompt:      'consent',
        },
      },
    })

    if (error) {
      console.warn('[LIFF Auth] OAuth failed:', error.message)
    }

    // ── 5. บันทึก line_user_id ────────────────────────────
    const { data: { session: newSession } } = await supabase.auth.getSession()
    if (newSession?.user) {
      const userId = newSession.user.id
      await supabase.from('profiles').upsert({
        id:            userId,
        line_user_id:  lineProfile.userId,
        display_name:  newSession.user.user_metadata?.full_name || lineProfile.displayName,
        avatar_url:    newSession.user.user_metadata?.avatar_url || lineProfile.pictureUrl,
      })
      return { success: true, userId, isNewUser: false }
    }

    return { success: false, reason: 'Could not establish session' }

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[LIFF Auth]', msg)
    return { success: false, reason: msg }
  }
}
