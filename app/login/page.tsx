'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LogIn, Mail, Loader2, CheckCircle2, AlertCircle, 
  UserPlus, MapPin, Phone, Camera, Cake, UserCircle,
  Briefcase, Heart, Sparkles, Smile, ChevronRight, ArrowLeft,
  Home, MessageSquare
} from 'lucide-react'

// ── 1. ตัวเลือกบทบาทเครือข่ายสัตว์เลี้ยง ──
const expertiseOptions = [
  { value: 'adopt',       label: 'แ หาบ้านใหม่ / รับเลี้ยง' },
  { value: 'rescue',      label: '🆘 ตามหาสัตว์หาย/ช่วยเหลือสัตว์จร' },
  { value: 'mating',      label: '❤️ หาคู่ให้สัตว์เลี้ยง' },
  { value: 'showcase',    label: '📸 ประกวด / อวดความน่ารัก' },
  { value: 'knowledge',   label: '📚 ศึกษาความรู้การเลี้ยง' },
  { value: 'general', label: 'ผู้ใช้งานทั่วไป (พร้อมช่วยเป็นหูเป็นตา)' },
  { value: 'volunteer', label: 'อาสาสมัคร / ศูนย์พักพิงสัตว์' },
  { value: 'petscout', label: 'PetScout (รับจ้างตามหาสัตว์หาย)' },
  { value: 'vet', label: 'สัตวแพทย์ / คลินิกรักษาสัตว์' },
  { value: 'groomer', label: 'บริการอาบน้ำตัดขน / โรงแรมสัตว์' },
  { value: 'petsitter', label: 'รับฝากหรือดูแลสัตว์ที่บ้าน' },
  { value: 'retailer', label: 'ร้านจำหน่ายอาหารและอุปกรณ์สัตว์เลี้ยง' },
  { value: 'other', label: 'อื่นๆ (โปรดระบุ)' },
]

// ── 2. ตัวเลือกอาชีพหลัก ──
const occupationOptions = [
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

// ── 3. ตัวเลือกวัตถุประสงค์และความสนใจ (Interests) ──
const interestOptions = [
  { value: 'dog',         label: '🐕 สุนัข' },
  { value: 'cat',         label: '🐈 แมว' },
  { value: 'bird',        label: '🦜 นกสวยงาม' },
  { value: 'fish',        label: '🐟 ปลาสวยงาม' },
  { value: 'exotic',      label: '🦎 สัตว์ Exotic' },
  { value: 'rabbit',      label: '🐰 กระต่าย / สัตว์เล็ก' },
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

// ── 4. ตัวเลือกแท็กความเชี่ยวชาญเพิ่มเติม (Expertise Tags) ──
const expertiseTagOptions = [
  { value: 'rescue_expert',     label: '🆘 ยานพาหนะช่วยชีวิตสัตว์/จับสัตว์' },
  { value: 'medical_care',      label: '💊 ปฐมพยาบาล/ให้ยาสัตว์เบื้องต้น' },
  { value: 'foster_home',       label: '🏡 มีพื้นที่กักตัว/พักฟื้นสัตว์ชั่วคราว' },
  { value: 'pet_photography',   label: '📸 ถ่ายภาพสัตว์เลี้ยงโปรโมทหาบ้าน' },
  { value: 'craftsman_diy',     label: '🛠️ ช่างฝีมือ/ออกแบบวีลแชร์สัตว์พิการ' },
  { value: 'donation_co',       label: '📦 ประสานงานกองทุนและสิ่งของบริจาค' },
  { value: 'digital_creator',   label: '💻 ช่วยทำสื่อดิจิทัล/กราฟิกคอมมูนิตี้' },
]

// ── 5. ตัวเลือกสถานะภาพ ──
const maritalStatusOptions = [
  { value: 'single', label: 'โสด' },
  { value: 'married', label: 'แต่งงานแล้ว' },
  { value: 'complicated', label: 'ไม่เปิดเผย / คลุมเครือ' },
]

const thailandProvinces = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยะลา", "ยโสธร", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อุดรธานี", "อุทัยธานี", "อุตรดิตถ์", "อุบลราชธานี", "อำนาจเจริญ"
].sort()

export default function LoginPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [step, setStep] = useState<'email' | 'profile' | 'success'>('email')
  const [profileSubStep, setProfileSubStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── เพิ่มโครงสร้างตัวแปรของคอลลั่มใหม่ลงใน State ──
  const [formData, setFormData] = useState({
    display_name: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    phone_number: '',
    province: 'นครราชสีมา',
    district: '',       // 🆕 เพิ่มอำเภอ
    subdistrict: '',    // 🆕 เพิ่มตำบล
    address: '',        // 🆕 เพิ่มบ้านเลขที่/ถนน/หมู่บ้าน
    line_id: '',        // 🆕 เพิ่มไอดีไลน์ทั่วไป
    gender: 'unknown',
    avatar_url: '',
    occupation: 'employee',
    community_role: 'general',
    community_role_custom: '', // 🆕 คอลัมน์ Custom Role
    interests: [] as string[],
    expertise_tags: [] as string[], // 🆕 เพิ่มแท็กความเชี่ยวชาญ
    marital_status: 'single'
  })

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setMessage(null)

    try {
      const cleanEmail = email.trim().toLowerCase()
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle()

      if (error) throw error

      if (profile) {
        const { error: signInErr } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        })

        if (signInErr) throw signInErr
        setStep('success')
      } else {
        setStep('profile')
        setProfileSubStep(1)
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการตรวจสอบอีเมล' })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setUploading(true)
    setMessage(null)

    try {
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadErr } = await supabase.storage
        .from('pobpet-bucket')
        .upload(filePath, file)

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('pobpet-bucket')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      setMessage({ type: 'success', text: 'อัปโหลดรูปภาพประจำตัวสำเร็จแล้วค่ะ' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'อัปโหลดรูปภาพไม่สำเร็จ' })
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

  const handleNextSubStep = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!formData.display_name.trim() || !formData.phone_number.trim() || !formData.first_name.trim() || !formData.last_name.trim()) {
      setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลที่จำเป็น (ชื่อแสดงผล, เบอร์โทร, ชื่อ-นามสกุลจริง) ให้ครบถ้วนก่อนไปต่อครับ' })
      return
    }
    setMessage(null)
    setProfileSubStep(2)
  }

  const handleRegisterAndLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const cleanEmail = email.trim().toLowerCase()
      const finalCommunityRole = formData.community_role === 'other' ? formData.community_role_custom.trim() : formData.community_role

      const profileData = {
        display_name: formData.display_name.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        birth_date: formData.birth_date || null,
        phone_number: formData.phone_number.trim(),
        province: formData.province,
        district: formData.district.trim() || null,          // 🆕 บันทึกลงตัวแปร
        subdistrict: formData.subdistrict.trim() || null,    // 🆕 บันทึกลงตัวแปร
        address: formData.address.trim() || null,            // 🆕 บันทึกลงตัวแปร
        line_id: formData.line_id.trim() || null,            // 🆕 บันทึกลงตัวแปร
        gender: formData.gender,
        avatar_url: formData.avatar_url || null,
        occupation: formData.occupation,
        community_role: finalCommunityRole,
        community_role_custom: finalCommunityRole,            // 🆕 ซิงค์ชื่อคอลัมน์โดยตรง
        interests: formData.interests,
        expertise_tags: formData.expertise_tags,             // 🆕 บันทึกลงตัวแปร
        marital_status: formData.marital_status,
        line_user_id: null,                                   // 🆕 คอลัมน์ระบบเริ่มจาก Null
        current_cooldown_until: null                          // 🆕 คอลัมน์ระบบเริ่มจาก Null
      }

      localStorage.setItem('pobpet_pending_registration', JSON.stringify(profileData))

      const { error: authErr } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            pobpet_custom_registration: true,
            ...profileData
          }
        }
      })

      if (authErr) throw authErr
      setStep('success')
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลโปรไฟล์' })
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 text-center">
        <div className="max-w-md w-full p-10 bg-wagashi-matcha border-4 border-black rounded-3xl shadow-paper animate-in zoom-in">
          <CheckCircle2 size={80} className="mx-auto mb-6 text-black" />
          <h2 className="text-3xl font-black mb-4 uppercase">Success!</h2>
          <p className="font-bold text-lg">เราส่งลิงก์เข้าสู่ระบบไปที่ <br/> <span className="underline">{email}</span> แล้วครับ</p>
          <p className="mt-4 text-sm font-bold opacity-70">กรุณาตรวจสอบกล่องจดหมายของคุณเพื่อล็อกอิน</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wagashi-matcha/30 flex flex-col items-center justify-center p-4 selection:bg-black selection:text-white">
      <div className="w-full max-w-2xl bg-white border-4 border-black rounded-3xl p-6 md:p-10 shadow-paper relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-3 bg-black" />
        
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-wagashi-sakura/40 border-2 border-black rounded-2xl mb-4 shadow-paper-sm">
            <Heart className="w-10 h-10 text-black fill-wagashi-sakura animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-black tracking-tight mb-2">
            {step === 'email' ? 'เข้าสู่ระบบ / ลงทะเบียน' : 'สร้างโปรไฟล์ชาว PobPet'}
          </h1>
          <p className="text-gray-600 font-bold text-sm md:text-base">
            {step === 'email' 
              ? 'ร่วมเป็นส่วนหนึ่งของเครือข่ายตามหาสัตว์เลี้ยงและดูแลช่วยเหลือสัตว์ในชุมชน'
              : profileSubStep === 1 
                ? 'ขั้นตอนที่ 1/2: ข้อมูลส่วนตัวหลัก ที่อยู่และช่องทางติดต่อ'
                : 'ขั้นตอนที่ 2/2: เลือกสิ่งที่สนใจและแท็กความเชี่ยวชาญประจำตัว'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.form 
              key="email-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleCheckEmail} 
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="block font-black text-lg text-black flex items-center gap-2">
                  <Mail size={18} /> อีเมลของคุณ
                </label>
                <input 
                  type="email" required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  className="w-full border-4 border-black p-4 rounded-2xl font-bold text-lg outline-none bg-white focus:ring-4 ring-black/5"
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-black text-white py-8 text-xl font-black rounded-2xl border-2 border-black shadow-paper-sm hover:shadow-paper transition-all"
              >
                ดำเนินการต่อ ➔
              </Button>
            </motion.form>
          ) : (
            <motion.div
              key={`profile-step-sub-${profileSubStep}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <form onSubmit={handleRegisterAndLogin} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                
                {/* ── SUB-STEP 1: ข้อมูลประวัติ ที่อยู่ อาชีพ บทบาทชุมชน ── */}
                {profileSubStep === 1 && (
                  <>
                    <div className="md:col-span-2 flex flex-col items-center justify-center pb-2">
                      <div className="relative w-24 h-24 border-4 border-black rounded-full overflow-hidden bg-gray-100 shadow-paper-sm">
                        {formData.avatar_url ? (
                          <Image src={formData.avatar_url} alt="Avatar" fill className="object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <UserCircle size={56} />
                          </div>
                        )}
                        <label className="absolute bottom-0 right-0 left-0 bg-black/70 text-white p-1 text-center cursor-pointer text-xs">
                          <Camera size={12} className="mx-auto" />
                          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black">ชื่อเล่น / ชื่อในระบบ <span className="text-red-500">*</span></label>
                      <input type="text" required value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} placeholder="เช่น whootthira" className="w-full border-2 border-black p-2.5 rounded-xl font-bold" />
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black">เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span></label>
                      <input type="tel" required value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} placeholder="09x-xxx-xxxx" className="w-full border-2 border-black p-2.5 rounded-xl font-bold" />
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black">ชื่อจริง (ภาษาไทย) <span className="text-red-500">*</span></label>
                      <input type="text" required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full border-2 border-black p-2.5 rounded-xl font-bold" />
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black">นามสกุล (ภาษาไทย) <span className="text-red-500">*</span></label>
                      <input type="text" required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full border-2 border-black p-2.5 rounded-xl font-bold" />
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black">วันเกิด</label>
                      <input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} className="w-full border-2 border-black p-2.5 rounded-xl font-bold cursor-pointer" />
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black">เพศ</label>
                      <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full border-2 border-black p-2.5 rounded-xl font-bold bg-white cursor-pointer">
                        <option value="unknown">ไม่ระบุ</option>
                        <option value="male">ชาย</option>
                        <option value="female">หญิง</option>
                        <option value="other">อื่นๆ</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black">สถานภาพ</label>
                      <select value={formData.marital_status} onChange={e => setFormData({...formData, marital_status: e.target.value})} className="w-full border-2 border-black p-2.5 rounded-xl font-bold bg-white cursor-pointer">
                        {maritalStatusOptions.map(status => (<option key={status.value} value={status.value}>{status.label}</option>))}
                      </select>
                    </div>

                    {/* 🆕 ช่องกรอก LINE ID ดึงเข้าคอลัมน์ line_id */}
                    <div className="space-y-1">
                      <label className="font-black text-xs text-black flex items-center gap-1"><MessageSquare size={14}/> LINE ID (ผู้ใช้)</label>
                      <input type="text" value={formData.line_id} onChange={e => setFormData({...formData, line_id: e.target.value})} placeholder="ใส่ไอดีไลน์เพื่อรับงาน" className="w-full border-2 border-black p-2.5 rounded-xl font-bold" />
                    </div>

                    {/* 🏠 เลเยอร์ข้อมูลที่ตั้งและที่อยู่เชิงลึก (address, subdistrict, district, province) */}
                    <div className="space-y-1">
                      <label className="font-black text-xs text-black">จังหวัดประจำการหลัก</label>
                      <select value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} className="w-full border-2 border-black p-2.5 rounded-xl font-bold bg-white cursor-pointer">
                        {thailandProvinces.map(prov => (<option key={prov} value={prov}>{prov}</option>))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black">อำเภอ / เขต</label>
                      <input type="text" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} placeholder="เช่น ด่านขุนทด" className="w-full border-2 border-black p-2.5 rounded-xl font-bold" />
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black">ตำบล / แขวง</label>
                      <input type="text" value={formData.subdistrict} onChange={e => setFormData({...formData, subdistrict: e.target.value})} placeholder="เช่น ด่านขุนทด" className="w-full border-2 border-black p-2.5 rounded-xl font-bold" />
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black flex items-center gap-1"><Home size={14}/> ที่อยู่ / บ้านเลขที่ / ถนน / หมู่บ้าน</label>
                      <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="เช่น 444 หมู่ 1" className="w-full border-2 border-black p-2.5 rounded-xl font-bold" />
                    </div>

                    {/* อาชีพหลักและบทบาท */}
                    <div className="space-y-1">
                      <label className="font-black text-xs text-black flex items-center gap-1"><Briefcase size={14}/> อาชีพหลักของคุณ</label>
                      <select value={formData.occupation} onChange={e => setFormData({...formData, occupation: e.target.value})} className="w-full border-2 border-black p-2.5 rounded-xl font-bold bg-white cursor-pointer">
                        {occupationOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black flex items-center gap-1"><Sparkles size={14}/> บทบาทในเครือข่ายชุมชน</label>
                      <select value={formData.community_role} onChange={e => setFormData({...formData, community_role: e.target.value})} className="w-full border-2 border-black p-2.5 rounded-xl font-bold bg-white cursor-pointer">
                        {expertiseOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                      </select>
                    </div>

                    {formData.community_role === 'other' && (
                      <div className="md:col-span-2 space-y-1">
                        <label className="font-black text-xs text-black">โปรดระบุบทบาทอาชีพเพิ่มเติม (community_role_custom)</label>
                        <input type="text" value={formData.community_role_custom} onChange={e => setFormData({...formData, community_role_custom: e.target.value})} placeholder="เช่น ประธานวิสาหกิจชุมชนนวัตกรรม" className="w-full border-2 border-black p-2.5 rounded-xl font-bold" />
                      </div>
                    )}

                    <Button type="button" onClick={handleNextSubStep} className="md:col-span-2 mt-4 bg-black text-white py-6 text-lg font-black rounded-2xl border-2 border-black shadow-paper-sm hover:shadow-paper transition-all flex items-center justify-center gap-2">
                      เลือกความสนใจและแท็กความเชี่ยวชาญต่อ ➔
                    </Button>
                  </>
                )}

                {/* ── SUB-STEP 2: ความสนใจ (Interests) & แท็กความเชี่ยวชาญ (Expertise Tags) ── */}
                {profileSubStep === 2 && (
                  <>
                    {/* ส่วนเลือกวัตถุประสงค์หลัก (Interests) */}
                    <div className="space-y-3 md:col-span-2 border-4 border-black p-5 rounded-2xl bg-wagashi-matcha/10 shadow-paper-sm">
                      <label className="font-black text-base text-black flex items-center gap-1.5"><Heart size={16} className="fill-black"/> สิ่งที่คุณสนใจและวัตถุประสงค์หลัก (Interests - เลือกได้หลายข้อ)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {interestOptions.map(opt => (
                          <label key={opt.value} className="flex items-center gap-2.5 bg-white border border-black p-2.5 rounded-xl cursor-pointer select-none font-bold text-xs hover:bg-gray-50 shadow-paper-sm">
                            <input type="checkbox" checked={formData.interests.includes(opt.value)} onChange={() => handleInterestChange(opt.value)} className="w-4 h-4 accent-black rounded border-black" />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 🆕 ส่วนเลือกแท็กความเชี่ยวชาญเพิ่มเติม (expertise_tags) */}
                    <div className="space-y-3 md:col-span-2 border-4 border-black p-5 rounded-2xl bg-wagashi-sakura/10 shadow-paper-sm">
                      <label className="font-black text-base text-black flex items-center gap-1.5"><Sparkles size={16} className="fill-black"/> แท็กความเชี่ยวชาญเพื่อช่วยเหลือสัตว์เลี้ยง (Expertise Tags - เลือกได้หลายข้อ)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {expertiseTagOptions.map(opt => (
                          <label key={opt.value} className="flex items-center gap-2.5 bg-white border border-black p-2.5 rounded-xl cursor-pointer select-none font-bold text-xs hover:bg-gray-50 shadow-paper-sm">
                            <input type="checkbox" checked={formData.expertise_tags.includes(opt.value)} onChange={() => handleExpertiseTagChange(opt.value)} className="w-4 h-4 accent-black rounded border-black" />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-3 gap-3 mt-2">
                      <Button type="button" onClick={() => setProfileSubStep(1)} variant="outline" className="col-span-1 border-2 border-black py-7 font-black rounded-2xl bg-white hover:bg-gray-100 text-black flex items-center justify-center gap-1"><ArrowLeft size={14} /> ย้อนกลับ</Button>
                      <Button type="submit" disabled={loading || uploading} className="col-span-2 bg-black text-white py-7 text-lg font-black rounded-2xl border-2 border-black shadow-paper-sm hover:shadow-paper transition-all">
                        {loading || uploading ? <Loader2 className="animate-spin mx-auto" /> : "💾 ยืนยันข้อมูลสำเร็จ & รับ Magic Link"}
                      </Button>
                    </div>
                  </>
                )}
              </form>
              <Button onClick={() => { setStep('email'); setProfileSubStep(1); setMessage(null); }} variant="ghost" className="mt-4 text-gray-500 font-bold hover:text-black rounded-xl px-4 py-2">← ยกเลิกและกลับไปหน้าแรก</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {message && (
          <div className={`mt-6 p-4 rounded-xl border-2 border-black font-bold flex items-center gap-2 text-left ${message.type === 'error' ? 'bg-red-50 border-red-400 text-red-900' : 'bg-green-50 border-green-400 text-green-900'}`}>
            {message.type === 'error' ? <AlertCircle size={18} className="shrink-0 text-red-600" /> : <CheckCircle2 size={18} className="shrink-0 text-green-600" />}
            <span className="text-sm">{message.text}</span>
          </div>
        )}
      </div>
    </div>
  )
}