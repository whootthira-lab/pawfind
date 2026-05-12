'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function AdminModerationPage() {
  const [pendingEvents, setPendingEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. ดึงข้อมูลประกาศที่รอ Admin ตรวจสอบ
  const fetchPendingEvents = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select(`
        id, title, organizer_name, description, created_at, status,
        moderation_logs ( ai_reason, ai_score, model )
      `)
      .eq('status', 'pending_admin')
      .order('created_at', { ascending: false })

    if (error) console.error('Fetch error:', error)
    else setPendingEvents(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchPendingEvents()
  }, [])

  // 2. ฟังก์ชันอัปเดตสถานะ (อนุมัติ / ปฏิเสธ)
  const handleUpdateStatus = async (eventId: string, newStatus: string) => {
    const confirmMsg = newStatus === 'approved' ? 'ยืนยันการอนุมัติประกาศนี้?' : 'ยืนยันการปฏิเสธประกาศนี้?'
    if (!window.confirm(confirmMsg)) return

    // 💡 ใช้ API ทะลวง RLS (เหมือนตอนให้ AI ตรวจ) เพื่อความปลอดภัย
    const { error } = await supabase
      .from('events')
      .update({ status: newStatus })
      .eq('id', eventId)

    if (error) {
      alert(`อัปเดตไม่สำเร็จ (อาจติด RLS): ${error.message}`)
    } else {
      alert('อัปเดตสถานะเรียบร้อย!')
      fetchPendingEvents() // โหลดข้อมูลใหม่
    }
  }

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-ori-blue-d" size={48} /></div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 mb-20">
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 md:p-10 shadow-paper">
        <div className="flex items-center gap-3 mb-8 border-b-4 border-ori-ink pb-6">
          <AlertCircle className="text-ori-orange" size={32} />
          <h1 className="text-3xl font-black text-ori-ink">ระบบตรวจสอบประกาศ (Admin)</h1>
        </div>

        {pendingEvents.length === 0 ? (
          <div className="text-center py-10 text-gray-500 font-bold">
            🎉 ไม่มีประกาศค้างตรวจ เยี่ยมมาก!
          </div>
        ) : (
          <div className="space-y-6">
            {pendingEvents.map((event) => (
              <div key={event.id} className="border-2 border-gray-200 rounded-2xl p-6 hover:border-ori-blue-d transition-colors bg-gray-50">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <h3 className="text-xl font-black text-ori-ink">{event.title}</h3>
                    <p className="text-sm font-bold text-gray-600">ผู้จัด: {event.organizer_name}</p>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">{event.description || 'ไม่มีรายละเอียด'}</p>
                    
                    {/* แสดงเหตุผลจาก AI */}
                    {event.moderation_logs && event.moderation_logs.length > 0 && (
                      <div className="mt-4 bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold p-3 rounded-lg">
                        🤖 <strong>ความเห็น AI (คะแนน {event.moderation_logs[0].ai_score}):</strong> {event.moderation_logs[0].ai_reason}
                      </div>
                    )}
                  </div>

                  {/* ปุ่มดำเนินการ */}
                  <div className="flex flex-col gap-3 justify-center min-w-[140px]">
                    <button 
                      onClick={() => handleUpdateStatus(event.id, 'approved')}
                      className="bg-ori-green text-white font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition-colors shadow-sm"
                    >
                      <CheckCircle2 size={18} /> อนุมัติ
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(event.id, 'rejected')}
                      className="bg-red-500 text-white font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 transition-colors shadow-sm"
                    >
                      <XCircle size={18} /> ปฏิเสธ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}