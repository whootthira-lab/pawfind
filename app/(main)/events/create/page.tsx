'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Calendar, MapPin, Image as ImageIcon, Loader2, 
  UploadCloud, Info, CheckCircle2, Building2, AlertTriangle, XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const eventCategories = [
  { value: 'contest', label: '🏆 การแข่งขันและประกวด', desc: 'สำหรับงานที่มีการตัดสินผู้ชนะ' },
  { value: 'training', label: '📚 อบรมและให้ความรู้', desc: 'สำหรับ Workshop, สัมมนา, หลักสูตรต่างๆ' },
  { value: 'market', label: '🛒 ตลาดและงานแสดงสินค้า', desc: 'สำหรับงานขายสินค้าสัตว์เลี้ยง, นิทรรศการ' },
  { value: 'community', label: '🤝 กิจกรรมชุมชนและสาธารณะ', desc: 'สำหรับงานที่เป็นประโยชน์ต่อสังคม ไม่แสวงกำไร' },
  { value: 'health', label: '🏥 สุขภาพและการดูแล', desc: 'สำหรับกิจกรรมด้านสุขภาพสัตว์โดยเฉพาะ' },
  { value: 'news', label: '📣 ข่าวสารและประกาศ', desc: 'สำหรับข่าวทั่วไปที่ไม่ใช่งาน Event' },
  { value: 'help', label: '🔍 หาบ้านและช่วยเหลือ', desc: 'สำหรับประกาศที่ต้องการความช่วยเหลือจากชุมชน' },
]

// 💡 รายชื่อจังหวัดประเทศไทย
const thailandProvinces = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
].sort();

export default function CreateEventPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  
  // 💡 State สำหรับ Popup แจ้งผลการส่งประกาศ
  const [modalResult, setModalResult] = useState<{ show: boolean, status: string, reason: string } | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    event_type: 'news',
    description: '',
    organizer_name: '', 
    venue_name: '',     
    province: 'นครราชสีมา', // ค่าเริ่มต้นตามพื้นที่หลักของคุณวุฒิ์
    district: '',       
    subdistrict: '',    
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
    setIsSubmitting(true)

    try {
      let imageUrl = ''
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `posters/${fileName}`
        await supabase.storage.from('event-images').upload(filePath, imageFile)
        const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(filePath)
        imageUrl = publicUrl
      }

      const { data: newEvent, error: insertErr } = await supabase
        .from('events')
        .insert({
          organizer_id: user.id,
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
          image_url: imageUrl,
          status: 'pending_ai'
        })
        .select()
        .single()

      if (insertErr) throw insertErr

      if (newEvent) {
        const aiRes = await fetch('/api/events/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: newEvent.id,
            title: formData.title,
            description: formData.description,
            category: formData.event_type,
            trustLevel: user?.user_metadata?.trust_level || 'bronze'
          })
        })
        const aiData = await aiRes.json()
        
        // 💡 แสดงผลลัพธ์ผ่าน Popup Modal
        setModalResult({ 
          show: true, 
          status: aiData.status || 'pending_ai', 
          reason: aiData.reason || 'กำลังประมวลผลเนื้อหา' 
        })
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
      setIsSubmitting(false)
    }
  }

  const handleModalClose = () => {
    setModalResult(null)
    router.push('/events')
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 mb-20 relative">
      
      {/* 💡 ป๊อปอัปแจ้งผล (Modal Result) */}
      {modalResult?.show && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white border-4 border-ori-ink rounded-3xl p-8 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center animate-in fade-in zoom-in duration-200">
            {modalResult.status === 'approved' ? (
              <div className="text-green-500 mb-4 flex justify-center"><CheckCircle2 size={64} /></div>
            ) : modalResult.status === 'pending_admin' ? (
              <div className="text-orange-500 mb-4 flex justify-center"><AlertTriangle size={64} /></div>
            ) : (
              <div className="text-red-500 mb-4 flex justify-center"><XCircle size={64} /></div>
            )}
            
            <h2 className="text-2xl font-black text-ori-ink mb-2">
              {modalResult.status === 'approved' ? 'อนุมัติเรียบร้อย!' : 
               modalResult.status === 'pending_admin' ? 'รอแอดมินพิจารณา' : 
               'ตรวจสอบพบข้อควรระวัง'}
            </h2>
            
            <p className="text-gray-600 font-bold mb-4">
              {modalResult.status === 'approved' ? 'ประกาศของคุณแสดงผลบนแพลตฟอร์มแล้วครับ 🎉' : 
               modalResult.status === 'pending_admin' ? 'ประกาศถูกส่งเข้าคิวพิจารณา แอดมินจะทำการตรวจสอบและอนุมัติในไม่ช้าครับ ⏳' : 
               'กรุณาตรวจสอบรายละเอียดประกาศอีกครั้ง'}
            </p>

            <div className="bg-gray-50 border-2 border-gray-200 p-3 rounded-xl text-sm text-left mb-6 font-bold text-gray-700">
              <span className="text-ori-blue-d">🤖 ผลวิเคราะห์ AI:</span> {modalResult.reason}
            </div>

            <Button onClick={handleModalClose} className="w-full bg-ori-ink text-white font-black py-6 rounded-xl hover:bg-gray-800 transition-colors">
              ตกลงและไปที่กระดานข่าว
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 md:p-10 shadow-paper relative overflow-hidden">
        
        <div className="mb-8 border-b-4 border-ori-ink pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-ori-ink flex items-center gap-3">
              <Calendar className="text-ori-blue-d" size={32} />
              สร้างประกาศกิจกรรม & ข่าวสาร
            </h1>
            <p className="font-bold text-gray-500 mt-2">กระจายข่าวสารและกิจกรรมดีๆ ให้ชุมชน PobPet 🐾</p>
          </div>
          <div className="bg-blue-50 text-ori-blue-d border-2 border-ori-blue-d px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2">
            <Info size={16} /> ตรวจสอบเนื้อหาโดย AI
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-2">
              <label className="font-black text-ori-ink flex items-center gap-2 text-sm">
                <ImageIcon size={16} /> รูปโปสเตอร์
              </label>
              <div className="border-4 border-dashed border-gray-200 rounded-2xl p-4 h-48 relative bg-gray-50 flex flex-col items-center justify-center text-center hover:bg-gray-100 transition-colors cursor-pointer">
                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <div className="text-gray-400 font-bold text-xs flex flex-col items-center">
                    <UploadCloud size={32} className="mb-2 opacity-50" />
                    คลิกเพื่ออัปโหลด
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <label className="font-black text-ori-ink text-sm">หมวดหมู่ประกาศ <span className="text-red-500">*</span></label>
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
                  placeholder="เช่น งานประกวดแมวโคราช 2026"
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
                placeholder="ระบุชื่อผู้จัดหรือเจ้าของประกาศ"
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
                placeholder="ระบุชื่อสถานที่"
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
                {thailandProvinces.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="font-black text-[11px]">อำเภอ</label>
                <input 
                  placeholder="อำเภอ"
                  value={formData.district}
                  onChange={e => setFormData({...formData, district: e.target.value})}
                  className="ori-input text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="font-black text-[11px]">ตำบล</label>
                <input 
                  placeholder="ตำบล"
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
              <label className="font-black text-ori-ink text-sm">วันที่สิ้นสุด (ถ้ามี)</label>
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
                rows={4}
                placeholder="พิมพ์ข้อมูลเพิ่มเติม..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="ori-input"
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-ori-blue-d text-white py-6 px-10 rounded-2xl font-black text-lg shadow-paper hover:shadow-paper-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin" size={24} /> กำลังตรวจสอบเนื้อหา...</>
              ) : (
                <><CheckCircle2 size={24} /> บันทึกและลงประกาศ</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}