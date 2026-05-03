'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export function PetGallery({ primaryImage, images, petName }: any) {
  const [selectedImg, setSelectedImg] = useState<string | null>(null)

  const formatSrc = (src: string) => 
    src?.startsWith('http') ? src : `data:image/jpeg;base64,${src}`

  return (
    <>
      <div className="flex flex-col border-b-2 border-black">
        {/* รูปหลัก */}
        <div 
          className="cursor-zoom-in overflow-hidden"
          onClick={() => setSelectedImg(primaryImage)}
        >
          <img 
            src={formatSrc(primaryImage)} 
            alt={petName} 
            className="w-full h-[450px] object-cover hover:scale-105 transition-transform duration-500" 
          />
        </div>
        
        {/* รูป Gallery */}
        {images && images.length > 0 && (
          <div className="flex gap-2 p-4 bg-gray-50 border-t-2 border-black overflow-x-auto scrollbar-hide">
            {images.map((img: any, idx: number) => (
              <img 
                key={idx}
                src={formatSrc(img.storage_url)}
                alt={`${petName} gallery ${idx + 1}`}
                onClick={() => setSelectedImg(img.storage_url)}
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