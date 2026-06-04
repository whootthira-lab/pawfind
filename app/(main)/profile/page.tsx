'use client'
// app/(main)/profile/page.tsx (V7 - อัปเกรดระบบสิทธิ์ความเป็นส่วนตัวโปรไฟล์, ออโต้แมปตารางรูปภาพลูก และซ่อมแซมภาพ Fallback สมบูรณ์ 100%)

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { MatchResultCard } from '@/components/pet/MatchResult'
import { ResolveButton } from '@/components/pet/ResolveButton'
import {
  User, CheckCircle, Loader2, Plus, PlusCircle, MessageSquare,
  Save, Camera, MapPin, Phone, UserCircle, Settings, Briefcase,
  Heart, AlertCircle, ChevronRight, PawPrint, Upload, X, CalendarDays
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DonationModal } from '@/components/DonationModal'

// ── Constants ตัวเลือกต่าง ๆ สอดคล้องทั้งระบบ ──────────────────[cite: 21]
const expertiseOptions = [
  { value: 'general', label: 'ผู้ใช้งานทั่วไป (พร้อมช่วยเป็นหูเป็นตา)' },
  { value: 'adopt',       label: '🐶 หาบ้านใหม่ / รับเลี้ยง' },
  { value: 'rescue',      label: '🆘 ค้นหาสัตว์หาย/แจ้งพบสัตว์หลงหรือจร' },
  { value: 'mating',      label: '❤️ หาคู่ผสมพันธุ์ให้น้องๆ' },
  { value: 'showcase',    label: '📸 อวดความน่ารัก/ประกวดสัตว์เลี้ยง' },
  { value: 'knowledge',   label: '📚 ศึกษาความรู้และการเลี้ยงดู' },
  { value: 'petscout', label: '🔍 สร้างรายได้จากการช่วยตามหาสัตว์หาย(PetScout)' },
  { value: 'vet', label: '🏥 ประชาสัมพันธ์ คลินิกรักษาสัตว์' },
  { value: 'groomer', label: '🪮 บริการอาบน้ำตัดขน / โรงแรมสัตว์' },
  { value: 'petsitter', label: '🏩 บริการรับฝากหรือดูแลสัตว์ที่บ้าน' },
  { value: 'retailer', label: '🛍️ ร้านจำหน่ายอาหารและอุปกรณ์สัตว์เลี้ยง' },
  { value: 'announce', label: '📢 ประชาสัมพันธ์ข่าว/กิจกรรม' },
  { value: 'other', label: 'อื่นๆ (โปรดระบุ)' },
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

const interestOptions = [
  { value: 'dog',         label: '🐕 สุนัข' },
  { value: 'cat',         label: '🐈 แมว' },
  { value: 'bird',        label: '🦜 นกสวยงาม' },
  { value: 'fish',        label: '🐟 ปลาสวยงาม' },
  { value: 'exotic',      label: '🦎 สัตว์ Exotic' },
  { value: 'rabbit',      label: '🐰 กระต่าย / สัตว์เล็ก' },
  { value: 'adopt',       label: '🐶 หาบ้านใหม่/รับเลี้ยงสัตว์' },
  { value: 'health',      label: '🏥 สุขภาพสัตว์เลี้ยง' },
  { value: 'innovation', label: '💡 นวัตกรรม / DIY' },
  { value: 'community',   label: '🤝 ชุมชนอาสาสมัคร' },
  { value: 'memorial',    label: '🕯 ของที่ระลึกสัตว์เลี้ยง' },
  { value: 'astrology',   label: '🔮 ดูดวง / โหราศาสตร์' },
  { value: 'psychology',  label: '🧠 จิตวิทยา' },
  { value: 'selfdev',     label: '📈 พัฒนาตนเอง' },
  { value: 'sport_football',  label: '⚽ ฟุตบอล' },
  { value: 'sport_badminton', label: '🏸 แบดมินตัน / เทนนิส' },
  { value: 'sport_golf',      label: '⛳ กอล์ฟ' },
  { value: 'sport_muay',      label: '🥊 ศิลปะการต่อสู้' },
  { value: 'sport_other',     label: '🏅 กีฬาประเภทอื่นๆ' },
  { value: 'fitness',     label: '💪 ฟิตเนส / ออกกำลังกาย' },
  { value: 'fashion',     label: '👗 แฟชั่น / สไตล์' },
  { value: 'herbs',       label: '🌿 สมุนไพรธรรมชาติ' },
  { value: 'cooking',     label: '🍳 ทำอาหารเพื่อสุขภาพ' },
  { value: 'travel',      label: '✈️ ท่องเที่ยว' },
  { value: 'tech',        label: '💻 เทคโนโลยี / AI' },
  { value: 'art',         label: '🎨 ศิลปะ / งานฝีมือ' },
  { value: 'music',       label: '🎵 ดนตรี' },
  { value: 'reading',     label: '📚 อ่านหนังสือ' },
  { value: 'meditation',  label: '🧘 ทำสมาธิ / ธรรมะ' },
]

const thailandProvinces = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยะลา", "ยโสธร", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อุดรธานี", "อุทัยธานี", "อุตรดิตถ์", "อุบลราชธานี", "อำนาจเจริญ"
].sort()

function CommentBadge({ petId, comments }: { petId: string; comments: any[] }) {
  const [hasNew, setHasNew] = useState(false)
  const count = comments?.length || 0

  useEffect(() => {
    if (typeof window !== 'undefined' && count > 0) {
      const lastViewedStr = localStorage.getItem(`last_viewed_comments_${petId}`)
      const lastViewed = lastViewedStr ? parseInt(lastViewedStr) : 0
      const latestCommentTime = comments && comments.length > 0
        ? Math.max(...comments.map((c: any) => new Date(c.created_at).getTime()))
        : 0
      setHasNew(latestCommentTime > lastViewed)
    }
  }, [petId, comments, count])

  const handleClick = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`last_viewed_comments_${petId}`, Date.now().toString())
    }
    setHasNew(false)
  }

  if (count === 0) return null

  return (
    <Link 
      href={`/pet/${petId}#comments`}
      onClick={handleClick}
      className={`absolute -top-3 -left-3 z-30 min-w-[32px] h-8 px-2.5 rounded-full flex items-center justify-center border-4 border-black shadow-paper-sm font-black text-xs cursor-pointer hover:scale-105 active:scale-95 transition-all ${
        hasNew 
          ? 'bg-ori-orange text-white animate-bounce' 
          : 'bg-ori-cream text-black'
      }`}
      title={hasNew ? 'มีความคิดเห็นใหม่! กดเพื่อดูความคิดเห็น' : 'ความคิดเห็น กดเพื่อดู'}
    >
      <MessageSquare size={12} className="mr-1 shrink-0" />
      <span>{hasNew ? `+${count}` : count}</span>
    </Link>
  )
}

export default function ProfilePage() {
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [activeTab,    setActiveTab]    = useState<'posts' | 'resolved' | 'settings' | 'pets'>('posts')
  const [user,         setUser]         = useState<any>(null)
  const [myPets,       setMyPets]       = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [isSaving,     setIsSaving]     = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [saveSuccess,  setSaveSuccess]  = useState(false)
  const [showDonation, setShowDonation] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab === 'pets') {
        setActiveTab('pets')
      }
    }
  }, [])

  const [profile, setProfile] = useState({
    display_name:         '',
    first_name:           '',
    last_name:            '',
    gender:               '',
    occupation:           '',
    phone_number:         '',
    line_id:              '',
    avatar_url:           '',
    address:              '',
    province:             'นครราชสีมา',
    district:             '',
    subdistrict:          '',
    contact_link:         '',
    community_role:       'general',
    community_role_custom: '',
    interests:            [] as string[],
    is_public:            true,
  })

  // ── States สำหรับโมดูลสร้างโปรไฟล์น้องใหม่พรีเมียม ──[cite: 21]
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
    is_sterilized: false,
    birthday: '',
    province: 'นครราชสีมา',
    district: '',
    sub_district: '',
    details: '',
    reward_amount: '0'
  })

  const [speciesCustom, setSpeciesCustom] = useState('')

  // ฟังก์ชันคำนวณอายุสัตว์เลี้ยงภาษาไทยเรียลไทม์[cite: 21]
  const calculateAge = (birthdayString: string | null) => {
    if (!birthdayString) return 'ไม่ระบุอายุ'
    const birth = new Date(birthdayString)
    const today = new Date()
    let years = today.getFullYear() - birth.getFullYear()
    let months = today.getMonth() - birth.getMonth()
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--
      months += 12
    }
    if (today.getDate() < birth.getDate()) {
      months--
      if (months < 0) {
        years--
        months += 11
      }
    }
    if (years === 0 && months === 0) {
      const diffTime = Math.abs(today.getTime() - birth.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return `อายุ: ${diffDays} วัน`
    }
    const yearStr = years > 0 ? `${years} ปี ` : ''
    const monthStr = months > 0 ? `${months} เดือน` : ''
    return `อายุ: ${yearStr}${monthStr}`.trim()
  }

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }
      setUser(session.user)

      // ── Profile ──────────────────────────────────────────[cite: 21]
      const { data: pData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (pData) {
        setProfile({
          display_name:          pData.display_name          || '',
          first_name:            pData.first_name            || '',
          last_name:             pData.last_name             || '',
          gender:                pData.gender                || '',
          occupation:            pData.occupation            || '',
          phone_number:          pData.phone_number          || '',
          line_id:               pData.line_id               || '',
          avatar_url:            pData.avatar_url            || '',
          address:               pData.address               || '',
          province:              pData.province              || 'นครราชสีมา',
          district:              pData.district              || '',
          subdistrict:           pData.subdistrict           || '',
          contact_link:          pData.contact_link          || '',
          community_role:        pData.community_role        || 'general',
          community_role_custom: pData.community_role_custom || '',
          interests:             pData.interests             || [],
          is_public:             pData.is_public !== false,
        })
      }

      // ── Pets ──────────────────────────────────────────────[cite: 21]
      const { data: pets } = await supabase
        .from('pets')
        .select('*, pet_images(storage_url, is_primary), comments(id, created_at)')
        .eq('user_id', session.user.id)
        .not('status', 'eq', 'archived')
        .order('created_at', { ascending: false })

      if (pets) {
        setMyPets(pets.map((p: any) => {
          // ── 🟢 ปรับโครงสร้างดึงภาพประจำตัวแดชบอร์ดแบบพรีเมียม Fallback แก้ปัญหารูปพังไม่ยอมแสดงผล (ข้อ 9) ──
          const safeImageUrl = p.pet_images?.find((img: any) => img.is_primary)?.storage_url 
            || p.pet_images?.[0]?.storage_url 
            || (p.images && Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '')
            || p.primary_image 
            || p.image_url 
            || '/favicon.ico'

          return {
            ...p,
            unread_count: p.comments?.length || 0,
            comments:     p.comments || [],
            image_url:    safeImageUrl,
          }
        }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchAllData() }, [fetchAllData])

  // ── Avatar Upload ──[cite: 21]
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: upErr } = await supabase.storage
        .from('profile-images').upload(filePath, file, { cacheControl: '3600', upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images').getPublicUrl(filePath)
      
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
    } catch {
      alert('อัปโหลดรูปไม่สำเร็จ')
    } finally {
      setUploading(false)
    }
  }

  // ── Save Profile ──[cite: 21]
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    try {
      // ── 🟢 อัปเดตผูกมิติบันทึกค่าลงตัวแปรสิทธิ์ความปลอดภัยใหม่ visibility สอดคล้องเงื่อนไข (ข้อ 6) ──
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name.trim(),
          first_name: profile.first_name.trim(),
          last_name: profile.last_name.trim(),
          phone_number: profile.phone_number.trim(),
          province: profile.province,
          district: profile.district.trim(),
          subdistrict: profile.subdistrict.trim(),
          address: profile.address.trim(),
          line_id: profile.line_id.trim(),
          avatar_url: profile.avatar_url,
          occupation: profile.occupation,
          community_role: profile.community_role,
          community_role_custom: profile.community_role === 'other' ? profile.community_role_custom.trim() : null,
          interests: profile.interests.length ? profile.interests : null,
          is_public: profile.is_public,
          visibility: profile.is_public ? 'public' : 'private', // 🟢 เชื่อมระบบส่งสิทธิ์ความปลอดภัยสากลลงดาต้าเบส
        })
        .eq('id', user.id)

      if (error) throw error
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      alert('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setIsSaving(false)
    }
  }

  // ── 🆕 ฟังก์ชันอัปโหลดคลังรูปภาพและบันทึกรูปตำหนิ 3 ชิ้นลงฟิลด์ distinctive_features ──[cite: 21]
  const handlePetRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (petSaving || !user) return
    if (petImages.length === 0) return alert('กรุณาแนบรูปถ่ายหลักของน้องอย่างน้อย 1 รูปค่ะ')
    setPetSaving(true)

    try {
      const uploadedUrls: string[] = []
      for (const img of petImages) {
        const fileExt = img.file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        await supabase.storage.from('pet-images').upload(fileName, img.file)
        const { data: { publicUrl } } = supabase.storage.from('pet-images').getPublicUrl(fileName)
        uploadedUrls.push(publicUrl)
      }

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

      // ── 🟢 สั่งบันทึกลงตารางหลักพร้อมรับก้อนข้อมูล ID กลับมาจัดการออโต้แมปตารางลูก (ข้อ 1, 5, 9) ──
      const { data: insertedPet, error: insertErr } = await supabase
        .from('pets')
        .insert({
          user_id: user.id,
          name: petDataForm.name || 'ไม่ทราบชื่อ',
          species: petDataForm.species === 'อื่นๆ' ? ((speciesCustom || '').trim() || 'อื่นๆ') : petDataForm.species,
          breed: (petDataForm.breed || '').trim() || null,
          gender: petDataForm.gender,
          is_sterilized: petDataForm.is_sterilized,
          birthday: petDataForm.birthday || null,
          birthdate: petDataForm.birthday || null,
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
          visibility: 'public',
          mode_showcase: true,
          mode_lost: false,
          mode_mating: false,
          mode_adoption: false
        })
        .select()
        .single()

      if (insertErr) throw insertErr

      // ── 🟢 แตกแถวข้อมูลลิงก์ส่งไปบันทึกลงฐานตารางย่อย pet_images อัตโนมัติ ป้องกันรูปภาพหายไร้บั๊ก 100% ──
      if (insertedPet && uploadedUrls.length > 0) {
        const imageRows = uploadedUrls.map((url, index) => ({
          pet_id: insertedPet.id,
          storage_url: url,
          is_primary: index === 0
        }))
        await supabase.from('pet_images').insert(imageRows)
      }

      // ── 🟢 2. ข้อย่อยที่ 2: นับจำนวน "ลงทะเบียนน้องใหม่ + สร้างประกาศบอร์ด" (สะสมรวมกัน) ──
      let shouldShowDonation = false
      try {
        const { data: curProfile } = await supabase
          .from('profiles')
          .select('pet_creation_count')
          .eq('id', user.id)
          .maybeSingle()
        
        const newCount = (curProfile?.pet_creation_count || 0) + 1
        await supabase
          .from('profiles')
          .update({ pet_creation_count: newCount })
          .eq('id', user.id)
        
        if (newCount % 3 === 0) {
          shouldShowDonation = true
        }
      } catch (countErr) {
        console.error('Error updating pet_creation_count client-side:', countErr)
      }

      alert('🎉 ลงทะเบียนบันทึกโปรไฟล์น้องสำเร็จเสร็จสิ้นเรียบร้อย!')
      setPetFormOpen(false)
      setPetImages([])
      setFeatureImages([])
      await fetchAllData()
      if (shouldShowDonation) {
        setShowDonation(true)
      }
    } catch (err: any) {
      alert(`ลงทะเบียนโปรไฟล์น้องล้มเหลว: ${err.message}`)
    } finally {
      setPetSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-gray-50">
      <Loader2 className="animate-spin text-black" size={60} />
      <p className="font-black text-gray-500">กำลังเรียกข้อมูลบัญชี...</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8 mb-20 text-black" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>

      {/* ── Profile Header ── */}
      <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-paper
        flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="w-24 h-24 rounded-2xl border-4 border-black overflow-hidden
          bg-gray-100 shadow-paper-sm shrink-0 relative group">
          {profile.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="Profile Thumbnail" 
              className="w-full h-full object-cover"
              onError={(e) => {
                if (profile.avatar_url && !profile.avatar_url.includes('/avatars/')) {
                  const parts = profile.avatar_url.split('/profile-images/');
                  if (parts.length === 2) {
                    (e.target as HTMLImageElement).src = `${parts[0]}/profile-images/avatars/${parts[1]}`;
                  }
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-wagashi-matcha/20 text-black">
              <User size={36} />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="animate-spin text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-black mb-1">
            {profile.display_name || 'คุณผู้ใช้งาน'}
          </h1>
          <p className="font-bold text-gray-500 mb-3">{user?.email}</p>

          <div className="inline-block bg-green-100 border-2 border-green-400
            text-green-800 px-3 py-1 rounded-full text-sm font-black mb-3">
            🛡️ เครือข่ายตามหาสัตว์เลี้ยงฟรีคอมมูนิตี้
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link href="/report"
            className="ori-btn ori-btn-green flex items-center justify-center gap-2
              shadow-paper-sm hover:-translate-y-1 font-black text-sm">
            <PlusCircle size={18} /> ลงประกาศใหม่
          </Link>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-4 border-b-4 border-black pb-2">
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-2 px-4 font-black text-lg transition-all ${
            activeTab === 'posts' ? 'text-black border-b-4 border-black -mb-[12px]' : 'text-gray-400'
          }`}>
          📦 ประกาศของฉัน ({myPets.filter(p => !p.is_resolved).length})
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`pb-2 px-4 font-black text-lg transition-all ${
            activeTab === 'resolved' ? 'text-green-600 border-b-4 border-green-600 -mb-[12px]' : 'text-gray-400'
          }`}>
          ✅ สำเร็จแล้ว ({myPets.filter(p => p.is_resolved).length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-2 px-4 font-black text-lg transition-all ${
            activeTab === 'settings' ? 'text-blue-600 border-b-4 border-blue-600 -mb-[12px]' : 'text-gray-400'
          }`}>
          ⚙️ ตั้งค่าโปรไฟล์
        </button>
        <button
          onClick={() => setActiveTab('pets')}
          className={`pb-2 px-4 font-black text-lg transition-all ${
            activeTab === 'pets' ? 'text-amber-600 border-b-4 border-amber-600 -mb-[12px]' : 'text-gray-400'
          }`}>
          🐾 จัดการโปรไฟล์น้อง ({myPets.length})
        </button>
      </div>

      <div className="mt-4">
        {/* ══ แท็บแก้ไขข้อมูลส่วนตัว ═════════════════════════════ */}
        {activeTab === 'settings' && (
          <motion.form
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleUpdateProfile}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border-4 border-black p-6 md:p-10 rounded-3xl shadow-paper"
          >
            <h2 className="md:col-span-2 text-2xl font-black border-b-2 border-black pb-4 flex items-center gap-2">
              <Settings className="text-blue-600" /> แก้ไขข้อมูลส่วนตัว
            </h2>

            <div className="md:col-span-2 flex items-center gap-6 bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-300">
              <div className="w-20 h-20 rounded-xl border-2 border-black overflow-hidden bg-white shrink-0 shadow-paper-sm">
                <img 
                  src={profile.avatar_url || '/placeholder-user.png'} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    if (profile.avatar_url && !profile.avatar_url.includes('/avatars/')) {
                      const parts = profile.avatar_url.split('/profile-images/');
                      if (parts.length === 2) {
                        (e.target as HTMLImageElement).src = `${parts[0]}/profile-images/avatars/${parts[1]}`;
                      }
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-2 text-left">
                <label className="cursor-pointer bg-white border-2 border-black px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all flex items-center gap-2">
                  <Camera size={16} /> เปลี่ยนรูปโปรไฟล์
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </label>
                <p className="text-[10px] text-gray-500 font-bold">แนะนำรูปขนาดสี่เหลี่ยมจัตุรัส</p>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="font-black text-sm flex items-center gap-1"><UserCircle size={14} /> ชื่อโปรไฟล์ (Display Name)</label>
              <input value={profile.display_name} required onChange={e => setProfile({ ...profile, display_name: e.target.value })} className="ori-input" />
            </div>
            <div className="space-y-2 text-left">
              <label className="font-black text-sm flex items-center gap-1"><Phone size={14} /> เบอร์โทรศัพท์</label>
              <input type="tel" required value={profile.phone_number} onChange={e => setProfile({ ...profile, phone_number: e.target.value })} className="ori-input" />
            </div>
            <div className="space-y-2 text-left">
              <label className="font-black text-sm">ชื่อจริง</label>
              <input value={profile.first_name} required onChange={e => setProfile({ ...profile, first_name: e.target.value })} className="ori-input" />
            </div>
            <div className="space-y-2 text-left">
              <label className="font-black text-sm">นามสกุล</label>
              <input value={profile.last_name} required onChange={e => setProfile({ ...profile, last_name: e.target.value })} className="ori-input" />
            </div>

            <div className="space-y-2 text-left">
              <label className="font-black text-sm">เพศ</label>
              <select value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value })} className="ori-input bg-white cursor-pointer">
                <option value="">ไม่ระบุ</option>
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>
            
            <div className="space-y-2 text-left">
              <label className="font-black text-sm flex items-center gap-1">🔒 สิทธิ์ความเป็นส่วนตัวโปรไฟล์</label>
              <select 
                value={profile.is_public ? "public" : "private"} 
                onChange={e => setProfile({ ...profile, is_public: e.target.value === "public" })} 
                className="ori-input bg-white cursor-pointer font-bold"
              >
                <option value="public">🌍 สาธารณะ (ค้นเจอที่อยู่และสัตว์ได้)</option>
                <option value="private">🔒 เฉพาะฉัน (จำกัดเฉพาะชื่อ, รูป และจังหวัด)</option>
              </select>
            </div>
            <div className="space-y-2 text-left">
              <label className="font-black text-sm flex items-center gap-1"><Briefcase size={14} /> อาชีพ</label>
              <select value={profile.occupation} onChange={e => setProfile({ ...profile, occupation: e.target.value })} className="ori-input bg-white cursor-pointer">
                {occupationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            {/* Location */}
            <div className="md:col-span-2 space-y-2 pt-2 text-left">
              <label className="font-black text-sm flex items-center gap-1"><MapPin size={14} /> ที่อยู่ (จังหวัด/อำเภอ/ตำบล)</label>
              <div className="grid grid-cols-3 gap-2">
                <select value={profile.province} onChange={e => setProfile({ ...profile, province: e.target.value })} className="ori-input text-sm bg-white cursor-pointer outline-none">
                  {thailandProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input placeholder="อำเภอ" value={profile.district} onChange={e => setProfile({ ...profile, district: e.target.value })} className="ori-input text-sm" />
                <input placeholder="ตำบล" value={profile.subdistrict} onChange={e => setProfile({ ...profile, subdistrict: e.target.value })} className="ori-input text-sm" />
              </div>
            </div>

            {/* Interests */}
            <div className="md:col-span-2 space-y-3 pt-4 border-t-2 border-gray-100 text-left">
              <label className="font-black text-sm flex items-center gap-1"><Heart size={14} /> ความสนใจเกี่ยวกับสัตว์เลี้ยง (เลือกได้หลายข้อ)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {interestOptions.map(opt => {
                  const isSelected = profile.interests.includes(opt.value)
                  return (
                    <button
                      key={opt.value} type="button"
                      onClick={() => {
                        const next = isSelected ? profile.interests.filter(i => i !== opt.value) : [...profile.interests, opt.value]
                        setProfile({ ...profile, interests: next })
                      }}
                      className={`px-3 py-2 rounded-xl border-2 font-bold text-sm text-left transition-all flex items-center justify-between gap-1 ${
                        isSelected ? 'border-black bg-wagashi-kinako shadow-paper-sm' : 'border-black/25 bg-white hover:border-black'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <span className="text-green-600 font-black">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Community role */}
            <div className="md:col-span-2 space-y-2 pt-4 border-t-2 border-gray-100 text-left">
              <label className="font-black text-ori-ink">คุณต้องการช่วยเหลือหรือให้บริการด้านไหน? 🐾</label>
              <select value={profile.community_role} onChange={e => setProfile({ ...profile, community_role: e.target.value })} className="w-full border-4 border-black p-3 rounded-xl shadow-paper-sm font-bold bg-wagashi-kinako/10 cursor-pointer">
                {expertiseOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              {profile.community_role === 'other' && (
                <input placeholder="ระบุความเชี่ยวชาญ..." value={profile.community_role_custom} onChange={e => setProfile({ ...profile, community_role_custom: e.target.value })} className="ori-input mt-2" />
              )}
            </div>

            <div className="md:col-span-2 flex flex-col items-center gap-3 mt-6">
              <Button type="submit" disabled={isSaving} className="w-full md:w-64 bg-black text-white py-6 rounded-2xl font-black text-lg shadow-paper-sm hover:shadow-paper transition-all">
                {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} className="mr-2" /> บันทึกการแก้ไข</>}
              </Button>
              {saveSuccess && <span className="text-green-600 font-black animate-bounce">บันทึกข้อมูลเรียบร้อยแล้ว! ✅</span>}
            </div>
          </motion.form>
        )}

        {/* ══ แท็บประกาศปัจจุบัน ═════════════════════════════════ */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {myPets.filter(p => !p.is_resolved).map(pet => (
              <div key={pet.id} className="flex flex-col gap-4 relative">
                <CommentBadge petId={pet.id} comments={pet.comments} />
                <MatchResultCard result={pet} />
                <ResolveButton petId={pet.id} status={pet.status} onResolved={() => { fetchAllData(); setShowDonation(true) }} />
              </div>
            ))}
            {myPets.filter(p => !p.is_resolved).length === 0 && (
              <div className="md:col-span-3 text-center py-16 text-ori-ink-l font-bold">
                ยังไม่มีประกาศเปิดอยู่ชั่วคราวค่ะ <Link href="/report" className="text-ori-orange underline">ลงประกาศแรกเลย</Link>
              </div>
            )}
          </div>
        )}

        {/* ══ แท็บเคสที่ช่วยสำเร็จแล้ว ══════════════════════════════ */}
        {activeTab === 'resolved' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {myPets.filter(p => p.is_resolved).map(pet => (
              <div key={pet.id} className="relative opacity-90 grayscale-[0.3]">
                <MatchResultCard result={pet} />
              </div>
            ))}
            {myPets.filter(p => p.is_resolved).length === 0 && (
              <div className="md:col-span-3 text-center py-16 text-gray-400 font-bold">ยังไม่มีข้อมูลประวัติเคสสำเร็จค่ะ</div>
            )}
          </div>
        )}

        {/* ══ แท็บจัดการโปรไฟล์น้องและรูปตำหนิพิเศษ 3 มุม ═══════════════ */}
        {activeTab === 'pets' && (
          <div className="space-y-6 text-left animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
              <div>
                <h3 className="text-2xl font-black">🐾 สมุดทะเบียนรายชื่อและประวัติสุขภาพสัตว์เลี้ยง</h3>
                <p className="text-xs font-bold text-gray-500 mt-0.5">เพิ่มประวัติน้อง และแนบภาพตำหนิพิเศษ 3 มุม ควบคู่คำอธิบายเพื่อใช้เชื่อมสัญญาน Web Push ฟรี</p>
              </div>
              <Button onClick={() => setPetFormOpen(!petFormOpen)} className="bg-black text-white font-black border-2 border-black shadow-paper-sm rounded-xl py-5 hover:bg-gray-800">
                {petFormOpen ? '✖️ ปิดกล่องฟอร์ม' : '➕ ลงทะเบียนประวัติน้องใหม่'}
              </Button>
            </div>

            {petFormOpen && (
              <form onSubmit={handlePetRegistration} className="border-4 border-black p-6 rounded-3xl bg-gray-50/50 space-y-5 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-black text-sm">ชื่อของน้องสัตว์เลี้ยง <span className="text-red-500">*</span></label>
                    <input type="text" required value={petDataForm.name} onChange={e => setPetDataForm({...petDataForm, name: e.target.value})} placeholder="เช่น ชาเย็น, นมสด" className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-black text-sm">ประเภทสัตว์</label>
                    <select value={petDataForm.species} onChange={e => setPetDataForm({...petDataForm, species: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold bg-white cursor-pointer outline-none">
                      <option value="แมว">🐈 แมว</option>
                      <option value="สุนัข">🐕 สุนัข</option>
                      <option value="นกสวยงาม">🦜 นกสวยงาม</option>
                      <option value="อื่นๆ">🐾 อื่นๆ</option>
                    </select>
                  </div>
                </div>

                {/* ── ฟิลด์สายพันธุ์ และช่องกรอกระบุเพิ่มเติมกรณีเลือกสัตว์ประเภทอื่นๆ ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-black text-sm">สายพันธุ์ (Breed)</label>
                    <input type="text" value={petDataForm.breed} onChange={e => setPetDataForm({...petDataForm, breed: e.target.value})} placeholder="เช่น วิเชียรมาศ, ไซบีเรียนฮัสกี้ (ระบุหรือไม่ก็ได้)" className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none bg-white" />
                  </div>
                  {petDataForm.species === 'อื่นๆ' ? (
                    <div className="space-y-1">
                      <label className="font-black text-sm">ระบุประเภทสัตว์เพิ่มเติม <span className="text-red-500">*</span></label>
                      <input type="text" required value={speciesCustom} onChange={e => setSpeciesCustom(e.target.value)} placeholder="เช่น เต่า, กิ้งก่า, แฮมสเตอร์" className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none bg-white" />
                    </div>
                  ) : <div />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-black text-sm">เพศของน้อง 🐾</label>
                    <select value={petDataForm.gender} onChange={e => setPetDataForm({...petDataForm, gender: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold bg-white cursor-pointer outline-none">
                      <option value="unknown">❓ ไม่ทราบ / ไม่ระบุ</option>
                      <option value="male">♂ เพศผู้ (Male)</option>
                      <option value="female">♀ เพศเมีย (Female)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-black text-sm">การทำหมัน 🩺</label>
                    <select value={petDataForm.is_sterilized ? "true" : "false"} onChange={e => setPetDataForm({...petDataForm, is_sterilized: e.target.value === "true"})} className="w-full border-2 border-black p-3 rounded-xl font-bold bg-white cursor-pointer outline-none">
                      <option value="false">❌ ยังไม่ได้ทำหมัน</option>
                      <option value="true">✨ ทำหมันเรียบร้อยแล้ว</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-black text-sm">วันเกิดของน้อง (เพื่อคำนวณอายุ) 🎂</label>
                    <input type="date" value={petDataForm.birthday} onChange={e => setPetDataForm({...petDataForm, birthday: e.target.value})} className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none bg-white cursor-pointer" />
                    {petDataForm.birthday && (
                      <p className="text-xs font-black text-ori-orange mt-1">🎂 {calculateAge(petDataForm.birthday)}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-black text-sm">จังหวัดประจำตัวน้อง</label>
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

                <div className="space-y-2 border-2 border-black p-4 rounded-xl bg-white shadow-paper-sm">
                  <label className="font-black text-sm flex items-center gap-1">🖼️ รูปถ่ายสภาพปกติของน้อง (สูงสุด 5 รูป) <span className="text-red-500">*</span></label>
                  <input type="file" multiple accept="image/*" ref={petFileInputRef} onChange={ev => {
                    if (!ev.target.files) return
                    const files = Array.from(ev.target.files)
                    if (petImages.length + files.length > 5) return alert('แนบรูปหลักได้สูงสุด 5 รูปค่ะ')
                    setPetImages(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f) }))])
                  }} className="hidden" />
                  <Button type="button" onClick={() => petFileInputRef.current?.click()} variant="outline" className="border-2 border-dashed border-gray-400 py-6 w-full font-black hover:bg-gray-50"><Upload size={16}/> กดอัปโหลดรูปภาพปกติ</Button>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {petImages.map((img, i) => <img key={i} src={img.preview} className="w-14 h-14 object-cover border-2 border-black rounded-xl shadow-paper-sm" />)}
                  </div>
                </div>

                <div className="space-y-3 border-2 border-black p-4 rounded-xl bg-amber-50/20 shadow-paper-sm">
                  <label className="font-black text-sm flex items-center gap-1 text-amber-900">⚡ อัปโหลดรูปภาพลักษณะตำหนิพิเศษ / จุดสังเกตเด่น (สูงสุด 3 รูป)</label>
                  <input type="file" multiple accept="image/*" ref={featureFileInputRef} onChange={ev => {
                    if (!ev.target.files) return
                    const files = Array.from(ev.target.files)
                    if (featureImages.length + files.length > 3) return alert('อัปโหลดรูปตำหนิพิเศษได้สูงสุด 3 รูปค่ะ')
                    setFeatureImages(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f), description: '' }))])
                  }} className="hidden" />
                  <Button type="button" onClick={() => featureFileInputRef.current?.click()} className="bg-amber-100 text-amber-900 border-2 border-amber-300 w-full font-black hover:bg-amber-200"><Plus size={14}/> ➕ เพิ่มรูปจุดสังเกตพิเศษเด่นประจำตัว</Button>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    {featureImages.map((feat, idx) => (
                      <div key={idx} className="border-2 border-black p-3 rounded-2xl bg-white space-y-2 shadow-paper-sm">
                        <img src={feat.preview} className="w-full h-24 object-cover border-2 border-black rounded-xl bg-gray-100" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myPets.map(pet => (
                <div key={pet.id} className="border-4 border-black p-4 rounded-2xl bg-white shadow-paper-sm flex gap-3 text-left hover:-translate-y-0.5 transition-transform duration-200 relative">
                  <CommentBadge petId={pet.id} comments={pet.comments} />
                  <img src={pet.image_url || '/favicon.ico'} className="w-20 h-20 object-cover border-2 border-black rounded-xl bg-gray-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-lg leading-tight truncate text-ori-ink">{pet.name}</h4>
                    <p className="text-xs font-bold text-gray-500 mt-0.5">{pet.species} · {pet.province || 'นครราชสีมา'}</p>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      <Link href={`/pet/${pet.id}`} className="text-[10px] font-black border-2 border-black bg-ori-orange text-white px-2 py-1 rounded-md hover:bg-ori-orange-d shadow-paper-sm transition-transform active:scale-95">ดูโปรไฟล์ →</Link>
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

      <DonationModal isOpen={showDonation} onClose={() => setShowDonation(false)} />
    </div>
  )
}