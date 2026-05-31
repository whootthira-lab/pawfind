'use client'
// app/(main)/pets/new/page.tsx (ฉบับแก้ไขเพิ่มช่องเลือกเพศและทำหมันสากลตามโครงสร้างดีไซน์ PobPet)

import { useState, useRef, useEffect, useMemo } from 'react'
import { createBrowserClient }       from '@supabase/ssr'
import { useRouter }                 from 'next/navigation'
import Image                         from 'next/image'
import {
  Upload, Sparkles, Loader2,
  PawPrint, Heart, Home, Trophy, Search,
  X, AlertCircle
} from 'lucide-react'

type Mode = 'mode_lost' | 'mode_mating' | 'mode_adoption' | 'mode_showcase'

const SPECIES_OPTIONS = [
  '', 'สุนัข', 'แมว', 'นกสวยงาม', 'ปลาสวยงาม',
  'กระต่าย', 'แฮมสเตอร์', 'เต่า', 'งู', 'กิ้งก่า', 'อื่นๆ',
]

const GENDER_OPTIONS = [
  { value: 'unknown', label: '❓ ไม่ทราบ / ไม่ระบุ' },
  { value: 'male',    label: '♂ เพศผู้ (Male)'   },
  { value: 'female',  label: '♀ เพศเมีย (Female)'  },
]

const MODE_CONFIG: { key: Mode; icon: any; label: string; color: string; desc: string }[] = [
  { key: 'mode_lost',     icon: Search, label: 'ประกาศหาย',     color: 'blue',   desc: 'เปิดเมื่อน้องหาย AI จะช่วยหาคู่ Match' },
  { key: 'mode_mating',   icon: Heart,  label: 'หาคู่ให้น้อง',  color: 'pink',   desc: 'ตามหาคู่สายพันธุ์เดียวกัน' },
  { key: 'mode_adoption', icon: Home,   label: 'หาบ้านใหม่',    color: 'green',  desc: 'ส่งต่อความรัก หาบ้านที่อบอุ่นให้น้อง' },
  { key: 'mode_showcase', icon: Trophy, label: 'โชว์โปรไฟล์',   color: 'amber',  desc: 'พื้นที่อวดความน่ารัก สะสมทำเนียบ' },
]

const THAI_PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", 
  "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", 
  "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", 
  "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", 
  "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", 
  "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", 
  "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", 
  "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", 
  "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
].sort((a, b) => a.localeCompare(b, 'th'))

export default function NewPetPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // ── States ──────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('mode_lost')
  const [form, setForm] = useState({
    name: '',
    species: '',
    species_custom: '',   // ← เพิ่มช่องกรอกเมื่อเลือก "อื่นๆ"
    breed: '',
    gender: 'unknown',       
    is_sterilized: false,    // 🟢 รองรับค่า Boolean การทำหมันหลังบ้าน
    birthday: '',            
    province: '',
    district: '',
    sub_district: '',
    details: '',
    reward_amount: '',
    contact_name: '',
    contact_tel: '',
    emergency_name: '',
    emergency_tel: '',
  })

  const [images,    setImages]    = useState<{ file: File; preview: string }[]>([])
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isPublic,  setIsPublic]  = useState(true)   // ← privacy toggle

  // ── ดึงข้อมูล Profile มา pre-fill ฟอร์ม (ข้อ 7) ──────────────
  useEffect(() => {
    async function checkAuthAndPrefill() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('กรุณาล็อกอินก่อนใช้งานลงประกาศนะคะ')
          return
        }
        setAuthChecked(true)

        // ดึงข้อมูล profile มา pre-fill
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, first_name, last_name, phone_number, province, district, subdistrict, address')
          .eq('id', user.id)
          .single()

        if (profile) {
          const fullName = profile.display_name
            || [profile.first_name, profile.last_name].filter(Boolean).join(' ')
            || ''
          setForm(f => ({
            ...f,
            contact_name:  fullName,
            contact_tel:   profile.phone_number   || f.contact_tel,
            province:      profile.province       || f.province,
            district:      profile.district       || f.district,
            sub_district:  profile.subdistrict    || f.sub_district,
          }))
        }
      } catch (err) {
        console.error(err)
        setAuthChecked(true)
      }
    }
    checkAuthAndPrefill()
  }, [supabase])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    
    if (images.length + files.length > 5) {
      alert('อัปโหลดรูปภาพรวมกันได้สูงสุด 5 รูปค่ะ')
      return
    }

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))
    setImages(prev => [...prev, ...newImages])
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      const target = prev[index]
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSave = async () => {
    if (saving || !authChecked) return
    setError(null)

    if (!form.species) return setError('กรุณาเลือกประเภทสัตว์เลี้ยงค่ะ')
    if (form.species === 'อื่นๆ' && !form.species_custom.trim()) {
      return setError('กรุณาระบุประเภทสัตว์เลี้ยงในช่อง "อื่นๆ" ค่ะ')
    }
    if (!form.province) return setError('กรุณาเลือกจังหวัดที่เกิดเหตุค่ะ')
    if (!form.contact_tel) return setError('กรุณากรอกเบอร์โทรศัพท์ผู้ติดต่อหลักค่ะ')
    if (images.length === 0) return setError('กรุณาอัปโหลดรูปภาพน้องอย่างน้อย 1 รูป เพื่อช่วยในการจดจำของ AI ค่ะ')

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ไม่พบข้อมูลผู้ใช้งาน กรุณาล็อกอินใหม่อีกครั้ง')

      const uploadedUrls: string[] = []

      for (const img of images) {
        const fileExt = img.file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadErr } = await supabase.storage
          .from('pet-images')
          .upload(fileName, img.file, { cacheControl: '3600', upsert: true })

        if (uploadErr) throw uploadErr

        const { data: { publicUrl } } = supabase.storage
          .from('pet-images')
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrl)
      }

      const { data: insertedPet, error: insertErr } = await supabase
        .from('pets')
        .insert({
          user_id: user.id,
          name: form.name || 'ไม่ทราบชื่อ',
          species: form.species === 'อื่นๆ' && form.species_custom.trim()
            ? form.species_custom.trim()
            : form.species,
          breed: form.breed || null,
          gender: form.gender,
          is_sterilized: form.is_sterilized, 
          birthday: form.birthday || null,   
          birthdate: form.birthday || null,  
          province: form.province,
          district: form.district || null,
          sub_district: form.sub_district || null,
          details: form.details || null,
          reward_amount: form.reward_amount ? parseFloat(form.reward_amount) : 0,
          mode: mode,
          images: uploadedUrls,
          image_url: uploadedUrls[0] || null,
          primary_image: uploadedUrls[0] || null,
          status: mode === 'mode_lost'     ? 'lost'     :
                  mode === 'mode_mating'   ? 'mating'   :
                  mode === 'mode_adoption' ? 'adoption' : 'showcase',
          contact_name: form.contact_name || null,
          contact_tel: form.contact_tel,
          emergency_name: form.emergency_name || null,
          emergency_tel: form.emergency_tel || null,
          mode_lost:      mode === 'mode_lost',
          mode_mating:    mode === 'mode_mating',
          mode_adoption:  mode === 'mode_adoption',
          mode_showcase:  mode === 'mode_showcase',
          is_public:      isPublic,
          visibility:     isPublic ? 'public' : 'private',
        })
        .select()
        .single()

      if (insertErr) throw insertErr

      // ── 🟢 แตกแถวข้อมูลลิงก์ส่งไปบันทึกลงฐานตารางย่อย pet_images อัตโนมัติ ──
      if (insertedPet && uploadedUrls.length > 0) {
        const imageRows = uploadedUrls.map((url, index) => ({
          pet_id: insertedPet.id,
          storage_url: url,
          is_primary: index === 0
        }))
        await supabase.from('pet_images').insert(imageRows)
      }

      // 🟢 ออโต้สร้างคำบรรยายภาพ AI (Auto AI Caption) หลังจากสร้างประกาศสำเร็จ เพื่อให้แสดงผลจับคู่ AI ได้เต็มประสิทธิภาพทันที
      if (insertedPet && images.length > 0) {
        try {
          const firstFile = images[0].file
          const reader = new FileReader()
          const base64Str = await new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const res = reader.result as string
              resolve(res.split(',')[1])
            }
            reader.onerror = reject
            reader.readAsDataURL(firstFile)
          })

          const captionRes = await fetch('/api/pets/caption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Str,
              petName: insertedPet.name,
              species: insertedPet.species
            })
          })

          if (captionRes.ok) {
            const { caption } = await captionRes.json()
            if (caption) {
              await supabase
                .from('pets')
                .update({ ai_caption: caption })
                .eq('id', insertedPet.id)
            }
          }
        } catch (autoErr) {
          console.error('[Auto AI Caption Error]:', autoErr)
        }
      }

      images.forEach(img => URL.revokeObjectURL(img.preview))

      if (isPublic && (mode === 'mode_lost' || mode === 'mode_mating' || mode === 'mode_adoption')) {
        router.push(`/pet/${insertedPet.id}/match`)
      } else {
        router.push(`/pets/${insertedPet.id}?created=true`)
      }
      router.refresh()

    } catch (err: any) {
      console.error('[Create Pet Error]:', err)
      setError(err.message || 'เกิดข้อผิดพลาดระหว่างบันทึกข้อมูล กรุณาลองใหม่อีกครั้งค่ะ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 mb-24 text-black">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black tracking-tight text-ori-ink flex items-center justify-center gap-2">
          <PawPrint size={36} className="text-black" />
          สร้างประกาศใหม่ 🐾
        </h1>
        <p className="text-sm font-bold text-ori-ink-l mt-2">
          เลือกหมวดหมู่ที่ต้องการและกรอกข้อมูลน้องให้ครบถ้วน เพื่อให้ระบบคลังข้อมูลเริ่มวิเคราะห์จับคู่ทันทีฟรีไม่มีเงื่อนไข
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {MODE_CONFIG.map(cfg => {
          const Icon = cfg.icon
          const isSelected = mode === cfg.key
          return (
            <button
              key={cfg.key}
              onClick={() => !saving && setMode(cfg.key)}
              type="button"
              className={`p-4 border-4 rounded-2xl flex flex-col items-center text-center gap-2 transition-all ${
                isSelected
                  ? 'border-black bg-white shadow-paper translate-y-0'
                  : 'border-gray-200 bg-gray-50/50 hover:border-gray-400 opacity-70'
              }`}
            >
              <div className={`p-2 rounded-xl border-2 border-black bg-${cfg.color}-100`}>
                <Icon size={20} className="text-black" />
              </div>
              <p className="font-black text-sm">{cfg.label}</p>
            </button>
          )
        })}
      </div>

      <div className="p-4 bg-gray-50 border-2 border-black rounded-2xl mb-6 flex items-start gap-2">
        <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs font-bold text-gray-600">
          {MODE_CONFIG.find(c => c.key === mode)?.desc}
        </p>
      </div>

      <div className="space-y-6">
        {/* Section รูปภาพ */}
        <div className="p-5 border-4 border-black rounded-3xl bg-white shadow-paper-sm space-y-4">
          <h2 className="font-black text-lg text-ori-ink flex items-center gap-1.5">
            🖼️ รูปภาพของน้อง ({images.length}/5) <span className="text-red-500 text-xs font-bold">*</span>
          </h2>

          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square border-2 border-black rounded-xl overflow-hidden group bg-gray-100">
                <Image src={img.preview} alt="preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-white border border-black rounded-full hover:bg-red-50"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-gray-400 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-black hover:bg-gray-50 transition-colors bg-gray-50/50"
              >
                <Upload size={20} className="text-gray-400" />
                <span className="text-[10px] font-black text-gray-500">เพิ่มรูปภาพ</span>
              </button>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" multiple className="hidden" />
        </div>

        {/* Section ข้อมูลลักษณะ */}
        <div className="p-5 border-4 border-black rounded-3xl bg-white shadow-paper-sm space-y-4">
          <h2 className="font-black text-lg text-ori-ink">🐾 ข้อมูลลักษณะสัตว์เลี้ยง</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-black text-sm">ชื่อของน้องสัตว์เลี้ยง *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="เช่น ชาเย็น, นมสด" className="ori-input" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">ประเภทสัตว์เลี้ยง *</label>
              <select value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value, species_custom: '' }))} className="ori-input bg-white font-bold">
                {SPECIES_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt === '' ? '-- เลือกประเภท --' : opt}</option>
                ))}
              </select>
              {/* ── ช่องกรอกเพิ่มเติมเมื่อเลือก "อื่นๆ" ── */}
              {form.species === 'อื่นๆ' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={form.species_custom}
                    onChange={e => setForm(f => ({ ...f, species_custom: e.target.value }))}
                    placeholder="ระบุประเภทสัตว์เลี้ยง เช่น แกะ, หนูแฮมสเตอร์..."
                    className="ori-input border-2 border-dashed border-black focus:border-solid"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* ── 🟢 [แผงแทรกใหม่แกะกล่องตามสไตล์หน้ากากรูปภาพ] ช่องกรอกข้อมูลเพศ และการทำหมัน ── */}
            <div className="space-y-1">
              <label className="font-black text-sm">เพศของน้อง 🐾</label>
              <select 
                value={form.gender} 
                onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} 
                className="ori-input bg-white font-bold cursor-pointer"
              >
                {GENDER_OPTIONS.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">การทำหมันของน้อง 🩺</label>
              <select 
                value={form.is_sterilized ? "true" : "false"} 
                onChange={e => setForm(f => ({ ...f, is_sterilized: e.target.value === "true" }))} 
                className="ori-input bg-white font-bold cursor-pointer"
              >
                <option value="false">❌ ยังไม่ได้ทำหมัน</option>
                <option value="true">✨ ทำหมันเรียบร้อยแล้ว</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">วันเกิดน้อง (เพื่อคำนวณอายุ) 🎂</label>
              <input 
                type="date" 
                value={form.birthday} 
                onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} 
                className="ori-input cursor-pointer font-bold" 
              />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">สายพันธุ์เฉพาะ (ระบุระเอียดเพิ่มเติม)</label>
              <input type="text" value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} placeholder="เช่น ชิสุ, เปอร์เซีย (ระบุหรือไม่ก็ได้)" className="ori-input" />
            </div>
          </div>

          {mode === 'mode_lost' && (
            <div className="space-y-1 pt-2 animate-fadeIn">
              <label className="font-black text-sm flex items-center gap-1 text-ori-yellow-d">
                💰 สินน้ำใจ / เงินรางวัลนำส่ง (บาท)
              </label>
              <input type="number" value={form.reward_amount} onChange={e => setForm(f => ({ ...f, reward_amount: e.target.value }))} placeholder="0 (ใส่จำนวนเงิน หรือเว้นว่างไว้หากไม่มีรางวัล)" className="ori-input" />
            </div>
          )}
        </div>

        {/* Section พิกัดเกิดเหตุ */}
        <div className="p-5 border-4 border-black rounded-3xl bg-white shadow-paper-sm space-y-4">
          <h2 className="font-black text-lg text-ori-ink">📍 พื้นที่และสถานที่เกิดเหตุ</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-black text-sm">จังหวัดประจำตัวน้อง <span className="text-red-500">*</span></label>
              <select value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} className="ori-input bg-white font-bold">
                <option value="">-- เลือกจังหวัด --</option>
                {THAI_PROVINCES.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">อำเภอ</label>
              <input type="text" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} placeholder="เช่น อำเภอเมือง, ด่านขุนทด" className="ori-input" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">ตำบล</label>
              <input type="text" value={form.sub_district} onChange={e => setForm(f => ({ ...f, sub_district: e.target.value }))} placeholder="เช่น ในเมือง, หินดาด" className="ori-input" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-black text-sm">รายละเอียดจุดสังเกตเพิ่มเติม / พฤติกรรมน้อง</label>
            <textarea rows={3} value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} placeholder="เช่น น้องมีปลอกคอสีแดง, ขนแหว่งที่ขาหลังซ้าย" className="ori-input resize-none" />
          </div>
        </div>

        {/* Section ผู้ติดต่อ */}
        <div className="p-5 border-4 border-black rounded-3xl bg-white shadow-paper-sm space-y-4">
          <h2 className="font-black text-lg text-ori-ink">📞 ข้อมูลผู้ติดต่อ</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-black text-sm">ชื่อผู้ติดต่อหลัก</label>
              <input type="text" value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="ชื่อของคุณ" className="ori-input" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
              <input type="tel" value={form.contact_tel} onChange={e => setForm(f => ({ ...f, contact_tel: e.target.value }))} placeholder="0xx-xxx-xxxx" className="ori-input" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">ชื่อผู้ติดต่อสำรอง (ถ้ามี)</label>
              <input type="text" value={form.emergency_name} onChange={e => setForm(f => ({ ...f, emergency_name: e.target.value }))} placeholder="ชื่อบุคคลสำรอง" className="ori-input" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">เบอร์โทรศัพท์สำรอง</label>
              <input type="tel" value={form.emergency_tel} onChange={e => setForm(f => ({ ...f, emergency_tel: e.target.value }))} placeholder="0xx-xxx-xxxx" className="ori-input" />
            </div>
          </div>
        </div>

        {/* ── Privacy Toggle (ข้อ 6) ── */}
        <div className="p-5 border-4 border-black rounded-3xl bg-white shadow-paper-sm">
          <h2 className="font-black text-lg text-ori-ink mb-3 flex items-center gap-2">
            👁️ การมองเห็นโปรไฟล์
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`p-4 border-4 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all ${
                isPublic
                  ? 'border-black bg-green-50 shadow-paper'
                  : 'border-gray-200 bg-gray-50 opacity-60 hover:opacity-80'
              }`}
            >
              <span className="text-2xl">🌍</span>
              <p className="font-black text-sm">สาธารณะ</p>
              <p className="text-[10px] font-bold text-gray-500 leading-tight">
                แสดงในฟีดและหน้าค้นหา ผู้ใช้อื่นเห็นได้
              </p>
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`p-4 border-4 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all ${
                !isPublic
                  ? 'border-black bg-amber-50 shadow-paper'
                  : 'border-gray-200 bg-gray-50 opacity-60 hover:opacity-80'
              }`}
            >
              <span className="text-2xl">🔒</span>
              <p className="font-black text-sm">เฉพาะฉัน</p>
              <p className="text-[10px] font-bold text-gray-500 leading-tight">
                แสดงเฉพาะในบัญชีของฉัน ไม่ปรากฏในฟีดสาธารณะ
              </p>
            </button>
          </div>
          {isPublic && (
            <p className="mt-2 text-xs font-bold text-gray-500 flex items-center gap-1">
              <span>✅</span>
              ผู้ใช้อื่นจะเห็น: ชื่อ รูป จังหวัด อำเภอ และ Petcard ตามโหมดที่เลือก
            </p>
          )}
          {!isPublic && (
            <p className="mt-2 text-xs font-bold text-gray-500 flex items-center gap-1">
              <span>🔒</span>
              ผู้ใช้อื่นเห็นเฉพาะ: ชื่อ รูป จังหวัด เท่านั้น
            </p>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-400 rounded-2xl flex items-center gap-3 text-red-800 animate-shake">
            <AlertCircle size={18} className="shrink-0" />
            <span className="font-bold text-sm">{error}</span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !authChecked}
          className="w-full py-5 bg-black text-white font-black text-lg rounded-2xl border-4 border-black shadow-paper hover:shadow-paper-lg hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {saving ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              กำลังประมวลผลและส่งข้อมูลเข้าฐานระบบ...
            </>
          ) : (
            <>
              <Sparkles size={20} className="text-ori-yellow" />
              ลงประกาศและเปิดระบบวิเคราะห์คลังข้อมูลสำเร็จ
            </>
          )}
        </button>
      </div>
    </div>
  )
}