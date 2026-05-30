'use client'

import { useEffect, useState, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { X, Lock, LogIn, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LoginModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const pathname = usePathname()
  const router = useRouter()

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  useEffect(() => {
    // 💡 ข้ามสำหรับหน้าเกี่ยวกับระบบและเข้าสู่ระบบหลักเพื่อหลีกเลี่ยงลูปหน้าจอ
    const isExcluded = pathname === '/login' || pathname.startsWith('/auth')
    const alreadyDismissed = sessionStorage.getItem('pobpet_login_prompt_dismissed')

    if (isExcluded || alreadyDismissed) {
      setIsOpen(false)
      return
    }

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          // หากยังไม่ได้ล็อกอิน ให้เด้งโมดอลขึ้นมา
          setIsOpen(true)
        } else {
          setIsOpen(false)
        }
      } catch (err) {
        console.error('Error checking auth session in modal:', err)
      }
    }

    checkAuth()
  }, [pathname, supabase])

  const handleClose = () => {
    // บันทึกสถานะว่ากดปิดในแท็บปัจจุบัน เพื่อความลื่นไหลทาง UX ไม่เด้งกวนใจบ่อยเกินไป
    sessionStorage.setItem('pobpet_login_prompt_dismissed', 'true')
    setIsOpen(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) throw error
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Google Login ไม่สำเร็จ')
      setLoading(false)
    }
  }

  const handleEmailLoginRedirect = () => {
    handleClose()
    router.push('/login')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white border-4 border-black rounded-3xl shadow-paper-lg p-6 md:p-8 max-w-md w-full text-center z-10 text-black overflow-hidden"
            style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}
          >
            <div className="absolute top-0 left-0 w-full h-3 bg-black" />

            {/* Close Button */}
            <button 
              onClick={handleClose} 
              className="absolute top-5 right-5 bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded-full p-2 border-2 border-transparent hover:border-black transition-all"
            >
              <X size={20} />
            </button>

            {/* Icon lock */}
            <div className="mx-auto w-16 h-16 bg-wagashi-sakura/50 border-4 border-black rounded-2xl flex items-center justify-center mb-6 shadow-paper-sm animate-pulse">
              <Lock size={32} className="text-black" />
            </div>

            <h2 className="text-2xl md:text-3xl font-black mb-3 text-black tracking-tight leading-tight">
              เข้าสู่ระบบชาว PobPet 🐾
            </h2>
            <p className="text-gray-600 font-bold mb-6 text-sm leading-relaxed">
              ร่วมเป็นส่วนหนึ่งของเครือข่ายตามหาสัตว์เลี้ยงด้วย AI แจ้งพบสัตว์หลง และรับสิทธิประโยชน์พิเศษมากมายสำหรับการดูแลน้องๆ ในชุมชนของเรา!
            </p>

            {errorMsg && (
              <div className="p-3 bg-red-50 border-2 border-red-400 rounded-xl flex items-center gap-2 text-red-800 text-xs font-bold mb-4 text-left">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 border-4 border-black
                  bg-white py-4 rounded-xl font-black text-base shadow-paper-sm
                  hover:shadow-paper hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><Lock className="animate-spin" size={18} /> กำลังเชื่อมต่อ...</span>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    เข้าสู่ระบบด้วย Google
                  </>
                )}
              </button>

              {/* Email / Password Sign In Button */}
              <button
                type="button"
                onClick={handleEmailLoginRedirect}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 border-4 border-black
                  bg-black text-white py-4 rounded-xl font-black text-base shadow-paper-sm
                  hover:shadow-paper hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
              >
                <LogIn size={18} />
                เข้าสู่ระบบด้วยอีเมล / รหัสผ่าน
              </button>
            </div>

            {/* Divider or Guest link */}
            <div className="mt-5 border-t border-black/10 pt-4">
              <button 
                onClick={handleClose} 
                className="text-xs font-black text-gray-500 hover:text-black transition-colors underline underline-offset-2 flex items-center justify-center gap-1 mx-auto"
              >
                <Sparkles size={12} className="text-amber-500" />
                เข้าชมเว็บไซต์ชั่วคราวแบบผู้เยี่ยมชม
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
