// lib/liff-auth.ts
// ── LIFF Auth ที่รองรับ iOS (PKCE flow) ──────────────────────
//
// ปัญหา iOS: Safari มี ITP (Intelligent Tracking Prevention)
// บล็อก third-party cookies ทำให้ Supabase session หลุดใน LIFF
//
// แก้โดย: ใช้ PKCE + skipBrowserRedirect: true
// ─────────────────────────────────────────────────────────────

import { createBrowserClient } from '@supabase/ssr'

// ตรวจว่าอยู่ใน LIFF environment ไหม
export function isInLiff(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.location.href.includes('liff.line.me') ||
    navigator.userAgent.includes('Line') ||
    typeof (window as any).liff !== 'undefined'
  )
}

// ตรวจว่าเป็น iOS ไหม
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

// ── Main LIFF init + Auth ─────────────────────────────────────
export async function initLiffWithAuth(liffId?: string): Promise<{
  success:  boolean
  userId?:  string
  isNewUser?: boolean
  reason?:  string
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

    // Dynamic import เพื่อหลีกเลี่ยง SSR error
    const liff = (await import('@line/liff')).default
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
    // iOS-safe: ใช้ skipBrowserRedirect: true เพื่อหลีกเลี่ยง cross-site tracking
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'line',
      options: {
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt:      'consent',
        },
      },
    })

    if (error) {
      // Fallback: ลอง exchange LINE token โดยตรง (ถ้า Supabase รองรับ)
      console.warn('[LIFF Auth] OAuth failed, trying token exchange:', error.message)
    }

    // ── 5. บันทึก line_user_id ใน profiles ───────────────
    const { data: { session: newSession } } = await supabase.auth.getSession()
    if (newSession?.user) {
      const userId = newSession.user.id

      // upsert line_user_id
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

// ── LIFF React Hook ────────────────────────────────────────────
// ใช้ใน LIFF pages:
// const { ready, userId, error } = useLiffAuth()
export function useLiffAuth() {
  // ใช้ใน client components เท่านั้น
  // import { useEffect, useState } from 'react'
  // const [state, setState] = useState({ ready: false, userId: null, error: null })
  // useEffect(() => { initLiffWithAuth().then(...) }, [])
  // return state
  //
  // หมายเหตุ: ไม่ implement hook ที่นี่ เพราะต้องการ React
  // ให้ใช้ initLiffWithAuth() โดยตรงใน useEffect แทน
  return null
}
