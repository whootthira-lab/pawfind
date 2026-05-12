'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Calendar, MapPin, Image as ImageIcon, Loader2, 
  UploadCloud, Info, CheckCircle2, Building2, ChevronLeft 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const eventCategories = [
  { value: 'contest', label: '🏆 การแข่งขันและประกวด', desc: 'สำหรับงานที่มีการตัดสินผู้ชนะ' },
  { value: 'training', label: '📚 อบรมและให้ความรู้', desc: 'สำหรับ Workshop, สัมมนา, หลักสูตรต่างๆ' },
  { value: 'market', label: '🛒 ตลาดและงานแสดงสินค้า', desc: 'สำหรับงานขายสินค้าสัตว์เลี้ยง, นิทรรศการ' },
  { value: 'community', label: '🤝 กิจกรรมชุมชนและสาธารณะ', desc: 'สำหรับงานที่เป็นประโยชน์ต่อสังคม ไม่แสวงกำไร' },
  { value: 'health', label: '🏥 สุขภาพและการดูแล', desc: 'สำหรับกิจกรรมด้านสุขภาพสัตว์โดยเฉพาะ' },
  { value: 'news', label: '📣 ข่าวสารและประกาศ', desc: 'สำหรับข่าวทั่วไปที่ไม่ใช่งาน Event' },
  { value: 'help', label: '🔍 หาบ้านและช่วยเหลือ', desc: 'สำหรับประกาศที่ต้องการความช่วยเหลือจากชุมชน' },
]

// 💡 รายชื่อจังหวัดประเทศไทยชุดเดียวกับหน้า Create
const thailandProvinces = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
].sort();

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id

  const [user, setUser] = useState<any>(null)
  const [isFetching, setIsFetching] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    event_type: 'news',
    description: '',
    organizer_name: '', 
    venue_name: '',     
    province: '',
    district: '',       
    subdistrict: '',    
    start_date: '',
    end_date: '',
    image_url: ''
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. ตรวจสอบสิทธิ์และดึงข้อมูลเดิม
  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error || !event) {
        alert('ไม่พบข้อมูลประกาศครับ')
        router.push('/account/my-events')
        return
      }

      if (event.organizer_id !== session.user.id) {
        alert('คุณไม่มีสิทธิ์แก้ไขประกาศนี้ครับ')
        router.push('/events')
        return
      }

      setFormData({
        title: event.title || '',
        event_type: event.event_type || 'news',
        description: event.description || '',
        organizer_name: event.organizer_name || '',
        venue_name: event.venue_name || '',
        province: event.province || '',
        district: event.district || '',
        subdistrict: event.subdistrict || '',
        start_date: event.start_date ? event.start_date.substring(0, 16) : '', 
        end_date: event.end_date ? event.end_date.substring(0, 16) : '',
        image_url: event.image_url || ''
      })
      setImagePreview(event.image_url)
      setIsFetching(false)
    }
    initData()
  }, [eventId, router, supabase])

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
    setIsSubmitting(true)

    try {
      let finalImageUrl = formData.image_url

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `posters/${fileName}`
        
        const { error: uploadErr } = await supabase.storage.from('event-images').upload(filePath, imageFile)
        if (uploadErr) throw uploadErr
        
        const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(filePath)
        finalImageUrl = publicUrl
      }

      const { error: updateErr } = await supabase
        .from('events')
        .update({
          organizer_name: formData.organizer_name,
          title: formData.title,
          event_type: formData.event_type,
          description: formData.description,
          venue_name: formData.venue_name,
          province: formData.province,
          district: formData.district,
          subdistrict: formData.subdistrict,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          image_url: finalImageUrl,
          status: 'pending_ai' 
        })
        .eq('id', eventId)

      if (updateErr) throw updateErr

      const aiRes = await fetch('/api/events/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventId,
          title: formData.title,
          description: formData.description,
          category: formData.event_type,
          trustLevel: user?.user_metadata?.trust_level || 'bronze'
        })
      })
      
      const aiData = await aiRes.json()

      if (!aiRes.ok || !aiData.success) {
        alert(`✅ แก้ไขข้อมูลแล้ว แต่การตรวจ AI ขัดข้อง: ${aiData.error || 'กำลังรอคิวตรวจ'}`)
      } else {
        alert(`✅ แก้ไขประกาศเรียบร้อย!\nผลการตรวจจาก AI: ${aiData.status}\nเหตุผล: ${aiData.reason}`)
      }

      router.push('/account/my-events')
      router.refresh()

    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isFetching) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-ori-blue-d" size={48} /></div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 mb-20">
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 md:p-10 shadow-paper relative overflow-hidden">
        
        <div className="mb-8 border-b-4 border-ori-ink pb-6">
          <Link href="/account/my-events" className="text-ori-blue-d font-black flex items-center gap-1 mb-4 hover:underline">
            <ChevronLeft size={20} /> กลับไปที่ประกาศของฉัน
          </Link>
          <h1 className="text-3xl font-black text-ori-ink flex items-center gap-3">
            <Calendar className="text-ori-blue-d" size={32} />
            แก้ไขประกาศกิจกรรม
          </h1>
          <p className="font-bold text-gray-500 mt-2 italic">เมื่อแก้ไขแล้ว ระบบจะส่งให้ AI ตรวจสอบเนื้อหาใหม่อีกครั้งครับ 🤖</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-2">
              <label className="font-black text-ori-ink flex items-center gap-2 text-sm">
                <ImageIcon size={16} /> เปลี่ยนรูปโปสเตอร์
              </label>
              <div className="border-4 border-dashed border-gray-200 rounded-2xl p-4 h-48 relative bg-gray-50 flex flex-col items-center justify-center text-center hover:bg-gray-100 transition-colors cursor-pointer">
                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <div className="text-gray-400 font-bold text-xs flex flex-col items-center">
                    <UploadCloud size={32} className="mb-2 opacity-50" />
                    คลิกเพื่อเปลี่ยนรูป
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <label className="font-black text-ori-ink text-sm">หมวดหมู่ประกาศ</label>
                <select 
                  value={formData.event_type}
                  onChange={e => setFormData({...formData, event_type: e.target.value})}
                  className="ori-input bg-white cursor-pointer"
                >
                  {eventCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-black text-ori-ink text-sm">หัวข้อประกาศ <span className="text-red-500">*</span></label>
                <input 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="ori-input"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border-2 border-ori-ink/5">
            <div className="md:col-span-2 space-y-2">
              <label className="font-black text-ori-ink text-sm flex items-center gap-2">
                <Building2 size={16} className="text-ori-green" /> ผู้จัดงาน <span className="text-red-500">*</span>
              </label>
              <input 
                required
                value={formData.organizer_name}
                onChange={e => setFormData({...formData, organizer_name: e.target.value})}
                className="ori-input"
              />
            </div>

            <div className="md:col-span-2 space-y-2 pt-2">
              <label className="font-black text-ori-ink text-sm flex items-center gap-2">
                <MapPin size={16} className="text-ori-orange" /> สถานที่จัดงาน
              </label>
              <input 
                value={formData.venue_name}
                onChange={e => setFormData({...formData, venue_name: e.target.value})}
                className="ori-input"
              />
            </div>

            {/* 💡 จังหวัดเป็น Dropdown ตามโจทย์ */}
            <div className="space-y-2">
              <label className="font-black text-[11px]">จังหวัด <span className="text-red-500">*</span></label>
              <select 
                required
                value={formData.province}
                onChange={e => setFormData({...formData, province: e.target.value})}
                className="ori-input text-sm bg-white cursor-pointer"
              >
                <option value="" disabled>เลือกจังหวัด</option>
                {thailandProvinces.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="font-black text-[11px]">อำเภอ</label>
                <input 
                  placeholder="อำเภอ/เขต"
                  value={formData.district}
                  onChange={e => setFormData({...formData, district: e.target.value})}
                  className="ori-input text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="font-black text-[11px]">ตำบล</label>
                <input 
                  placeholder="ตำบล/แขวง"
                  value={formData.subdistrict}
                  onChange={e => setFormData({...formData, subdistrict: e.target.value})}
                  className="ori-input text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-black text-ori-ink text-sm">วันที่เริ่ม <span className="text-red-500">*</span></label>
              <input 
                type="datetime-local" 
                required
                value={formData.start_date}
                onChange={e => setFormData({...formData, start_date: e.target.value})}
                className="ori-input font-sans"
              />
            </div>
            <div className="space-y-2">
              <label className="font-black text-ori-ink text-sm">วันที่สิ้นสุด</label>
              <input 
                type="datetime-local" 
                value={formData.end_date}
                onChange={e => setFormData({...formData, end_date: e.target.value})}
                className="ori-input font-sans"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="font-black text-ori-ink text-sm">รายละเอียดประกาศ</label>
              <textarea 
                rows={6}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="ori-input"
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <Link href="/account/my-events">
              <Button type="button" variant="outline" className="py-6 px-8 rounded-2xl font-black border-2 border-ori-ink">
                ยกเลิก
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-ori-blue-d text-white py-6 px-10 rounded-2xl font-black text-lg shadow-paper hover:shadow-paper-lg transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin" size={24} /> กำลังตรวจสอบและบันทึก...</>
              ) : (
                <><CheckCircle2 size={24} /> บันทึกการแก้ไข</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}