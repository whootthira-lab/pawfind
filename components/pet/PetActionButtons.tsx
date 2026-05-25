'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { PartyPopper, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DonationModal } from '@/components/DonationModal' // Import Modal ที่พี่มีอยู่แล้ว

export function PetActionButtons({ petId, status, petName, ownerId }: { 
  petId: string, 
  status: string, 
  petName: string,
  ownerId: string
}) {
  const [loading, setLoading] = useState(false)
  const [showDonation, setShowDonation] = useState(false) // 🟢 State สำหรับ Pop-up
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleResolve = async () => {
    const confirmMsg = status === 'adoption' 
      ? '🎉 ยืนยันว่าน้องได้บ้านใหม่ที่อบอุ่นแล้วใช่ไหม?' 
      : '🎊 ยืนยันว่าพบน้องแล้วใช่ไหม? ยินดีด้วยนะครับ!';
    
    if (!confirm(confirmMsg)) return

    setLoading(true)
    try {
      // 1. อัปเดตสถานะในฐานข้อมูล
      const { error } = await supabase
        .from('pets')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString(),
          status: 'showcase' // ปรับสถานะเป็นโชว์เคสเมื่อสำเร็จ
        })
        .eq('id', petId)

      if (error) throw error

      // 2. ถ้าสำเร็จ ให้โชว์ Donation Modal
      setShowDonation(true)
      router.refresh()
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  const buttonText = status === 'adoption' ? 'ได้บ้านแล้ว 💖' : 'พบน้องแล้ว 🚨';

  return (
    <>
      <button 
        onClick={handleResolve}
        disabled={loading}
        className="bg-wagashi-matcha w-full py-3 rounded-2xl border-2 border-black font-black text-sm flex items-center justify-center gap-2 shadow-paper-sm hover:shadow-none active:translate-y-1 transition-all"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <PartyPopper size={18} />}
        {loading ? 'กำลังบันทึก...' : buttonText}
      </button>

      {/* 🟢 เรียกใช้ Modal ที่พี่มีอยู่แล้วที่นี่ */}
      <DonationModal isOpen={showDonation} onClose={() => setShowDonation(false)} />
    </>
  )
}