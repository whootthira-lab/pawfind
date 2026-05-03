'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { 
  LogIn, Mail, Loader2, CheckCircle2, AlertCircle, 
  UserPlus, MapPin, Phone, Camera, Link as LinkIcon, Cake 
} from 'lucide-react'

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'register' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false) // สำหรับสถานะอัปโหลดรูป
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    phone_number: '',
    line_id: '',
    avatar_url: '',
    address: '',
    province: '',
    district: '',
    subdistrict: '',
    contact_link: ''
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. ฟังก์ชันจัดการการอัปโหลดไฟล์จริงไปที่ Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      setUploading(true)
      
      // ตั้งชื่อไฟล์ใหม่ด้วย timestamp เพื่อป้องกันชื่อซ้ำใน Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // อัปโหลดไฟล์ไปที่ bucket 'profile-images'
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // ดึง Public URL ของรูปที่อัปโหลดสำเร็จ
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)

      setFormData({ ...formData, avatar_url: publicUrl })
      
    } catch (error) {
      alert('อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setUploading(false)
    }
  }

  // 2. ตรวจสอบว่ามีอีเมลในระบบหรือยัง
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { data } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single()

    if (data) {
      await handleSendOTP(email)
    } else {
      setStep('register')
      setLoading(false)
    }
  }

  // 3. ส่ง Magic Link (signInWithOtp)
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

  // 4. บันทึกข้อมูลและส่งลิงก์
  const handleRegisterAndLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const metadata = {
      ...formData,
      display_name: `${formData.first_name} ${formData.last_name}`,
      email
    }

    await handleSendOTP(email, metadata)
  }

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
            <h1 className="text-3xl font-black text-center mb-2 italic tracking-tight">PAWFIND LOGIN</h1>
            <p className="text-center font-bold text-gray-400 mb-8 uppercase tracking-widest text-xs">Community Connectivity</p>
            
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
              <Button disabled={loading} className="w-full bg-black text-white py-8 text-xl font-black rounded-2xl border-2 border-black shadow-paper-sm hover:shadow-paper transition-all">
                {loading ? <Loader2 className="animate-spin" /> : "ดำเนินการต่อ ➔"}
              </Button>
            </form>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-3 mb-8 border-b-4 border-black pb-4">
              <UserPlus size={32} className="text-wagashi-matcha" />
              <h2 className="text-2xl font-black italic">REGISTER PROFILE</h2>
            </div>
            
            <form onSubmit={handleRegisterAndLogin} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
              
              {/* ส่วนอัปโหลดรูปโปรไฟล์จริง */}
              <div className="md:col-span-2 bg-gray-50 p-6 border-4 border-black rounded-2xl flex flex-col items-center gap-4 shadow-inner">
                <div className="w-28 h-28 bg-white rounded-full border-4 border-black flex items-center justify-center overflow-hidden shadow-paper-sm relative group">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Preview" />
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

              <div className="space-y-1">
                <label className="font-black text-sm ml-1 uppercase text-gray-500">ชื่อจริง</label>
                <input required className="w-full border-2 border-black rounded-lg p-3 font-bold focus:bg-gray-50 outline-none" 
                  onChange={e => setFormData({...formData, first_name: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="font-black text-sm ml-1 uppercase text-gray-500">นามสกุล</label>
                <input required className="w-full border-2 border-black rounded-lg p-3 font-bold focus:bg-gray-50 outline-none" 
                  onChange={e => setFormData({...formData, last_name: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="font-black text-sm ml-1 flex items-center gap-1 uppercase text-gray-500"><Cake size={14}/> วันเกิด</label>
                <input type="date" required className="w-full border-2 border-black rounded-lg p-3 font-bold" 
                  onChange={e => setFormData({...formData, birth_date: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="font-black text-sm ml-1 flex items-center gap-1 uppercase text-gray-500"><Phone size={14}/> เบอร์โทร</label>
                <input required className="w-full border-2 border-black rounded-lg p-3 font-bold" 
                  onChange={e => setFormData({...formData, phone_number: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="font-black text-sm ml-1 flex items-center gap-1 uppercase text-gray-500"><MapPin size={14}/> จังหวัด</label>
                <input required placeholder="เช่น นครราชสีมา" className="w-full border-2 border-black rounded-lg p-3 font-bold" 
                  onChange={e => setFormData({...formData, province: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="font-black text-sm ml-1 text-gray-500 uppercase">อำเภอ / ตำบล</label>
                <input required placeholder="ด่านขุนทด" className="w-full border-2 border-black rounded-lg p-3 font-bold" 
                  onChange={e => setFormData({...formData, district: e.target.value})} />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="font-black text-sm ml-1 uppercase text-gray-500">ที่อยู่โดยละเอียด</label>
                <textarea rows={2} required className="w-full border-2 border-black rounded-lg p-3 font-bold resize-none" 
                  onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="md:col-span-1 space-y-1">
                <label className="font-black text-sm ml-1">Line ID</label>
                <input className="w-full border-2 border-black rounded-lg p-3 font-bold bg-green-50/30" 
                  onChange={e => setFormData({...formData, line_id: e.target.value})} />
              </div>

              <div className="md:col-span-1 space-y-1">
                <label className="font-black text-sm ml-1 flex items-center gap-1"><LinkIcon size={14}/> ช่องทางติดต่ออื่น</label>
                <input className="w-full border-2 border-black rounded-lg p-3 font-bold" 
                  onChange={e => setFormData({...formData, contact_link: e.target.value})} />
              </div>

              <Button disabled={loading || uploading} className="md:col-span-2 mt-6 bg-black text-white py-8 text-xl font-black rounded-2xl border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" /> : "บันทึกโปรไฟล์และรับ Magic Link"}
              </Button>
            </form>
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