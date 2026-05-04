'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { MatchResultCard } from '@/components/pet/MatchResult'
import { ResolveButton } from '@/components/pet/ResolveButton' // 💡 เพิ่ม Import ปุ่มปิดประกาศ
import { User, Package, MessageCircle, CheckCircle, Loader2, PlusCircle, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'posts' | 'resolved' | 'comments'>('posts')
  const [user, setUser] = useState<any>(null)
  const [myPets, setMyPets] = useState<any[]>([])
  const [myComments, setMyComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        // 1. ดึงประกาศทั้งหมด (ทั้งที่ยังหาอยู่และสำเร็จแล้ว)
        const { data: pets } = await supabase
          .from('pets')
          .select('*, pet_images(storage_url, is_primary)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        // 2. ดึงประวัติคอมเมนต์
        const { data: comments } = await supabase
          .from('comments')
          .select('*, pets(name, type)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        // 💡 แปลงโครงสร้างข้อมูลรูปภาพให้ MatchResultCard อ่านได้
        if (pets) {
          const formattedPets = pets.map((p: any) => ({
            ...p,
            province: p.province || p.district || 'ไม่ระบุพิกัด',
            image_url: p.pet_images?.find((img: any) => img.is_primary)?.storage_url 
              || p.pet_images?.[0]?.storage_url 
              || (p.images && p.images.length > 0 ? p.images[0] : '')
          }))
          setMyPets(formattedPets)
        }
        
        if (comments) setMyComments(comments)
      }
      setLoading(false)
    }
    fetchAllData()
  }, [supabase])

  // แยกข้อมูลตาม Tab
  const activePosts = myPets.filter(p => !p.is_resolved)
  const resolvedPosts = myPets.filter(p => p.is_resolved)

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-ori-orange" size={48} /></div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8 mb-20">
      {/* --- ส่วนหัวโปรไฟล์ --- */}
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-8 shadow-paper flex flex-col md:flex-row items-center gap-8 relative">
        <div className="w-32 h-32 rounded-full border-4 border-ori-ink overflow-hidden bg-ori-orange text-white shadow-paper-sm">
          {user?.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" /> : <User size={60} className="m-auto mt-6" />}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-black mb-1">{user?.user_metadata?.first_name || 'คุณผู้ใช้งาน'}</h1>
          <p className="font-bold text-ori-ink-l">{user?.email}</p>
        </div>
        <Link href="/report" className="ori-btn ori-btn-green md:absolute md:bottom-8 md:right-8 flex items-center gap-2">
          <PlusCircle size={18} /> ลงประกาศใหม่
        </Link>
      </div>

      {/* --- ระบบ TABS --- */}
      <div className="flex flex-wrap gap-4 border-b-4 border-ori-ink pb-2">
        <button onClick={() => setActiveTab('posts')} className={`pb-2 px-4 font-black text-lg transition-all ${activeTab === 'posts' ? 'text-ori-orange border-b-4 border-ori-orange -mb-[12px]' : 'text-ori-ink-l'}`}>
          📦 ประกาศของฉัน ({activePosts.length})
        </button>
        <button onClick={() => setActiveTab('resolved')} className={`pb-2 px-4 font-black text-lg transition-all ${activeTab === 'resolved' ? 'text-ori-green border-b-4 border-ori-green -mb-[12px]' : 'text-ori-ink-l'}`}>
          ✅ สำเร็จแล้ว ({resolvedPosts.length})
        </button>
        <button onClick={() => setActiveTab('comments')} className={`pb-2 px-4 font-black text-lg transition-all ${activeTab === 'comments' ? 'text-ori-blue border-b-4 border-ori-blue -mb-[12px]' : 'text-ori-ink-l'}`}>
          💬 คอมเมนต์ของฉัน ({myComments.length})
        </button>
      </div>

      {/* --- แสดงผลตาม Tab ที่เลือก --- */}
      <div className="mt-4">
        {/* Tab 1: ประกาศของฉัน */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activePosts.map(pet => (
              <div key={pet.id} className="flex flex-col gap-3">
                <MatchResultCard result={pet} />
                {/* 💡 ฟังก์ชันที่ 3: ปุ่มสำหรับปิดประกาศ */}
                <ResolveButton 
                  petId={pet.id} 
                  status={pet.status} 
                  onResolved={() => {
                    window.location.reload() // รีเฟรชหน้าเพื่อย้ายรายการไปแท็บ 'สำเร็จแล้ว' อัตโนมัติ
                  }} 
                />
              </div>
            ))}
            {activePosts.length === 0 && <p className="col-span-full text-center py-10 font-bold text-ori-ink-l">ไม่มีประกาศที่กำลังดำเนินการ</p>}
          </div>
        )}

        {/* Tab 2: สำเร็จแล้ว */}
        {activeTab === 'resolved' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resolvedPosts.map(pet => (
              <div key={pet.id} className="relative opacity-80 transition-opacity hover:opacity-100">
                <div className="absolute top-4 right-4 z-10 bg-ori-green text-white px-3 py-1 rounded-full font-black shadow-paper-sm text-sm flex items-center gap-1">
                  <CheckCircle size={14} /> สำเร็จแล้ว
                </div>
                <MatchResultCard result={pet} />
              </div>
            ))}
            {resolvedPosts.length === 0 && <p className="col-span-full text-center py-10 font-bold text-ori-ink-l">ยังไม่มีรายการที่สำเร็จ</p>}
          </div>
        )}

        {/* Tab 3: คอมเมนต์ของฉัน */}
        {activeTab === 'comments' && (
          <div className="flex flex-col gap-4">
            {myComments.map(comment => (
              <div key={comment.id} className="bg-white border-2 border-ori-ink rounded-2xl p-5 shadow-paper-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-ori-blue-bg text-ori-blue-d px-3 py-1 rounded-lg text-xs font-black border-2 border-ori-blue">
                    💬 ตอบกลับในโพสต์: {comment.pets?.name || 'สัตว์เลี้ยงไม่มีชื่อ'}
                  </span>
                  <span className="text-xs font-bold text-ori-ink-l flex items-center gap-1">
                    <Calendar size={12} /> {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: th })}
                  </span>
                </div>
                <p className="font-bold text-ori-ink-m">&quot;{comment.content}&quot;</p>
              </div>
            ))}
            {myComments.length === 0 && <p className="text-center py-10 font-bold text-ori-ink-l">คุณยังไม่เคยแสดงความคิดเห็น</p>}
          </div>
        )}
      </div>
    </div>
  )
}