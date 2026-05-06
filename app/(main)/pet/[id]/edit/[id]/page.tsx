'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EditPetPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pet, setPet] = useState<any>(null)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // ดึงข้อมูลเดิมมาแสดงในฟอร์ม
  useEffect(() => {
    const fetchPet = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('กรุณาเข้าสู่ระบบก่อนครับ')
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !data) {
        alert('ไม่พบข้อมูลประกาศนี้')
        router.push('/search')
        return
      }

      // ตรวจสอบว่าเป็นเจ้าของประกาศจริงหรือไม่
      if (data.user_id !== session.user.id) {
        alert('คุณไม่มีสิทธิ์แก้ไขประกาศนี้ครับ')
        router.push(`/pet/${params.id}`)
        return
      }

      setPet(data)
      setLoading(false)
    }
    fetchPet()
  }, [params.id, router, supabase])

  // ฟังก์ชันบันทึกข้อมูลที่แก้ไข
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('pets')
        .update({
          name: pet.name,
          status: pet.status,
          color: pet.color,
          distinctive_features: pet.distinctive_features,
          contact_info: pet.contact_info,
          reward_amount: pet.reward_amount,
          tambon: pet.tambon,
          district: pet.district,
          province: pet.province
        })
        .eq('id', params.id)

      if (error) throw error

      alert('อัปเดตข้อมูลสำเร็จ! 🐾')
      router.push(`/pet/${params.id}`) // กลับไปหน้ารายละเอียด
      router.refresh()
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin text-ori-orange" size={48} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 mb-20">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 font-black text-ori-ink hover:text-ori-orange mb-6 transition-colors"
      >
        <ArrowLeft size={20} /> ย้อนกลับ
      </button>

      <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-paper">
        <h1 className="text-3xl font-black mb-6 border-b-4 border-black pb-4">✏️ แก้ไขข้อมูลประกาศ</h1>

        <form onSubmit={handleUpdate} className="flex flex-col gap-5">
          
          <div className="flex flex-col gap-2">
            <label className="font-bold">สถานะ</label>
            <select 
              value={pet.status} 
              onChange={e => setPet({...pet, status: e.target.value})}
              className="ori-input cursor-pointer"
            >
              <option value="lost">🚨 ประกาศตามหาน้อง (หาย)</option>
              <option value="found">👀 พบน้องหลงทาง</option>
              <option value="adoption">💖 หาบ้านให้น้อง</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold">ชื่อสัตว์เลี้ยง</label>
            <input 
              type="text" 
              value={pet.name || ''} 
              onChange={e => setPet({...pet, name: e.target.value})}
              className="ori-input" 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold">สี <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={pet.color || ''} 
              onChange={e => setPet({...pet, color: e.target.value})}
              required
              className="ori-input" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-sm">ตำบล/แขวง</label>
              <input type="text" value={pet.tambon || ''} onChange={e => setPet({...pet, tambon: e.target.value})} className="ori-input" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-sm">อำเภอ/เขต</label>
              <input type="text" value={pet.district || ''} onChange={e => setPet({...pet, district: e.target.value})} className="ori-input" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-sm">จังหวัด</label>
              <input type="text" value={pet.province || ''} onChange={e => setPet({...pet, province: e.target.value})} className="ori-input" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold">ตำหนิหรือลักษณะพิเศษ</label>
            <textarea 
              value={pet.distinctive_features || ''} 
              onChange={e => setPet({...pet, distinctive_features: e.target.value})}
              rows={3} 
              className="ori-input" 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold">ช่องทางติดต่อ <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={pet.contact_info || ''} 
              onChange={e => setPet({...pet, contact_info: e.target.value})}
              required
              className="ori-input" 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold">เงินรางวัล (บาท)</label>
            <input 
              type="number" 
              value={pet.reward_amount || 0} 
              onChange={e => setPet({...pet, reward_amount: Number(e.target.value)})}
              className="ori-input" 
            />
          </div>

          <Button 
            type="submit" 
            disabled={saving}
            className="w-full mt-4 ori-btn-orange text-xl py-6 rounded-xl flex justify-center items-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
          </Button>

        </form>
      </div>
    </div>
  )
}