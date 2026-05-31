'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export function PetGallery({ primaryImage, images, petName, name }: any) {
  const actualPetName = petName || name || 'น้องสัตว์เลี้ยง'
  const [selectedImg, setSelectedImg] = useState<string | null>(null)

  const formatSrc = (src: string) => {
    if (!src) return ''
    if (src.startsWith('http') || src.startsWith('data:')) return src
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ajjvtazuncdtxjwcplcv.supabase.co'
    return `${supabaseUrl}/storage/v1/object/public/pet-images/${src}`
  }

  // ปรับโครงสร้างรูปภาพแกลเลอรีให้ปลอดภัยสูงสุด (รองรับทั้ง Array สตริงธรรมดา และออบเจกต์ฐานข้อมูล)
  const normalizedImages = (images || []).map((img: any) => {
    if (!img) return null
    if (typeof img === 'string') {
      return { url: img }
    }
    if (typeof img === 'object') {
      return { url: img.storage_url || img.url || '' }
    }
    return null
  }).filter((item: any) => item && item.url)

  // ดักจับรูปหลัก หากไม่ส่งมา ให้เลือกใช้รูปภาพแรกในคลังแกลเลอรีอัตโนมัติ
  const actualPrimaryImage = primaryImage || normalizedImages[0]?.url || ''

  return (
    <>
      <div className="flex flex-col border-b-2 border-black">
        {/* รูปหลัก */}
        <div 
          className="cursor-zoom-in overflow-hidden"
          onClick={() => setSelectedImg(actualPrimaryImage)}
        >
          <img 
            src={formatSrc(actualPrimaryImage)} 
            alt={actualPetName} 
            className="w-full h-[450px] object-cover hover:scale-105 transition-transform duration-500" 
          />
        </div>
        
        {/* รูป Gallery */}
        {normalizedImages.length > 0 && (
          <div className="flex gap-2 p-4 bg-gray-50 border-t-2 border-black overflow-x-auto scrollbar-hide">
            {normalizedImages.map((img: any, idx: number) => (
              <img 
                key={idx}
                src={formatSrc(img.url)}
                alt={`${actualPetName} gallery ${idx + 1}`}
                onClick={() => setSelectedImg(img.url)}
                className="w-24 h-24 object-cover border-2 border-black rounded shadow-paper-sm flex-shrink-0 cursor-pointer hover:-translate-y-1 transition-transform"
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImg(null)}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          >
            <button className="absolute top-6 right-6 text-white bg-black/50 p-2 rounded-full border border-white/20">
              <X size={32} />
            </button>
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={formatSrc(selectedImg)}
              alt="Full View"
              className="max-w-full max-h-[90vh] object-contain rounded-lg border-2 border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}