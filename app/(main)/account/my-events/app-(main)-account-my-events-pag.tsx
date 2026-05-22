'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Edit, Trash2, CalendarDays, Loader2, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function MyEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchMyEvents = async (userId: string) => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching events:', error)
    } else {
      setEvents(data || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      fetchMyEvents(session.user.id)
    }
    initData()
  }, [router, supabase])

  const handleDelete = async (eventId: string, title: string) => {
    if (!window.confirm(`⚠️ ยืนยันการลบประกาศ "${title}"?\nข้อมูลนี้จะถูกลบอย่างถาวรและไม่สามารถกู้คืนได้`)) return

    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId)
      if (error) throw error
      
      alert('✅ ลบประกาศเรียบร้อยแล้วครับ')
      fetchMyEvents(user.id) // โหลดข้อมูลใหม่หลังจากลบ
    } catch (err: any) {
      alert(`ลบไม่สำเร็จ: ${err.message}`)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="bg-green-100 text-green-800 border-2 border-green-300 px-3 py-1 rounded-lg text-xs font-black">✅ อนุมัติแล้ว</span>
      case 'pending_ai': return <span className="bg-blue-100 text-blue-800 border-2 border-blue-300 px-3 py-1 rounded-lg text-xs font-black">🤖 รอ AI ตรวจสอบ</span>
      case 'pending_admin': return <span className="bg-orange-100 text-orange-800 border-2 border-orange-300 px-3 py-1 rounded-lg text-xs font-black">⏳ รอแอดมินพิจารณา</span>
      case 'draft_returned': return <span className="bg-yellow-100 text-yellow-800 border-2 border-yellow-300 px-3 py-1 rounded-lg text-xs font-black">✍️ ส่งกลับให้แก้ไข</span>
      case 'rejected': return <span className="bg-red-100 text-red-800 border-2 border-red-300 px-3 py-1 rounded-lg text-xs font-black">❌ ไม่อนุมัติ</span>
      default: return <span className="bg-gray-100 text-gray-800 border-2 border-gray-300 px-3 py-1 rounded-lg text-xs font-black">{status}</span>
    }
  }

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-ori-blue-d" size={48} /></div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 mb-20">
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 md:p-10 shadow-paper">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b-4 border-ori-ink pb-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-ori-blue-d" size={32} />
            <div>
              <h1 className="text-3xl font-black text-ori-ink">ประกาศของฉัน</h1>
              <p className="font-bold text-gray-500 mt-1">จัดการแก้ไขและลบประกาศกิจกรรมของคุณ</p>
            </div>
          </div>
          <Link href="/events/create">
            <Button className="bg-ori-blue-d font-black py-5 px-6 rounded-xl flex items-center gap-2">
              <PlusCircle size={20} /> สร้างประกาศใหม่
            </Button>
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <CalendarDays size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="font-black text-gray-500 text-lg">คุณยังไม่มีประกาศกิจกรรมเลยครับ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {events.map((event) => (
              <div key={event.id} className="border-4 border-ori-ink rounded-2xl p-5 md:p-6 bg-white hover:-translate-y-1 transition-transform duration-200">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  
                  {/* ข้อมูลประกาศ */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(event.status)}
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-ori-ink line-clamp-1">{event.title}</h3>
                    <p className="text-sm font-bold text-gray-500">
                      หมวดหมู่: {event.event_type} | สร้างเมื่อ: {new Date(event.created_at).toLocaleDateString('th-TH')}
                    </p>
                  </div>

                  {/* ปุ่มจัดการ */}
                  <div className="flex gap-2 items-center">
                    <Button 
                      onClick={() => router.push(`/events/edit/${event.id}`)}
                      className="bg-white border-2 border-ori-ink text-ori-ink hover:bg-gray-100 font-black h-12 w-12 md:w-auto px-0 md:px-4 rounded-xl flex items-center justify-center gap-2"
                      title="แก้ไข"
                    >
                      <Edit size={18} /> <span className="hidden md:inline">แก้ไข</span>
                    </Button>
                    <Button 
                      onClick={() => handleDelete(event.id, event.title)}
                      className="bg-red-50 text-red-600 border-2 border-red-600 hover:bg-red-100 font-black h-12 w-12 md:w-auto px-0 md:px-4 rounded-xl flex items-center justify-center gap-2"
                      title="ลบ"
                    >
                      <Trash2 size={18} /> <span className="hidden md:inline">ลบ</span>
                    </Button>
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