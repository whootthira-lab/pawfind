"use client"

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { AnimatePresence, motion } from 'framer-motion'

export default function DonationSection() {
  const [images, setImages] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  useEffect(() => {
    const fetchImages = async () => {
      const { data } = await supabase
        .from('pets')
        .select('images, pet_images(storage_url, is_primary)')
        .order('created_at', { ascending: false })
        .limit(15) 
      
      if (data && data.length > 0) {
        const allImages = data.map((p: any) => {
          return p.pet_images?.find((img: any) => img.is_primary)?.storage_url 
            || p.pet_images?.[0]?.storage_url 
            || (p.images && p.images.length > 0 ? p.images[0] : null)
        }).filter(Boolean)

        if (allImages.length > 0) {
          setImages(allImages)
          return
        }
      }
      setImages(['/home-og.png']) 
    }
    fetchImages()
  }, [supabase])

  useEffect(() => {
    if (images.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [images])

  return (
    <section className="bg-ori-orange text-white border-4 border-black p-6 md:p-10 rounded-3xl shadow-paper flex flex-col xl:flex-row items-center gap-10 relative overflow-hidden">
      
      {/* ── ฝั่งซ้าย: ข้อความและ QR Code ── */}
      <div className="flex-1 w-full z-10 flex flex-col items-center xl:items-start text-center xl:text-left">
        <h3 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
          ร่วมสมทบทุนเพื่อให้น้องๆ <br className="hidden md:block" />ได้มีโอกาสกลับบ้าน 💖
        </h3>
        <p className="text-lg md:text-xl font-bold opacity-90 mb-8">
          ทุกการสนับสนุนช่วยต่อลมหายใจให้แพลตฟอร์มนี้ได้ไปต่อ
        </p>
        
        {/* 💡 ปรับกล่อง QR Code ให้เรียงลงมาด้านล่าง */}
        <div className="flex flex-col items-center gap-4 bg-white/10 p-5 md:p-6 rounded-3xl border-4 border-black backdrop-blur-sm w-fit max-w-full">
          {/* QR Code ขยายขนาดให้ชัดขึ้น */}
          <img 
            src="/qr-code.jpg" 
            alt="QR Code รับบริจาค" 
            className="w-40 h-40 md:w-48 md:h-48 rounded-2xl border-4 border-black shadow-paper-sm object-cover bg-white shrink-0" 
          />
          
          {/* ข้อมูลบัญชี จัดกึ่งกลาง */}
          <div className="bg-white text-ori-orange font-black py-2.5 px-6 rounded-xl border-4 border-black shadow-paper-sm text-base md:text-lg text-center w-full whitespace-nowrap">
            ชื่อบัญชี: KRUTH APEX
          </div>
        </div>
      </div>

      {/* ── ฝั่งขวา: รูปภาพสลับอัตโนมัติ ── */}
      <div className="w-full max-w-md xl:w-[450px] aspect-square md:h-[400px] border-4 border-black rounded-3xl overflow-hidden shadow-paper bg-white relative shrink-0 z-10 mx-auto">
        <AnimatePresence mode='wait'>
          {images.length > 0 && (
            <motion.img
              key={currentIndex}
              src={images[currentIndex]}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full h-full object-cover absolute inset-0"
              alt="PobPet rescued pets"
            />
          )}
        </AnimatePresence>
        
        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-xl border-4 border-black font-black text-ori-orange text-sm shadow-paper-sm z-10">
          เพื่อนๆ ของเรา 🐾
        </div>
      </div>
      
      {/* ── ลายพื้นหลังตกแต่ง ── */}
      <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-50px] left-[-50px] w-80 h-80 bg-black opacity-10 rounded-full blur-3xl pointer-events-none"></div>
    </section>
  )
}