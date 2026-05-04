'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { CheckCircle, Loader2 } from 'lucide-react'
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
      ? 'ยืนยันว่าน้องได้บ้านใหม่ที่อบอุ่นแล้วใช่ไหม?' 
      : 'ยืนยันว่าพบน้องแล้วใช่ไหม? ยินดีด้วยนะครับ!';
    
    if (!confirm(confirmMsg)) return

    setLoading(true)
    const { error } = await supabase
      .from('pets')
      .update({ 
        is_resolved: true, 
        resolved_at: new Date().toISOString() 
      })
      .eq('id', petId)

    if (!error) {
      onResolved()
      router.refresh()
    } else {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    }
    setLoading(false)
  }

  const buttonText = status === 'adoption' ? 'ได้บ้านแล้ว 💖' : 'พบน้องแล้ว 🚨';
  const colorClass = status === 'adoption' ? 'ori-btn-green' : 'ori-btn-orange';

  return (
    <button 
      onClick={handleResolve}
      disabled={loading}
      className={`${colorClass} w-full py-2 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-paper-sm hover:shadow-none translate-y-0 active:translate-y-1 transition-all`}
    >
      {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
      {buttonText}
    </button>
  )
}