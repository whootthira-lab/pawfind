'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { MatchResultCard } from '@/components/pet/MatchResult'
import { ResolveButton } from '@/components/pet/ResolveButton'
import { User, CheckCircle, Loader2, PlusCircle, MessageSquare, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

// ── 1. เตรียมตัวเลือกให้ครอบคลุม ──
const expertiseOptions = [
  { value: 'general', label: 'ผู้ใช้งานทั่วไป (พร้อมช่วยเป็นหูเป็นตา)' },
  { value: 'volunteer', label: 'อาสาสมัคร / ศูนย์พักพิงสัตว์' },
  { value: 'petscout', label: 'PetScout (รับจ้างตามหาสัตว์หาย)' },
  { value: 'vet', label: 'สัตวแพทย์ / คลินิกรักษาสัตว์' },
  { value: 'groomer', label: 'บริการอาบน้ำตัดขน / โรงแรมสัตว์' },
  { value: 'petsitter', label: 'รับฝากหรือดูแลสัตว์ที่บ้าน' },
  { value: 'retailer', label: 'ร้านจำหน่ายอาหารและอุปกรณ์สัตว์เลี้ยง' },
  { value: 'other', label: 'อื่นๆ (โปรดระบุ)' },
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'posts' | 'resolved' | 'settings'>('posts')
  const [user, setUser] = useState<any>(null)
  const [myPets, setMyPets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // State สำหรับข้อมูลโปรไฟล์ (รวมถึง dropdown)
  const [profile, setProfile] = useState<{
    community_role: string,
    community_role_custom: string
  }>({
    community_role: 'general',
    community_role_custom: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setLoading(false)
        return
      }

      setUser(session.user)

      // ── ดึงข้อมูลโปรไฟล์ (บทบาทชุมชน) ──
      const { data: profileData } = await supabase
        .from('profiles')
        .select('community_role, community_role_custom')
        .eq('id', session.user.id)
        .single()
      
      if (profileData) {
        setProfile({
          community_role: profileData.community_role || 'general',
          community_role_custom: profileData.community_role_custom || ''
        })
      }

      // ── ดึงข้อมูลสัตว์เลี้ยง ──
      const { data: pets, error: petsError } = await supabase
        .from('pets')
        .select(`
          *,
          pet_images(storage_url, is_primary),
          comments(count) 
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (petsError) console.error('❌ Query Error:', petsError.message)

      if (pets) {
        const formattedPets = pets.map((p: any) => ({
          ...p,
          unread_count: p.comments?.[0]?.count || 0,
          province: p.province || p.district || 'ไม่ระบุพิกัด',
          image_url: p.pet_images?.find((img: any) => img.is_primary)?.storage_url 
            || p.pet_images?.[0]?.storage_url 
            || (p.image_url || '')
        }))
        setMyPets(formattedPets)
      }
    } catch (err) {
      console.error('❌ Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchAllData() }, [fetchAllData])

  // ── ฟังก์ชันบันทึกบทบาท ──
  const handleSaveProfile = async () => {
    if (!user) return
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          community_role: profile.community_role,
          community_role_custom: profile.community_role === 'other' ? profile.community_role_custom : null
        })
        .eq('id', user.id)

      if (error) throw error
      
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่')
    } finally {
      setIsSaving(false)
    }
  }

  const activePosts = myPets.filter(p => !p.is_resolved)
  const resolvedPosts = myPets.filter(p => p.is_resolved)

  if (loading && myPets.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-ori-orange" size={60} />
      <p className="font-black text-ori-ink-l">กำลังเรียกข้อมูลประกาศของคุณ...</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8 mb-20">
      {/* Header โปรไฟล์ */}
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-8 shadow-paper flex flex-col md:flex-row items-center gap-8 relative">
        <div className="w-32 h-32 rounded-full border-4 border-ori-ink overflow-hidden bg-ori-orange text-white shadow-paper-sm shrink-0">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={60} className="m-auto mt-6" />
          )}
        </div>
        
        {/* ข้อมูลโปรไฟล์และ Dropdown บทบาทชุมชน */}
        <div className="flex-1 text-center md:text-left w-full">
          <h1 className="text-3xl font-black mb-1">{user?.user_metadata?.display_name || user?.user_metadata?.first_name || 'คุณผู้ใช้งาน'}</h1>
          <p className="font-bold text-ori-ink-l mb-4">{user?.email}</p>
          
          {/* ── ส่วนเลือกบทบาทชุมชน ── */}
          <div className="bg-wagashi-kinako/30 p-4 rounded-xl border-2 border-ori-ink/20 max-w-lg mx-auto md:mx-0 text-left">
            <label className="font-black text-ori-ink text-sm md:text-base block mb-2">
              คุณต้องการช่วยเหลือหรือให้บริการเกี่ยวกับสัตว์ด้านไหนได้บ้าง? 🐾
            </label>
            <div className="flex flex-col gap-2">
              <select 
                name="community_role"
                value={profile.community_role}
                onChange={(e) => setProfile({...profile, community_role: e.target.value})}
                className="w-full border-2 border-ori-ink p-2.5 rounded-lg shadow-paper-sm outline-none focus:border-ori-orange transition-colors bg-white cursor-pointer font-bold text-sm"
              >
                {expertiseOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <AnimatePresence>
                {profile.community_role === 'other' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <input 
                      type="text"
                      placeholder="โปรดระบุความเชี่ยวชาญของคุณ..."
                      value={profile.community_role_custom}
                      onChange={(e) => setProfile({...profile, community_role_custom: e.target.value})}
                      className="w-full border-2 border-ori-ink p-2.5 rounded-lg shadow-paper-sm outline-none focus:border-ori-orange transition-colors bg-white font-bold text-sm"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="mt-2 text-sm font-bold bg-ori-ink text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-black transition-colors w-fit"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                บันทึกข้อมูล
              </button>
              
              {saveSuccess && (
                <span className="text-green-600 font-bold text-xs mt-1 animate-pulse">
                  บันทึกข้อมูลสำเร็จ! ✅
                </span>
              )}
            </div>
          </div>
          {/* ────────────────────── */}
        </div>

        <Link href="/report" className="ori-btn ori-btn-green md:absolute md:bottom-8 md:right-8 flex items-center justify-center gap-2 mt-4 md:mt-0 w-full md:w-auto">
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

      {/* รายการประกาศ */}
      <div className="mt-4">
        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activePosts.map(pet => (
              <div key={pet.id} className="flex flex-col gap-4 relative">
                {pet.unread_count > 0 && (
                  <div className="absolute -top-3 -left-3 z-30 bg-ori-orange text-white min-w-[32px] h-32 px-2 rounded-full flex items-center justify-center border-4 border-ori-ink shadow-paper-sm font-black text-sm animate-bounce">
                    <MessageSquare size={14} className="mr-1" /> {pet.unread_count}
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
              <div key={pet.id} className="relative opacity-90 grayscale-[0.5]">
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