'use client'
// app/(main)/account/subscription/page.tsx

import { useState, useEffect, useMemo, Suspense } from 'react'
import { createBrowserClient }                    from '@supabase/ssr'
import { useRouter, useSearchParams }             from 'next/navigation'
import Link                                       from 'next/link'
import Image                                      from 'next/image'
import { Button }                                 from '@/components/ui/button'
import {
  Crown, PawPrint, Plus, AlertCircle,
  CheckCircle2, ChevronRight, Receipt,
  Bell, Shield, Loader2, User, Phone, MapPin, 
  Briefcase, Heart, Camera, Sparkles, Settings,
  Home, MessageSquare, Cake, UserPlus
} from 'lucide-react'

interface SubInfo {
  plan:            string
  expires_at:      string | null
  grace_until:     string | null
  is_active:       boolean
  pet_slots_addon: number
  pet_limit:       number
  days_left:       number
  in_grace:        boolean
  is_expired:      boolean
}

interface PaymentRecord {
  id:            string
  amount:        number
  status:        string
  slip_type:     string
  created_at:    string
}

// ── 🟢 ปรับเปลี่ยนตัวเลือกให้ตรงกับหน้า Login เพื่อความสอดคล้องตามสั่ง ──

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

const interestOptions = [
  { value: 'dog',         label: '🐕 สุนัข' },
  { value: 'cat',         label: '🐈 แมว' },
  { value: 'bird',        label: '🦜 นกสวยงาม' },
  { value: 'fish',        label: '🐟 ปลาสวยงาม' },
  { value: 'exotic',      label: '🦎 สัตว์ Exotic' },
  { value: 'rabbit',      label: '🐰 กระต่าย / สัตว์เล็ก' },
  { value: 'adopt',       label: '🐶 หาบ้านใหม่/รับเลี้ยงสัตว์' },
  { value: 'rescue',      label: '🆘 ช่วยเหลือสัตว์เจ็บป่วย/สัตว์จร' },
  { value: 'mating',      label: '❤️ หาคู่ผสมพันธุ์ให้น้องๆ' },
  { value: 'showcase',    label: '📸 อวดความน่ารัก/ประกวดสัตว์เลี้ยง' },
  { value: 'knowledge',   label: '📚 ศึกษาความรู้และการเลี้ยงดู' },
  { value: 'health',      label: '🏥 สุขภาพสัตว์เลี้ยง' },
  { value: 'prosthetics', label: '🦿 นวัตกรรมขาเทียม / DIY' },
  { value: 'community',   label: '🤝 ชุมชนอาสาสมัคร' },
  { value: 'memorial',    label: '🕯 ของที่ระลึกสัตว์เลี้ยง' },
  { value: 'astrology',   label: '🔮 ดูดวง / โหราศาสตร์' },
  { value: 'psychology',  label: '🧠 จิตวิทยา' },
  { value: 'selfdev',     label: '📈 พัฒนาตนเอง' },
  { value: 'sport_football',  label: '⚽ ฟุตบอล' },
  { value: 'sport_badminton', label: '🏸 แบดมินตัน / เทนนิส' },
  { value: 'sport_golf',      label: '⛳ กольф' },
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

const expertiseTagOptions = [
  { value: 'rescue_expert',     label: '🆘 ยานพาหนะช่วยชีวิตสัตว์/จับสัตว์' },
  { value: 'medical_care',      label: '💊 ปฐมพยาบาล/ให้ยาสัตว์เบื้องต้น' },
  { value: 'foster_home',       label: '🏡 มีพื้นที่กักตัว/พักฟื้นสัตว์ชั่วคราว' },
  { value: 'pet_photography',   label: '📸 ถ่ายภาพสัตว์เลี้ยงโปรโมทหาบ้าน' },
  { value: 'craftsman_diy',     label: '🛠️ ช่างฝีมือ/ออกแบบวีลแชร์สัตว์พิการ' },
  { value: 'donation_co',       label: '📦 ประสานงานกองทุนและสิ่งของบริจาค' },
  { value: 'digital_creator',   label: '💻 ช่วยทำสื่อดิจิทัล/กราฟิกคอมมูนิตี้' },
]

const maritalStatusOptions = [
  { value: 'single',       label: 'โสด' },
  { value: 'married',      label: 'แต่งงานแล้ว' },
  { value: 'complicated',  label: 'ไม่เปิดเผย / คลุมเครือ' },
]

const thailandProvinces = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยะลา", "ยโสธร", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อุดรธานี", "อุทัยธานี", "อุตรดิตถ์", "อุบลราชธานี", "อำนาจเจริญ"
].sort()

function SubscriptionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [activeTab, setActiveTab] = useState<'profile' | 'billing'>('profile')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Subscriptions & Payments State
  const [subInfo, setSubInfo] = useState<SubInfo | null>(null)
  const [payments, setPayments] = useState<PaymentRecord[]>([])

  // Profile Form State
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    display_name: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    phone_number: '',
    province: 'นครราชสีมา',
    district: '',
    subdistrict: '',
    address: '',
    line_id: '',
    gender: 'unknown',
    avatar_url: '',
    occupation: 'employee',
    community_role: 'general',
    community_role_custom: '',
    interests: [] as string[],
    expertise_tags: [] as string[],
    marital_status: 'single'
  })

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'billing') {
      setActiveTab('billing')
    }
  }, [searchParams])

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/login')
          return
        }
        setUser(session.user)

        // 1. ดึงข้อมูล Profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (prof) {
          setFormData({
            display_name:         prof.display_name || '',
            first_name:           prof.first_name || '',
            last_name:            prof.last_name || '',
            birth_date:           prof.birth_date || '',
            phone_number:         prof.phone_number || '',
            province:             prof.province || 'นครราชสีมา',
            district:             prof.district || '',
            subdistrict:          prof.subdistrict || '',
            address:              prof.address || '',
            line_id:              prof.line_id || '',
            gender:               prof.gender || 'unknown',
            avatar_url:           prof.avatar_url || '',
            occupation:           prof.occupation || 'employee',
            community_role:       prof.community_role || 'general',
            community_role_custom: prof.community_role_custom || '',
            interests:            Array.isArray(prof.interests) ? prof.interests : [],
            expertise_tags:       Array.isArray(prof.expertise_tags) ? prof.expertise_tags : [],
            marital_status:       prof.marital_status || 'single'
          })
        }

        // 2. ดึงข้อมูล Subscription & Payments
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle()

        if (sub) {
          setSubInfo({
            plan:            sub.plan || 'free',
            expires_at:      sub.expires_at,
            grace_until:     sub.grace_until,
            is_active:       sub.is_active ?? false,
            pet_slots_addon: sub.pet_slots_addon || 0,
            pet_limit:       sub.plan === 'member' ? 15 : 3,
            days_left:       0,
            in_grace:        false,
            is_expired:      false
          })
        }

        const { data: pmts } = await supabase
          .from('payments')
          .select('id, amount, status, slip_type, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (pmts) setPayments(pmts)

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [supabase, router])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return
    setUploading(true)
    setProfileMsg(null)

    try {
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadErr } = await supabase.storage
        .from('pobpet-bucket')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('pobpet-bucket')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      setProfileMsg({ type: 'success', text: 'อัปโหลดรูปโปรไฟล์ชั่วคราวสำเร็จ อย่าลืมกดบันทึกด้านล่างนะคะ' })
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'อัปโหลดรูปภาพไม่สำเร็จ' })
    } finally {
      setUploading(false)
    }
  }

  const handleInterestChange = (value: string) => {
    setFormData(prev => {
      const current = [...prev.interests]
      if (current.includes(value)) {
        return { ...prev, interests: current.filter(i => i !== value) }
      } else {
        return { ...prev, interests: [...current, value] }
      }
    })
  }

  const handleExpertiseTagChange = (value: string) => {
    setFormData(prev => {
      const current = [...prev.expertise_tags]
      if (current.includes(value)) {
        return { ...prev, expertise_tags: current.filter(t => t !== value) }
      } else {
        return { ...prev, expertise_tags: [...current, value] }
      }
    })
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSavingProfile(true)
    setProfileMsg(null)

    if (!formData.display_name.trim() || !formData.phone_number.trim() || !formData.first_name.trim() || !formData.last_name.trim()) {
      setProfileMsg({ type: 'error', text: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนก่อนทำการบันทึกค่ะ' })
      setSavingProfile(false)
      return
    }

    try {
      const finalCommunityRole = formData.community_role === 'other' ? formData.community_role_custom.trim() : formData.community_role

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id:                    user.id,
          email:                 user.email,
          display_name:          formData.display_name.trim(),
          first_name:            formData.first_name.trim(),
          last_name:             formData.last_name.trim(),
          birth_date:            formData.birth_date || null,
          phone_number:          formData.phone_number.trim(),
          province:              formData.province,
          district:              formData.district.trim() || null,
          subdistrict:           formData.subdistrict.trim() || null,
          address:               formData.address.trim() || null,
          line_id:               formData.line_id.trim() || null,
          gender:                formData.gender,
          avatar_url:            formData.avatar_url || null,
          occupation:            formData.occupation,
          community_role:        finalCommunityRole,
          community_role_custom: formData.community_role_custom.trim() || null,
          interests:             formData.interests,
          expertise_tags:        formData.expertise_tags,
          marital_status:        formData.marital_status,
          updated_at:            new Date().toISOString()
        })

      if (error) throw error
      setProfileMsg({ type: 'success', text: '🎉 บันทึกการอัปเดตโปรไฟล์ของคุณเรียบร้อยแล้วค่ะ' })
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' })
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="animate-spin text-black" size={40} />
        <p className="font-bold text-gray-500">กำลังโหลดข้อมูลบัญชีผู้ใช้งาน...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-black">
      {/* ส่วนหัวเพจหลัก */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-4 border-black p-6 rounded-3xl bg-white shadow-paper mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-wagashi-matcha/30 border-2 border-black rounded-2xl shadow-paper-sm">
            <Settings className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black">การตั้งค่าและบัญชีของฉัน</h1>
            <p className="text-sm font-bold text-gray-500 mt-0.5">จัดการข้อมูลโปรไฟล์ชาว PobPet และการเลือกสิทธิ์สมาชิกเครือข่าย</p>
          </div>
        </div>
      </div>

      {/* Tabs สลับหน้าจอ */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 font-black rounded-xl border-2 border-black transition-all ${
            activeTab === 'profile'
              ? 'bg-black text-white shadow-none translate-y-0.5'
              : 'bg-white text-black shadow-paper-sm hover:-translate-y-0.5'
          }`}
        >
          ⚙️ ข้อมูลโปรไฟล์ทั่วไป
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-6 py-3 font-black rounded-xl border-2 border-black transition-all ${
            activeTab === 'billing'
              ? 'bg-black text-white shadow-none translate-y-0.5'
              : 'bg-white text-black shadow-paper-sm hover:-translate-y-0.5'
          }`}
        >
          👑 สิทธิ์สมาชิกและการเงิน
        </button>
      </div>

      {/* แผงเนื้อหาหลัก */}
      <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-10 shadow-paper">
        {activeTab === 'profile' ? (
          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            
            {/* อัปโหลดรูปประจำตัว */}
            <div className="md:col-span-2 flex flex-col items-center justify-center pb-4 border-b-2 border-dashed border-black/20">
              <div className="relative w-28 h-28 border-4 border-black rounded-full overflow-hidden bg-gray-100 shadow-paper-sm">
                {formData.avatar_url ? (
                  <Image src={formData.avatar_url} alt="Avatar" fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User size={64} />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 left-0 bg-black/70 text-white p-1.5 text-center cursor-pointer text-xs font-bold hover:bg-black transition-colors">
                  <Camera size={14} className="mx-auto" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
              <span className="text-xs font-bold text-gray-500 mt-2">รูปโปรไฟล์ประจำเครือข่าย</span>
            </div>

            {/* กลุ่มฟิลด์ข้อมูลหลัก */}
            <div className="space-y-1">
              <label className="font-black text-xs text-black flex items-center gap-1"><UserPlus size={16}/> ชื่อเล่น / ชื่อในระบบ <span className="text-red-500">*</span></label>
              <input 
                type="text" required
                value={formData.display_name}
                onChange={e => setFormData({...formData, display_name: e.target.value})}
                placeholder="เช่น พี่สมชาย, มะนาว"
                className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none focus:ring-4 ring-black/5"
              />
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs text-black flex items-center gap-1"><Phone size={16}/> เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span></label>
              <input 
                type="tel" required
                value={formData.phone_number}
                onChange={e => setFormData({...formData, phone_number: e.target.value})}
                placeholder="09x-xxx-xxxx"
                className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none focus:ring-4 ring-black/5"
              />
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs text-black">ชื่อจริง (ภาษาไทย) <span className="text-red-500">*</span></label>
              <input 
                type="text" required
                value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})}
                className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs text-black">นามสกุล (ภาษาไทย) <span className="text-red-500">*</span></label>
              <input 
                type="text" required
                value={formData.last_name}
                onChange={e => setFormData({...formData, last_name: e.target.value})}
                className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs text-black flex items-center gap-1"><Cake size={16}/> วันเกิด</label>
              <input 
                type="date"
                value={formData.birth_date}
                onChange={e => setFormData({...formData, birth_date: e.target.value})}
                className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs text-black">เพศ</label>
              <select 
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}
                className="w-full border-2 border-black p-3 rounded-xl font-bold bg-white outline-none cursor-pointer"
              >
                <option value="unknown">ไม่ระบุ</option>
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs text-black">สถานภาพ</label>
              <select 
                value={formData.marital_status}
                onChange={e => setFormData({...formData, marital_status: e.target.value})}
                className="w-full border-2 border-black p-3 rounded-xl font-bold bg-white outline-none cursor-pointer"
              >
                {maritalStatusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs text-black flex items-center gap-1"><MessageSquare size={14}/> LINE ID (ผู้ใช้)</label>
              <input 
                type="text"
                value={formData.line_id}
                onChange={e => setFormData({...formData, line_id: e.target.value})}
                placeholder="ใส่ไอดีไลน์เพื่อรับงาน"
                className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none focus:ring-4 ring-black/5"
              />
            </div>

            {/* ข้อมูลด้านภูมิศาสตร์ */}
            <div className="space-y-1">
              <label className="font-black text-xs text-black flex items-center gap-1"><MapPin size={16}/> จังหวัดประจำการหลัก</label>
              <select 
                value={formData.province}
                onChange={e => setFormData({...formData, province: e.target.value})}
                className="w-full border-2 border-black p-3 rounded-xl font-bold bg-white outline-none cursor-pointer"
              >
                {thailandProvinces.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs text-black">อำเภอ / เขต</label>
              <input 
                type="text"
                value={formData.district}
                onChange={e => setFormData({...formData, district: e.target.value})}
                placeholder="เช่น ด่านขุนทด"
                className="w-full border-2 border-black p-3 rounded-xl font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs text-black">ตำบล / แขวง</label>
              <input 
                type="text"
                value={formData.subdistrict}
                onChange={e => setFormData({...formData, subdistrict: e.target.value})}
                placeholder="เช่น ด่านขุนทด"
                className="w-full border-2 border-black p-3 rounded-xl font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs text-black flex items-center gap-1"><Home size={14}/> ที่อยู่ / บ้านเลขที่ / ถนน</label>
              <input 
                type="text"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                placeholder="เช่น 444 หมู่ 1"
                className="w-full border-2 border-black p-3 rounded-xl font-bold"
              />
            </div>

            {/* อาชีพ & บทบาทเครือข่าย */}
            <div className="space-y-1">
              <label className="font-black text-xs text-black flex items-center gap-1"><Briefcase size={14}/> อาชีพหลักของคุณ</label>
              <select 
                value={formData.occupation}
                onChange={e => setFormData({...formData, occupation: e.target.value})}
                className="w-full border-2 border-black p-3 rounded-xl font-bold bg-white outline-none cursor-pointer"
              >
                {occupationOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-black text-xs text-black flex items-center gap-1"><Sparkles size={14}/> บทบาทในเครือข่ายชุมชน</label>
              <select 
                value={formData.community_role}
                onChange={e => setFormData({...formData, community_role: e.target.value})}
                className="w-full border-2 border-black p-3 rounded-xl font-bold bg-white outline-none cursor-pointer"
              >
                {expertiseOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {formData.community_role === 'other' && (
              <div className="md:col-span-2 space-y-1">
                <label className="font-black text-xs text-black">โปรดระบุบทบาทอาชีพเพิ่มเติม</label>
                <input 
                  type="text"
                  value={formData.community_role_custom}
                  onChange={e => setFormData({...formData, community_role_custom: e.target.value})}
                  placeholder="เช่น ช่างภาพช่วยถ่ายรูปสัตว์พิการ"
                  className="w-full border-2 border-black p-3 rounded-xl font-bold"
                />
              </div>
            )}

            {/* ── ส่วนเลือกความสนใจหลัก (Interests) ── */}
            <div className="space-y-3 md:col-span-2 border-4 border-black p-5 rounded-2xl bg-wagashi-matcha/5 shadow-paper-sm mt-2">
              <label className="font-black text-sm text-black flex items-center gap-1.5"><Heart size={16} className="fill-black"/> สิ่งที่คุณสนใจและวัตถุประสงค์หลัก (Interests - เลือกได้หลายข้อ)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {interestOptions.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2.5 bg-white border border-black p-2.5 rounded-xl cursor-pointer select-none font-bold text-xs hover:bg-gray-50 shadow-paper-sm">
                    <input type="checkbox" checked={formData.interests.includes(opt.value)} onChange={() => handleInterestChange(opt.value)} className="w-4 h-4 accent-black rounded border-black focus:ring-0 cursor-pointer" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* ── ส่วนเลือกแท็กความเชี่ยวชาญ (Expertise Tags) ── */}
            <div className="space-y-3 md:col-span-2 border-4 border-black p-5 rounded-2xl bg-wagashi-sakura/5 shadow-paper-sm">
              <label className="font-black text-sm text-black flex items-center gap-1.5"><Sparkles size={16} className="fill-black"/> แท็กความเชี่ยวชาญเพื่อช่วยเหลือสัตว์เลี้ยง (Expertise Tags - เลือกได้หลายข้อ)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {expertiseTagOptions.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2.5 bg-white border border-black p-2.5 rounded-xl cursor-pointer select-none font-bold text-xs hover:bg-gray-50 shadow-paper-sm">
                    <input type="checkbox" checked={formData.expertise_tags.includes(opt.value)} onChange={() => handleExpertiseTagChange(opt.value)} className="w-4 h-4 accent-black rounded border-black focus:ring-0 cursor-pointer" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* แถบแจ้งเตือนสถานะการเซฟ */}
            {profileMsg && (
              <div className={`md:col-span-2 p-4 rounded-xl border-2 border-black flex items-center gap-2 text-left font-bold ${
                profileMsg.type === 'error' ? 'bg-red-50 border-red-400 text-red-900' : 'bg-green-50 border-green-400 text-green-900'
              }`}>
                {profileMsg.type === 'error' ? <AlertCircle size={18} className="shrink-0 text-red-600" /> : <CheckCircle2 size={18} className="shrink-0 text-green-600" />}
                <span className="text-sm">{profileMsg.text}</span>
              </div>
            )}

            {/* ปุ่มยืนยันการเซฟ */}
            <Button type="submit" disabled={savingProfile || uploading} className="md:col-span-2 bg-black text-white py-7 text-lg font-black rounded-2xl border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 mt-2">
              {savingProfile ? <><Loader2 className="animate-spin" /> กำลังบันทึกการเปลี่ยนแปลง...</> : "💾 บันทึกการเปลี่ยนแปลงโปรไฟล์"}
            </Button>
          </form>
        ) : (
          /* แท็บสิทธิ์สมาชิกและการเงิน (คง UI และ Logic เดิมไว้ครบถ้วน) */
          <div className="space-y-8">
            <div className="border-4 border-black p-6 rounded-2xl bg-wagashi-matcha/10 relative overflow-hidden shadow-paper-sm">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Crown size={120} />
              </div>
              <h3 className="text-xl font-black uppercase flex items-center gap-2">
                <Crown className="text-black fill-yellow-400" /> 
                แพ็คเกจปัจจุบัน: <span className="underline">{subInfo?.plan === 'member' ? 'PRO MEMBER' : 'FREE PLAN'}</span>
              </h3>
              <p className="font-bold text-sm text-gray-600 mt-2">
                โควต้าช่องสัตว์เลี้ยงทั้งหมดที่คุณใช้ได้: {subInfo?.pet_limit ?? 3} ตัว 
                {subInfo?.pet_slots_addon && subInfo.pet_slots_addon > 0 ? ` (รวมแอดออนพิเศษ +${subInfo.pet_slots_addon} ช่อง)` : ''}
              </p>
              {subInfo?.plan === 'member' && subInfo.expires_at && (
                <p className="text-xs font-black bg-black text-white inline-block px-3 py-1 rounded-md mt-4">
                  หมดอายุวันที่: {new Date(subInfo.expires_at).toLocaleDateString('th-TH')}
                </p>
              )}
            </div>

            {/* ประวัติการชำระเงิน */}
            <div className="space-y-4">
              <h3 className="text-xl font-black flex items-center gap-2 border-b-4 border-black pb-2">
                <Receipt size={20} /> ประวัติการแจ้งโอน / บิลชำระเงิน
              </h3>
              {payments.length === 0 ? (
                <p className="text-sm font-bold text-gray-400 text-center py-6">ยังไม่มีประวัติการทำรายการชำระเงินในระบบค่ะ</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {payments.map(p => (
                    <div key={p.id} className="border-2 border-black p-4 rounded-xl flex justify-between items-center bg-white shadow-paper-sm">
                      <div>
                        <p className="font-black text-sm">เลขรายการ: #{p.id.substring(0,8).toUpperCase()}</p>
                        <p className="text-xs font-bold text-gray-500">
                          วันที่: {new Date(p.created_at).toLocaleString('th-TH')} | ประเภท: {p.slip_type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-base">{p.amount.toLocaleString()} ฿</p>
                        <span className={`text-[10px] font-black uppercase border px-2 py-0.5 rounded-md ${
                          p.status === 'approved' ? 'bg-green-100 border-green-500 text-green-700' :
                          p.status === 'pending' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' :
                          'bg-red-100 border-red-500 text-red-700'
                        }`}>
                          {p.status === 'approved' ? 'สำเร็จ' : p.status === 'pending' ? 'รอตรวจ' : 'ปฏิเสธ'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AccountSubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="animate-spin text-black" size={40} />
        <p className="font-bold text-gray-500">กำลังเตรียมหน้าจอข้อมูล...</p>
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  )
}