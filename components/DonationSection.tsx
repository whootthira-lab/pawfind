'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { AnimatePresence, motion } from 'framer-motion'
import { TrendingUp, Heart } from 'lucide-react'

export default function DonationSection() {
  const [images, setImages] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // 1. เชื่อมต่อ Supabase
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // 2. ดึงรูปภาพสัตว์ล่าสุดจากฐานข้อมูลมาแสดง
  useEffect(() => {
    const fetchImages = async () => {
      const { data } = await supabase
        .from('pets')
        // ดึงจากตาราง pet_images ที่เราใช้เก็บรูป
        .select('pet_images(storage_url)')
        .order('created_at', { ascending: false })
        .limit(15) 
      
      if (data && data.length > 0) {
        // กรองเอาเฉพาะรูปแรกของสัตว์แต่ละตัว
        const allImages = data
          .map((pet: any) => pet.pet_images?.[0]?.storage_url)
          .filter(Boolean)

        if (allImages.length > 0) {
          setImages(allImages)
          return
        }
      }
      // ถ้าไม่มีรูปในระบบเลย ให้ใช้รูปล่าสุดจากโฟลเดอร์
      setImages(['/home-og.png']) 
    }
    fetchImages()
  }, [supabase])

  // 3. ตั้งเวลาเปลี่ยนรูปภาพอัตโนมัติ (ทุกๆ 3.5 วินาที)
  useEffect(() => {
    if (images.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [images])

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-black px-2 flex items-center gap-2">
        <TrendingUp className="text-ori-orange" /> ทุนสนับสนุนโครงการ
      </h2>

      <div className="bg-ori-orange text-white border-[4px] border-black rounded-[2.5rem] shadow-paper p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden">
        
        {/* ── ฝั่งซ้าย: ข้อความและข้อมูลบัญชี ── */}
        <div className="flex-1 text-center md:text-left z-10 w-full">
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight flex flex-col md:block items-center gap-2">
            ร่วมสมทบทุนเพื่อให้น้องๆ <br/>ได้มีโอกาสกลับบ้าน <Heart className="inline-block fill-white" size={40} />
          </h3>
          <p className="font-bold text-lg md:text-xl mb-8 opacity-95">
            ทุกการสนับสนุนช่วยต่อลมหายใจให้แพลตฟอร์มนี้ได้ไปต่อ
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-6">
            {/* 💡 QR Code (ขยายขนาดใหญ่ขึ้น w-48 ถึง w-64 และจัดให้อยู่เดี่ยวๆ) */}
            <div className="bg-white p-4 rounded-3xl border-4 border-black shadow-paper-sm hover:-translate-y-1 transition-transform inline-block">
              <img 
                src="/qr-code.jpg" 
                alt="QR Code Donation" 
                className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-2xl" 
              />
            </div>
          </div>
        </div>

        {/* ── ฝั่งขวา: รูปภาพสลับอัตโนมัติ (สุ่มจากฐานข้อมูล) ── */}
        <div className="w-full md:w-[350px] h-[350px] border-[4px] border-black rounded-[2rem] overflow-hidden shadow-paper bg-white relative shrink-0 z-10">
          <AnimatePresence mode='wait'>
            {images.length > 0 && (
              // eslint-disable-next-line @next/next/no-img-element
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
          {/* ป้ายแปะมุมรูป */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg border-2 border-black font-black text-ori-orange text-sm shadow-sm z-10">
            PobPet 🐾
          </div>
        </div>
      </div>
    </div>
  )
}