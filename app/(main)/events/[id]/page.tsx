'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams, useRouter } from 'next/navigation'
import { 
  Calendar, MapPin, Trophy, Megaphone, BookOpen, 
  ShoppingCart, Users, HeartPulse, Search, Building2, 
  ArrowLeft, Share2, Clock
} from 'lucide-react'
import Link from 'next/link'

const getCategoryStyle = (type: string) => {
  switch (type) {
    case 'contest': return { color: 'text-ori-orange bg-ori-orange/10 border-ori-orange', icon: <Trophy />, label: 'การแข่งขันและประกวด' };
    case 'training': return { color: 'text-purple-600 bg-purple-50 border-purple-600', icon: <BookOpen />, label: 'อบรมและให้ความรู้' };
    case 'market': return { color: 'text-blue-600 bg-blue-50 border-blue-600', icon: <ShoppingCart />, label: 'ตลาดและงานแสดงสินค้า' };
    case 'community': return { color: 'text-ori-green-d bg-ori-green/10 border-ori-green-d', icon: <Users />, label: 'กิจกรรมชุมชน' };
    case 'health': return { color: 'text-red-500 bg-red-50 border-red-500', icon: <HeartPulse />, label: 'สุขภาพและการดูแล' };
    case 'news': return { color: 'text-gray-600 bg-gray-50 border-gray-600', icon: <Megaphone />, label: 'ข่าวสารและประกาศ' };
    case 'help': return { color: 'text-ori-blue-d bg-ori-blue/10 border-ori-blue-d', icon: <Search />, label: 'หาบ้านและช่วยเหลือ' };
    default: return { color: 'text-black bg-gray-50 border-black', icon: <Calendar />, label: 'กิจกรรม' };
  }
}

export default function EventDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (data) setEvent(data)
      setLoading(false)
    }
    fetchEvent()
  }, [id, supabase])

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-ori-blue-d">กำลังดึงข้อมูลข่าวสาร...</div>
  if (!event) return <div className="min-h-screen flex items-center justify-center font-black">ไม่พบข้อมูลประกาศนี้</div>

  const style = getCategoryStyle(event.event_type)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 mb-20">
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 font-black text-gray-500 hover:text-ori-ink transition-colors">
        <ArrowLeft size={20} /> กลับสู่กระดานข่าว
      </button>

      <div className="bg-white border-4 border-ori-ink rounded-[40px] overflow-hidden shadow-paper">
        {/* Poster Header */}
        <div className="aspect-[21/9] bg-gray-100 border-b-4 border-ori-ink relative flex items-center justify-center">
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-300 opacity-50 flex flex-col items-center">
              <Megaphone size={64} />
              <span className="font-black mt-2">POBPET NEWS</span>
            </div>
          )}
          <div className={`absolute top-6 left-6 px-4 py-2 bg-white border-2 rounded-full font-black text-sm flex items-center gap-2 shadow-paper-sm ${style.color}`}>
            {style.icon} {style.label}
          </div>
        </div>

        <div className="p-8 md:p-12">
          <h1 className="text-3xl md:text-5xl font-black text-ori-ink mb-6 leading-tight">
            {event.title}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* รายละเอียดฝั่งซ้าย */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border-2 border-ori-ink/5">
                <Building2 className="text-ori-green mt-1" size={24} />
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">ผู้จัดงาน</p>
                  <p className="font-black text-lg text-ori-ink">{event.organizer_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border-2 border-ori-ink/5">
                <Calendar className="text-ori-blue-d mt-1" size={24} />
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">วันที่และเวลา</p>
                  <p className="font-black text-lg text-ori-ink">
                    {new Date(event.start_date).toLocaleDateString('th-TH', { 
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })} น.
                  </p>
                </div>
              </div>
            </div>

            {/* รายละเอียดฝั่งขวา */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border-2 border-ori-ink/5">
                <MapPin className="text-ori-orange mt-1" size={24} />
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">สถานที่</p>
                  <p className="font-black text-lg text-ori-ink">{event.venue_name || 'ไม่ระบุสถานที่'}</p>
                  <p className="font-bold text-gray-500 text-sm">
                    {event.subdistrict ? `ต.${event.subdistrict} ` : ''}
                    {event.district ? `อ.${event.district} ` : ''}
                    จ.{event.province}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t-4 border-gray-100 pt-8">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2">
              <Clock size={20} className="text-ori-blue-d" /> รายละเอียดเพิ่มเติม
            </h3>
            <div className="font-bold text-gray-600 leading-relaxed whitespace-pre-wrap">
              {event.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}