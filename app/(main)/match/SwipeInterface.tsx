'use client'
import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Bookmark, X, Eye } from 'lucide-react' // เพิ่ม Icon

export function SwipeInterface({ initialPets }: { initialPets: any[] }) {
  const [pets, setPets] = useState(initialPets)
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // อัปเดตข้อมูลเมื่อมีการเปลี่ยนหน้าหรือเปลี่ยนโหมด
  useEffect(() => {
    setPets(initialPets)
  }, [initialPets])

  const handleSwipe = async (id: string, direction: 'left' | 'right' | 'up') => {
    if (direction === 'up') {
      // 👆 ปัดขึ้น = บันทึก
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('saved_pets').insert({ pet_id: id, user_id: user.id })
        alert('✨ บันทึกน้องลงในรายการโปรดแล้ว!')
      } else {
        alert('กรุณาเข้าสู่ระบบเพื่อบันทึกรายการ')
      }
    } else if (direction === 'right') {
      // 👉 ปัดขวา = ดูรายละเอียด
      router.push(`/pet/${id}`)
    }
    
    // เอาการ์ดที่ปัดแล้วออกจากจอ
    setPets(current => current.filter(p => p.id !== id))
  }

  if (pets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-washi border-4 border-dashed border-black rounded-3xl text-center p-8 max-w-sm mx-auto">
        <h2 className="text-3xl font-black mb-2">หมดแล้วจ้า! 🎉</h2>
        <p className="text-lg font-bold text-gray-500">คุณดูน้องๆ ในหน้านี้ครบหมดแล้ว ลองกดโหลดหน้าถัดไปดูนะ</p>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-sm mx-auto h-[600px]">
      <AnimatePresence>
        {pets.map((pet, index) => {
          const isFront = index === 0
          return (
            <SwipeCard
              key={pet.id}
              pet={pet}
              isFront={isFront}
              onSwipe={(direction: 'left'|'right'|'up') => handleSwipe(pet.id, direction)}
              zIndex={pets.length - index}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function SwipeCard({ pet, isFront, onSwipe, zIndex }: any) {
  const x = useMotionValue(0)
  const y = useMotionValue(0) // 💡 เพิ่มแกน Y สำหรับปัดขึ้น
  
  const rotate = useTransform(x, [-200, 200], [-10, 10])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  const opacityY = useTransform(y, [-200, -100, 0], [0, 1, 1])

  const handleDragEnd = (e: any, info: { offset: { x: number, y: number } }) => {
    // เช็คว่าปัดขึ้น (y ติดลบเยอะๆ) หรือปัดซ้าย/ขวา
    if (info.offset.y < -100 && Math.abs(info.offset.x) < 80) {
      onSwipe('up')
    } else if (info.offset.x > 100) {
      onSwipe('right')
    } else if (info.offset.x < -100) {
      onSwipe('left')
    }
  }

  return (
    <motion.div
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      style={{ x, y, rotate, opacity: isFront ? (y.get() < -50 ? opacityY : opacity) : 1, zIndex }}
      drag={isFront ? true : false} // 💡 ยอมให้ลากได้อิสระทั้ง X และ Y
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: isFront ? 1 : 0.95, opacity: 1, top: isFront ? 0 : 20 }}
      exit={{ x: x.get(), y: y.get(), opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-washi border-4 border-black w-full h-full rounded-3xl shadow-paper flex flex-col overflow-hidden pointer-events-none relative">
        
        {/* ลายน้ำบอกสถานะตอนลากการ์ด */}
        <motion.div style={{ opacity: useTransform(x, [-100, -50], [1, 0]) }} className="absolute top-10 right-10 z-20 border-4 border-red-500 text-red-500 font-black text-4xl p-2 rounded-xl rotate-12">ผ่าน</motion.div>
        <motion.div style={{ opacity: useTransform(x, [50, 100], [0, 1]) }} className="absolute top-10 left-10 z-20 border-4 border-green-500 text-green-500 font-black text-4xl p-2 rounded-xl -rotate-12">ดูข้อมูล</motion.div>
        <motion.div style={{ opacity: useTransform(y, [-100, -50], [1, 0]) }} className="absolute bottom-40 left-1/2 -translate-x-1/2 z-20 border-4 border-blue-500 text-blue-500 bg-white font-black text-3xl p-2 rounded-xl">บันทึก 👆</motion.div>

        <div className="h-2/3 border-b-4 border-black relative">
          {pet.image_url ? (
            <img src={pet.image_url} alt={pet.name || 'pet'} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center font-bold text-xl">ไม่มีรูปภาพ</div>
          )}
          <div className="absolute top-4 left-4 bg-white border-2 border-black px-3 py-1 font-bold rounded-full shadow-paper-sm text-sm">
            {pet.status === 'lost' ? '🚨 แจ้งหาย' : pet.status === 'found' ? '👀 พบสัตว์หลง' : '💖 หาบ้าน'}
          </div>
        </div>
        
        <div className="flex-1 p-6 flex flex-col justify-center bg-white pointer-events-auto">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-black text-3xl">{pet.name || 'ไม่ระบุชื่อ'}</h3>
          </div>
          <p className="text-lg font-bold text-gray-600 mb-4">{pet.breed || 'ไม่ระบุสายพันธุ์'} • {pet.province}</p>
          
          <div className="flex gap-3 justify-center mt-auto">
            <Button variant="outline" className="h-14 w-14 rounded-full border-4 border-black shadow-paper-sm hover:shadow-paper bg-white" onClick={() => onSwipe('left')}>
              <X size={28} className="text-red-500 stroke-[3]" />
            </Button>
            <Button variant="outline" className="h-14 w-14 rounded-full border-4 border-black shadow-paper-sm hover:shadow-paper bg-white" onClick={() => onSwipe('up')}>
              <Bookmark size={24} className="text-blue-500 stroke-[3]" />
            </Button>
            <Button className="h-14 w-14 rounded-full border-4 border-black shadow-paper-sm hover:shadow-paper bg-wagashi-matcha" onClick={() => onSwipe('right')}>
              <Eye size={28} className="text-black stroke-[3]" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}