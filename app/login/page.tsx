'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LogIn, Mail, Loader2, CheckCircle2, AlertCircle, 
  UserPlus, MapPin, Phone, Camera, Link as LinkIcon, Cake, UserCircle,
  Briefcase, Heart
} from 'lucide-react'

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

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'register' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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
    interests: [] as string[]
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      setUploading(true)
      setMessage(null)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)
        
      if (publicUrl) {
         setFormData({ ...formData, avatar_url: publicUrl })
      }
      
    } catch (error: any) {
      console.error('Upload Error:', error)
      setMessage({ type: 'error', text: 'อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' })
    } finally {
      setUploading(false)
    }
  }

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setMessage(null)

    const cleanEmail = email.trim().toLowerCase()

    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (error) {
      console.error('Check email error:', error)
      setMessage({ type: 'error', text: 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง' })
      setLoading(false)
      return
    }

    if (data) {
      // 🟢 บัญชีมีอยู่แล้ว ส่งลิงก์เข้าสู่ระบบได้เลย
      await handleSendOTP(cleanEmail)
    } else {
      // ผู้ใช้งานใหม่ ไปหน้ากรอกฟอร์มลงทะเบียน
      setStep('register')
      setLoading(false)
    }
  }

  const handleSendOTP = async (targetEmail: string, authMetadata = {}) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: authMetadata // แนบข้อมูลชั้นเดียวธรรมดาไปที่ Auth Meta
      },
    })

    if (error) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด: ' + error.message })
      setLoading(false)
    } else {
      setStep('success')
      setLoading(false)
    }
  }

  // 🟢 ฟังก์ชันแก้ไขใหม่: บันทึกลงฐานข้อมูลตรงๆ ป้องกันข้อมูล Array ตกหล่นจากการส่งผ่านอีเมล
  const handleRegisterAndLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.display_name.trim()) {
      setMessage({ type: 'error', text: 'กรุณากรอกชื่อโปรไฟล์ที่จะใช้แสดงผล' })
      return
    }
    if (!formData.gender) {
      setMessage({ type: 'error', text: 'กรุณาเลือกเพศของคุณเพื่อความสมบูรณ์ของระบบค่ะ' })
      return
    }

    setLoading(true)
    setMessage(null)

    const cleanEmail = email.trim().toLowerCase()

    try {
      // 1. สั่งให้สุ่มสร้างรหัส ID ชั่วคราวก่อน (หรือใช้ระบบจอง ID ของคลาส Supabase)
      // เพื่อความชัวร์ในขั้นตอนนี้ เราจะยิงบันทึกข้อมูลดิบลงตาราง profiles โดยระบุอีเมลเป็นตัวเชื่อมโยงหลัก
      // ข้อมูลความสนใจประเภท Array (interests) จะถูกเซฟเข้าตารางเรียบร้อย ไม่หายแน่นอน!
      
      const roleFinal = formData.community_role === 'other' ? formData.community_role_custom : formData.community_role

      // ลบข้อมูลขยะเก่าออก (ถ้าเคยลงทะเบียนค้างไว้แต่เมลไม่ผ่าน)
      await supabase.from('profiles').delete().eq('email', cleanEmail)

      // บันทึกฟอร์มลงตารางตรงๆ ชิ้นส่วน Array จะอยู่ครบ 100%
      const { error: insertErr } = await supabase
        .from('profiles')
        .insert({
          email:          cleanEmail,
          display_name:   formData.display_name.trim(),
          first_name:     formData.first_name.trim(),
          last_name:      formData.last_name.trim(),
          birth_date:     formData.birth_date || null,
          tel:            formData.phone_number.trim(), // แมปตัวแปรให้ตรงกับตาราง profiles
          gender:         formData.gender,
          line_id:        formData.line_id.trim() || null,
          avatar_url:     formData.avatar_url || null,
          address:        formData.address.trim() || null,
          province:       formData.province,
          district:       formData.district.trim() || null,
          subdistrict:    formData.subdistrict.trim() || null,
          contact_link:   formData.contact_link.trim() || null,
          community_role: roleFinal,
          occupation:     formData.occupation || null,
          interests:      formData.interests // Array อยู่ครบถ้วน!
        })

      if (insertErr) throw insertErr

      // 2. ส่ง Magic Link ไปที่อีเมล โดยแนบชื่อไปใน Metadata ฝั่ง Auth เพื่อยืนยันสิทธิ์ลิงก์คู่ขนาน
      await handleSendOTP(cleanEmail, { display_name: formData.display_name.trim() })

    } catch (err: any) {
      console.error('[Register Error]:', err)
      setMessage({ type: 'error', text: 'บันทึกโปรไฟล์ไม่สำเร็จ: ' + (err.message || 'โครงสร้างข้อมูลไม่สอดคล้อง') })
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
          <p className="mt-4 text-sm font-bold opacity-70">กรุณาตรวจสอบกล่องข้อความของคุณเพื่อล็อกอิน</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 py-20 bg-gray-50/30">
      <div className="max-w-2xl w-full p-8 bg-white border-4 border-black rounded-3xl shadow-paper">
        
        {step === 'email' ? (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-center mb-6">
              <div className="bg-wagashi-kinako border-2 border-black p-4 rounded-full shadow-paper-sm">
                <LogIn size={42} />
              </div>
            </div>
            <h1 className="text-3xl font-black text-center mb-2 italic tracking-tight uppercase">PobPet Login</h1>
            <p className="text-center font-bold text-gray-400 mb-8 uppercase tracking-widest text-xs">Community Connectivity</p>
            
            <form onSubmit={handleCheckEmail} className="space-y-4">
              <div className="space-y-2 text-left">
                <label className="font-black text-sm ml-1">กรอกอีเมลเข้าสู่ระบบ (Magic Link)</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" 
                  className="w-full border-4 border-black rounded-xl px-4 py-4 font-bold text-lg focus:ring-8 ring-black/5 outline-none transition-all"
                />
              </div>
              <Button disabled={loading} className="w-full bg-black text-white py-8 text-xl font-black rounded-2xl border-2 border-black shadow-paper-sm hover:shadow-paper transition-all active:translate-y-1">
                {loading ? <Loader2 className="animate-spin" /> : "ดำเนินการต่อ ➔"}
              </Button>
            </form>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-3 mb-8 border-b-4 border-black pb-4 text-left">
              <UserPlus size={32} className="text-wagashi-matcha" />
              <h2 className="text-2xl font-black italic uppercase">Register Profile</h2>
            </div>
            
            <form onSubmit={handleRegisterAndLogin} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
              
              <div className="md:col-span-2 bg-gray-50 p-6 border-4 border-black rounded-2xl flex flex-col items-center gap-4 shadow-inner">
                <div className="w-28 h-28 bg-white rounded-full border-4 border-black flex items-center justify-center overflow-hidden shadow-paper-sm relative group">
                  {formData.avatar_url ? (
                    <Image 
                      src={formData.avatar_url} 
                      alt="Profile Preview" 
                      fill
                      className="object-cover"
                      sizes="(max-width: 112px) 100vw, 112px"
                    />
                  ) : (
                    <Camera size={32} className="text-gray-300" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" />
                    </div>
                  )}
                </div>
                <label className="cursor-pointer bg-wagashi-kinako border-2 border-black px-6 py-2 rounded-xl font-black hover:shadow-paper-sm transition-all active:translate-y-1">
                  {uploading ? 'กำลังจัดการไฟล์...' : 'เลือกรูปโปรไฟล์ของคุณ'}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="font-black text-sm ml-1 flex items-center gap-1 uppercase text-ori-orange-d">
                  <UserCircle size={16}/> ชื่อโปรไฟล์ที่จะใช้แสดง (Display Name) *
                </label>
                <input 
                  required 
                  placeholder="เช่น ลักกี้ (ไม่ต้องแสดงชื่อจริง)" 
                  className="w-full border-4 border-black rounded-xl p-4 font-bold text-lg focus:bg-orange-50 outline-none transition-colors shadow-paper-sm" 
                  onChange={e => setFormData({...formData, display_name: e.target.value})} 
                />
              </div>

              <div className="space-y-1">
                <label className="font-black text-sm ml-1 uppercase text-gray-500">ชื่อจริง</label>
                <input required className="w-full border-2 border-black rounded-lg p-3 font-bold focus:bg-gray-50 outline-none transition-colors" 
                  onChange={e => setFormData({...formData, first_name: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="font-black text-sm ml-1 uppercase text-gray-500">นามสกุล</label>
                <input required className="w-full border-2 border-black rounded-lg p-3 font-bold focus:bg-gray-50 outline-none transition-colors" 
                  onChange={e => setFormData({...formData, last_name: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="font-black text-sm ml-1 text-gray-500 uppercase">เพศของคุณ *</label>
                <select
                  required
                  value={formData.gender}
                  onChange={e => setFormData({...formData, gender: e.target.value})}
                  className="w-full border-2 border-black rounded-lg p-3 font-bold bg-white focus:bg-gray-50 outline-none transition-colors cursor-pointer"
                >
                  <option value="">-- เลือกเพศ --</option>
                  <option value="male">♂ ชาย / เพศผู้</option>
                  <option value="female">♀ หญิง / เพศเมีย</option>
                  <option value="other">🌈 LGBTQ+ / ไม่ระบุ</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-black text-sm ml-1 flex items-center gap-1 uppercase text-gray-500"><Cake size={14}/> วันเกิด</label>
                <input type="date" required className="w-full border-2 border-black rounded-lg p-3 font-bold" 
                  onChange={e => setFormData({...formData, birth_date: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="font-black text-sm ml-1 flex items-center gap-1 uppercase text-gray-500"><Phone size={14}/> เบอร์โทร</label>
                <input type="tel" required placeholder="08x-xxx-xxxx" className="w-full border-2 border-black rounded-lg p-3 font-bold" 
                  onChange={e => setFormData({...formData, phone_number: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="font-black text-sm ml-1 flex items-center gap-1 uppercase text-gray-500"><MapPin size={14}/> จังหวัด</label>
                <select 
                  required 
                  value={formData.province}
                  onChange={e => setFormData({...formData, province: e.target.value})}
                  className="w-full border-2 border-black rounded-lg p-3 font-bold bg-white focus:bg-gray-50 outline-none transition-colors"
                >
                  <option value="" disabled>เลือกจังหวัด</option>
                  {thailandProvinces.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-black text-sm ml-1 text-gray-500 uppercase">อำเภอ / เขต</label>
                <input required placeholder="เช่น ด่านขุนทด" className="w-full border-2 border-black rounded-lg p-3 font-bold" 
                  onChange={e => setFormData({...formData, district: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="font-black text-sm ml-1 text-gray-500 uppercase">ตำบล / แขวง</label>
                <input required placeholder="เช่น ห้วยบง" className="w-full border-2 border-black rounded-lg p-3 font-bold" 
                  onChange={e => setFormData({...formData, subdistrict: e.target.value})} />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="font-black text-sm ml-1 uppercase text-gray-500">ที่อยู่โดยละเอียด</label>
                <textarea rows={2} required placeholder="บ้านเลขที่, หมู่บ้าน, ซอย..." className="w-full border-2 border-black rounded-lg p-3 font-bold resize-none" 
                  onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="md:col-span-1 space-y-1">
                <label className="font-black text-sm ml-1">Line ID</label>
                <input placeholder="ถ้ามี" className="w-full border-2 border-black rounded-lg p-3 font-bold bg-green-50/30" 
                  value={formData.line_id}
                  onChange={e => setFormData({...formData, line_id: e.target.value})} />
              </div>

              <div className="md:col-span-1 space-y-1">
                <label className="font-black text-sm ml-1 flex items-center gap-1"><LinkIcon size={14}/> ช่องทางติดต่ออื่น</label>
                <input placeholder="FB / IG Link" className="w-full border-2 border-black rounded-lg p-3 font-bold" 
                  onChange={e => setFormData({...formData, contact_link: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="font-black text-sm ml-1 flex items-center gap-1 uppercase text-gray-500">
                  <Briefcase size={14}/> อาชีพ
                </label>
                <select
                  value={formData.occupation}
                  onChange={e => setFormData({...formData, occupation: e.target.value})}
                  className="w-full border-2 border-black rounded-lg p-3 font-bold bg-white focus:bg-gray-50 outline-none transition-colors cursor-pointer"
                >
                  {occupationOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="font-black text-sm ml-1 flex items-center gap-2 uppercase text-gray-500">
                  <Heart size={14}/> ความสนใจเกี่ยวกับสัตว์เลี้ยงและไลฟ์สไตล์ (เลือกได้หลายข้อ)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                        className={`px-3 py-2.5 rounded-xl border-2 font-bold text-sm text-left transition-all active:scale-95 ${
                          isSelected
                            ? 'border-black bg-wagashi-kinako shadow-paper-sm'
                            : 'border-black/30 bg-white hover:border-black hover:bg-gray-50'
                        }`}
                      >
                        {opt.label}
                        {isSelected && <span className="float-right text-green-600">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="md:col-span-2 mt-2 bg-wagashi-kinako/30 p-5 rounded-2xl border-4 border-black/10 shadow-inner">
                <label className="font-black text-sm ml-1 flex items-center gap-2 text-ori-ink mb-3">
                  🐾 คุณต้องการช่วยเหลือหรือให้บริการเกี่ยวกับสัตว์ด้านไหนได้บ้าง?
                </label>
                <select 
                  value={formData.community_role}
                  onChange={(e) => setFormData({...formData, community_role: e.target.value})}
                  className="w-full border-2 border-black rounded-xl p-3 font-bold focus:bg-white outline-none transition-colors cursor-pointer"
                >
                  {expertiseOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {formData.community_role === 'other' && (
                <div className="md:col-span-2 space-y-1 animate-in fade-in">
                  <label className="font-black text-sm ml-1 text-gray-600">ระบุบทบาทภารกิจเพิ่มเติมของคุณ</label>
                  <input 
                    type="text"
                    value={formData.community_role_custom}
                    onChange={e => setFormData({...formData, community_role_custom: e.target.value})}
                    placeholder="เช่น ช่างภาพจิตอาสาถ่ายรูปสุนัขจร"
                    className="w-full border-2 border-black rounded-xl p-3 font-bold"
                  />
                </div>
              )}

              <Button disabled={loading || uploading} className="md:col-span-2 mt-6 bg-black text-white py-8 text-xl font-black rounded-2xl border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50">
                {loading || uploading ? <Loader2 className="animate-spin" /> : "บันทึกโปรไฟล์และรับ Magic Link เพื่อเข้าใช้งาน"}
              </Button>
            </form>
            <Button onClick={() => setStep('email')} variant="ghost" className="mt-4 text-gray-500 font-bold hover:text-black hover:bg-gray-100 rounded-xl px-4 py-2">
              ← กลับไปหน้าแรก
            </Button>
          </div>
        )}

        {message && message.type === 'error' && (
          <div className="mt-6 p-4 rounded-xl border-2 border-black bg-wagashi-sakura text-red-900 font-bold flex items-center gap-2 text-left">
            <AlertCircle className="shrink-0" />
            <span className="text-sm">{message.text}</span>
          </div>
        )}
      </div>
    </div>
  )
}