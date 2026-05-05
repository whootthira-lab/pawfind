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
    const confirmMsg = status === 'adoption' 
      ? '🎉 ยืนยันว่าน้องได้บ้านใหม่ที่อบอุ่นแล้วใช่ไหม?' 
      : '🎊 ยืนยันว่าพบน้องแล้วใช่ไหม? ยินดีด้วยนะครับ!';
    
    if (!confirm(confirmMsg)) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('pets')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', petId)

      if (!error) {
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

  const buttonText = status === 'adoption' ? 'ได้บ้านแล้ว 💖' : 'พบน้องแล้ว 🚨';
  // 💡 ใช้สีเขียวที่ดูสำเร็จกว่าสำหรับสถานะพบน้อง
  const colorClass = "ori-btn-green"; 

  return (
    <button 
      onClick={handleResolve}
      disabled={loading}
      className={`${colorClass} w-full py-3 rounded-2xl border-2 border-ori-ink font-black text-sm flex items-center justify-center gap-2 shadow-paper-sm hover:shadow-none active:translate-y-1 transition-all disabled:opacity-70`}
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