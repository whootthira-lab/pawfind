'use client'
// components/AuthModal.tsx
// ── Login Popup — เด้งเมื่อ user ไม่ได้ล็อกอิน ──────────────

import { motion, AnimatePresence } from 'framer-motion'
import { X, LogIn, PawPrint } from 'lucide-react'
import Link from 'next/link'

interface AuthModalProps {
  isOpen:   boolean
  onClose:  () => void
  message?: string   // ข้อความที่บอกว่าต้อง login ทำอะไร
}

export function AuthModal({
  isOpen,
  onClose,
  message = 'กรุณาเข้าสู่ระบบก่อนใช้งานฟีเจอร์นี้ค่ะ',
}: AuthModalProps) {
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
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative bg-white border-4 border-black rounded-3xl
              shadow-paper p-8 max-w-sm w-full text-center z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-red-100
                hover:text-red-600 rounded-full p-2 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Icon */}
            <div className="mx-auto w-16 h-16 bg-ori-orange/20 border-4 border-black
              rounded-full flex items-center justify-center mb-4 shadow-paper-sm">
              <PawPrint size={32} className="text-black" />
            </div>

            <h2 className="text-2xl font-black mb-2">เข้าสู่ระบบก่อนนะคะ 🐾</h2>
            <p className="text-gray-600 font-bold text-sm mb-6 leading-relaxed">
              {message}
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2
                  bg-black text-white font-black py-4 rounded-2xl border-2 border-black
                  shadow-paper-sm hover:shadow-paper hover:-translate-y-1
                  active:translate-y-0 transition-all text-lg"
              >
                <LogIn size={20} />
                เข้าสู่ระบบ / สมัครสมาชิก
              </Link>

              <button
                onClick={onClose}
                className="w-full font-bold text-gray-500 py-2
                  hover:text-black transition-colors text-sm"
              >
                ยกเลิก
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ── Hook ใช้งานง่าย ─────────────────────────────────────────
// import { useAuthGuard } from '@/hooks/useAuthGuard'
// const { guardAction } = useAuthGuard()
// guardAction(() => router.push('/pets/new'))  → เด้ง modal ถ้าไม่ได้ login
