'use client'
// hooks/useAuthGuard.ts
// ── ใช้งาน: guardAction(() => doSomething()) ──────────────────
// ถ้าไม่ได้ login → เด้ง AuthModal
// ถ้า login แล้ว → ทำ action ทันที

import { useState, useCallback } from 'react'
import { createBrowserClient }   from '@supabase/ssr'

export function useAuthGuard() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMessage,   setAuthMessage]   = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const guardAction = useCallback(async (
    action:  () => void,
    message?: string
  ) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setAuthMessage(message || 'กรุณาเข้าสู่ระบบก่อนใช้งานฟีเจอร์นี้ค่ะ')
      setShowAuthModal(true)
      return
    }
    action()
  }, [supabase])

  return { showAuthModal, setShowAuthModal, authMessage, guardAction }
}
