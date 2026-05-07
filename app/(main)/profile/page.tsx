'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { MatchResultCard } from '@/components/pet/MatchResult'
import { ResolveButton } from '@/components/pet/ResolveButton'
import { 
  User, CheckCircle, Loader2, PlusCircle, MessageSquare, 
  Save, Camera, MapPin, Phone, UserCircle, Settings 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

// 👇 เพิ่มการ import Button เข้ามาแล้วครับ
import { Button } from '@/components/ui/button'

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
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // ── State สำหรับข้อมูลโปรไฟล์ทั้งหมด ──
  const [profile, setProfile] = useState({
    display_name: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    line_id: '',
    avatar_url: '',
    address: '',
    province: '',
    district: '',
    subdistrict: '',
    contact_link: '',
    community_role: 'general',
    community_role_custom: ''
  })

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

      const { data: pData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (pData) {
        setProfile({
          display_name: pData.display_name || '',
          first_name: pData.first_name || '',
          last_name: pData.last_name || '',
          phone_number: pData.phone_number || '',
          line_id: pData.line_id || '',
          avatar_url: pData.avatar_url || '',
          address: pData.address || '',
          province: pData.province || '',
          district: pData.district || '',
          subdistrict: pData.subdistrict || '',
          contact_link: pData.contact_link || '',
          community_role: pData.community_role || 'general',
          community_role_custom: pData.community_role_custom || ''
        })
      }

      const { data: pets } = await supabase
        .from('pets')
        .select('*, pet_images(storage_url, is_primary), comments(count)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (pets) {
        setMyPets(pets.map((p: any) => ({
          ...p,
          unread_count: p.comments?.[0]?.count || 0,
          image_url: p.pet_images?.find((img: any) => img.is_primary)?.storage_url || p.pet_images?.[0]?.storage_url
        })))
      }
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [supabase])

  useEffect(() => { fetchAllData() }, [fetchAllData])

  // ── ระบบอัปโหลดรูปโปรไฟล์ ──
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`
      const { error: upErr } = await supabase.storage.from('profile-images').upload(filePath, file)
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('profile-images').getPublicUrl(filePath)
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
    } catch (err) { alert('อัปโหลดรูปไม่สำเร็จ') } finally { setUploading(false) }
  }

  // ── บันทึกการเปลี่ยนแปลงทั้งหมด ──
  const handleUpdateProfile = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...profile,
          community_role_custom: profile.community_role === 'other' ? profile.community_role_custom : null
        })
        .eq('id', user.id)

      if (error) throw error
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) { alert('บันทึกไม่สำเร็จ กรุณาลองใหม่') } finally { setIsSaving(false) }
  }

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-ori-orange" size={60} />
      <p className="font-black text-ori-ink-l">กำลังเรียกข้อมูล...</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8 mb-20">
      {/* Profile Header */}
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-8 shadow-paper flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="w-32 h-32 rounded-full border-4 border-ori-ink overflow-hidden bg-ori-orange text-white shadow-paper-sm shrink-0 relative group">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={60} className="m-auto mt-6" />
          )}
          {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-black mb-1">{profile.display_name || 'คุณผู้ใช้งาน'}</h1>
          <p className="font-bold text-ori-ink-l mb-4">{user?.email}</p>
          <div className="inline-block bg-wagashi-matcha/20 border-2 border-wagashi-matcha text-ori-green-d px-3 py-1 rounded-full text-sm font-black">
             🛡️ {expertiseOptions.find(o => o.value === profile.community_role)?.label}
          </div>
        </div>

        <Link href="/report" className="ori-btn ori-btn-green flex items-center justify-center gap-2 mt-4 md:mt-0 shadow-paper-sm hover:-translate-y-1">
          <PlusCircle size={18} /> ลงประกาศใหม่
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-4 border-b-4 border-ori-ink pb-2">
        <button onClick={() => setActiveTab('posts')} className={`pb-2 px-4 font-black text-lg transition-all ${activeTab === 'posts' ? 'text-ori-orange border-b-4 border-ori-orange -mb-[12px]' : 'text-ori-ink-l'}`}>
          📦 ประกาศของฉัน
        </button>
        <button onClick={() => setActiveTab('resolved')} className={`pb-2 px-4 font-black text-lg transition-all ${activeTab === 'resolved' ? 'text-ori-green border-b-4 border-ori-green -mb-[12px]' : 'text-ori-ink-l'}`}>
          ✅ สำเร็จแล้ว
        </button>
        <button onClick={() => setActiveTab('settings')} className={`pb-2 px-4 font-black text-lg transition-all ${activeTab === 'settings' ? 'text-ori-blue-d border-b-4 border-ori-blue-d -mb-[12px]' : 'text-ori-ink-l'}`}>
          ⚙️ ตั้งค่าโปรไฟล์
        </button>
      </div>

      <div className="mt-4">
        {/* ── Tab: Settings (ฟอร์มแก้ไขโปรไฟล์) ── */}
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border-4 border-ori-ink p-6 md:p-10 rounded-3xl shadow-paper">
            <h2 className="md:col-span-2 text-2xl font-black border-b-2 border-black pb-4 flex items-center gap-2">
              <Settings className="text-ori-blue-d" /> แก้ไขข้อมูลส่วนตัว
            </h2>

            {/* Avatar Update Section */}
            <div className="md:col-span-2 flex items-center gap-6 bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-300">
               <div className="w-20 h-20 rounded-full border-2 border-black overflow-hidden bg-white shrink-0">
                  {/* 👇 เพิ่ม alt attribute เพื่อแก้ Warning */}
                  <img src={profile.avatar_url || '/placeholder-user.png'} alt="Avatar" className="w-full h-full object-cover" />
               </div>
               <div className="flex flex-col gap-2">
                  <label className="cursor-pointer bg-white border-2 border-black px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all flex items-center gap-2">
                    <Camera size={16} /> เปลี่ยนรูปโปรไฟล์
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                  <p className="text-[10px] text-gray-500 font-bold">แนะนำรูปขนาดสี่เหลี่ยมจัตุรัส</p>
               </div>
            </div>

            <div className="space-y-2">
              <label className="font-black text-sm flex items-center gap-1"><UserCircle size={14}/> ชื่อโปรไฟล์ (Display Name)</label>
              <input value={profile.display_name} onChange={e => setProfile({...profile, display_name: e.target.value})} className="ori-input" />
            </div>

            <div className="space-y-2">
              <label className="font-black text-sm flex items-center gap-1"><Phone size={14}/> เบอร์โทรศัพท์</label>
              <input value={profile.phone_number} onChange={e => setProfile({...profile, phone_number: e.target.value})} className="ori-input" />
            </div>

            <div className="space-y-2">
              <label className="font-black text-sm">ชื่อจริง</label>
              <input value={profile.first_name} onChange={e => setProfile({...profile, first_name: e.target.value})} className="ori-input" />
            </div>

            <div className="space-y-2">
              <label className="font-black text-sm">นามสกุล</label>
              <input value={profile.last_name} onChange={e => setProfile({...profile, last_name: e.target.value})} className="ori-input" />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="font-black text-sm flex items-center gap-1"><MapPin size={14}/> ที่อยู่ (จังหวัด/อำเภอ/ตำบล)</label>
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="จังหวัด" value={profile.province} onChange={e => setProfile({...profile, province: e.target.value})} className="ori-input text-sm" />
                <input placeholder="อำเภอ" value={profile.district} onChange={e => setProfile({...profile, district: e.target.value})} className="ori-input text-sm" />
                <input placeholder="ตำบล" value={profile.subdistrict} onChange={e => setProfile({...profile, subdistrict: e.target.value})} className="ori-input text-sm" />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2 pt-4 border-t-2 border-gray-100">
              <label className="font-black text-ori-ink">คุณต้องการช่วยเหลือหรือให้บริการด้านไหน? 🐾</label>
              <select 
                value={profile.community_role}
                onChange={(e) => setProfile({...profile, community_role: e.target.value})}
                className="w-full border-4 border-black p-3 rounded-xl shadow-paper-sm font-bold bg-wagashi-kinako/10"
              >
                {expertiseOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              {profile.community_role === 'other' && (
                <input 
                  placeholder="ระบุความเชี่ยวชาญ..."
                  value={profile.community_role_custom}
                  onChange={e => setProfile({...profile, community_role_custom: e.target.value})}
                  className="ori-input mt-2"
                />
              )}
            </div>

            <div className="md:col-span-2 flex flex-col items-center gap-3 mt-6">
              <Button 
                onClick={handleUpdateProfile} 
                disabled={isSaving}
                className="w-full md:w-64 bg-black text-white py-6 rounded-2xl font-black text-lg shadow-paper-sm hover:shadow-paper transition-all"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} className="mr-2" /> บันทึกการแก้ไข</>}
              </Button>
              {saveSuccess && <span className="text-green-600 font-black animate-bounce">บันทึกข้อมูลเรียบร้อยแล้ว! ✅</span>}
            </div>
          </motion.div>
        )}

        {/* Tab: Posts & Resolved (ส่วนเดิม) */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myPets.filter(p => !p.is_resolved).map(pet => (
              <div key={pet.id} className="flex flex-col gap-4 relative">
                {pet.unread_count > 0 && (
                  <div className="absolute -top-3 -left-3 z-30 bg-ori-orange text-white min-w-[32px] h-32 px-2 rounded-full flex items-center justify-center border-4 border-ori-ink shadow-paper-sm font-black text-sm animate-bounce">
                    <MessageSquare size={14} className="mr-1" /> {pet.unread_count}
                  </div>
                )}
                <MatchResultCard result={pet} />
                <ResolveButton petId={pet.id} status={pet.status} onResolved={fetchAllData} />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'resolved' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myPets.filter(p => p.is_resolved).map(pet => (
              <div key={pet.id} className="relative opacity-90 grayscale-[0.5]">
                <div className="absolute top-4 right-4 z-10 bg-ori-green text-white px-3 py-1 rounded-full font-black shadow-paper-sm text-sm"><CheckCircle size={14} /> สำเร็จแล้ว</div>
                <MatchResultCard result={pet} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}