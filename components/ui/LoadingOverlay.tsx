'use client'

import { motion } from 'framer-motion'

export function LoadingOverlay({ message }: { message: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
    >
      {/* 🐾 Animation อุ้งเท้าวิ่งวน */}
      <div className="relative w-24 h-24 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute text-4xl"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.5],
              x: Math.cos(i * Math.PI / 2) * 40,
              y: Math.sin(i * Math.PI / 2) * 40
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          >
            🐾
          </motion.div>
        ))}
        {/* ตรงกลางเป็นรูป AI กำลังคิด */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center text-5xl"
        >
          🤖
        </motion.div>
      </div>

      {/* ข้อความสถานะ */}
      <motion.div 
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-2xl font-bold text-black text-center px-6"
      >
        <p className="bg-white border-2 border-black px-4 py-2 shadow-paper">
          {message}
        </p>
      </motion.div>
      
      {/* เส้นโหลดสไตล์ Neubrutalism */}
      <div className="w-64 h-4 bg-white border-2 border-black mt-6 relative overflow-hidden shadow-paper-sm">
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-wagashi-matcha w-1/2 border-r-2 border-black"
        />
      </div>
    </motion.div>
  )
}