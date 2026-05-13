'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LogIn, Mail, Loader2, CheckCircle2, AlertCircle, 
  UserPlus, MapPin, Phone, Camera, Link as LinkIcon, Cake, UserCircle 
} from 'lucide-react'

// ── 1. เตรียมตัวเลือกบทบาทชุมชน ──
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

// ── 2. ดรอปดาวน์ 77 จังหวัด ──
const thailandProvinces = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
].sort()

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'register' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [lineLoading, setLineLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [formData, setFormData] = useState({
    display_name: '', 
    first_name: '',
    last_name: '',
    birth_date: '',
    phone_number: '',
    line_id: '',
    avatar_url: '',
    address: '',
    province: 'นครราชสีมา', // ตั้งค่าเริ่มต้น
    district: '',
    subdistrict: '',
    contact_link: '',
    community_role: 'general',
    community_role_custom: ''
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 💡 ฟังก์ชัน LINE Login
  const handleLineLogin = () => {
    setLineLoading(true)
    window.location.href = '/api/auth/line'
  }

  // ── ฟังก์ชันทำงานเดิมทั้งหมด ──
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
    setLoading(true)
    setMessage(null)

    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('Check email error:', error)
      setMessage({ type: 'error', text: 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง' })
      setLoading(false)
      return
    }

    if (data) {
      await handleSendOTP(email)
    } else {
      setStep('register')
      setLoading(false)
    }
  }

  const handleSendOTP = async (targetEmail: string, metadata = {}) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: metadata 
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

  const handleRegisterAndLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.display_name) {
      setMessage({ type: 'error', text: 'กรุณากรอกชื่อโปรไฟล์ที่จะใช้แสดงผล' })
      return
    }

    setLoading(true)
    const metadata = { ...formData, email }
    await handleSendOTP(email, metadata)
  }

  // ── ส่วนแสดงผล UI ──
  if (step === 'success') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 text-center">
        <div className="max-w-md w-full p-10 bg-wagashi-matcha border-4 border-black rounded-3xl shadow-paper animate-in zoom-in">
          <CheckCircle2 size={80} className="mx-auto mb-6 text-black" />
          <h2 className="text-3xl font-black mb-4 uppercase">Success!</h2>
          <p className="font-bold text-lg">เราส่งลิงก์เข้าสู่ระบบไปที่ <br/> <span className="underline">{email}</span> แล้วครับ</p>
          <p className="mt-4 text-sm font-bold opacity-70">กรุณาตรวจสอบกล่องข้อความของคุณ</p>
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
            
            {/* 💡 1. ปุ่ม LINE Login */}
            <div className="space-y-4 mb-6">
              <button
                onClick={handleLineLogin}
                disabled={lineLoading || loading}
                className="w-full bg-[#00B900] hover:bg-[#009900] text-white font-black text-xl py-5 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all border-4 border-transparent hover:border-black shadow-sm active:translate-y-1 disabled:opacity-70"
              >
                {lineLoading ? (
                  <Loader2 className="animate-spin" size={28} />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                      <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.122.303.079.758.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.965 1.739-1.906 2.548-3.834 2.548-5.98z"/>
                    </svg>
                    เข้าสู่ระบบด้วย LINE
                  </>
                )}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t-2 border-black/10"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 font-black text-gray-400">หรือใช้อีเมล (Magic Link)</span></div>
              </div>
            </div>

            {/* ฟอร์มกรอกอีเมลเดิม */}
            <form onSubmit={handleCheckEmail} className="space-y-4">
              <div className="space-y-2 text-left">
                <label className="font-black text-sm ml-1">กรอกอีเมลเพื่อเริ่มใช้งาน</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" 
                  className="w-full border-4 border-black rounded-xl px-4 py-4 font-bold text-lg focus:ring-8 ring-black/5 outline-none transition-all"
                />
              </div>
              <Button disabled={loading || lineLoading} className="w-full bg-black text-white py-8 text-xl font-black rounded-2xl border-2 border-black shadow-paper-sm hover:shadow-paper transition-all active:translate-y-1">
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
                  <UserCircle size={16}/> ชื่อโปรไฟล์ที่จะใช้แสดง (Display Name)
                </label>
                <input 
                  required 
                  placeholder="เช่น kruth_apex (ไม่ต้องแสดงชื่อจริง)" 
                  className="w-full border-4 border-black rounded-xl p-4 font-bold text-lg focus:bg-orange-50 outline-none transition-colors shadow-paper-sm" 
                  onChange={e => setFormData({...formData, display_name: e.target.value})} 
                />
                <p className="text-[10px] font-bold text-gray-400 ml-1 italic">* ชื่อนี้จะถูกใช้เป็นตัวตนของคุณบนแพลตฟอร์ม</p>
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
                <label className="font-black text-sm ml-1 flex items-center gap-1 uppercase text-gray-500"><Cake size={14}/> วันเกิด</label>
                <input type="date" required className="w-full border-2 border-black rounded-lg p-3 font-bold" 
                  onChange={e => setFormData({...formData, birth_date: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="font-black text-sm ml-1 flex items-center gap-1 uppercase text-gray-500"><Phone size={14}/> เบอร์โทร</label>
                <input required placeholder="08x-xxx-xxxx" className="w-full border-2 border-black rounded-lg p-3 font-bold" 
                  onChange={e => setFormData({...formData, phone_number: e.target.value})} />
              </div>

              {/* 💡 2. เปลี่ยนช่องจังหวัดเป็น Dropdown */}
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
                <input required placeholder="เช่น สระจระเข้" className="w-full border-2 border-black rounded-lg p-3 font-bold" 
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
                  onChange={e => setFormData({...formData, line_id: e.target.value})} />
              </div>

              <div className="md:col-span-1 space-y-1">
                <label className="font-black text-sm ml-1 flex items-center gap-1"><LinkIcon size={14}/> ช่องทางติดต่ออื่น</label>
                <input placeholder="FB / IG Link" className="w-full border-2 border-black rounded-lg p-3 font-bold" 
                  onChange={e => setFormData({...formData, contact_link: e.target.value})} />
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

                <AnimatePresence>
                  {formData.community_role === 'other' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-3"
                    >
                      <input 
                        type="text"
                        placeholder="โปรดระบุความเชี่ยวชาญหรือบริการของคุณ..."
                        value={formData.community_role_custom}
                        onChange={(e) => setFormData({...formData, community_role_custom: e.target.value})}
                        className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none focus:ring-4 ring-black/5"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                <p className="text-[10px] font-bold text-gray-500 mt-2 italic ml-1">
                  * ข้อมูลนี้จะช่วยให้เราสร้างเครือข่ายความช่วยเหลือในชุมชนได้แข็งแกร่งขึ้น
                </p>
              </div>

              <Button disabled={loading || uploading} className="md:col-span-2 mt-6 bg-black text-white py-8 text-xl font-black rounded-2xl border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50">
                {loading || uploading ? <Loader2 className="animate-spin" /> : "บันทึกโปรไฟล์และรับ Magic Link"}
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