'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LogIn, Mail, Loader2, CheckCircle2, AlertCircle, 
  UserPlus, MapPin, Phone, Camera, Cake, UserCircle,
  Briefcase, Heart, Sparkles, Smile
} from 'lucide-react'

// ── ตัวเลือกบทบาทชุมชน / อาชีพ ──
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

// ── ตัวเลือกความสนใจ (Interests) ──
const interestOptions = [
  { value: 'dog',         label: '🐕 สุนัข' },
  { value: 'cat',         label: '🐈 แมว' },
  { value: 'bird',        label: '🦜 นกสวยงาม / นกเสียง' },
  { value: 'fish',        label: '🐟 ปลาสวยงาม' },
  { value: 'exotic',      label: '🦎 สัตว์ Exotic' },
  { value: 'rabbit',      label: '🐰 กระต่าย / สัตว์ขนาดเล็ก' },
  { value: 'adopt', label: '🐶 หาบ้านใหม่/รับเลี้ยงสัตว์' },
  { value: 'rescue', label: '🆘 ช่วยเหลือสัตว์เจ็บป่วย/สัตว์จร' },
  { value: 'mating', label: '❤️ หาคู่ผสมพันธุ์ให้น้องๆ' },
  { value: 'showcase', label: '📸 อวดความน่ารัก/ประกวดสัตว์เลี้ยง' },
  { value: 'knowledge', label: '📚 ศึกษาความรู้และการเลี้ยงดู' },
  { value: 'health',      label: '🏥 สุขภาพและการดูแลสัตว์' },
  { value: 'prosthetics', label: '🦿 นวัตกรรม,DIY' },
  { value: 'adoption',    label: '💖 การรับเลี้ยงและหาบ้าน' },
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

// ── ตัวเลือกสถานะ (Marital Status) ──
const maritalStatusOptions = [
  { value: 'single', label: 'โสด' },
  { value: 'married', label: 'แต่งงานแล้ว' },
  { value: 'complicated', label: 'ไม่เปิดเผย / คลุมเครือ' },
]

const thailandProvinces = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยะลา", "ยโสธร", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อุดรธานี", "อุทัยธานี", "อุตรดิตถ์", "อุบลราชธานี", "อำนาจเจริญ"
]

export default function LoginPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [step, setStep] = useState<'email' | 'profile'>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Form Data State ──
  const [formData, setFormData] = useState({
    display_name: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    phone_number: '',
    province: 'กรุงเทพมหานคร',
    gender: 'unknown',
    avatar_url: '',
    community_role: 'general',
    community_role_custom: '',
    interests: [] as string[],
    marital_status: 'single'
  })

  // ── 1. ตรวจสอบ Email และส่ง Magic Link หรือสลับขั้นตอนสร้างโปรไฟล์ ──
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

        setMessage({
          type: 'success',
          text: 'พบข้อมูลโปรไฟล์ของคุณแล้ว! ระบบได้ส่ง Magic Link สำหรับเข้าสู่ระบบไปยังอีเมลของคุณเรียบร้อยแล้วค่ะ'
        })
      } else {
        setStep('profile')
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการตรวจสอบอีเมล' })
    } finally {
      setLoading(false)
    }
  }

  // ── 2. อัปโหลดรูปภาพไปยัง Bucket (pobpet-bucket) ──
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

  // ── จัดการ Checkbox กลุ่มความสนใจ (Interests) ──
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

  // ── 3. บันทึกข้อมูลและรับสิทธิ์ล็อกอินเข้าใช้งาน ──
  const handleRegisterAndLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const cleanEmail = email.trim().toLowerCase()

      const { error: authErr } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (authErr) throw authErr

      const { error: insertErr } = await supabase
        .from('profiles')
        .insert({
          email: cleanEmail,
          display_name: formData.display_name.trim(),
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          birth_date: formData.birth_date || null,
          phone_number: formData.phone_number.trim(),
          province: formData.province,
          gender: formData.gender,
          avatar_url: formData.avatar_url || null,
          community_role: formData.community_role,
          community_role_custom: formData.community_role === 'other' ? formData.community_role_custom.trim() : null,
          interests: formData.interests,
          marital_status: formData.marital_status
        })

      if (insertErr) throw insertErr

      setMessage({
        type: 'success',
        text: 'ลงทะเบียนโปรไฟล์เสร็จสิ้น! เราได้ส่ง Magic Link ไปที่อีเมลของคุณแล้ว กรุณาเปิดกล่องจดหมายเพื่อกดยืนยันการเข้าใช้งานค่ะ'
      })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลโปรไฟล์' })
    } finally {
      setLoading(false)
    }
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
              : 'กรอกข้อมูลส่วนตัวเพื่อเริ่มต้นสร้างเครือข่ายความปลอดภัยให้น้องๆ'}
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
                  className="w-full border-4 border-black p-4 rounded-2xl font-bold text-lg outline-none bg-white focus:ring-4 ring-black/5 placeholder:text-gray-400 transition-all"
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-black text-white py-8 text-xl font-black rounded-2xl border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <span className="flex items-center gap-2 justify-center">
                    ดำเนินการต่อ <LogIn size={20} />
                  </span>
                )}
              </Button>
            </motion.form>
          ) : (
            <motion.div
              key="profile-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <form onSubmit={handleRegisterAndLogin} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* ส่วนอัปโหลด รูปโปรไฟล์ */}
                <div className="md:col-span-2 flex flex-col items-center justify-center pb-4">
                  <div className="relative w-28 h-28 border-4 border-black rounded-full overflow-hidden bg-gray-100 shadow-paper-sm">
                    {formData.avatar_url ? (
                      <Image 
                        src={formData.avatar_url} 
                        alt="Avatar" 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <UserCircle size={64} className="stroke-[1]" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 left-0 bg-black/70 text-white p-1 text-center cursor-pointer transition-colors hover:bg-black">
                      <Camera size={14} className="mx-auto" />
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>
                  <span className="text-xs font-bold text-gray-500 mt-2">รูปโปรไฟล์ (ไม่จำเป็นต้องใส่ตอนนี้ก็ได้ค่ะ)</span>
                </div>

                {/* ชื่อเล่น */}
                <div className="space-y-1.5">
                  <label className="font-black text-sm text-black flex items-center gap-1"><UserPlus size={16}/> ชื่อเล่น / ชื่อในระบบ</label>
                  <input 
                    type="text" required
                    value={formData.display_name}
                    onChange={e => setFormData({...formData, display_name: e.target.value})}
                    placeholder="เช่น พี่สมชาย, มะนาว"
                    className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none focus:ring-4 ring-black/5"
                  />
                </div>

                {/* เบอร์โทร */}
                <div className="space-y-1.5">
                  <label className="font-black text-sm text-black flex items-center gap-1"><Phone size={16}/> เบอร์โทรศัพท์ติดต่อ</label>
                  <input 
                    type="tel" required
                    value={formData.phone_number}
                    onChange={e => setFormData({...formData, phone_number: e.target.value})}
                    placeholder="09x-xxx-xxxx"
                    className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none focus:ring-4 ring-black/5"
                  />
                </div>

                {/* ชื่อจริง */}
                <div className="space-y-1.5">
                  <label className="font-black text-sm text-black">ชื่อจริง (ภาษาไทย)</label>
                  <input 
                    type="text" required
                    value={formData.first_name}
                    onChange={e => setFormData({...formData, first_name: e.target.value})}
                    className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none"
                  />
                </div>

                {/* นามสกุล */}
                <div className="space-y-1.5">
                  <label className="font-black text-sm text-black">นามสกุล (ภาษาไทย)</label>
                  <input 
                    type="text" required
                    value={formData.last_name}
                    onChange={e => setFormData({...formData, last_name: e.target.value})}
                    className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none"
                  />
                </div>

                {/* วันเกิด */}
                <div className="space-y-1.5">
                  <label className="font-black text-sm text-black flex items-center gap-1"><Cake size={16}/> วันเกิด</label>
                  <input 
                    type="date"
                    value={formData.birth_date}
                    onChange={e => setFormData({...formData, birth_date: e.target.value})}
                    className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none cursor-pointer"
                  />
                </div>

                {/* เพศ */}
                <div className="space-y-1.5">
                  <label className="font-black text-sm text-black">เพศ</label>
                  <select 
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                    className="w-full border-2 border-black p-3 rounded-xl font-bold focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="unknown">ไม่ระบุ</option>
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>

                {/* จังหวัด */}
                <div className="space-y-1.5">
                  <label className="font-black text-sm text-black flex items-center gap-1"><MapPin size={16}/> จังหวัดประจำการหลัก</label>
                  <select 
                    value={formData.province}
                    onChange={e => setFormData({...formData, province: e.target.value})}
                    className="w-full border-2 border-black p-3 rounded-xl font-bold focus:bg-white outline-none cursor-pointer"
                  >
                    {thailandProvinces.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                {/* สถานะภาพ */}
                <div className="space-y-1.5">
                  <label className="font-black text-sm text-black flex items-center gap-1"><Smile size={16}/> สถานะภาพ</label>
                  <select 
                    value={formData.marital_status}
                    onChange={e => setFormData({...formData, marital_status: e.target.value})}
                    className="w-full border-2 border-black p-3 rounded-xl font-bold focus:bg-white outline-none cursor-pointer"
                  >
                    {maritalStatusOptions.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                {/* 🟢 อาชีพ / บทบาทชุมชน (แก้ไขจุดที่ตกหล่นและผูก State ครบถ้วน) */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-black text-sm text-black flex items-center gap-1">
                    <Briefcase size={16} /> บทบาทในเครือข่ายสัตว์เลี้ยง (อาชีพ)
                  </label>
                  <select 
                    value={formData.community_role}
                    onChange={e => setFormData({...formData, community_role: e.target.value})}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold focus:bg-white outline-none transition-colors cursor-pointer"
                  >
                    {expertiseOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* ฟิลด์ระบุเพิ่มเติมเมื่อเลือก "อื่นๆ" */}
                {formData.community_role === 'other' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="md:col-span-2 space-y-1.5 overflow-hidden"
                  >
                    <label className="font-black text-sm text-black">โปรดระบุอาชีพหรือบทบาทของคุณ</label>
                    <input 
                      type="text"
                      value={formData.community_role_custom}
                      onChange={e => setFormData({...formData, community_role_custom: e.target.value})}
                      placeholder="เช่น ช่างภาพจิตอาสาช่วยเหลือศูนย์จร"
                      className="w-full border-2 border-black p-3.5 rounded-xl font-bold outline-none"
                    />
                  </motion.div>
                )}

                {/* วัตถุประสงค์ / ความสนใจหลัก */}
                <div className="space-y-2 md:col-span-2 border-2 border-dashed border-black/30 p-4 rounded-2xl bg-wagashi-matcha/10">
                  <label className="font-black text-sm text-black flex items-center gap-1 mb-1">
                    <Sparkles size={16} className="text-amber-500 fill-amber-500"/> วัตถุประสงค์ / ความสนใจหลัก (เลือกได้มากกว่า 1 ข้อ)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {interestOptions.map(opt => (
                      <label key={opt.value} className="flex items-center gap-3 bg-white border border-black p-3 rounded-xl cursor-pointer select-none font-bold text-xs hover:bg-gray-50 transition-all">
                        <input 
                          type="checkbox"
                          checked={formData.interests.includes(opt.value)}
                          onChange={() => handleInterestChange(opt.value)}
                          className="w-4 h-4 accent-black rounded border-black focus:ring-0"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                
                <p className="text-[10px] font-bold text-gray-500 mt-1 italic md:col-span-2 ml-1">
                  * ข้อมูลนี้จะช่วยให้เราสร้างเครือข่ายความช่วยเหลือในชุมชนได้แข็งแกร่งขึ้น
                </p>

                <Button disabled={loading || uploading} className="md:col-span-2 mt-4 bg-black text-white py-8 text-xl font-black rounded-2xl border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50">
                  {loading || uploading ? <Loader2 className="animate-spin" /> : "บันทึกโปรไฟล์และรับ Magic Link เพื่อเข้าใช้งาน"}
                </Button>
              </form>
              
              <Button onClick={() => setStep('email')} variant="ghost" className="mt-4 text-gray-500 font-bold hover:text-black hover:bg-gray-100 rounded-xl px-4 py-2">
                ← กลับไปหน้าแรก
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {message && (
          <div className={`mt-6 p-4 rounded-xl border-2 border-black font-bold flex items-center gap-2 text-left ${
            message.type === 'error' ? 'bg-red-50 border-red-400 text-red-900' : 'bg-green-50 border-green-400 text-green-900'
          }`}>
            {message.type === 'error' ? <AlertCircle size={18} className="shrink-0 text-red-600" /> : <CheckCircle2 size={18} className="shrink-0 text-green-600" />}
            <span className="text-sm">{message.text}</span>
          </div>
        )}
        
      </div>
    </div>
  )
}