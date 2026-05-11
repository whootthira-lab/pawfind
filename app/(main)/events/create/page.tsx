'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Calendar, MapPin, Image as ImageIcon, Loader2, UploadCloud, Info, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CreateEventPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    event_type: 'event', // 'event' หรือ 'pr'
    description: '',
    province: '',
    start_date: '',
    end_date: '',
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('กรุณาล็อกอินก่อนสร้างกิจกรรมครับ')
        router.push('/login')
      } else {
        setUser(session.user)
      }
    }
    checkUser()
  }, [router, supabase])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!formData.title || !formData.province || !formData.start_date) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนครับ')
      return
    }

    setIsSubmitting(true)

    try {
      let imageUrl = ''

      // 1. อัปโหลดรูปโปสเตอร์ (ถ้ามี)
      if (imageFile) {
        setIsUploading(true)
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `posters/${fileName}`

        const { error: uploadErr } = await supabase.storage
          .from('event-images')
          .upload(filePath, imageFile)

        if (uploadErr) throw uploadErr

        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(filePath)
        
        imageUrl = publicUrl
        setIsUploading(false)
      }

      // 2. บันทึกข้อมูลลงตาราง events
      // (ระบบ Trigger ที่เราทำไว้จะรอดักแปลง lat/lng เป็น PostGIS ให้เองถ้ามีการส่งพิกัดมาในอนาคต)
      const { error: insertErr } = await supabase
        .from('events')
        .insert({
          organizer_id: user.id,
          title: formData.title,
          event_type: formData.event_type,
          description: formData.description,
          province: formData.province,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          image_url: imageUrl,
          status: 'approved' // 💡 ตั้งให้อนุมัติอัตโนมัติไปก่อน เพื่อให้เทสต์ Ticker ได้เลย
        })

      if (insertErr) throw insertErr

      alert('✅ สร้างกิจกรรมสำเร็จ! ระบบจะแสดงบนแถบอักษรวิ่งเร็วๆ นี้ครับ')
      router.push('/') // กลับหน้าแรก
      router.refresh()

    } catch (err: any) {
      console.error(err)
      alert('เกิดข้อผิดพลาด: ' + err.message)
      setIsUploading(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 mb-20">
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 md:p-10 shadow-paper relative overflow-hidden">
        
        <div className="mb-8 border-b-4 border-ori-ink pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-ori-ink flex items-center gap-3">
              <Calendar className="text-ori-blue-d" size={32} />
              ลงประกาศกิจกรรม / PR
            </h1>
            <p className="font-bold text-gray-500 mt-2">
              กระจายข่าวสาร งานแฟร์สัตว์เลี้ยง หรือโปรโมชั่นร้านค้า ให้คนรักสัตว์ได้รับรู้!
            </p>
          </div>
          <div className="bg-wagashi-matcha/20 text-ori-green-d border-2 border-wagashi-matcha px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2">
            <Info size={16} /> แสดงผลบนแถบอักษรวิ่ง
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* อัปโหลดรูปโปสเตอร์ */}
          <div className="space-y-2">
            <label className="font-black text-ori-ink flex items-center gap-2">
              <ImageIcon size={18} /> รูปภาพโปสเตอร์ (ถ้ามี)
            </label>
            <div className="border-4 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative overflow-hidden h-64">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain absolute inset-0 p-2" />
              ) : (
                <div className="text-center flex flex-col items-center gap-2 text-gray-500">
                  <UploadCloud size={40} className="text-gray-400" />
                  <span className="font-bold">คลิกหรือลากรูปมาวางที่นี่</span>
                  <span className="text-xs font-bold bg-gray-200 px-2 py-1 rounded-md">แนะนำขนาด 1:1 หรือ 4:3</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* หมวดหมู่ */}
            <div className="space-y-2">
              <label className="font-black text-ori-ink">หมวดหมู่ประกาศ <span className="text-red-500">*</span></label>
              <select 
                value={formData.event_type}
                onChange={e => setFormData({...formData, event_type: e.target.value})}
                className="w-full border-4 border-black p-3 rounded-xl shadow-paper-sm font-bold bg-white"
              >
                <option value="event">🏆 กิจกรรม / งานแฟร์ / ฉีดวัคซีนฟรี</option>
                <option value="pr">📢 ประชาสัมพันธ์ / โปรโมชั่นร้านค้า</option>
              </select>
            </div>

            {/* จังหวัด */}
            <div className="space-y-2">
              <label className="font-black text-ori-ink flex items-center gap-2">
                <MapPin size={18} /> จังหวัดที่จัดงาน <span className="text-red-500">*</span>
              </label>
              <input 
                required
                placeholder="เช่น นครราชสีมา"
                value={formData.province}
                onChange={e => setFormData({...formData, province: e.target.value})}
                className="ori-input"
              />
            </div>

            {/* หัวข้อ */}
            <div className="md:col-span-2 space-y-2">
              <label className="font-black text-ori-ink">หัวข้อกิจกรรม / อักษรวิ่ง <span className="text-red-500">*</span></label>
              <input 
                required
                maxLength={100}
                placeholder="ชื่อที่จะไปปรากฏบนแถบวิ่ง (ไม่เกิน 100 ตัวอักษร)"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="ori-input text-lg"
              />
            </div>

            {/* วันที่เริ่ม */}
            <div className="space-y-2">
              <label className="font-black text-ori-ink">วันที่จัดงาน / เริ่มโปรโมชั่น <span className="text-red-500">*</span></label>
              <input 
                type="datetime-local" 
                required
                value={formData.start_date}
                onChange={e => setFormData({...formData, start_date: e.target.value})}
                className="ori-input font-sans"
              />
            </div>

            {/* วันที่สิ้นสุด */}
            <div className="space-y-2">
              <label className="font-black text-ori-ink">วันที่สิ้นสุด (ถ้ามี)</label>
              <input 
                type="datetime-local" 
                value={formData.end_date}
                onChange={e => setFormData({...formData, end_date: e.target.value})}
                className="ori-input font-sans"
              />
            </div>

            {/* รายละเอียด */}
            <div className="md:col-span-2 space-y-2">
              <label className="font-black text-ori-ink">รายละเอียดเพิ่มเติม</label>
              <textarea 
                rows={4}
                placeholder="พิมพ์รายละเอียดของงาน หรือช่องทางการติดต่อเพิ่มเติม..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="ori-input"
              />
            </div>
          </div>

          <div className="pt-6 border-t-4 border-gray-100 flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-ori-blue-d text-white py-6 px-10 rounded-2xl font-black text-lg shadow-paper hover:shadow-paper-lg hover:-translate-y-1 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin" size={24} /> {isUploading ? 'กำลังอัปโหลดรูป...' : 'กำลังบันทึก...'}</>
              ) : (
                <><CheckCircle2 size={24} /> สร้างประกาศกิจกรรม</>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}