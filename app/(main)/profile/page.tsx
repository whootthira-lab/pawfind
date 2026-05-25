'use client'
// app/(main)/profile/page.tsx (V2 - ปลด Paywall เด็ดขาด, แก้บั๊ครูปภาพนุด, บันทึกรูปตำหนิ 3 รูปพร้อมรายละเอียดฟรี 100%)

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { MatchResultCard } from '@/components/pet/MatchResult'
import { ResolveButton } from '@/components/pet/ResolveButton'
import {
  User, CheckCircle, Loader2, PlusCircle, MessageSquare,
  Save, Camera, MapPin, Phone, UserCircle, Settings, Briefcase,
  Heart, AlertCircle, ChevronRight, PawPrint, Upload, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DonationModal } from '@/components/DonationModal'

// ── Constants ตัวเลือกต่าง ๆ สอดคล้องทั้งระบบ ──────────────────
const expertiseOptions = [
  { value: 'adopt',       label: '🐶 หาบ้านใหม่ / รับเลี้ยง' },
  { value: 'rescue',      label: '🆘 ค้นหาสัตว์หาย/ช่วยเหลือสัตว์จร' },
  { value: 'mating',      label: '❤️ หาคู่ให้สัตว์เลี้ยง' },
  { value: 'showcase',    label: '📸 ประกวด / อวดความน่ารัก' },
  { value: 'knowledge',   label: '📚 ศึกษาความรู้การเลี้ยง' },
  { value: 'general',     label: 'ผู้ใช้งานทั่วไป (พร้อมช่วยเป็นหูเป็นตา)' },
  { value: 'volunteer',   label: 'อาสาสมัคร / ศูนย์พักพิงสัตว์' },
  { value: 'petscout',    label: 'PetScout (รับจ้างตามหาสัตว์หาย)' },
  { value: 'vet',         label: 'สัตวแพทย์ / คลินิกรักษาสัตว์' },
  { value: 'groomer',     label: 'บริการอาบน้ำตัดขน / โรงแรมสัตว์' },
  { value: 'petsitter',   label: 'รับฝากหรือดูแลสัตว์ที่บ้าน' },
  { value: 'retailer',    label: 'ร้านจำหน่ายอาหารและอุปกรณ์สัตว์เลี้ยง' },
  { value: 'other',       label: 'อื่นๆ (โปรดระบุ)' },
]

const occupationOptions = [
  { value: 'student',         label: '🎓 นักเรียน / นักศึกษา' },
  { value: 'employee',        label: '💼 พนักงานบริษัท / ลูกจ้าง' },
  { value: 'government',      label: '🏛 ข้าราชการ / รัฐวิสาหกิจ' },
  { value: 'business_owner',  label: '🏪 เจ้าของกิจการ / ธุรกิจส่วนตัว' },
  { value: 'freelance',       label: '🖥 Freelance / อาชีพอิสระ' },
  { value: 'agriculturist',   label: '🌾 เกษตรกร' },
  { value: 'healthcare',      label: '🏥 บุคลากรทางการแพทย์' },
  { value: 'educator',        label: '📚 ครู / อาจารย์' },
  { value: 'retired',         label: '🏖 เกษียณอายุ' },
  { value: 'unemployed',      label: '🔍 ว่างงาน / กำลังหางาน' },
  { value: 'other',           label: '✏️ อื่นๆ' },
]

const thailandProvinces = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยะลา", "ยโสธร", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อุดรธานี", "อุทัยธานี", "อุตรดิตถ์", "อุบลราชธานี", "อำนาจเจริญ"
].sort()

export default function ProfilePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [activeTab, setActiveTab] = useState<'profile' | 'active' | 'resolved' | 'pets'>('profile')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [myPets, setMyPets] = useState<any[]>([])
  const [showDonation, setShowDonation] = useState(false)

  // Profile Form States
  const [updating, setUpdating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [form, setForm] = useState({
    display_name: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    province: 'นครราชสีมา',
    district: '',
    subdistrict: '',
    address: '',
    line_id: '',
    avatar_url: '',
    occupation: 'employee',
    community_role: 'general',
    community_role_custom: ''
  })

  // ── 🆕 States สำหรับโมดูลสร้างโปรไฟล์น้องใหม่พรีเมียม ──
  const [petFormOpen, setPetFormOpen] = useState(false)
  const [petSaving, setPetSaving] = useState(false)
  const petFileInputRef = useRef<HTMLInputElement>(null)
  const featureFileInputRef = useRef<HTMLInputElement>(null)
  
  const [petImages, setPetImages] = useState<{ file: File; preview: string }[]>([])
  const [featureImages, setFeatureImages] = useState<{ file: File; preview: string; description: string }[]>([])

  const [petDataForm, setPetDataForm] = useState({
    name: '',
    species: 'แมว',
    breed: '',
    gender: 'unknown',
    province: 'นครราชสีมา',
    district: '',
    sub_district: '',
    details: '',
    reward_amount: '0'
  })

  const fetchAllData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const userId = session.user.id
    setUser(session.user)

    // 1. ดึงข้อมูลโปรไฟล์ผู้ใช้
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone_number: profile.phone_number || '',
        province: profile.province || 'นครราชสีมา',
        district: profile.district || '',
        subdistrict: profile.subdistrict || '',
        address: profile.address || '',
        line_id: profile.line_id || '',
        avatar_url: profile.avatar_url || '',
        occupation: profile.occupation || 'employee',
        community_role: profile.community_role || 'general',
        community_role_custom: profile.community_role_custom || ''
      })
    }

    // 2. ดึงข้อมูลสัตว์เลี้ยงทั้งหมดของนุดรายนี้
    const { data: pets } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', userId)
      .not('status', 'eq', 'archived')
      .order('created_at', { ascending: false })

    setMyPets(pets || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // ── 🟢 [แก้ไขบั๊ก] อัปโหลดรูปประจำตัวนุดลงถังที่ถูกต้อง 'profile-images' พร้อมอัปเดต State ให้รูปแสดงผลทันที ──
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return
    setUploading(true)
    setMessage(null)

    try {
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadErr } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName)

      setForm(prev => ({ ...prev, avatar_url: publicUrl }))
      setMessage({ type: 'success', text: '📷 อัปโหลดรูปภาพโปรไฟล์สำเร็จแล้ว อย่าลืมกดบันทึกข้อมูลด้านล่างนะคะ' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' })
    } finally {
      setUploading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setUpdating(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: form.display_name.trim(),
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone_number: form.phone_number.trim(),
          province: form.province,
          district: form.district.trim(),
          subdistrict: form.subdistrict.trim(),
          address: form.address.trim(),
          line_id: form.line_id.trim(),
          avatar_url: form.avatar_url,
          occupation: form.occupation,
          community_role: form.community_role,
          community_role_custom: form.community_role === 'other' ? form.community_role_custom.trim() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error
      setMessage({ type: 'success', text: '🎉 บันทึกการอัปเดตข้อมูลโปรไฟล์ของท่านเรียบร้อยแล้ว' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' })
    } finally {
      setUpdating(false)
    }
  }

  // ── 🆕 ฟังก์ชันอัปโหลดคลังรูปภาพและบันทึกรูปตำหนิ 3 ชิ้นลงฟิลด์ distinctive_features ──
  const handlePetRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (petSaving || !user) return
    if (petImages.length === 0) return alert('กรุณาแนบรูปถ่ายหลักของน้องอย่างน้อย 1 รูป')
    setPetSaving(true)

    try {
      const uploadedUrls: string[] = []
      // อัปโหลดรูปภาพปกติสูงสุด 5 รูป
      for (const img of petImages) {
        const fileExt = img.file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        await supabase.storage.from('pet-images').upload(fileName, img.file)
        const { data: { publicUrl } } = supabase.storage.from('pet-images').getPublicUrl(fileName)
        uploadedUrls.push(publicUrl)
      }

      // อัปโหลดรูปตำหนิพิเศษสูงสุด 3 รูป พ่วงรายละเอียดแมปลงช่อง distinctive_features รูปแบบ JSON
      const markingsJsonList = []
      for (const feat of featureImages) {
        const fileExt = feat.file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-mark.${fileExt}`
        await supabase.storage.from('pet-images').upload(fileName, feat.file)
        const { data: { publicUrl } } = supabase.storage.from('pet-images').getPublicUrl(fileName)
        markingsJsonList.push({
          url: publicUrl,
          description: feat.description.trim() || 'จุดสังเกตเด่นพิเศษ'
        })
      }

      const { error } = await supabase
        .from('pets')
        .insert({
          user_id: user.id,
          name: petDataForm.name || 'ไม่ทราบชื่อ',
          species: petDataForm.species,
          breed: petDataForm.breed || null,
          gender: petDataForm.gender,
          province: petDataForm.province,
          district: petDataForm.district || null,
          sub_district: petDataForm.sub_district || null,
          details: petDataForm.details || null,
          reward_amount: parseFloat(petDataForm.reward_amount) || 0,
          image_url: uploadedUrls[0],
          doc_urls: uploadedUrls,
          distinctive_features: JSON.stringify(markingsJsonList),
          status: 'showcase',
          is_public: true,
          mode_showcase: true,
          mode_lost: false,
          mode_mating: false,
          mode_adoption: false
        })

      if (error) throw error
      alert('🎉 ลงทะเบียนบันทึกโปรไฟล์น้องสำเร็จเสร็จสิ้นเรียบร้อย!')
      setPetFormOpen(false)
      setPetImages([])
      setFeatureImages([])
      await fetchAllData()
    } catch (err: any) {
      alert(`บันทึกโปรไฟล์น้องล้มเหลว: ${err.message}`)
    } finally {
      setPetSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-black" size={48} />
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 text-black" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>
      
      {/* ── 🟢 [แก้ไขสอดคล้อง] ลบแถบสีเหลือง Paywall ด้านบนออก และดึงรูปประจำตัวจากฐานข้อมูลโดยตรง ── */}
      <div className="border-4 border-black p-6 rounded-3xl bg-white shadow-paper flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 border-4 border-black rounded-full overflow-hidden bg-gray-100 shadow-paper-sm shrink-0">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200"><User size={44} /></div>
            )}
          </div>
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-black">{form.display_name || 'สมาชิก PobPet'}</h1>
            <p className="text-sm font-bold text-gray-500 mt-0.5">{user?.email}</p>
            <span className="inline-block bg-green-100 text-green-800 border-2 border-green-400 text-xs font-black px-2.5 py-0.5 rounded-full mt-1">
              🛡️ เครือข่ายตามหาสัตว์เลี้ยงฟรีคอมมูนิตี้
            </span>
          </div>
        </div>
      </div>

      {/* ── แท็บสลับหน้าจอ (เพิ่มแท็บสิทธิ์จัดการโปรไฟล์น้องตัวที่ 4) ── */}
      <div className="flex flex-wrap gap-2 border-b-4 border-black pb-2">
        <button onClick={() => setActiveTab('profile')} className={`px-5 py-2.5 font-black rounded-xl border-2 border-black transition-all text-sm ${activeTab === 'profile' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}>⚙️ แก้ไขข้อมูลส่วนตัว</button>
        <button onClick={() => setActiveTab('active')} className={`px-5 py-2.5 font-black rounded-xl border-2 border-black transition-all text-sm ${activeTab === 'active' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}>🚨 ประกาศตามหาปัจจุบัน ({myPets.filter(p => !p.is_resolved).length})</button>
        <button onClick={() => setActiveTab('resolved')} className={`px-5 py-2.5 font-black rounded-xl border-2 border-black transition-all text-sm ${activeTab === 'resolved' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}>✅ เคสที่ช่วยสำเร็จแล้ว ({myPets.filter(p => p.is_resolved).length})</button>
        <button onClick={() => setActiveTab('pets')} className={`px-5 py-2.5 font-black rounded-xl border-2 border-black transition-all text-sm ${activeTab === 'pets' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}>🐾 จัดการโปรไฟล์น้อง ({myPets.length})</button>
      </div>

      <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 shadow-paper">
        
        {/* ══ แท็บที่ 1: แก้ไขข้อมูลส่วนตัว ════════════════════════ */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="md:col-span-2 flex flex-col items-center justify-center pb-2">
              <div className="relative w-24 h-24 border-4 border-black rounded-full overflow-hidden bg-gray-100 shadow-paper-sm">
                {form.avatar_url ? <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><UserCircle size={56} /></div>}
                <label className="absolute bottom-0 right-0 left-0 bg-black/70 text-white p-1 text-center cursor-pointer text-xs transition-colors hover:bg-black font-bold">
                  <Camera size={12} className="mx-auto" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs">ชื่อแสดงผลในระบบ <span className="text-red-500">*</span></label>
              <input type="text" required value={form.display_name} onChange={e => setForm({...form, display_name: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold" />
            </div>
            <div className="space-y-1">
              <label className="font-black text-xs">เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span></label>
              <input type="tel" required value={form.phone_number} onChange={e => setForm({...form, phone_number: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold" />
            </div>
            <div className="space-y-1">
              <label className="font-black text-xs">ชื่อจริง <span className="text-red-500">*</span></label>
              <input type="text" required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold" />
            </div>
            <div className="space-y-1">
              <label className="font-black text-xs">นามสกุล <span className="text-red-500">*</span></label>
              <input type="text" required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs flex items-center gap-1"><MapPin size={14}/> จังหวัดประจำการหลัก</label>
              {/* ── 🟢 บังคับทุกช่องเลือกจังหวัดเป็น Dropdown List ตัวเลือกสากล ── */}
              <select value={form.province} onChange={e => setForm({...form, province: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold bg-white cursor-pointer outline-none">
                {thailandProvinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-black text-xs">อำเภอ</label>
              <input type="text" value={form.district} onChange={e => setForm({...form, district: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold" />
            </div>
            <div className="space-y-1">
              <label className="font-black text-xs">ตำบล</label>
              <input type="text" value={form.subdistrict} onChange={e => setForm({...form, subdistrict: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold" />
            </div>
            <div className="space-y-1">
              <label className="font-black text-xs">บ้านเลขที่ / ที่อยู่</label>
              <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs">อาชีพ</label>
              <select value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold bg-white cursor-pointer">
                {occupationOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-black text-xs">บทบาทชุมชน</label>
              <select value={form.community_role} onChange={e => setForm({...form, community_role: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold bg-white cursor-pointer">
                {expertiseOptions.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>

            {message && (
              <div className={`md:col-span-2 p-4 rounded-xl border-2 border-black font-bold flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-900 border-red-400' : 'bg-green-50 text-green-900 border-green-400'}`}>
                {message.type === 'error' ? <AlertCircle size={16}/> : <CheckCircle size={16}/>}
                <span>{message.text}</span>
              </div>
            )}

            {/* ── 🟢 [แก้ไขสอดคล้อง] ลบเศษซากแถบโฆษณาเส้นประเหลือง 399 บาท บริเวณด้านล่างนี้ทิ้งถาวร ── */}
            <Button type="submit" disabled={updating || uploading} className="md:col-span-2 bg-black text-white py-6 text-base font-black rounded-2xl border-4 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5 transition-all">
              {updating ? <><Loader2 className="animate-spin" /> กำลังบันทึกข้อมูล...</> : <><Save size={16}/> บันทึกการแก้ไขข้อมูลส่วนตัว</>}
            </Button>
          </form>
        )}

        {/* ══ แท็บที่ 2: ประกาศตามหาปัจจุบัน ═══════════════════════ */}
        {activeTab === 'active' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {myPets.filter(p => !p.is_resolved).map(pet => (
              <div key={pet.id} className="border-4 border-black p-4 rounded-2xl bg-white shadow-paper-sm flex flex-col justify-between">
                <div>
                  <img src={pet.image_url} className="w-full aspect-video object-cover border-2 border-black rounded-xl mb-3 bg-gray-50" />
                  <h4 className="font-black text-lg text-ori-ink">{pet.name}</h4>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">{pet.species} · Status: <span className="text-red-600 font-black">{pet.status}</span></p>
                </div>
                <div className="mt-4 pt-2 border-t border-dashed border-gray-200">
                  <ResolveButton petId={pet.id} status={pet.status} onResolved={() => { fetchAllData(); setShowDonation(true) }} />
                </div>
              </div>
            ))}
            {myPets.filter(p => !p.is_resolved).length === 0 && (
              <div className="md:col-span-3 text-center py-12 text-gray-400 font-bold">ยังไม่มีเคสตามหาเปิดอยู่</div>
            )}
          </div>
        )}

        {/* ══ แท็บที่ 3: เคสที่ช่วยสำเร็จแล้ว ═══════════════════════ */}
        {activeTab === 'resolved' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {myPets.filter(p => p.is_resolved).map(pet => (
              <div key={pet.id} className="relative border-4 border-black p-4 rounded-2xl bg-white shadow-paper-sm opacity-90 grayscale-[0.3]">
                <div className="absolute top-6 right-6 z-10 bg-green-600 text-white text-xs font-black px-2.5 py-1 rounded-md border border-black shadow-paper-sm">🎉 สำเร็จแล้ว</div>
                <img src={pet.image_url} className="w-full aspect-video object-cover border-2 border-black rounded-xl mb-3 bg-gray-50" />
                <h4 className="font-black text-lg">{pet.name}</h4>
                <p className="text-xs font-bold text-gray-500 mt-0.5">{pet.species} · พบเมื่อ {pet.resolved_at ? new Date(pet.resolved_at).toLocaleDateString('th-TH') : 'เร็วๆ นี้'}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── 🟢 [ฟีเจอร์ย้ายมาจาก LINE OA] แท็บที่ 4: สมุดทะเบียนจัดการโปรไฟล์น้องและรูปตำหนิพิเศษ 3 มุม ── */}
        {activeTab === 'pets' && (
          <div className="space-y-6 text-left animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
              <div>
                <h3 className="text-xl font-black">🐾 ทะเบียนสมุดสุขภาพสัตว์เลี้ยงและรูปตำหนิเด่น</h3>
                <p className="text-xs font-bold text-gray-500 mt-0.5">เพิ่มประวัติน้อง และแนบภาพตำหนิพิเศษ 3 มุม ควบคู่คำอธิบายเพื่อใช้เชื่อมสัญญาน Web Push ฟรี</p>
              </div>
              <Button onClick={() => setPetFormOpen(!petFormOpen)} className="bg-black text-white font-black border-2 border-black shadow-paper-sm rounded-xl py-5 hover:bg-gray-800">
                {petFormOpen ? '✖️ ปิดฟอร์ม' : '➕ ลงทะเบียนประวัติน้องใหม่'}
              </Button>
            </div>

            {/* ฟอร์มสร้างน้องพรีเมียมเวอร์ชันหน้าเว็บ */}
            {petFormOpen && (
              <form onSubmit={handlePetRegistration} className="border-4 border-black p-6 rounded-3xl bg-gray-50/50 space-y-5 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-black text-sm">ชื่อของน้องสัตว์เลี้ยง <span className="text-red-500">*</span></label>
                    <input type="text" required value={petDataForm.name} onChange={e => setPetDataForm({...petDataForm, name: e.target.value})} placeholder="เช่น ชาเย็น, มะนาว" className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-black text-sm">ประเภทสายพันธุ์</label>
                    <select value={petDataForm.species} onChange={e => setPetDataForm({...petDataForm, species: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold bg-white cursor-pointer outline-none">
                      <option value="แมว">🐈 แมว</option>
                      <option value="สุนัข">🐕 สุนัข</option>
                      <option value="นกสวยงาม">🦜 นกสวยงาม</option>
                      <option value="อื่นๆ">🐾 อื่นๆ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-black text-sm">จังหวัดประจำตัวน้อง</label>
                    {/* ── 🟢 ช่องเลือกจังหวัดสัตว์เลี้ยง บังคับใช้ Dropdown List ยึดตัวแปรสากลสอดคล้องกัน ── */}
                    <select value={petDataForm.province} onChange={e => setPetDataForm({...petDataForm, province: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold bg-white cursor-pointer outline-none">
                      {thailandProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-black text-sm">อำเภอ</label>
                    <input type="text" value={petDataForm.district} onChange={e => setPetDataForm({...petDataForm, district: e.target.value})} placeholder="เช่น ด่านขุนทด" className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-black text-sm">ตำบล</label>
                    <input type="text" value={petDataForm.sub_district} onChange={e => setPetDataForm({...petDataForm, sub_district: e.target.value})} placeholder="เช่น หินดาด" className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none bg-white" />
                  </div>
                </div>

                {/* ส่วนอัปโหลดรูปภาพปกติหลักสูงสุด 5 รูป */}
                <div className="space-y-2 border-2 border-black p-4 rounded-xl bg-white shadow-paper-sm">
                  <label className="font-black text-sm flex items-center gap-1">🖼️ รูปถ่ายสภาพปกติของน้อง (สูงสุด 5 รูป) <span className="text-red-500">*</span></label>
                  <input type="file" multiple accept="image/*" ref={petFileInputRef} onChange={ev => {
                    if (!ev.target.files) return
                    const files = Array.from(ev.target.files)
                    if (petImages.length + files.length > 5) return alert('แนบรูปหลักได้สูงสุด 5 รูป')
                    setPetImages(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f) }))])
                  }} className="hidden" />
                  <Button type="button" onClick={() => petFileInputRef.current?.click()} variant="outline" className="border-2 border-dashed border-gray-400 py-6 w-full font-black hover:bg-gray-50"><Upload size={16}/> กดอัปโหลดรูปภาพปกติ</Button>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {petImages.map((img, i) => <img key={i} src={img.preview} className="w-14 h-14 object-cover border-2 border-black rounded-xl shadow-paper-sm" />)}
                  </div>
                </div>

                {/* ── 🟢 ฟีเจอร์เด่น: แนบรูปภาพตำหนิ/จุดสังเกตเด่น 3 รูป พร้อมช่องกรอกคำอธิบายประจำภาพ ── */}
                <div className="space-y-3 border-2 border-black p-4 rounded-xl bg-amber-50/20 shadow-paper-sm">
                  <label className="font-black text-sm flex items-center gap-1 text-amber-900">⚡ อัปโหลดรูปภาพลักษณะตำหนิพิเศษ / จุดสังเกตเด่น (สูงสุด 3 รูป)</label>
                  <input type="file" multiple accept="image/*" ref={featureFileInputRef} onChange={ev => {
                    if (!ev.target.files) return
                    const files = Array.from(ev.target.files)
                    if (featureImages.length + files.length > 3) return alert('อัปโหลดรูปตำหนิพิเศษได้สูงสุด 3 รูป')
                    setFeatureImages(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f), description: '' }))])
                  }} className="hidden" />
                  <Button type="button" onClick={() => featureFileInputRef.current?.click()} className="bg-amber-100 text-amber-900 border-2 border-amber-300 w-full font-black hover:bg-amber-200"><Plus size={14}/> ➕ เพิ่มรูปจุดสังเกตพิเศษเด่นประจำตัว</Button>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    {featureImages.map((feat, idx) => (
                      <div key={idx} className="border-2 border-black p-3 rounded-2xl bg-white space-y-2 shadow-paper-sm">
                        <img src={feat.preview} className="w-full h-24 object-cover border-2 border-black rounded-xl bg-gray-50" />
                        <input 
                          type="text" required
                          placeholder="กรอกตำหนิรูปนี้ เช่น มีปานสีน้ำตาลที่พุง" 
                          value={feat.description}
                          onChange={e => {
                            const updated = [...featureImages]
                            updated[idx].description = e.target.value
                            setFeatureImages(updated)
                          }}
                          className="w-full border-2 border-black p-1.5 rounded-lg text-xs font-bold outline-none" 
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-black text-sm">รายละเอียดจุดสังเกตเพิ่มเติม / พฤติกรรมน้อง</label>
                  <textarea rows={2} value={petDataForm.details} onChange={e => setPetDataForm({...petDataForm, details: e.target.value})} placeholder="เช่น มีนิสัยขี้กลัวเสียงฟ้าร้อง หรือตื่นตระหนกง่าย" className="w-full border-2 border-black p-2.5 rounded-xl font-bold resize-none bg-white outline-none" />
                </div>

                <Button type="submit" disabled={petSaving} className="w-full bg-black text-white font-black py-4 rounded-xl border-2 border-black shadow-paper-sm text-base">
                  {petSaving ? <><Loader2 className="animate-spin" /> กำลังส่งข้อมูลประวัติน้องขึ้นคลาวด์...</> : "💾 ยืนยันบันทึกทะเบียนประวัติน้องสัตว์เลี้ยง"}
                </Button>
              </form>
            )}

            {/* การ์ดรายชื่อสัตว์เลี้ยงผูกบัญชีในหน้าตั้งค่าโปรไฟล์ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myPets.map(pet => (
                <div key={pet.id} className="border-4 border-black p-4 rounded-2xl bg-white shadow-paper-sm flex gap-3 text-left hover:-translate-y-0.5 transition-transform duration-200">
                  <img src={pet.image_url || '/favicon.ico'} className="w-20 h-20 object-cover border-2 border-black rounded-xl bg-gray-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-lg leading-tight truncate text-ori-ink">{pet.name}</h4>
                    <p className="text-xs font-bold text-gray-500 mt-0.5">{pet.species} · {pet.province || 'นครราชสีมา'}</p>
                    <div className="flex gap-1.5 mt-3">
                      <Link href={`/pets/${pet.id}`} className="text-[10px] font-black border-2 border-black bg-gray-100 px-2 py-1 rounded-md hover:bg-gray-200">🏥 สมุดสุขภาพ</Link>
                      <Link href={`/pets/${pet.id}/edit`} className="text-[10px] font-black border-2 border-black bg-white px-2 py-1 rounded-md hover:bg-gray-100">✏️ แก้ไข</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DonationModal open={showDonation} onClose={() => setShowDonation(false)} />
    </div>
  )
}