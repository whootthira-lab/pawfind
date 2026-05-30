'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface PetGalleryProps {
  primaryImage: string
  images: { storage_url: string; is_primary: boolean }[]
  petName: string
}

export function PetGallery({ primaryImage, images, petName }: PetGalleryProps) {
  const [selectedImg, setSelectedImg] = useState<string | null>(null)

  const formatSrc = (src: string) => {
    if (!src) return ''
    if (src.startsWith('http') || src.startsWith('data:')) return src
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ajjvtazuncdtxjwcplcv.supabase.co'
    return `${supabaseUrl}/storage/v1/object/public/pet-images/${src}`
  }

  return (
    <div className="flex flex-col border-b-2 border-black">
      {/* รูปหลัก */}
      <div 
        className="cursor-zoom-in overflow-hidden group"
        onClick={() => setSelectedImg(primaryImage)}
      >
        <img 
          src={formatSrc(primaryImage)} 
          alt={petName} 
          className="w-full h-[450px] object-cover transition-transform duration-500 group-hover:scale-105" 
        />
      </div>
      
      {/* รูปประกอบอื่นๆ */}
      {images.length > 1 && (
        <div className="flex gap-3 p-4 bg-gray-50 border-t-2 border-black overflow-x-auto scrollbar-hide">
          {images.map((img, idx) => (
            <motion.img 
              whileHover={{ y: -5 }}
              key={idx}
              src={formatSrc(img.storage_url)}
              alt={`${petName} gallery ${idx + 1}`}
              onClick={() => setSelectedImg(img.storage_url)}
              className="w-24 h-24 object-cover border-2 border-black rounded shadow-paper-sm flex-shrink-0 cursor-pointer hover:border-wagashi-matcha transition-colors"
            />
          ))}
        </div>
      )}

      {/* Full Image Modal (Lightbox) */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-10"
            onClick={() => setSelectedImg(null)}
          >
            <button 
              className="absolute top-6 right-6 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
              onClick={() => setSelectedImg(null)}
            >
              <X size={32} />
            </button>
            
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={formatSrc(selectedImg)}
              alt="Full view"
              className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}