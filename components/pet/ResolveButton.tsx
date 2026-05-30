'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { CheckCircle, Loader2, PartyPopper } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ResolveButton({ petId, status, onResolved }: { 
  petId: string, 
  status: string, 
  onResolved: () => void 
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleResolve = async () => {
    let confirmMsg = '🎊 ยืนยันว่าพบน้องแล้วใช่ไหม? ยินดีด้วยนะครับ!'
    let titleText = '🎉 พบน้องแล้ว!'
    let descText = 'ยินดีด้วยค่ะ น้องได้กลับบ้านอย่างปลอดภัยเรียบร้อยแล้ว'
    
    if (status === 'adoption') {
      confirmMsg = '🎉 ยืนยันว่าน้องได้บ้านใหม่ที่อบอุ่นแล้วใช่ไหม?'
      titleText = '🏡 น้องได้บ้านแล้ว!'
      descText = 'ยินดีด้วยค่ะ น้องได้รับอุปการะสู่บ้านใหม่ที่อบอุ่นเรียบร้อยแล้ว'
    } else if (status === 'mating') {
      confirmMsg = '💖 ยืนยันว่าน้องจับคู่แมตช์สำเร็จแล้วใช่ไหม?'
      titleText = '❤️ น้องได้คู่แล้ว!'
      descText = 'ยินดีด้วยค่ะ น้องจับคู่แมตช์และผสมพันธุ์สำเร็จเรียบร้อยแล้ว'
    }
    
    if (!confirm(confirmMsg)) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('pets')
        .update({ 
          status: 'showcase',
          mode_lost: false,
          mode_adoption: false,
          mode_mating: false,
          mode_showcase: true,
          is_resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', petId)

      if (!error) {
        // บันทึกลงประวัติสุขภาพสัตว์เลี้ยง (pet_health_events)
        await supabase
          .from('pet_health_events')
          .insert({
            pet_id: petId,
            event_type: 'other',
            title: titleText,
            description: descText,
            event_date: new Date().toISOString().split('T')[0]
          })

        onResolved() // รีเฟรชข้อมูลในหน้า Profile
        router.refresh() // อัปเดต Server Cache
      } else {
        throw error
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  const buttonText = status === 'adoption' 
    ? 'น้องได้บ้านแล้ว 🏡' 
    : status === 'mating' 
      ? 'น้องได้คู่แล้ว ❤️' 
      : 'พบน้องแล้ว 🚨';

  const colorClass = status === 'lost' 
    ? 'bg-[#2D6A2D] hover:bg-[#3E803E] text-white' 
    : status === 'mating' 
      ? 'bg-[#C2185B] hover:bg-[#D81B60] text-white' 
      : 'bg-[#1A5EA8] hover:bg-[#1E71C9] text-white';

  return (
    <button 
      onClick={handleResolve}
      disabled={loading}
      className={`${colorClass} w-full py-3 rounded-2xl border-2 border-black font-black text-sm flex items-center justify-center gap-2 shadow-paper-sm hover:shadow-none active:translate-y-1 transition-all disabled:opacity-70`}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={18} />
      ) : (
        <PartyPopper size={18} />
      )}
      {loading ? 'กำลังบันทึก...' : buttonText}
    </button>
  )
}