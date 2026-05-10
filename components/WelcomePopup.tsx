'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, X } from 'lucide-react'

export function WelcomePopup() {
  const [show, setShow] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // ถ้าลิงก์มี ?welcome=true ให้โชว์ป๊อปอัป
    if (searchParams.get('welcome') === 'true') {
      setShow(true)
      
      // ลบคำว่า ?welcome=true ออกจากลิงก์เบราว์เซอร์ เพื่อไม่ให้มันเด้งซ้ำตอนรีเฟรช
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete('welcome')
      router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false })

      // ตั้งเวลาให้ป๊อปอัปหายไปเองใน 5 วินาที
      setTimeout(() => setShow(false), 5000)
    }
  }, [searchParams, router, pathname])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
        >
          <div className="bg-white border-4 border-black rounded-2xl shadow-paper p-4 flex items-start gap-4">
            <div className="bg-wagashi-matcha text-black rounded-full p-1 border-2 border-black">
              <CheckCircle2 size={28} />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-lg text-black leading-tight">คุณล็อกอินแล้ว!</h3>
              <p className="font-bold text-gray-600 text-sm mt-1">ยินดีต้อนรับสู่ PobPet (พบเพ็ท) 🐾</p>
            </div>
            <button onClick={() => setShow(false)} className="text-gray-400 hover:text-black">
              <X size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}