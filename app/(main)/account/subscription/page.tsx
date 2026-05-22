'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient }          from '@supabase/ssr'
import { useRouter }                    from 'next/navigation'
import Image                            from 'next/image'
import { 
  User, Phone, MapPin, Briefcase, Heart, 
  Loader2, CheckCircle2, AlertCircle, Camera,
  UserCheck, Home, Shield, Sparkles
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

export default function EditProfileComponent() {
  const router = useRouter()
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // ── States ──────────────────────────────────────────────────
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [message, setMessage]       = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  // ── ดึงข้อมูลโปรไฟล์เดิมมาปักหมุดเรนเดอร์ในฟอร์ม ───────────────────
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        const { data: prof, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (error) throw error

        if (prof) {
          // ตรวจเช็คว่าบทบาทชุมชนเป็นค่า Custom หรือค่าในลิสต์ปกติ
          const isStandardRole = expertiseOptions.some(opt => opt.value === prof.community_role)

          setFormData({
            display_name:   prof.display_name || '',
            first_name:     prof.first_name || '',
            last_name:      prof.last_name || '',
            birth_date:     prof.birth_date || '',
            phone_number:   prof.tel || '', // ผูกเข้ากับคอลัมน์ tel ของตาราง
            gender:         prof.gender || '',
            line_id:        prof.line_id || '',
            avatar_url:     prof.avatar_url || '',
            address:        prof.address || '',
            province:       prof.province || 'นครราชสีมา',
            district:       prof.district || '',
            subdistrict:    prof.subdistrict || '',
            contact_link:   prof.contact_link || '',
            community_role: isStandardRole ? (prof.community_role || 'general') : 'other',
            community_role_custom: isStandardRole ? '' : (prof.community_role || ''),
            occupation:     prof.occupation || '',
            interests:      Array.isArray(prof.interests) ? prof.interests : [] // รองรับอาร์เรย์สมบูรณ์
          })
        }
      } catch (err: any) {
        console.error(err)
        setMessage({ type: 'error', text: 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้: ' + err.message })
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [supabase, router])

  // ── จัดการอัปโหลดรูปภาพโปรไฟล์ใหม่ ──────────────────────────────
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
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)
        
      if (publicUrl) {
         setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
         setMessage({ type: 'success', text: 'เปลี่ยนรูปภาพโปรไฟล์ชั่วคราวสำเร็จ กดบันทึกเพื่อยืนยันค่ะ' })
      }
    } catch (error: any) {
      console.error(error)
      setMessage({ type: 'error', text: 'อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' })
    } finally {
      setUploading(false)
    }
  }

  // ── ฟังก์ชันสั่งอัปเดตข้อมูลตรงเข้าฐานข้อมูลตาราง Profiles ──────────────────
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.display_name.trim()) {
      setMessage({ type: 'error', text: 'กรุณากรอกชื่อโปรไฟล์ที่จะใช้แสดงผลค่ะ' })
      return
    }
    if (!formData.gender) {
      setMessage({ type: 'error', text: 'กรุณาระบุเพศของคุณค่ะ' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง')

      const roleFinal = formData.community_role === 'other' ? formData.community_role_custom : formData.community_role

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          display_name:   formData.display_name.trim(),
          first_name:     formData.first_name.trim(),
          last_name:      formData.last_name.trim(),
          birth_date:     formData.birth_date || null,
          tel:            formData.phone_number.trim(), // อัปเดตลงคอลัมน์ tel ในฐานข้อมูลจริง
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
          interests:      formData.interests // ข้อมูล Array บันทึกเข้าได้ครบถ้วน ไร้รอยต่อ
        })
        .eq('id', session.user.id)

      if (updateErr) throw updateErr

      setMessage({ type: 'success', text: '🎉 บันทึกการแก้ไขข้อมูลส่วนตัวเรียบร้อยแล้วค่ะ!' })
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: 'บันทึกไม่สำเร็จ: ' + (err.message || 'โปรดตรวจสอบนโยบายสิทธิ์ความปลอดภัย RLS') })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-black" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto bg-white border-4 border-black rounded-3xl p-6 shadow-paper my-4 animate-in fade-in duration-3xl">
      <div className="flex items-center gap-3 mb-6 border-b-4 border-black pb-4 text-left">
        <div className="p-2 bg-wagashi-matcha border-2 border-black rounded-xl">
          <UserCheck size={24} className="text-black" />
        </div>
        <h2 className="text-2xl font-black italic uppercase tracking-tight">แก้ไขข้อมูลส่วนตัว</h2>
      </div>

      <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
        
        {/* ส่วนจัดการอัปโหลดภาพ Avatar */}
        <div className="md:col-span-2 bg-gray-50 p-6 border-4 border-black rounded-2xl flex flex-col items-center gap-4 shadow-inner">
          <div className="w-24 h-24 bg-white rounded-full border-4 border-black flex items-center justify-center overflow-hidden shadow-paper-sm relative group">
            {formData.avatar_url ? (
              <Image 
                src={formData.avatar_url} 
                alt="Profile" 
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <Camera size={28} className="text-gray-300" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" />
              </div>
            )}
          </div>
          <label className="cursor-pointer bg-wagashi-kinako border-2 border-black px-5 py-2 rounded-xl text-xs font-black hover:shadow-paper-sm transition-all active:translate-y-0.5">
            {uploading ? 'กำลังจัดการไฟล์...' : 'เปลี่ยนรูปโปรไฟล์'}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={uploading || saving}
            />
          </label>
        </div>

        {/* ชื่อโปรไฟล์แสดงผล */}
        <div className="md:col-span-2 space-y-1">
          <label className="font-black text-sm ml-1 flex items-center gap-1 uppercase text-ori-orange-d">
            ชื่อโปรไฟล์ที่ใช้แสดง (Display Name) *
          </label>
          <input 
            required 
            type="text"
            value={formData.display_name}
            placeholder="ชื่อเล่น หรือชื่อแฝงของคุณ" 
            className="w-full border-4 border-black rounded-xl p-3.5 font-bold text-base focus:bg-orange-50/50 outline-none transition-colors shadow-paper-sm" 
            onChange={e => setFormData({...formData, display_name: e.target.value})} 
          />
        </div>

        {/* ชื่อจริง */}
        <div className="space-y-1">
          <label className="font-black text-sm ml-1 text-gray-500 uppercase">ชื่อจริง</label>
          <input 
            type="text"
            value={formData.first_name}
            className="w-full border-2 border-black rounded-lg p-3 font-bold focus:bg-gray-50 outline-none" 
            onChange={e => setFormData({...formData, first_name: e.target.value})} 
          />
        </div>

        {/* นามสกุล */}
        <div className="space-y-1">
          <label className="font-black text-sm ml-1 text-gray-500 uppercase">นามสกุล</label>
          <input 
            type="text"
            value={formData.last_name}
            className="w-full border-2 border-black rounded-lg p-3 font-bold focus:bg-gray-50 outline-none" 
            onChange={e => setFormData({...formData, last_name: e.target.value})} 
          />
        </div>

        {/* ตัวเลือกเพศ */}
        <div className="space-y-1">
          <label className="font-black text-sm ml-1 text-gray-500 uppercase">เพศของคุณ *</label>
          <select
            required
            value={formData.gender}
            onChange={e => setFormData({...formData, gender: e.target.value})}
            className="w-full border-2 border-black rounded-lg p-3 font-bold bg-white focus:bg-gray-50 outline-none cursor-pointer"
          >
            <option value="">-- เลือกเพศ --</option>
            <option value="male">♂ ชาย / เพศผู้</option>
            <option value="female">♀ หญิง / เพศเมีย</option>
            <option value="other">🌈 LGBTQ+ / ไม่ระบุ</option>
          </select>
        </div>

        {/* วันเกิด */}
        <div className="space-y-1">
          <label className="font-black text-sm ml-1 text-gray-500 uppercase">วันเกิด</label>
          <input 
            type="date" 
            value={formData.birth_date}
            className="w-full border-2 border-black rounded-lg p-3 font-bold" 
            onChange={e => setFormData({...formData, birth_date: e.target.value})} 
          />
        </div>

        {/* เบอร์โทรศัพท์ */}
        <div className="space-y-1">
          <label className="font-black text-sm ml-1 text-gray-500 uppercase">เบอร์โทรศัพท์ *</label>
          <input 
            type="tel" 
            required
            value={formData.phone_number}
            placeholder="08x-xxx-xxxx" 
            className="w-full border-2 border-black rounded-lg p-3 font-bold" 
            onChange={e => setFormData({...formData, phone_number: e.target.value})} 
          />
        </div>

        {/* ดรอปดาวน์จังหวัด */}
        <div className="space-y-1">
          <label className="font-black text-sm ml-1 text-gray-500 uppercase">จังหวัด</label>
          <select 
            required 
            value={formData.province}
            onChange={e => setFormData({...formData, province: e.target.value})}
            className="w-full border-2 border-black rounded-lg p-3 font-bold bg-white focus:bg-gray-50 outline-none transition-colors cursor-pointer"
          >
            {thailandProvinces.map(prov => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
        </div>

        {/* อำเภอ */}
        <div className="space-y-1">
          <label className="font-black text-sm ml-1 text-gray-500 uppercase">อำเภอ / เขต</label>
          <input 
            type="text"
            value={formData.district}
            placeholder="เช่น ด่านขุนทด" 
            className="w-full border-2 border-black rounded-lg p-3 font-bold" 
            onChange={e => setFormData({...formData, district: e.target.value})} 
          />
        </div>

        {/* ตำบล */}
        <div className="space-y-1">
          <label className="font-black text-sm ml-1 text-gray-500 uppercase">ตำบล / แขวง</label>
          <input 
            type="text"
            value={formData.subdistrict}
            placeholder="เช่น ห้วยบง" 
            className="w-full border-2 border-black rounded-lg p-3 font-bold" 
            onChange={e => setFormData({...formData, subdistrict: e.target.value})} 
          />
        </div>

        {/* ที่อยู่โดยละเอียด */}
        <div className="md:col-span-2 space-y-1">
          <label className="font-black text-sm ml-1 uppercase text-gray-500">ที่อยู่โดยละเอียด</label>
          <textarea 
            rows={2} 
            value={formData.address}
            placeholder="บ้านเลขที่, หมู่บ้าน, ซอย..." 
            className="w-full border-2 border-black rounded-lg p-3 font-bold resize-none" 
            onChange={e => setFormData({...formData, address: e.target.value})} 
          />
        </div>

        {/* Line ID */}
        <div className="md:col-span-1 space-y-1">
          <label className="font-black text-sm ml-1 text-gray-600">Line ID</label>
          <input 
            type="text"
            value={formData.line_id}
            placeholder="ID ไลน์ (ถ้ามี)" 
            className="w-full border-2 border-black rounded-lg p-3 font-bold bg-green-50/20" 
            onChange={e => setFormData({...formData, line_id: e.target.value})} 
          />
        </div>

        {/* ช่องทางติดต่ออื่น */}
        <div className="md:col-span-1 space-y-1">
          <label className="font-black text-sm ml-1 text-gray-600">ช่องทางติดต่ออื่น</label>
          <input 
            type="text"
            value={formData.contact_link}
            placeholder="ลิงก์ Facebook / IG" 
            className="w-full border-2 border-black rounded-lg p-3 font-bold" 
            onChange={e => setFormData({...formData, contact_link: e.target.value})} 
          />
        </div>

        {/* เลือกอาชีพ */}
        <div className="space-y-1 md:col-span-2">
          <label className="font-black text-sm ml-1 text-gray-500 uppercase">อาชีพ</label>
          <select
            value={formData.occupation}
            onChange={e => setFormData({...formData, occupation: e.target.value})}
            className="w-full border-2 border-black rounded-lg p-3 font-bold bg-white focus:bg-gray-50 outline-none cursor-pointer"
          >
            {occupationOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* ── มิติความสนใจ (Interests Checkbox Buttons) ── */}
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

        {/* บทบาทช่วยเหลือเครือข่าย */}
        <div className="md:col-span-2 mt-2 bg-wagashi-kinako/20 p-5 rounded-2xl border-4 border-black/10 shadow-inner">
          <label className="font-black text-sm ml-1 flex items-center gap-2 text-ori-ink mb-3">
            🐾 คุณต้องการช่วยเหลือหรือให้บริการเกี่ยวกับสัตว์ด้านไหนได้บ้าง?
          </label>
          <select 
            value={formData.community_role}
            onChange={(e) => setFormData({...formData, community_role: e.target.value})}
            className="w-full border-2 border-black rounded-xl p-3 font-bold bg-white focus:bg-gray-50 outline-none cursor-pointer"
          >
            {expertiseOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* ฟิลด์ระบุบทบาทคัสตอมเพิ่มเติม */}
        {formData.community_role === 'other' && (
          <div className="md:col-span-2 space-y-1 animate-in fade-in">
            <label className="font-black text-sm ml-1 text-gray-600">ระบุบทบาทภารกิจเพิ่มเติมของคุณ</label>
            <input 
              type="text"
              value={formData.community_role_custom}
              onChange={e => setFormData({...formData, community_role_custom: e.target.value})}
              placeholder="เช่น ช่างภาพจิตอาสาช่วยเหลือศูนย์พักพิง"
              className="w-full border-2 border-black rounded-xl p-3.5 font-bold"
            />
          </div>
        )}

        {/* กล่องแสดงผล Alert แจ้งเตือนความคืบหน้า */}
        {message && (
          <div className={`md:col-span-2 p-4 rounded-xl border-2 border-black flex items-center gap-2 text-left font-bold ${
            message.type === 'error' ? 'bg-red-50 text-red-900' : 'bg-green-50 text-green-900'
          }`}>
            {message.type === 'error' ? <AlertCircle size={18} className="shrink-0 text-red-600" /> : <CheckCircle2 size={18} className="shrink-0 text-green-600" />}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* ปุ่ม Submit ทำรายการอัปเดต */}
        <Button 
          type="submit" 
          disabled={saving || uploading} 
          className="md:col-span-2 mt-2 bg-black text-white py-8 text-xl font-black rounded-2xl border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50"
        >
          {saving ? (
            <><Loader2 className="animate-spin" /> กำลังบันทึกประวัติโปรไฟล์ใหม่...</>
          ) : (
            <><Sparkles size={18} className="text-ori-yellow" /> ยืนยันการอัปเดตข้อมูลส่วนตัว</>
          )}
        </Button>
      </form>
    </div>
  )
}