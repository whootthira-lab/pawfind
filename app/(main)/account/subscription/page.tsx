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
  Home, MessageSquare
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

const expertiseOptions = [
  { value: 'adopt',       label: '🐶 หาบ้านใหม่/รับเลี้ยงสัตว์' },
  { value: 'rescue',      label: '🆘 ช่วยเหลือสัตว์เจ็บป่วย/สัตว์จร' },
  { value: 'mating',      label: '❤️ หาคู่ให้น้องๆ' },
  { value: 'showcase',    label: '📸 อวดความน่ารัก/ประกวดสัตว์เลี้ยง' },
  { value: 'knowledge',   label: '📚 ศึกษาความรู้และการเลี้ยงดู' },
  { value: 'health',      label: '🏥 สุขภาพและการดูแลสัตว์' },
  { value: 'prosthetics', label: '🦿 นวัตกรรม,DIY' },
  { value: 'adoption',    label: '💖 การรับเลี้ยงและหาบ้าน' },
  { value: 'general', label: 'ผู้ใช้งานทั่วไป (พร้อมช่วยเป็นหูเป็นตา)' },
  { value: 'volunteer', label: 'อาสาสมัคร / ศูนย์พักพิงสัตว์' },
  { value: 'petscout', label: 'PetScout (รับจ้างตามหาสัตว์หาย)' },
  { value: 'vet', label: 'สัตวแพทย์ / คลินิกรักษาสัตว์' },
  { value: 'groomer', label: 'บริการอาบน้ำตัดขน / โรงแรมสัตว์' },
  { value: 'petsitter', label: 'รับฝากหรือดูแลสัตว์ที่บ้าน' },
  { value: 'retailer', label: 'ร้านจำหน่ายอาหารและอุปกรณ์สัตว์เลี้ยง' },
  { value: 'other', label: 'อื่นๆ (โปรดระบุ)' },
]

const thailandProvinces = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
].sort()

const occupationOptions = [
  { value: '', label: '-- เลือกอาชีพ --' },
  { value: 'student', label: '🎓 นักเรียน / นักศึกษา' },
  { value: 'employee', label: '💼 พนักงานบริษัท / ลูกจ้าง' },
  { value: 'government', label: '🏛 ข้าราชการ / รัฐวิสาหกิจ' },
  { value: 'business_owner', label: '🏪 เจ้าของกิจการ / ธุรกิจส่วนตัว' },
  { value: 'freelance', label: '🖥 Freelance / อาชีพอิสระ' },
  { value: 'agriculturist', label: '🌾 เกษตรกร' },
  { value: 'healthcare', label: '🏥 บุคลากรทางการแพทย์' },
  { value: 'educator', label: '📚 ครู / อาจารย์' },
  { value: 'retired', label: '🏖 เกษียณอายุ' },
  { value: 'unemployed', label: '🔍 ว่างงาน / กำลังหางาน' },
  { value: 'other', label: '✏️ อื่นๆ' },
]

const interestOptions = [
  { value: 'dog',         label: '🐕 สุนัข' },
  { value: 'cat',         label: '🐈 แมว' },
  { value: 'bird',        label: '🦜 นกสวยงาม / นกเสียง' },
  { value: 'fish',        label: '🐟 ปลาสวยงาม' },
  { value: 'exotic',      label: '🦎 สัตว์ Exotic' },
  { value: 'rabbit',      label: '🐰 กระต่าย / สัตว์ขนาดเล็ก' },
  { value: 'contest',     label: '🏆 การประกวดสัตว์' },
  { value: 'community',   label: '🤝 ชุมชนและอาสาสมัคร' },
  { value: 'memorial',    label: '🕯 ของที่ระลึกสัตว์เลี้ยง' },
  { value: 'astrology',   label: '🔮 ดูดวง / โหราศาสตร์' },
  { value: 'psychology',  label: '🧠 จิตวิทยา' },
  { value: 'selfdev',     label: '📈 พัฒนาตนเอง' },
  { value: 'sport_football',  label: '⚽ ฟุตบอล' },
  { value: 'sport_badminton', label: '🏸 แบดมินตัน,เทนนิส' },
  { value: 'sport_golf',      label: '⛳ กอล์ฟ' },
  { value: 'sport_muay',      label: '🥊 กีฬาต่อสู้ / ศิลปะการต่อสู้' },
  { value: 'sport_other',     label: '🏅 กีฬา — ประเภทอื่นๆ' },
  { value: 'fitness',     label: '💪 ออกกำลังกาย / Fitness' },
  { value: 'fashion',     label: '👗 แฟชั่น / สไตล์' },
  { value: 'herbs',       label: '🌿 สมุนไพร / ธรรมชาติบำบัด' },
  { value: 'cooking',     label: '🍳 ทำอาหาร / อาหารเพื่อสุขภาพ' },
  { value: 'travel',      label: '✈️ ท่องเที่ยว' },
  { value: 'tech',        label: '💻 เทคโนโลยี / AI' },
  { value: 'art',         label: '🎨 ศิลปะ / งานฝีมือ' },
  { value: 'music',       label: '🎵 ดนตรี' },
  { value: 'reading',     label: '📚 อ่านหนังสือ' },
  { value: 'meditation',  label: '🧘 ทำสมาธิ / ธรรมะ' },
]

// ── 🆕 แท็กความเชี่ยวชาญอ้างอิงจากหน้าลงทะเบียนลงประวัติหลัก ──
const expertiseTagOptions = [
  { value: 'rescue_expert',     label: '🆘 ยานพาหนะช่วยชีวิตสัตว์/จับสัตว์' },
  { value: 'medical_care',      label: '💊 ปฐมพยาบาล/ให้ยาสัตว์เบื้องต้น' },
  { value: 'foster_home',       label: '🏡 มีพื้นที่กักตัว/พักฟื้นสัตว์ชั่วคราว' },
  { value: 'pet_photography',   label: '📸 ถ่ายภาพสัตว์เลี้ยงโปรโมทหาบ้าน' },
  { value: 'craftsman_diy',     label: '🛠️ ช่างฝีมือ/ออกแบบวีลแชร์สัตว์พิการ' },
  { value: 'donation_co',       label: '📦 ประสานงานกองทุนและสิ่งของบริจาค' },
  { value: 'digital_creator',   label: '💻 ช่วยทำสื่อดิจิทัล/กราฟิกคอมมูนิตี้' },
  { value: 'none',   label: 'ไม่มี/ไม่สะดวก' },
  { value: 'other', label: '✏️ อื่นๆ' },
]

const maritalStatusOptions = [
  { value: 'single', label: 'โสด' },
  { value: 'married', label: 'แต่งงานแล้ว' },
  { value: 'complicated', label: 'ไม่เปิดเผย / คลุมเครือ' },
]

function thDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-ori-orange" />
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  )
}

function SubscriptionContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [activeTab, setActiveTab] = useState<'package' | 'settings'>('package')
  const [sub,        setSub]        = useState<SubInfo | null>(null)
  const [payments,   setPayments]   = useState<PaymentRecord[]>([])
  const [petCount,   setPetCount]   = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [addonToast, setAddonToast] = useState(false)

  const [savingProfile, setSavingProfile] = useState(false)
  const [uploading, setUploading]         = useState(false)
  const [profileMsg, setProfileMsg]       = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    display_name: '', 
    first_name: '',
    last_name: '',
    birth_date: '',
    phone_number: '',
    gender: '',
    line_id: '',
    avatar_url: '',
    address: '',
    province: 'นครราชสีมา',
    district: '',
    subdistrict: '',
    contact_link: '',
    community_role: 'general',
    community_role_custom: '',
    occupation: '',
    interests: [] as string[],
    expertise_tags: [] as string[], // 🆕 ตรวจรับแท็กความเชี่ยวชาญลงสเตตแก้ไข
    marital_status: 'single'        // 🆕 เพิ่มสเตตสถานภาพ
  })

  useEffect(() => {
    if (searchParams.get('addon') === 'success') {
      setAddonToast(true)
      setTimeout(() => setAddonToast(false), 5000)
    }
  }, [searchParams])

  useEffect(() => {
    const loadAllData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const userId = session.user.id
      const now    = new Date()

      const { data: s } = await supabase
        .from('subscriptions')
        .select('plan, expires_at, grace_until, is_active, pet_slots_addon')
        .eq('user_id', userId)
        .maybeSingle()

      if (s) {
        const expires   = s.expires_at  ? new Date(s.expires_at)  : null
        const grace     = s.grace_until ? new Date(s.grace_until) : null
        const isExpired = expires ? expires < now : false
        const inGrace   = isExpired && grace ? grace > now : false
        const daysLeft  = inGrace && grace
          ? Math.ceil((grace.getTime() - now.getTime()) / 86400000)
          : !isExpired && expires
            ? Math.ceil((expires.getTime() - now.getTime()) / 86400000)
            : 0
        const addon    = s.pet_slots_addon || 0
        const petLimit = s.plan === 'member' && !isExpired ? 3 + addon : 1

        setSub({
          plan:            s.plan,
          expires_at:      s.expires_at,
          grace_until:     s.grace_until,
          is_active:       s.is_active,
          pet_slots_addon: addon,
          pet_limit:       petLimit,
          days_left:       daysLeft,
          in_grace:        inGrace,
          is_expired:      isExpired,
        })
      }

      const { count } = await supabase
        .from('pets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active')
      setPetCount(count || 0)

      const { data: pData } = await supabase
        .from('payment_slips')
        .select('id, amount, status, slip_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
      setPayments(pData || [])

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (prof) {
        const isStandardRole = expertiseOptions.some(opt => opt.value === prof.community_role)
        setFormData({
          display_name:   prof.display_name || '',
          first_name:     prof.first_name || '',
          last_name:      prof.last_name || '',
          birth_date:     prof.birth_date || '',
          // 🟢 ซิงค์ดึงรหัสโทรศัพท์ให้ปลอดภัยไม่หลุดว่างเปล่า
          phone_number:   prof.phone_number || prof.tel || '', 
          gender:         prof.gender || '',
          line_id:        prof.line_id || '',
          avatar_url:     prof.avatar_url || '',
          address:        prof.address || '',
          province:       prof.province || 'นครราชสีมา',
          district:       prof.district || '',
          subdistrict:    prof.subdistrict || '',
          contact_link:   prof.contact_link || '',
          community_role: isStandardRole ? (prof.community_role || 'general') : 'other',
          community_role_custom: isStandardRole ? '' : (prof.community_role || ''),
          occupation:     prof.occupation || '',
          interests:      Array.isArray(prof.interests) ? prof.interests : [],
          expertise_tags: Array.isArray(prof.expertise_tags) ? prof.expertise_tags : [], // 🆕 ซิงค์โหลดแท็กที่มีอยู่เดิม
          marital_status: prof.marital_status || 'single' // 🆕 ซิงค์สถานภาพ
        })
      }

      setLoading(false)
    }
    loadAllData()
  }, [supabase, router])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return
      setUploading(true)
      setProfileMsg(null)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)
        
      if (publicUrl) {
         setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
         setProfileMsg({ type: 'success', text: 'เปลี่ยนรูปภาพโปรไฟล์ชั่วคราวสำเร็จ กดปุ่มยืนยันด้านล่างเพื่อเซฟค่ะ' })
      }
    } catch (error: any) {
      setProfileMsg({ type: 'error', text: 'อัปโหลดรูปภาพไม่สำเร็จ' })
    } finally {
      setUploading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.display_name.trim()) {
      setProfileMsg({ type: 'error', text: 'กรุณากรอกชื่อโปรไฟล์ที่จะใช้แสดงผลค่ะ' })
      return
    }
    if (!formData.gender) {
      setProfileMsg({ type: 'error', text: 'กรุณาระบุเพศของคุณค่ะ' })
      return
    }

    setSavingProfile(true)
    setProfileMsg(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง')

      const roleFinal = formData.community_role === 'other' ? formData.community_role_custom : formData.community_role

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          display_name:   formData.display_name.trim(),
          first_name:     formData.first_name.trim(),
          last_name:      formData.last_name.trim(),
          birth_date:     formData.birth_date || null,
          phone_number:   formData.phone_number.trim(), // 🟢 บันทึกลงตัวคีย์กลางผูกขาดร่วมกัน
          tel:            formData.phone_number.trim(), // อัปเดตคีย์เก่าเผื่อไว้คู่ขนาน
          gender:         formData.gender,
          line_id:        formData.line_id.trim() || null,
          avatar_url:     formData.avatar_url || null,
          address:        formData.address.trim() || null,
          province:       formData.province,
          district:       formData.district.trim() || null,
          subdistrict:    formData.subdistrict.trim() || null,
          contact_link:   formData.contact_link.trim() || null,
          community_role: roleFinal,
          community_role_custom: roleFinal, // 🆕 บันทึกลงช่อง custom สอดรับฟอร์มลงทะเบียน
          occupation:     formData.occupation || null,
          interests:      formData.interests,
          expertise_tags: formData.expertise_tags, // 🆕 อัปเดตแท็กความเชี่ยวชาญลงฐานข้อมูลจริง
          marital_status: formData.marital_status  // 🆕 อัปเดตสถานภาพ
        })
        .eq('id', session.user.id)

      if (updateErr) throw updateErr

      // ── ซิงค์ข้อมูลขึ้นเลเยอร์ Metadata ของฝั่งเซสชันล็อกอินด้วย ──
      await supabase.auth.updateUser({
        data: {
          display_name:   formData.display_name.trim(),
          first_name:     formData.first_name.trim(),
          last_name:      formData.last_name.trim(),
          phone_number:   formData.phone_number.trim(),
          province:       formData.province,
          district:       formData.district.trim(),
          subdistrict:    formData.subdistrict.trim(),
          address:        formData.address.trim(),
          line_id:        formData.line_id.trim(),
          avatar_url:     formData.avatar_url,
          occupation:     formData.occupation,
          community_role: roleFinal,
          interests:      formData.interests,
          expertise_tags: formData.expertise_tags,
          marital_status: formData.marital_status
        }
      })

      setProfileMsg({ type: 'success', text: '🎉 บันทึกการแก้ไขข้อมูลโปรไฟล์เรียบร้อยแล้วค่ะ!' })
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: 'บันทึกไม่สำเร็จ: ' + err.message })
    } finally {
      setSavingProfile(false)
    }
  }

  const isMember   = sub?.plan === 'member' && !sub?.is_expired
  const statusColor = sub?.in_grace
    ? 'bg-red-50 border-red-300'
    : isMember
      ? 'bg-amber-50 border-amber-300'
      : 'bg-gray-50 border-gray-300'

  const SLIP_TYPE_LABEL: Record<string, string> = {
    member:  '⭐ Member ฿399/ปี',
    addon_1: '➕ Add-on +1 ตัว ฿79',
    addon_3: '➕ Add-on +3 ตัว ฿199',
  }
  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    auto_approved: { label: 'ผ่านแล้ว ✅',     color: 'text-green-600' },
    approved:      { label: 'ผ่านแล้ว ✅',     color: 'text-green-600' },
    pending:       { label: 'รอตรวจสอบ ⏳',   color: 'text-amber-600' },
    rejected:      { label: 'ไม่ผ่าน ❌',      color: 'text-red-600'   },
  }

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 size={48} className="animate-spin text-ori-orange" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 mb-20 space-y-6">

      <div className="flex gap-2 border-b-4 border-black pb-2">
        <button
          onClick={() => setActiveTab('package')}
          className={`flex items-center gap-1.5 px-4 py-2 font-black text-sm rounded-xl border-2 transition-all ${
            activeTab === 'package'
              ? 'bg-black text-white border-black shadow-paper-sm'
              : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'
          }`}
        >
          <Crown size={16} /> จัดการแพ็คเกจ
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-4 py-2 font-black text-sm rounded-xl border-2 transition-all ${
            activeTab === 'settings'
              ? 'bg-black text-white border-black shadow-paper-sm'
              : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'
          }`}
        >
          <Settings size={16} /> ⚙️ ตั้งค่าโปรไฟล์
        </button>
      </div>

      {activeTab === 'package' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {addonToast && (
            <div className="p-4 bg-green-50 border-2 border-green-400 rounded-2xl flex items-center gap-3">
              <CheckCircle2 size={20} className="text-green-600 shrink-0" />
              <div>
                <p className="font-black text-green-800">เพิ่ม Slot น้องสำเร็จแล้วค่ะ! 🐾</p>
                <p className="text-xs font-bold text-green-600">สร้างโปรไฟล์น้องเพิ่มได้เลย</p>
              </div>
              <Link href="/pets/new" className="ml-auto text-xs font-black text-green-700 bg-green-200 px-3 py-2 rounded-xl border border-green-400 hover:bg-green-300 transition-all shrink-0">
                สร้างเลย →
              </Link>
            </div>
          )}

          <div className={`border-4 rounded-3xl p-6 shadow-paper ${statusColor}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-black uppercase text-gray-500 mb-1">แพ็คเกจปัจจุบัน</p>
                <h2 className="text-2xl font-black">{isMember ? '⭐ Member' : '🐾 Free'}</h2>
              </div>
              {isMember && (
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-500">หมดอายุ</p>
                  <p className="font-black text-sm">{thDate(sub?.expires_at || null)}</p>
                  {(sub?.days_left || 0) <= 30 && (
                    <p className={`text-xs font-black mt-0.5 ${(sub?.days_left || 0) <= 7 ? 'text-red-600' : 'text-amber-600'}`}>
                      เหลือ {sub?.days_left} วัน
                    </p>
                  )}
                </div>
              )}
            </div>

            {sub?.in_grace && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-xl flex items-start gap-2 mb-4">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-sm text-red-800">อยู่ในช่วง Grace Period</p>
                  <p className="text-xs font-bold text-red-600">ข้อมูลน้องจะถูกซ่อนใน {sub?.days_left} วัน ถ้าไม่ต่ออายุ</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-gray-500">โปรไฟล์น้อง</p>
                <p className="font-black text-lg">{petCount}/{sub?.pet_limit || 1}</p>
              </div>
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-gray-500">Base slots</p>
                <p className="font-black text-lg">{isMember ? '3' : '1'}</p>
              </div>
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-gray-500">Add-on slots</p>
                <p className="font-black text-lg text-amber-600">+{sub?.pet_slots_addon || 0}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {isMember ? (
                <>
                  <Link href="/payment/slip?type=member" className="flex items-center justify-center gap-2 py-3 px-6 bg-ori-ink text-white font-black rounded-xl border-2 border-ori-ink shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5 transition-all">
                    <Crown size={16} className="text-amber-400" /> ต่ออายุ Member ฿399/ปี
                  </Link>
                  <Link href="/pricing/addon" className="flex items-center justify-center gap-2 py-3 px-6 bg-white font-black rounded-xl border-2 border-ori-ink shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5 transition-all">
                    <Plus size={16} /> ซื้อ slot น้องเพิ่ม
                  </Link>
                </>
              ) : (
                <Link href="/pricing" className="flex items-center justify-center gap-2 py-3 px-6 bg-ori-ink text-white font-black rounded-xl border-2 border-ori-ink shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5 transition-all">
                  <Crown size={16} className="text-amber-400" /> อัปเกรด Member ฿399/ปี <ChevronRight size={16} />
                </Link>
              )}
            </div>
          </div>

          <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper">
            <h2 className="font-black text-lg mb-4">สิทธิ์ที่มี</h2>
            {[
              { label: 'ประกาศหาย / แจ้งพบ',  free: true,           member: true          },
              { label: 'AI Matching',          free: true,           member: true          },
              { label: 'Chatbot',              free: '5 ครั้ง/วัน', member: 'ไม่จำกัด'    },
              { label: 'Pet Profile',          free: '1 ตัว',        member: `${sub?.pet_limit || 3} ตัว` },
              { label: 'สมุดสุขภาพ',          free: false,          member: true          },
              { label: 'บันทึกผ่าน Chatbot',  free: false,          member: true          },
              { label: 'QR Code ปลอกคอ',      free: false,          member: true          },
              { label: 'LINE OA แจ้งเตือน',   free: false,          member: true          },
              { label: 'ซื้อ slot เพิ่มได้',  free: false,          member: true          },
            ].map((f, i) => (
              <div key={i} className={`flex items-center justify-between py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                <span className="text-sm font-bold text-ori-ink">{f.label}</span>
                <span className={`text-sm font-black ${isMember ? 'text-green-600' : f.free === true ? 'text-green-600' : 'text-gray-300'}`}>
                  {isMember ? (f.member === true ? '✓' : f.member === false ? '—' : f.member) : (f.free === true ? '✓' : f.free === false ? '—' : f.free)}
                </span>
              </div>
            ))}
          </div>

          {payments.length > 0 && (
            <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper">
              <h2 className="font-black text-lg mb-4 flex items-center gap-2"><Receipt size={18} /> ประวัติการชำระ</h2>
              <div className="space-y-3">
                {payments.map(p => {
                  const s = STATUS_LABEL[p.status] || { label: p.status, color: 'text-gray-600' }
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-bold text-sm">{SLIP_TYPE_LABEL[p.slip_type] || p.slip_type}</p>
                        <p className="text-xs font-bold text-gray-400">{new Date(p.created_at).toLocaleDateString('th-TH')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm">฿{p.amount}</p>
                        <p className={`text-xs font-bold ${s.color}`}>{s.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl flex items-start gap-3">
            <Shield size={16} className="text-gray-400 shrink-0 mt-0.5" />
            <div className="text-xs font-bold text-gray-500 space-y-1">
              <p>ชำระผ่าน PromptPay โอนแล้วส่งสลิป AI ตรวจอัตโนมัติ</p>
              <p>Add-on slots ผูกกับ Member — ถ้า Member หมดอายุ slots จะหยุดใช้งานชั่วคราวด้วย</p>
              <p>Grace Period 30 วัน — ข้อมูลยังอยู่ครบ ต่ออายุเมื่อไหรก็ได้</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-paper animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3 mb-6 border-b-4 border-black pb-4 text-left">
            <div className="p-2 bg-wagashi-matcha border-2 border-black rounded-xl">
              <User size={24} className="text-black" />
            </div>
            <h2 className="text-2xl font-black italic uppercase tracking-tight">แก้ไขข้อมูลส่วนตัว</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
            
            <div className="md:col-span-2 bg-gray-50 p-6 border-4 border-black rounded-2xl flex flex-col items-center gap-4 shadow-inner">
              <div className="w-24 h-24 bg-white rounded-full border-4 border-black flex items-center justify-center overflow-hidden shadow-paper-sm relative group">
                {formData.avatar_url ? (
                  <Image src={formData.avatar_url} alt="Profile" fill className="object-cover" unoptimized />
                ) : (
                  <Camera size={28} className="text-gray-300" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer bg-wagashi-kinako border-2 border-black px-5 py-2 rounded-xl text-xs font-black hover:shadow-paper-sm transition-all">
                {uploading ? 'กำลังประมวลผลไฟล์...' : 'เปลี่ยนรูปโปรไฟล์'}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading || savingProfile} />
              </label>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-black text-sm ml-1 flex items-center gap-1 uppercase text-ori-orange-d">
                ชื่อโปรไฟล์ที่ใช้แสดง (Display Name) *
              </label>
              <input 
                required 
                type="text"
                value={formData.display_name}
                className="w-full border-4 border-black rounded-xl p-3.5 font-bold text-base outline-none shadow-paper-sm focus:bg-orange-50/50" 
                onChange={e => setFormData({...formData, display_name: e.target.value})} 
              />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm ml-1 text-gray-500 uppercase">ชื่อจริง *</label>
              <input required type="text" value={formData.first_name} className="w-full border-2 border-black rounded-lg p-3 font-bold focus:bg-gray-50" onChange={e => setFormData({...formData, first_name: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm ml-1 text-gray-500 uppercase">นามสกุล *</label>
              <input required type="text" value={formData.last_name} className="w-full border-2 border-black rounded-lg p-3 font-bold focus:bg-gray-50" onChange={e => setFormData({...formData, last_name: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm ml-1 text-gray-500 uppercase">เพศของคุณ *</label>
              <select required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full border-2 border-black rounded-lg p-3 font-bold bg-white cursor-pointer">
                <option value="">-- เลือกเพศ --</option>
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
                <option value="other">อื่นๆ / ไม่ระบุ</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm ml-1 text-gray-500 uppercase">วันเกิด</label>
              <input type="date" value={formData.birth_date} className="w-full border-2 border-black rounded-lg p-3 font-bold" onChange={e => setFormData({...formData, birth_date: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm ml-1 text-gray-500 uppercase">เบอร์โทรศัพท์ *</label>
              <input type="tel" required value={formData.phone_number} className="w-full border-2 border-black rounded-lg p-3 font-bold" onChange={e => setFormData({...formData, phone_number: e.target.value})} />
            </div>

            {/* 🆕 เพิ่มกล่องอินพุตเลือกสถานภาพ (สอดรับฟอร์มลงทะเบียนล่าสุด) */}
            <div className="space-y-1">
              <label className="font-black text-sm ml-1 text-gray-500 uppercase">สถานภาพ</label>
              <select value={formData.marital_status} onChange={e => setFormData({...formData, marital_status: e.target.value})} className="w-full border-2 border-black rounded-lg p-3 font-bold bg-white cursor-pointer">
                {maritalStatusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm ml-1 text-gray-500 uppercase">จังหวัด</label>
              <select required value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} className="w-full border-2 border-black rounded-lg p-3 font-bold bg-white cursor-pointer">
                {thailandProvinces.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            {/* 🆕 เพิ่มฟิลด์ อำเภอ / เขต */}
            <div className="space-y-1">
              <label className="font-black text-sm ml-1 text-gray-500 uppercase">อำเภอ / เขต</label>
              <input type="text" value={formData.district} placeholder="เช่น ด่านขุนทด" className="w-full border-2 border-black rounded-lg p-3 font-bold" onChange={e => setFormData({...formData, district: e.target.value})} />
            </div>

            {/* 🆕 เพิ่มฟิลด์ ตำบล / แขวง */}
            <div className="space-y-1">
              <label className="font-black text-sm ml-1 text-gray-500 uppercase">ตำบล / แขวง</label>
              <input type="text" value={formData.subdistrict} placeholder="เช่น ห้วยบง" className="w-full border-2 border-black rounded-lg p-3 font-bold" onChange={e => setFormData({...formData, subdistrict: e.target.value})} />
            </div>

            {/* 🆕 เพิ่มฟิลด์ LINE ID เพื่อรองรับการเก็บลงคอลัมน์ line_id */}
            <div className="space-y-1">
              <label className="font-black text-sm ml-1 text-gray-600 flex items-center gap-1"><MessageSquare size={14}/> LINE ID (ผู้ใช้)</label>
              <input type="text" value={formData.line_id} placeholder="ใส่ไอดีไลน์เพื่อรับงาน" className="w-full border-2 border-black rounded-lg p-3 font-bold bg-green-50/10" onChange={e => setFormData({...formData, line_id: e.target.value})} />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-black text-sm ml-1 uppercase text-gray-500 flex items-center gap-1"><Home size={14}/> ที่อยู่โดยละเอียด</label>
              <textarea rows={2} value={formData.address} placeholder="บ้านเลขที่, หมู่บ้าน, ซอย..." className="w-full border-2 border-black rounded-lg p-3 font-bold resize-none" onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-black text-sm ml-1 text-gray-600">ช่องทางติดต่ออื่น (ลิงก์โซเชียล)</label>
              <input type="text" value={formData.contact_link} placeholder="ลิงก์ Facebook / IG" className="w-full border-2 border-black rounded-lg p-3 font-bold" onChange={e => setFormData({...formData, contact_link: e.target.value})} />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-black text-sm ml-1 text-gray-500 uppercase">อาชีพหลักของคุณ</label>
              <select value={formData.occupation} onChange={e => setFormData({...formData, occupation: e.target.value})} className="w-full border-2 border-black rounded-lg p-3 font-bold bg-white cursor-pointer">
                {occupationOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* ความสนใจ */}
            <div className="md:col-span-2 space-y-2">
              <label className="font-black text-sm ml-1 flex items-center gap-2 uppercase text-gray-500">
                <Heart size={14}/> วัตถุประสงค์ / ความสนใจหลัก (เลือกได้หลายข้อ)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[250px] overflow-y-auto border-2 border-black p-3 rounded-xl bg-gray-50/30">
                {interestOptions.map(opt => {
                  const isSelected = formData.interests.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        const next = isSelected
                          ? formData.interests.filter(i => i !== opt.value)
                          : [...formData.interests, opt.value]
                        setFormData({...formData, interests: next})
                      }}
                      className={`px-3 py-2.5 rounded-xl border-2 font-bold text-xs text-left transition-all ${
                        isSelected
                          ? 'border-black bg-wagashi-kinako shadow-paper-sm'
                          : 'border-black/30 bg-white hover:border-black'
                      }`}
                    >
                      {opt.label}
                      {isSelected && <span className="float-right text-green-600">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 🆕 เพิ่มแถบตาราง Checkbox สำหรับแท็กความเชี่ยวชาญ (expertise_tags - ตามแบบหน้าสมัครเป๊ะๆ) */}
            <div className="md:col-span-2 space-y-2">
              <label className="font-black text-sm ml-1 flex items-center gap-2 uppercase text-gray-500">
                <Sparkles size={14} className="text-amber-500 fill-amber-500"/> แท็กความเชี่ยวชาญช่วยเหลือสัตว์เลี้ยง (Expertise Tags - เลือกได้หลายข้อ)
              </label>
              <div className="grid grid-cols-1 gap-2 border-2 border-black p-3 rounded-xl bg-wagashi-sakura/5">
                {expertiseTagOptions.map(opt => {
                  const isTagSelected = formData.expertise_tags.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        const nextTags = isTagSelected
                          ? formData.expertise_tags.filter(t => t !== opt.value)
                          : [...formData.expertise_tags, opt.value]
                        setFormData({...formData, expertise_tags: nextTags})
                      }}
                      className={`px-4 py-3 rounded-xl border-2 font-bold text-xs text-left transition-all flex items-center justify-between ${
                        isTagSelected
                          ? 'border-black bg-wagashi-sakura/30 shadow-paper-sm'
                          : 'border-black/20 bg-white hover:border-black'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isTagSelected && <span className="text-green-600 font-black">✓ เลือกแล้ว</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* บทบาทเครือข่ายความช่วยเหลือ */}
            <div className="md:col-span-2 mt-2 bg-wagashi-kinako/20 p-5 rounded-2xl border-4 border-black/10 shadow-inner">
              <label className="font-black text-sm ml-1 flex items-center gap-2 text-ori-ink mb-3">
                🐾 คุณต้องการช่วยเหลือหรือให้บริการเกี่ยวกับสัตว์ด้านไหนได้บ้าง? (บทบาทเครือข่าย)
              </label>
              <select value={formData.community_role} onChange={(e) => setFormData({...formData, community_role: e.target.value})} className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white cursor-pointer">
                {expertiseOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {formData.community_role === 'other' && (
              <div className="md:col-span-2 space-y-1 animate-in fade-in">
                <label className="font-black text-sm ml-1 text-gray-600">ระบุบทบาทภารกิจเพิ่มเติมของคุณ (community_role_custom)</label>
                <input type="text" value={formData.community_role_custom} onChange={e => setFormData({...formData, community_role_custom: e.target.value})} placeholder="เช่น ช่างภาพจิตอาสาช่วยเหลือศูนย์จร" className="w-full border-2 border-black rounded-xl p-3.5 font-bold" />
              </div>
            )}

            {profileMsg && (
              <div className={`md:col-span-2 p-4 rounded-xl border-2 border-black flex items-center gap-2 text-left font-bold ${
                profileMsg.type === 'error' ? 'bg-red-50 text-red-900' : 'bg-green-50 text-green-900'
              }`}>
                {profileMsg.type === 'error' ? <AlertCircle size={18} className="shrink-0 text-red-600" /> : <CheckCircle2 size={18} className="shrink-0 text-green-600" />}
                <span className="text-sm">{profileMsg.text}</span>
              </div>
            )}

            <Button type="submit" disabled={savingProfile || uploading} className="md:col-span-2 mt-2 bg-black text-white py-8 text-xl font-black rounded-2xl border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50">
              {savingProfile ? (
                <><Loader2 className="animate-spin" /> กำลังบันทึกข้อมูล...</>
              ) : (
                <><Sparkles size={18} className="text-ori-yellow" /> ยืนยันการอัปเดตข้อมูลตั้งค่าโปรไฟล์</>
              )}
            </Button>
          </form>
        </div>
      )}

    </div>
  )
}