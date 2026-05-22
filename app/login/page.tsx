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

// ── ตัวเลือกบทบาทชุมชน ──
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
  { value: 'adopt', label: '🐶 หาบ้านใหม่/รับเลี้ยงสัตว์' },
  { value: 'rescue', label: '🆘 ช่วยเหลือสัตว์เจ็บป่วย/สัตว์จร' },
  { value: 'mating', label: '❤️ หาคู่ผสมพันธุ์ให้น้องๆ' },
  { value: 'showcase', label: '📸 อวดความน่ารัก/ประกวดสัตว์เลี้ยง' },
  { value: 'knowledge', label: '📚 ศึกษาความรู้และการเลี้ยงดู' },
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

  // ── Form Data State (เพิ่มฟิลด์ที่ขาดหาย) ──
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
    interests: [] as string[], // เก็บเป็น Array สำหรับ Checkbox หลายตัวเลือก
    marital_status: 'single'   // ค่าเริ่มต้นสถานะ
  })

  // ── 1. ตรวจสอบ Email และเช็คประวัติบัญชี ──
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
        // บัญชีมีอยู่แล้ว -> ยิง Magic Link ล็อกอินตรงๆ
        const { error: signInErr } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        })

        if (signInErr) throw signInErr

        setMessage({
          type: 'success',
          text: 'พบข้อมูลโปรไฟล์ของคุณแล้ว! ระบบได้จัดส่ง Magic Link สำหรับล็อกอินเข้าใช้งานไปยังอีเมลเรียบร้อยแล้วครับ'
        })
      } else {
        // ไม่มีบัญชี -> ย้ายไปกรอกข้อมูลส่วนตัวใน Step ถัดไป
        setStep('profile')
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการตรวจสอบอีเมล' })
    } finally {
      setLoading(false)
    }
  }

  // ── 2. อัปโหลดรูปภาพ Avatar ไปยัง Storage ──
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setUploading(true)
    setMessage(null)

    try {
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadErr } = await supabase.storage
        .from('pobpet-media')
        .upload(filePath, file)

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('pobpet-media')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      setMessage({ type: 'success', text: 'อัปโหลดรูปภาพประจำตัวสำเร็จแล้วครับ' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'อัปโหลดรูปภาพไม่สำเร็จ' })
    } finally {
      setUploading(false)
    }
  }

  // ── จัดการ Checkbox ความสนใจ ──
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

  // ── 3. บันทึกข้อมูลลงฐานข้อมูลและสั่งส่ง Magic Link ──
  const handleRegisterAndLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const cleanEmail = email.trim().toLowerCase()

      // สั่งให้ระบบเตรียมสิทธิ์ล็อกอินผ่าน OTP/Magic Link
      const { error: authErr } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (authErr) throw authErr

      // บันทึกข้อมูลลงตาราง profiles พร้อมจับคู่คีย์ฟิลด์ที่ถูกต้องตามเงื่อนไขตาราง
      const { error: insertErr } = await supabase
        .from('profiles')
        .insert({
          email: cleanEmail,
          display_name: formData.display_name.trim(),
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          birth_date: formData.birth_date || null,
          phone_number: formData.phone_number.trim(), // ✅ แก้ไขแมปให้เข้ากับคอลัมน์จริงใน Supabase
          province: formData.province,
          gender: formData.gender,
          avatar_url: formData.avatar_url || null,
          community_role: formData.community_role,
          community_role_custom: formData.community_role === 'other' ? formData.community_role_custom.trim() : null,
          interests: formData.interests,             // ✨ เพิ่มคอลัมน์เก็บความสนใจลงฐานข้อมูล
          marital_status: formData.marital_status     // ✨ เพิ่มคอลัมน์เก็บสถานะโสด/แต่งงานลงฐานข้อมูล
        })

      if (insertErr) throw insertErr

      setMessage({
        type: 'success',
        text: 'ลงทะเบียนบัญชีใหม่เสร็จสิ้น! เราได้ส่ง Magic Link ไปที่อีเมลของคุณแล้ว กรุณากดลิงก์เพื่อเข้าใช้งานระบบครับ'
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
        
        {/* ส่วนหัวแสดงสถานะขั้นตอน */}
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
            /* STEP 1: กรอก Email เพื่อคัดกรอง */
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
                  type="email"
                  required
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
            /* STEP 2: ฟอร์มกรอกประวัติใหม่ กรณีไม่มีข้อมูลเก่า */
            <motion.div
              key="profile-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <form onSubmit={handleRegisterAndLogin} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* จัดการ Avatar */}
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
                  <span className="text-xs font-bold text-gray-500 mt-2">รูปโปรไฟล์ (ไม่จำเป็นต้องใส่ตอนนี้ก็ได้ครับ)</span>
                </div>

                {/* ข้อมูลพื้นฐาน */}
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

                <div className="space-y-1.5">
                  <label className="font-black text-sm text-black">ชื่อจริง (ภาษาไทย)</label>
                  <input 
                    type="text" required
                    value={formData.first_name}
                    onChange={e => setFormData({...formData, first_name: e.target.value})}
                    className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none focus:ring-4 ring-black/5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-black text-sm text-black">นามสกุล (ภาษาไทย)</label>
                  <input 
                    type="text" required
                    value={formData.last_name}
                    onChange={e => setFormData({...formData, last_name: e.target.value})}
                    className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none focus:ring-4 ring-black/5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-black text-sm text-black flex items-center gap-1"><Cake size={16}/> วันเกิด</label>
                  <input 
                    type="date"
                    value={formData.birth_date}
                    onChange={e => setFormData({...formData, birth_date: e.target.value})}
                    className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none focus:ring-4 ring-black/5 cursor-pointer"
                  />
                </div>

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

                <div className="space-y-1.5">
                  <label className="font-black text-sm text-black flex items-center gap-1"><MapPin size={16}/> จังหวัดประจำการหลัก</label>
                  <select 
                    value={formData.province}
                    onChange={e => setFormData({...formData, province: e.target.value})}
                    className="w-full border-2 border-black p-3 rounded-xl font-bold focus:bg-white outline-none transition-colors cursor-pointer"
                  >
                    {thailandProvinces.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                {/* ✨ เพิ่มกล่องข้อมูลสถานะการแต่งงาน */}
                <div className="space-y-1.5">
                  <label className="font-black text-sm text-black flex items-center gap-1"><Smile size={16}/> สถานะภาพ</label>
                  <select 
                    value={formData.marital_status}
                    onChange={e => setFormData({...formData, marital_status: e.target.value})}
                    className="w-full border-2 border-black p-3 rounded-xl font-bold focus:bg-white outline-none transition-colors cursor-pointer"
                  >
                    {maritalStatusOptions.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-black text-sm text-black flex items-center gap-1"><Briefcase size={16}/> บทบาทในเครือข่ายสัตว์เลี้ยง</label>
                  <select 
                    value={formData.community_role}
                    onChange={e => setFormData({...formData, community_role: e.target.value})}
                    className="w-full border-2 border-black p-3 rounded-xl font-bold focus:bg-white outline-none transition-colors cursor-pointer"
                  >
                    {expertiseOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {formData.community_role === 'other' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="md:col-span-2 space-y-1.5 overflow-hidden"
                  >
                    <label className="font-black text-sm text-black">โปรดระบุบทบาทของคุณ</label>
                    <input 
                      type="text"
                      value={formData.community_role_custom}
                      onChange={e => setFormData({...formData, community_role_custom: e.target.value})}
                      placeholder="เช่น ช่างภาพจิตอาสาถ่ายรูปสุนัขจร"
                      className="w-full border-2 border-black p-3 rounded-xl font-bold outline-none focus:ring-4 ring-black/5"
                    />
                  </motion.div>
                )}

                {/* ✨ เพิ่มบล็อกเลือกความสนใจ (Interests Options - Checkbox หลายรายการ) */}
                <div className="space-y-2 md:col-span-2 border-2 border-dashed border-black/30 p-4 rounded-2xl bg-wagashi-matcha/10">
                  <label className="font-black text-sm text-black flex items-center gap-1 mb-1">
                    <Sparkles size={16} className="text-amber-500 fill-amber-500"/> ความสนใจหรือวัตถุประสงค์ในระบบ (เลือกได้มากกว่า 1 ข้อ)
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

        {/* ระบบแจ้งผลความคืบหน้าของธุรกรรม */}
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