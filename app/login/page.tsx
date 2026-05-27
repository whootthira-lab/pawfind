'use client'
// app/login/page.tsx (V4 - Multiple Community Roles Selection Style)

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LogIn, Mail, Loader2, CheckCircle2, AlertCircle, 
  UserPlus, MapPin, Phone, Camera, Cake, UserCircle,
  Briefcase, Heart, Sparkles, Smile, ChevronRight, ArrowLeft,
  Home, MessageSquare, PawPrint, Lock, Eye, EyeOff
} from 'lucide-react'

const expertiseOptions = [
  { value: 'general', label: 'ผู้ใช้งานทั่วไป (พร้อมช่วยเป็นหูเป็นตา)' },
  { value: 'adopt',       label: '🐶 หาบ้านใหม่ / รับเลี้ยง' },
  { value: 'rescue',      label: '🆘 ค้นหาสัตว์หาย/แจ้งพบสัตว์หลงหรือจร' },
  { value: 'mating',      label: '❤️ หาคู่ผสมพันธุ์ให้น้องๆ' },
  { value: 'showcase',    label: '📸 อวดความน่ารัก/ประกวดสัตว์เลี้ยง' },
  { value: 'knowledge',   label: '📚 ศึกษาความรู้และการเลี้ยงดู' },
  { value: 'petscout', label: '🔍 สร้างรายได้จากการช่วยตามหาสัตว์หาย(PetScout)' },
  { value: 'vet', label: '🏥 ประชาสัมพันธ์ คลินิกรักษาสัตว์' },
  { value: 'groomer', label: '🪮 ประชาสัมพันธ์ บริการอาบน้ำตัดขน / โรงแรมสัตว์' },
  { value: 'petsitter', label: '🏩 ประชาสัมพันธ์ บริการรับฝากหรือดูแลสัตว์ที่บ้าน' },
  { value: 'retailer', label: '🛍️ ประชาสัมพันธ์ ร้านจำหน่ายอาหารและอุปกรณ์สัตว์เลี้ยง' },
  { value: 'announce', label: '📢 ประชาสัมพันธ์ข่าว/กิจกรรม' },
  { value: 'other', label: 'อื่นๆ (โปรดระบุ)' },
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

const expertiseTagOptions = [
  { value: 'rescue_expert',     label: '🚑 ยานพาหนะช่วยชีวิตสัตว์/จับสัตว์' },
  { value: 'medical_care',      label: '💊 ปฐมพยาบาล/ให้ยาสัตว์เบื้องต้น' },
  { value: 'foster_home',       label: '🏡 มีพื้นที่กักตัว/พักฟื้นสัตว์ชั่วคราว' },
  { value: 'pet_photography',   label: '📸 ถ่ายภาพสัตว์เลี้ยงโปรโมทหาบ้าน' },
  { value: 'craftsman_diy',     label: '🛠️ ช่างฝีมือ/ออกแบบวีลแชร์สัตว์พิการ' },
  { value: 'donation_co',       label: '📦 ประสานงานกองทุนและสิ่งของบริจาค' },
  { value: 'digital_creator',   label: '💻 ช่วยทำสื่อดิจิทัล/กราฟิกคอมมูนิตี้' },
  { value: 'volunteer', label: '🛌 อาสาสมัคร / ศูนย์พักพิงสัตว์' },
  { value: 'petscout', label: '🔍 PetScout (นักตามหาสัตว์หาย)' },
  { value: 'none', label: 'ไม่มี' },
  { value: 'other', label: 'อื่นๆ' },
]

const maritalStatusOptions = [
  { value: 'single', label: 'โสด' },
  { value: 'married', label: 'แต่งงานแล้ว' },
  { value: 'complicated', label: 'ไม่เปิดเผย / คลุมเครือ' },
]

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

const thailandProvinces = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยะลา", "ยโสธร", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อุดรธานี", "อุทัยธานี", "อุตรดิตถ์", "อุบลราชธานี", "อำนาจเจริญ"
].sort()

// ── Generation Calculator ─────────────────────────────────────
function getGeneration(birthDate: string): { gen: string; emoji: string; age: number } | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const today = new Date()
  const year  = birth.getFullYear()
  let age = today.getFullYear() - year
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--

  let gen = '', emoji = ''
  if (year >= 1928 && year <= 1945) { gen = 'Silent Generation'; emoji = '🎖' }
  else if (year >= 1946 && year <= 1964) { gen = 'Baby Boomer'; emoji = '🌸' }
  else if (year >= 1965 && year <= 1979) { gen = 'Gen X'; emoji = '📼' }
  else if (year >= 1980 && year <= 1994) { gen = 'Millennials (Gen Y)'; emoji = '💻' }
  else if (year >= 1995 && year <= 2009) { gen = 'Gen Z'; emoji = '📱' }
  else if (year >= 2010) { gen = 'Gen Alpha'; emoji = '🤖' }
  else return null

  return { gen, emoji, age }
}

export default function LoginPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [step,           setStep]           = useState<'email' | 'profile' | 'success'>('email')
  const [loginMode,      setLoginMode]      = useState<'otp' | 'password'>('password')  // ← default: password
  const [profileSubStep, setProfileSubStep] = useState<1 | 2>(1)
  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [showPassword,   setShowPassword]   = useState(false)
  const [isNewUser,      setIsNewUser]      = useState(false)
  const [loading,        setLoading]        = useState(false)
  const [uploading,      setUploading]      = useState(false)
  const [message,        setMessage]        = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
    // ── 🟢 ปรับเปลี่ยนค่าตั้งต้นใน State หน้าบ้านให้รองรับเป็น Array เพื่อการเลือกหลายข้อ ──
    community_role: [] as string[], 
    community_role_custom: '',
    interests: [] as string[],
    expertise_tags: [] as string[],
    marital_status: 'single'
  })

  // ── Google Login ──────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) throw error
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Google Login ไม่สำเร็จ' })
      setLoading(false)
    }
  }

  // ── Email + Password / OTP ────────────────────────────────────
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setMessage(null)

    try {
      const cleanEmail = email.trim().toLowerCase()

      // ── Password mode ─────────────────────────────────────────
      if (loginMode === 'password') {
        if (!password.trim()) {
          setMessage({ type: 'error', text: 'กรุณากรอกรหัสผ่าน' })
          setLoading(false)
          return
        }

        // เช็คว่า user มีอยู่แล้วไหม
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', cleanEmail)
          .maybeSingle()

        if (profile) {
          // Login ด้วย password
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          })
          if (signInErr) {
            // Password ผิด → แนะนำ OTP
            if (signInErr.message.includes('Invalid login credentials')) {
              setMessage({ type: 'error', text: 'รหัสผ่านไม่ถูกต้อง หรือยังไม่ได้ตั้งรหัสผ่าน ลอง "ส่ง Magic Link" แทนได้ครับ' })
            } else {
              throw signInErr
            }
            return
          }
          // Login สำเร็จ → redirect
          window.location.href = '/auth/callback?next=/'
        } else {
          // User ใหม่ → สร้าง account ด้วย password
          setIsNewUser(true)
          setStep('profile')
          setProfileSubStep(1)
        }
        return
      }

      // ── OTP mode ──────────────────────────────────────────────
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle()

      if (profile) {
        const { error: signInErr } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
        })
        if (signInErr) throw signInErr
        setStep('success')
      } else {
        setIsNewUser(true)
        setStep('profile')
        setProfileSubStep(1)
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาด' })
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
      const filePath = `${fileName}`

      const { error: uploadErr } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file)

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      setMessage({ type: 'success', text: 'อัปโหลดรูปภาพประจำตัวสำเร็จแล้ว' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'อัปโหลดรูปภาพไม่สำเร็จ' })
    } finally {
      setUploading(false)
    }
  }

  // ── 🟢 ฟังก์ชันคอยดักการติ๊กเลือกของเป้าหมาย/บทบาทชุมชนแบบหลายข้อ ──
  const handleCommunityRoleChange = (value: string) => {
    setFormData(prev => {
      const current = [...prev.community_role]
      if (current.includes(value)) {
        return { ...prev, community_role: current.filter(r => r !== value) }
      } else {
        return { ...prev, community_role: [...current, value] }
      }
    })
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
    // ── 🟢 ตรวจสอบความถูกต้องว่าต้องเลือกเป้าหมายบทบาทอย่างน้อย 1 ข้อ ──
    if (formData.community_role.length === 0) {
      setMessage({ type: 'error', text: 'กรุณาเลือกเป้าหมายในการใช้งานอย่างน้อย 1 ข้อก่อนไปต่อ' })
      return
    }
    setMessage(null)
    setProfileSubStep(2)
  }

  const handleRegisterAndLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // ── ตรวจสอบ birth_date บังคับ ─────────────────────────────
    if (!formData.birth_date) {
      setMessage({ type: 'error', text: 'กรุณากรอกวันเดือนปีเกิด (บังคับ)' })
      setLoading(false)
      return
    }

    try {
      const cleanEmail = email.trim().toLowerCase()
      const roleJoinedString = formData.community_role.join(',')
      const genInfo = getGeneration(formData.birth_date)

      const profileData = {
        display_name:          formData.display_name.trim(),
        first_name:            formData.first_name.trim(),
        last_name:             formData.last_name.trim(),
        birth_date:            formData.birth_date,
        age:                   genInfo?.age || null,
        generation:            genInfo?.gen || null,
        phone_number:          formData.phone_number.trim(),
        province:              formData.province,
        district:              formData.district.trim() || null,
        subdistrict:           formData.subdistrict.trim() || null,
        address:               formData.address.trim() || null,
        line_id:               formData.line_id.trim() || null,
        gender:                formData.gender,
        avatar_url:            formData.avatar_url || null,
        occupation:            formData.occupation,
        community_role:        roleJoinedString,
        community_role_custom: formData.community_role.includes('other') ? formData.community_role_custom.trim() : roleJoinedString,
        interests:             formData.interests,
        expertise_tags:        formData.expertise_tags,
        marital_status:        formData.marital_status,
        line_user_id:          null,
        current_cooldown_until: null,
      }

      localStorage.setItem('pobpet_pending_registration', JSON.stringify(profileData))

      // ── Password signup หรือ OTP signup ───────────────────────
      if (loginMode === 'password' && password.trim()) {
        const { error: signUpErr } = await supabase.auth.signUp({
          email:    cleanEmail,
          password: password.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { pobpet_custom_registration: true, ...profileData },
          },
        })
        if (signUpErr) throw signUpErr
        setStep('success')
      } else {
        const { error: authErr } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { pobpet_custom_registration: true, ...profileData },
          },
        })
        if (authErr) throw authErr
        setStep('success')
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' })
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
            <PawPrint className="w-10 h-10 text-black fill-wagashi-sakura animate-pulse" />
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
              className="space-y-4"
            >
              {/* ── Google Login ── */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 border-4 border-black
                  bg-white py-4 rounded-2xl font-black text-lg shadow-paper-sm
                  hover:shadow-paper hover:-translate-y-1 transition-all disabled:opacity-50"
              >
                {loading
                  ? <Loader2 size={22} className="animate-spin" />
                  : <>
                      <svg width="22" height="22" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                      เข้าสู่ระบบด้วย Google
                    </>
                }
              </button>

              {/* ── Divider ── */}
              <div className="flex items-center gap-3 text-gray-400 font-bold text-sm">
                <div className="flex-1 h-0.5 bg-gray-200" />
                หรือใช้อีเมล
                <div className="flex-1 h-0.5 bg-gray-200" />
              </div>

              {/* ── Email ── */}
              <div className="space-y-2">
                <label className="block font-black text-sm text-black flex items-center gap-2">
                  <Mail size={16} /> อีเมล
                </label>
                <input 
                  type="email" required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  className="w-full border-4 border-black p-4 rounded-2xl font-bold text-lg
                    outline-none bg-white focus:ring-4 ring-black/5 placeholder:text-gray-400"
                />
              </div>

              {/* ── Password (ถ้าเลือก mode password) ── */}
              {loginMode === 'password' && (
                <div className="space-y-2">
                  <label className="block font-black text-sm text-black flex items-center gap-2">
                    <Lock size={16} /> รหัสผ่าน
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                      className="w-full border-4 border-black p-4 rounded-2xl font-bold text-lg
                        outline-none bg-white focus:ring-4 ring-black/5 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Toggle mode ── */}
              <div className="flex items-center justify-between text-sm font-bold">
                <button
                  type="button"
                  onClick={() => { setLoginMode(m => m === 'password' ? 'otp' : 'password'); setMessage(null) }}
                  className="text-gray-500 hover:text-black underline underline-offset-2 transition-colors"
                >
                  {loginMode === 'password'
                    ? '📧 ใช้ Magic Link แทน (ไม่ต้องจำรหัสผ่าน)'
                    : '🔑 ใช้รหัสผ่านแทน'
                  }
                </button>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-black text-white py-7 text-xl font-black rounded-2xl
                  border-2 border-black shadow-paper-sm hover:shadow-paper
                  hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50"
              >
                {loading
                  ? <Loader2 className="animate-spin mx-auto" />
                  : loginMode === 'password'
                    ? <span className="flex items-center gap-2 justify-center"><LogIn size={20} /> เข้าสู่ระบบ</span>
                    : <span className="flex items-center gap-2 justify-center"><Mail size={20} /> ส่ง Magic Link</span>
                }
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
                        <label className="absolute bottom-0 right-0 left-0 bg-black/70 text-white p-1 text-center cursor-pointer text-xs transition-colors hover:bg-black">
                          <Camera size={12} className="mx-auto" />
                          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        </label>
                      </div>
                      <span className="text-xs font-bold text-gray-500 mt-2">รูปโปรไฟล์ (ไม่จำเป็นต้องใส่ตอนนี้ก็ได้)</span>
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black flex items-center gap-1"><UserPlus size={16}/> ชื่อเล่น / ชื่อในระบบ <span className="text-red-500">*</span></label>
                      <input 
                        type="text" required
                        value={formData.display_name}
                        onChange={e => setFormData({...formData, display_name: e.target.value})}
                        placeholder="เช่น พี่สมชาย, มะนาว"
                        className="w-full border-2 border-black p-2.5 rounded-xl font-bold outline-none focus:ring-4 ring-black/5"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black flex items-center gap-1"><Phone size={16}/> เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span></label>
                      <input 
                        type="tel" required
                        value={formData.phone_number}
                        onChange={e => setFormData({...formData, phone_number: e.target.value})}
                        placeholder="09x-xxx-xxxx"
                        className="w-full border-2 border-black p-2.5 rounded-xl font-bold outline-none focus:ring-4 ring-black/5"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black">ชื่อจริง (ภาษาไทย) <span className="text-red-500">*</span></label>
                      <input 
                        type="text" required
                        value={formData.first_name}
                        onChange={e => setFormData({...formData, first_name: e.target.value})}
                        className="w-full border-2 border-black p-2.5 rounded-xl font-bold outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black">นามสกุล (ภาษาไทย) <span className="text-red-500">*</span></label>
                      <input 
                        type="text" required
                        value={formData.last_name}
                        onChange={e => setFormData({...formData, last_name: e.target.value})}
                        className="w-full border-2 border-black p-2.5 rounded-xl font-bold outline-none"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="font-black text-xs text-black flex items-center gap-1">
                        <Cake size={16}/> วันเกิด <span className="text-red-500">*</span>
                        <span className="text-gray-400 font-bold">(บังคับ — ใช้คำนวณอายุและ Generation)</span>
                      </label>
                      <input 
                        type="date"
                        required
                        value={formData.birth_date}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={e => setFormData({...formData, birth_date: e.target.value})}
                        className="w-full border-2 border-black p-2.5 rounded-xl font-bold outline-none cursor-pointer"
                      />
                      {/* ── Auto-calculate age + generation ── */}
                      {formData.birth_date && (() => {
                        const info = getGeneration(formData.birth_date)
                        if (!info) return null
                        return (
                          <div className="mt-1.5 flex items-center gap-2 p-2.5 bg-wagashi-matcha/20
                            border-2 border-black rounded-xl font-bold text-sm">
                            <span className="text-xl">{info.emoji}</span>
                            <div>
                              <span className="text-black">อายุ {info.age} ปี</span>
                              <span className="mx-2 text-gray-400">|</span>
                              <span className="text-ori-orange">{info.gen}</span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black">เพศ</label>
                      <select 
                        value={formData.gender}
                        onChange={e => setFormData({...formData, gender: e.target.value})}
                        className="w-full border-2 border-black p-2.5 rounded-xl font-bold focus:bg-white outline-none cursor-pointer"
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
                        className="w-full border-2 border-black p-2.5 rounded-xl font-bold focus:bg-white outline-none cursor-pointer"
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
                        className="w-full border-2 border-black p-2.5 rounded-xl font-bold outline-none focus:ring-4 ring-black/5"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black flex items-center gap-1"><MapPin size={16}/> จังหวัดประจำการหลัก</label>
                      <select 
                        value={formData.province}
                        onChange={e => setFormData({...formData, province: e.target.value})}
                        className="w-full border-2 border-black p-2.5 rounded-xl font-bold focus:bg-white outline-none cursor-pointer"
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
                        className="w-full border-2 border-black p-2.5 rounded-xl font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black">ตำบล / แขวง</label>
                      <input 
                        type="text"
                        value={formData.subdistrict}
                        onChange={e => setFormData({...formData, subdistrict: e.target.value})}
                        placeholder="เช่น ด่านขุนทด"
                        className="w-full border-2 border-black p-2.5 rounded-xl font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black flex items-center gap-1"><Home size={14}/> ที่อยู่ / บ้านเลขที่ / ถนน / หมู่บ้าน</label>
                      <input 
                        type="text"
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        placeholder="บ้านเลขที่,ซอย,หมู่"
                        className="w-full border-2 border-black p-2.5 rounded-xl font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-xs text-black flex items-center gap-1"><Briefcase size={14}/> อาชีพหลักของคุณ</label>
                      <select 
                        value={formData.occupation}
                        onChange={e => setFormData({...formData, occupation: e.target.value})}
                        className="w-full border-2 border-black p-2.5 rounded-xl font-bold focus:bg-white outline-none cursor-pointer"
                      >
                        {occupationOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* ── 🟢 [ปรับปรุง] เปลี่ยนรูปแบบจาก Dropdown ข้อความเดี่ยว เป็นแผงเลือกกลุ่ม Checkbox Neubrutalism หลายข้อ ── */}
                    <div className="space-y-3 md:col-span-2 border-4 border-black p-5 rounded-2xl bg-amber-50/20 shadow-paper-sm mt-2">
                      <label className="font-black text-base text-black flex items-center gap-1.5">
                        <Sparkles size={16} className="fill-black"/> เป้าหมายในการใช้งาน / บทบาทในเครือข่ายชุมชน (เลือกได้มากกว่า 1 ข้อ) <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {expertiseOptions.map(opt => (
                          <label key={opt.value} className="flex items-center gap-2.5 bg-white border border-black p-2.5 rounded-xl cursor-pointer select-none font-bold text-xs hover:bg-gray-50 transition-all shadow-paper-sm">
                            <input 
                              type="checkbox" 
                              checked={formData.community_role.includes(opt.value)} 
                              onChange={() => handleCommunityRoleChange(opt.value)} 
                              className="w-4 h-4 accent-black rounded border-black focus:ring-0 cursor-pointer" 
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    {formData.community_role.includes('other') && (
                      <div className="md:col-span-2 space-y-1 animate-in fade-in duration-200">
                        <label className="font-black text-xs text-black">โปรดระบุวัตถุประสงค์การเข้าใช้หรือบทบาทอาชีพเกี่ยวกับสัตว์เพิ่มเติม</label>
                        <input 
                          type="text"
                          value={formData.community_role_custom}
                          onChange={e => setFormData({...formData, community_role_custom: e.target.value})}
                          placeholder="เช่น ช่างภาพช่วยถ่ายรูปสัตว์พิการ, PetScout (นักตามหาสัตว์หาย) "
                          className="w-full border-2 border-black p-2.5 rounded-xl font-bold"
                        />
                      </div>
                    )}

                    <Button type="button" onClick={handleNextSubStep} className="md:col-span-2 mt-4 bg-black text-white py-6 text-lg font-black rounded-2xl border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2">
                      หน้าถัดไป ➔
                    </Button>
                  </>
                )}

                {profileSubStep === 2 && (
                  <>
                    <div className="space-y-3 md:col-span-2 border-4 border-black p-5 rounded-2xl bg-wagashi-matcha/10 shadow-paper-sm">
                      <label className="font-black text-base text-black flex items-center gap-1.5"><Heart size={16} className="fill-black"/> โปรดเลือกสิ่งที่คุณสนใจเพื่อเป็นแนวทางในการพัฒนาระบบ(Interests - เลือกได้หลายข้อ)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {interestOptions.map(opt => (
                          <label key={opt.value} className="flex items-center gap-2.5 bg-white border border-black p-2.5 rounded-xl cursor-pointer select-none font-bold text-xs hover:bg-gray-50 shadow-paper-sm">
                            <input type="checkbox" checked={formData.interests.includes(opt.value)} onChange={() => handleInterestChange(opt.value)} className="w-4 h-4 accent-black rounded border-black focus:ring-0 cursor-pointer" />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 md:col-span-2 border-4 border-black p-5 rounded-2xl bg-wagashi-sakura/10 shadow-paper-sm">
                      <label className="font-black text-base text-black flex items-center gap-1.5"><Sparkles size={16} className="fill-black"/>ความเชี่ยวชาญหรือด้านที่ต้องการช่วยเหลือสัตว์ (Expertise Tags - เลือกได้หลายข้อ)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {expertiseTagOptions.map(opt => (
                          <label key={opt.value} className="flex items-center gap-2.5 bg-white border border-black p-2.5 rounded-xl cursor-pointer select-none font-bold text-xs hover:bg-gray-50 shadow-paper-sm">
                            <input type="checkbox" checked={formData.expertise_tags.includes(opt.value)} onChange={() => handleExpertiseTagChange(opt.value)} className="w-4 h-4 accent-black rounded border-black focus:ring-0 cursor-pointer" />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-3 gap-3 mt-2">
                      <Button type="button" onClick={() => setProfileSubStep(1)} variant="outline" className="col-span-1 border-2 border-black py-7 font-black rounded-2xl bg-white hover:bg-gray-100 text-black flex items-center justify-center gap-1"><ArrowLeft size={14} /> ย้อนกลับ</Button>
                      <Button type="submit" disabled={loading || uploading} className="col-span-2 bg-black text-white py-7 text-lg font-black rounded-2xl border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50">
                        {loading || uploading ? <Loader2 className="animate-spin mx-auto" /> : "💾 ยืนยันและบันทึกข้อมูล"}
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