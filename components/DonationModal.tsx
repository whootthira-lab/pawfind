'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, HeartHandshake } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DonationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DonationModal({ isOpen, onClose }: DonationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white border-4 border-black rounded-3xl shadow-paper-lg p-6 max-w-md w-full text-center z-10"
          >
            <button onClick={onClose} className="absolute top-4 right-4 bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded-full p-2 transition-colors">
              <X size={24} />
            </button>

            <div className="mx-auto w-16 h-16 bg-wagashi-matcha border-4 border-black rounded-full flex items-center justify-center mb-4 shadow-paper-sm">
              <HeartHandshake size={32} className="text-black" />
            </div>

            <h2 className="text-2xl font-black mb-3 text-black">
              ยินดีด้วย! 🎉
            </h2>
            <p className="text-gray-700 font-bold mb-6 leading-relaxed">
              ร่วมส่งต่อความหวังและสิ่งดีๆ ด้วยการสมทบทุนค่าใช้จ่ายเพื่อให้เราได้ไปต่อ 🐾
            </p>

            <div className="border-4 border-black rounded-2xl p-4 bg-wagashi-kinako shadow-paper-inner mb-6 inline-block">
              {/* ⚠️ เปลี่ยนชื่อไฟล์ตรง src เป็นรูป QR Code ของจริง */}
              <img 
                src="/your-qr-code.jpg" 
                alt="QR Code สำหรับสนับสนุนเราเพื่อส่งต่อสิ่งดีๆ" 
                className="w-48 h-48 object-cover rounded-xl border-2 border-black mx-auto bg-white"
              />
              <p className="font-black text-sm mt-3 text-black">สแกนเพื่อสนับสนุน PobPet</p>
            </div>

            <Button onClick={onClose} className="w-full bg-black text-white hover:bg-gray-800 text-lg py-6 rounded-xl border-2 border-transparent font-bold">
              ปิดหน้าต่าง
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}