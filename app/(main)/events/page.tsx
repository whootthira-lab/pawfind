'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { 
  Calendar, MapPin, PlusCircle, Loader2, Trophy, 
  Megaphone, BookOpen, ShoppingCart, Users, HeartPulse, Search, Building2,
  Image as ImageIcon 
} from 'lucide-react'

// 💡 ฟังก์ชันกำหนดสี ไอคอน และชื่อเรียก ตามหมวดหมู่
const getCategoryStyle = (type: string) => {
  switch (type) {
    case 'contest': 
      return { color: 'text-ori-orange border-ori-orange bg-ori-orange/5', icon: <Trophy size={16} />, label: 'การแข่งขันและประกวด' };
    case 'training': 
      return { color: 'text-purple-600 border-purple-600 bg-purple-50', icon: <BookOpen size={16} />, label: 'อบรมและให้ความรู้' };
    case 'market': 
      return { color: 'text-blue-600 border-blue-600 bg-blue-50', icon: <ShoppingCart size={16} />, label: 'ตลาดและงานแสดงสินค้า' };
    case 'community': 
      return { color: 'text-ori-green-d border-ori-green-d bg-ori-green/5', icon: <Users size={16} />, label: 'กิจกรรมชุมชนและสาธารณะ' };
    case 'health': 
      return { color: 'text-red-500 border-red-500 bg-red-50', icon: <HeartPulse size={16} />, label: 'สุขภาพและการดูแล' };
    case 'news': 
      return { color: 'text-gray-600 border-gray-600 bg-gray-50', icon: <Megaphone size={16} />, label: 'ข่าวสารและประกาศ' };
    case 'help': 
      return { color: 'text-ori-blue-d border-ori-blue-d bg-ori-blue/5', icon: <Search size={16} />, label: 'หาบ้านและช่วยเหลือ' };
    default: 
      return { color: 'text-black border-black bg-gray-50', icon: <Calendar size={16} />, label: 'กิจกรรม' };
  }
}

export default function EventsBoardPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      try {
        // 💡 ดึงเฉพาะข้อมูลที่สถานะ 'approved' เท่านั้น
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'approved') 
          .order('start_date', { ascending: true }) // เรียงจากงานที่กำลังจะจัดขึ้นก่อน

        if (error) throw error
        if (data) setEvents(data)
      } catch (err) {
        console.error('Error fetching events:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [supabase])

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-ori-blue-d" size={60} />
      <p className="font-black text-ori-ink-l">กำลังโหลดกระดานข่าวชุมชน...</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 mb-20">
      {/* 🏆 ส่วนหัวกระดาน */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 border-b-4 border-ori-ink pb-8">
        <div>
          <h1 className="text-4xl font-black text-ori-ink flex items-center gap-3">
            <Trophy className="text-ori-orange" size={40} />
            กระดานกิจกรรม & ข่าวสาร
          </h1>
          <p className="font-bold text-gray-500 mt-2 text-lg">
            รวมทุกความเคลื่อนไหว กิจกรรม และประกาศสำคัญเพื่อชุมชนคนรักสัตว์
          </p>
        </div>
        <Link 
          href="/events/create" 
          className="bg-ori-green text-white font-black py-4 px-6 rounded-2xl flex items-center gap-2 shadow-paper hover:-translate-y-1 transition-all border-2 border-transparent hover:border-black"
        >
          <PlusCircle size={20} /> ลงประกาศใหม่
        </Link>
      </div>

      {/* 🐾 รายการการ์ดกิจกรรม */}
      {events.length === 0 ? (
        <div className="bg-white border-4 border-dashed border-gray-300 rounded-3xl p-16 text-center flex flex-col items-center">
          <Megaphone size={60} className="text-gray-300 mb-4" />
          <h3 className="text-2xl font-black text-gray-400">ยังไม่มีประกาศในขณะนี้</h3>
          <p className="font-bold text-gray-400 mt-2">ร่วมสร้างสรรค์ชุมชนโดยการลงประกาศกิจกรรมได้เลยครับ!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map(event => {
            const style = getCategoryStyle(event.event_type)
            return (
              <Link 
                key={event.id} 
                href={`/events/${event.id}`} 
                className="bg-white border-4 border-ori-ink rounded-3xl overflow-hidden shadow-paper hover:shadow-paper-lg hover:-translate-y-2 transition-all group flex flex-col cursor-pointer"
              >
                {/* 🖼️ ส่วนรูปภาพโปสเตอร์ */}
                <div className="aspect-video bg-gray-100 border-b-4 border-ori-ink relative overflow-hidden flex items-center justify-center">
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-300 opacity-50">
                      <ImageIcon size={48} />
                      <span className="font-black text-[10px] mt-2 uppercase tracking-widest">{style.label}</span>
                    </div>
                  )}
                  
                  {/* Badge ประเภทงาน */}
                  <div className={`absolute top-3 left-3 px-3 py-1 bg-white border-2 rounded-full font-black text-[10px] flex items-center gap-1 shadow-paper-sm ${style.color}`}>
                    {style.icon} {style.label.toUpperCase()}
                  </div>
                </div>

                {/* 📝 ส่วนข้อมูลเนื้อหา */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-black text-xl text-ori-ink mb-4 line-clamp-2 leading-snug group-hover:text-ori-blue-d transition-colors">
                    {event.title}
                  </h3>
                  
                  <div className="space-y-3 mt-auto">
                    {/* ข้อมูลผู้จัดงาน */}
                    <div className="flex items-center gap-2 text-xs font-black text-gray-500">
                      <Building2 size={14} className="text-ori-green" />
                      <span className="truncate">โดย: {event.organizer_name || 'ผู้จัดงาน PobPet'}</span>
                    </div>

                    {/* วันที่และเวลาจัดงาน */}
                    <div className="flex items-center gap-2 text-xs font-black text-gray-600 bg-gray-50 p-2.5 rounded-xl border-2 border-ori-ink/5">
                      <Calendar size={16} className="text-ori-blue-d shrink-0" />
                      <span>
                        {new Date(event.start_date).toLocaleDateString('th-TH', { 
                          day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit'
                        })} น.
                      </span>
                    </div>
                    
                    {/* สถานที่จัดงานแบบละเอียด */}
                    <div className="flex items-start gap-2 text-xs font-black text-gray-600 bg-gray-50 p-2.5 rounded-xl border-2 border-ori-ink/5">
                      <MapPin size={16} className="text-ori-orange shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-ori-ink font-black">{event.venue_name || 'ไม่ระบุสถานที่'}</span>
                        <span className="text-[10px] opacity-70">
                          {event.subdistrict ? `ต.${event.subdistrict} ` : ''}
                          {event.district ? `อ.${event.district} ` : ''}
                          จ.{event.province}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}