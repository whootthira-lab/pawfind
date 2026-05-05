'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { MatchResultCard } from '@/components/pet/MatchResult'
import { ResolveButton } from '@/components/pet/ResolveButton'
import { User, CheckCircle, Loader2, PlusCircle, Bell } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'posts' | 'resolved'>('posts')
  const [user, setUser] = useState<any>(null)
  const [myPets, setMyPets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 💡 ใช้ useMemo ป้องกันการสร้าง instance ใหม่ทุกครั้งที่ Render (ลด Warning)
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const fetchAllData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setLoading(false)
        return
      }

      setUser(session.user)

      // 💡 แก้ไข: ตัด notifications(id, is_read) ออกเพื่อป้องกัน Query พัง[cite: 12]
      const { data: pets, error: petsError } = await supabase
        .from('pets')
        .select(`
          *,
          pet_images(storage_url, is_primary)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      // เช็ค Error เผื่อไว้ดูใน Console เวลามีปัญหา
      if (petsError) {
        console.error('❌ Supabase Query Error:', petsError.message)
      }

      if (pets) {
        const formattedPets = pets.map((p: any) => {
          return {
            ...p,
            unread_count: 0, // 💡 ตั้งเป็น 0 ไว้ก่อน ระหว่างรอทำระบบแจ้งเตือน
            province: p.province || p.district || 'ไม่ระบุพิกัด',
            image_url: p.pet_images?.find((img: any) => img.is_primary)?.storage_url 
              || p.pet_images?.[0]?.storage_url 
              || (p.images?.[0] || '')
          }
        })
        setMyPets(formattedPets)
      }
      
    } catch (err) {
      console.error('❌ Profile fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const activePosts = myPets.filter(p => !p.is_resolved)
  const resolvedPosts = myPets.filter(p => p.is_resolved)

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-ori-orange" size={48} /></div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8 mb-20">
      {/* ส่วนหัวโปรไฟล์ */}
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-8 shadow-paper flex flex-col md:flex-row items-center gap-8 relative">
        <div className="w-32 h-32 rounded-full border-4 border-ori-ink overflow-hidden bg-ori-orange text-white shadow-paper-sm">
          {user?.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <User size={60} className="m-auto mt-6" />}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-black mb-1">{user?.user_metadata?.first_name || 'คุณผู้ใช้งาน'}</h1>
          <p className="font-bold text-ori-ink-l">{user?.email}</p>
        </div>
        <Link href="/report" className="ori-btn ori-btn-green md:absolute md:bottom-8 md:right-8 flex items-center gap-2">
          <PlusCircle size={18} /> ลงประกาศใหม่
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 border-b-4 border-ori-ink pb-2">
        <button onClick={() => setActiveTab('posts')} className={`pb-2 px-4 font-black text-lg transition-all ${activeTab === 'posts' ? 'text-ori-orange border-b-4 border-ori-orange -mb-[12px]' : 'text-ori-ink-l'}`}>
          📦 ประกาศของฉัน ({activePosts.length})
        </button>
        <button onClick={() => setActiveTab('resolved')} className={`pb-2 px-4 font-black text-lg transition-all ${activeTab === 'resolved' ? 'text-ori-green border-b-4 border-ori-green -mb-[12px]' : 'text-ori-ink-l'}`}>
          ✅ สำเร็จแล้ว ({resolvedPosts.length})
        </button>
      </div>

      {/* แสดงผลตาม Tab */}
      <div className="mt-4">
        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activePosts.map(pet => (
              <div key={pet.id} className="flex flex-col gap-3 relative">
                {/* Badge แจ้งเตือนบนการ์ด */}
                {pet.unread_count > 0 && (
                  <div className="absolute -top-2 -right-2 z-20 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-paper-sm flex items-center gap-1 animate-bounce">
                    <Bell size={12} fill="white" /> {pet.unread_count} แจ้งเตือนใหม่!
                  </div>
                )}
                <MatchResultCard result={pet} />
                <ResolveButton 
                  petId={pet.id} 
                  status={pet.status} 
                  onResolved={fetchAllData} 
                />
              </div>
            ))}
            {activePosts.length === 0 && <p className="col-span-full text-center py-10 font-bold text-ori-ink-l">ไม่มีประกาศที่กำลังดำเนินการ</p>}
          </div>
        )}

        {activeTab === 'resolved' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resolvedPosts.map(pet => (
              <div key={pet.id} className="relative opacity-80">
                <div className="absolute top-4 right-4 z-10 bg-ori-green text-white px-3 py-1 rounded-full font-black shadow-paper-sm text-sm flex items-center gap-1">
                  <CheckCircle size={14} /> สำเร็จแล้ว
                </div>
                <MatchResultCard result={pet} />
              </div>
            ))}
            {resolvedPosts.length === 0 && <p className="col-span-full text-center py-10 font-bold text-ori-ink-l">ยังไม่มีรายการที่สำเร็จ</p>}
          </div>
        )}
      </div>
    </div>
  )
}