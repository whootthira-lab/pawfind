'use client'
// app/(main)/pets/new/page.tsx

import { useState, useRef, useEffect, useMemo } from 'react'
import { createBrowserClient }       from '@supabase/ssr'
import { useRouter }                 from 'next/navigation'
import {
  Upload, Sparkles, Loader2, ChevronRight,
  PawPrint, Heart, Home, Trophy, Search,
  X, Plus, AlertCircle
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
type Mode = 'mode_lost' | 'mode_mating' | 'mode_adoption' | 'mode_showcase'

const SPECIES_OPTIONS = [
  '', 'สุนัข', 'แมว', 'นกสวยงาม', 'ปลาสวยงาม',
  'กระต่าย', 'แฮมสเตอร์', 'เต่า', 'งู', 'กิ้งก่า', 'อื่นๆ',
]
const GENDER_OPTIONS = [
  { value: '', label: '-- เลือก --' },
  { value: 'male',    label: '♂ เพศผู้' },
  { value: 'female',  label: '♀ เพศเมีย' },
  { value: 'unknown', label: '❓ ไม่ทราบ' },
]
const MODE_CONFIG: { key: Mode; icon: any; label: string; color: string; desc: string }[] = [
  { key: 'mode_lost',     icon: Search, label: 'ประกาศหาย',     color: 'blue',   desc: 'เปิดเมื่อน้องหาย AI จะช่วยหาคู่ Match' },
  { key: 'mode_mating',   icon: Heart,  label: 'หาคู่ให้น้อง',  color: 'pink',   desc: 'จับคู่กับสัตว์ที่ต้องการผสมพันธุ์' },
  { key: 'mode_adoption', icon: Home,   label: 'หาบ้านให้น้อง', color: 'green',  desc: 'ให้คนอื่นมารับเลี้ยงน้องต่อ' },
  { key: 'mode_showcase', icon: Trophy, label: 'โชว์โปรไฟล์',   color: 'amber',  desc: 'แสดงในฟีดและชมรมสัตว์เลี้ยง' },
]

const MODE_COLOR: Record<string, string> = {
  blue:  'border-blue-400 bg-blue-50 text-blue-700',
  pink:  'border-pink-400 bg-pink-50 text-pink-700',
  green: 'border-green-400 bg-green-50 text-green-700',
  amber: 'border-amber-400 bg-amber-50 text-amber-700',
}

// ── Main ─────────────────────────────────────────────────────
export default function NewPetPage() {
  const router  = useRouter()
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // ── Form state ──────────────────────────────────────────
  const [form, setForm] = useState({
    name:           '',
    species:        '',
    breed:          '',
    gender:         '',
    color:          '',
    birthday:       '',
    weight:         '',
    microchip_id:   '',
    special_marks:  '',
    ai_caption:     '',
    father_name:    '',
    mother_name:    '',
    emergency_name: '',
    emergency_tel:  '',
  })

  const [modes, setModes] = useState<Record<Mode, boolean>>({
    mode_lost: false, mode_mating: false,
    mode_adoption: false, mode_showcase: false,
  })

  // ── Image state ─────────────────────────────────────────
  const [images,        setImages]        = useState<File[]>([])
  const [previews,      setPreviews]      = useState<string[]>([])
  const [primaryIndex,  setPrimaryIndex]  = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── UI state ────────────────────────────────────────────
  const [saving,         setSaving]         = useState(false)
  const [captioning,     setCaptioning]     = useState(false)
  const [error,          setError]          = useState('')
  const [planInfo,       setPlanInfo]       = useState<{ plan: string; limit: number; current: number } | null>(null)
  const [planChecked,    setPlanChecked]    = useState(false)

  // ── Check plan and profiles identity on mount ──
  useEffect(() => {
    const checkPlanAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { 
        router.push('/login?next=/pets/new')
        return 
      }
      
      // ตรวจสอบว่ามีแถวข้อมูลใน public.profiles รองรับ Foreign Key แล้วหรือยัง
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single()

      if (!profile) {
        setError('ไม่พบข้อมูลโปรไฟล์ผู้ใช้งานในระบบตารางหลัก (public.profiles) กรุณาติดต่อผู้ดูแลระบบ หรือลองออกจากระบบแล้วเข้าใหม่ด้วย LINE อีกครั้งค่ะ')
        setPlanChecked(true)
        return
      }
      
      try {
        const res = await fetch('/api/subscriptions/status')
        const data = await res.json()
        setPlanInfo(data)
        setPlanChecked(true)
        if (data.current >= data.limit) {
          setError(`คุณมีโปรไฟล์น้อง ${data.current} ตัวแล้ว (สูงสุด ${data.limit} ตัวสำหรับแพ็คเกจ ${data.plan === 'free' ? 'Free' : 'Member'})`)
        }
      } catch (err) {
        console.error('Failed to load plan info', err)
      }
    }
    checkPlanAndProfile()
  }, [router, supabase])

  // ── Image handlers ──────────────────────────────────────
  const maxPhotos = planInfo?.plan === 'member' ? 10 : 3

  const handleImages = (files: FileList | null) => {
    if (!files) return
    const remaining = maxPhotos - images.length
    const newFiles  = Array.from(files).slice(0, remaining)
    setImages(prev  => [...prev, ...newFiles])
    newFiles.forEach(f => {
      const reader = new FileReader()
      reader.onload = e => setPreviews(prev => [...prev, e.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
    if (primaryIndex >= i && primaryIndex > 0) setPrimaryIndex(p => p - 1)
  }

  // ── AI Caption ──────────────────────────────────────────
  const generateCaption = async () => {
    if (!previews[primaryIndex]) return
    setCaptioning(true)
    try {
      const base64 = previews[primaryIndex].split(',')[1]
      const res    = await fetch('/api/pets/caption', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          imageBase64: base64,
          petName:     form.name,
          species:     form.species,
        }),
      })
      const data = await res.json()
      if (data.caption) setForm(f => ({ ...f, ai_caption: data.caption }))
    } finally {
      setCaptioning(false)
    }
  }

  // ── Upload images to Supabase Storage ───────────────────
  const uploadImages = async (petId: string, userId: string) => {
    const urls: { storage_url: string; is_primary: boolean }[] = []
    for (let i = 0; i < images.length; i++) {
      const file     = images[i]
      const ext      = file.name.split('.').pop()
      const path     = `pets/${userId}/${petId}/${Date.now()}-${i}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('pet-images').upload(path, file)
      if (upErr) continue
      const { data: { publicUrl } } = supabase.storage
        .from('pet-images').getPublicUrl(path)
      urls.push({ storage_url: publicUrl, is_primary: i === primaryIndex })
    }
    return urls
  }

  // ── Save ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { setError('กรุณาระบุชื่อน้อง'); return }
    if (!form.species)     { setError('กรุณาเลือกประเภทสัตว์'); return }
    setSaving(true); setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      
      // ✅ ดึงและตรวจสอบ ID จากตาราง public.profiles โดยตรง เพื่อป้องกันปัญหาสิทธิ์ Foreign Key บกพร่อง
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single()

      if (profileErr || !profile) {
        throw new Error('ไม่สามารถบันทึกข้อมูลได้ เนื่องจากระบบตรวจไม่พบโปรไฟล์หลักของคุณในฐานข้อมูล (public.profiles) กรุณาลองล็อกเอาต์แล้วล็อกอินเข้าสู่ระบบใหม่อีกครั้งค่ะ')
      }

      const userId = profile.id

      // Insert pet
      const { data: pet, error: petErr } = await supabase
        .from('pets')
        .insert({
          user_id:        userId, // ปลอดภัย 100% เพราะยืนยันจาก profiles ชัดเจนแล้ว
          name:           form.name.trim(),
          species:        form.species,
          breed:          form.breed   || null,
          gender:         form.gender  || null,
          color:          form.color   || null,
          birthday:       form.birthday || null,
          weight:         form.weight ? parseFloat(form.weight) : null,
          microchip_id:   form.microchip_id   || null,
          special_marks:  form.special_marks  || null,
          ai_caption:     form.ai_caption     || null,
          father_name:    form.father_name    || null,
          mother_name:    form.mother_name    || null,
          emergency_contact: (form.emergency_name || form.emergency_tel) ? {
            name: form.emergency_name,
            tel:  form.emergency_tel,
          } : null,
          ...modes,
          status: 'active',
        })
        .select('id')
        .single()

      if (petErr) throw petErr

      const petId = pet.id

      // Upload images
      if (images.length > 0) {
        const imageUrls = await uploadImages(petId, userId)
        if (imageUrls.length > 0) {
          await supabase.from('pet_images').insert(
            imageUrls.map(u => ({ pet_id: petId, ...u }))
          )
        }
      }

      router.push(`/pets/${petId}?created=true`)

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const atLimit = planInfo && planInfo.current >= planInfo.limit

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 mb-20">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1 flex items-center gap-2">
          <PawPrint size={28} /> สร้างโปรไฟล์น้อง
        </h1>
        <p className="text-ori-ink-l font-bold text-sm">
          บันทึกข้อมูลน้องไว้ ช่วย AI จับคู่ได้แม่นขึ้นถ้าน้องหาย
        </p>
      </div>

      {/* Limit or Foreign Key profile warning */}
      {planChecked && (atLimit || error) && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-400
          rounded-2xl flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-red-800">{error}</p>
            {atLimit && (
              <a href="/pricing"
                className="text-xs font-black text-red-600 underline mt-1 inline-block">
                อัปเกรด Member เพื่อเพิ่มได้ถึง 3 ตัว →
              </a>
            )}
          </div>
        </div>
      )}

      <div className={`space-y-6 ${atLimit || (planChecked && error && !atLimit) ? 'opacity-50 pointer-events-none' : ''}`}>

        {/* ── รูปภาพ ── */}
        <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper">
          <h2 className="font-black text-lg mb-4 flex items-center justify-between">
            <span>📸 รูปภาพน้อง</span>
            <span className="text-sm font-bold text-ori-ink-l">
              {images.length}/{maxPhotos} รูป
            </span>
          </h2>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <div
                    onClick={() => setPrimaryIndex(i)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-4 cursor-pointer
                      transition-all ${i === primaryIndex
                        ? 'border-ori-orange shadow-paper-sm'
                        : 'border-gray-200 hover:border-gray-400'
                      }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                  {i === primaryIndex && (
                    <div className="absolute -top-1.5 -left-1.5 bg-ori-orange
                      text-white text-[9px] font-black px-1.5 py-0.5
                      rounded-full border border-white">
                      หลัก
                    </div>
                  )}
                  <button onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500
                      text-white rounded-full border-2 border-white
                      flex items-center justify-center hover:bg-red-700">
                    <X size={10} />
                  </button>
                </div>
              ))}

              {/* Add more */}
              {images.length < maxPhotos && (
                <button onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-4 border-dashed
                    border-gray-300 hover:border-ori-ink flex flex-col
                    items-center justify-center text-gray-400
                    hover:text-ori-ink transition-all">
                  <Plus size={20} />
                  <span className="text-[9px] font-bold mt-0.5">เพิ่ม</span>
                </button>
              )}
            </div>
          )}

          {/* Drop zone */}
          {previews.length === 0 && (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleImages(e.dataTransfer.files) }}
              className="border-4 border-dashed border-gray-300 rounded-2xl
                min-h-[120px] flex flex-col items-center justify-center gap-2
                cursor-pointer hover:border-ori-ink hover:bg-gray-50 transition-all"
            >
              <Upload size={32} className="text-gray-400" />
              <p className="font-black text-sm">กดเพื่อเลือกรูปน้อง</p>
              <p className="text-xs font-bold text-gray-400">
                สูงสุด {maxPhotos} รูป · JPG, PNG
              </p>
            </div>
          )}

          <input ref={fileRef} type="file" multiple accept="image/*"
            className="hidden"
            onChange={e => handleImages(e.target.files)} />

          {/* AI Caption */}
          {previews.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="font-black text-sm">
                  🤖 คำบรรยาย AI (ช่วย Matching)
                </label>
                <button onClick={generateCaption} disabled={captioning}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs
                    font-black bg-purple-100 text-purple-700 border border-purple-300
                    rounded-xl hover:bg-purple-200 transition-all disabled:opacity-50">
                  {captioning
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Sparkles size={12} />
                  }
                  สร้างอัตโนมัติ
                </button>
              </div>
              <textarea
                value={form.ai_caption}
                onChange={e => setForm(f => ({ ...f, ai_caption: e.target.value }))}
                placeholder="AI จะวิเคราะห์รูปหลักและสร้างคำบรรยายให้อัตโนมัติ หรือพิมพ์เองก็ได้"
                rows={2}
                className="ori-input resize-none text-sm"
              />
            </div>
          )}
        </div>

        {/* ── ข้อมูลพื้นฐาน ── */}
        <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper">
          <h2 className="font-black text-lg mb-4">🐾 ข้อมูลพื้นฐาน</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="space-y-1">
              <label className="font-black text-sm">ชื่อน้อง *</label>
              <input value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="เช่น บัตเตอร์, มะลิ"
                className="ori-input" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">ประเภทสัตว์ *</label>
              <select value={form.species}
                onChange={e => setForm(f => ({ ...f, species: e.target.value }))}
                className="ori-input bg-white cursor-pointer">
                {SPECIES_OPTIONS.map(s => (
                  <option key={s} value={s}>{s || '-- เลือก --'}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">สายพันธุ์</label>
              <input value={form.breed}
                onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
                placeholder="เช่น โกลเด้น, เปอร์เซีย"
                className="ori-input" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">เพศ</label>
              <select value={form.gender}
                onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                className="ori-input bg-white cursor-pointer">
                {GENDER_OPTIONS.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">สี / ลักษณะขน</label>
              <input value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                placeholder="เช่น สีน้ำตาลทอง มีจุดขาวที่อก"
                className="ori-input" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">วันเกิด</label>
              <input type="date" value={form.birthday}
                onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
                className="ori-input" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">น้ำหนัก (กก.)</label>
              <input type="number" step="0.1" value={form.weight}
                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                placeholder="0.0"
                className="ori-input" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">เลขไมโครชิป</label>
              <input value={form.microchip_id}
                onChange={e => setForm(f => ({ ...f, microchip_id: e.target.value }))}
                placeholder="15 หลัก (ถ้ามี)"
                className="ori-input" />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-black text-sm">ตำหนิพิเศษ</label>
              <input value={form.special_marks}
                onChange={e => setForm(f => ({ ...f, special_marks: e.target.value }))}
                placeholder="เช่น แผลเป็นที่ขาซ้าย หูขาดเล็กน้อย ลายพิเศษ"
                className="ori-input" />
            </div>
          </div>
        </div>

        {/* ── Mode ── */}
        <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper">
          <h2 className="font-black text-lg mb-1">🔀 Mode</h2>
          <p className="text-sm font-bold text-ori-ink-l mb-4">
            เปิดได้หลาย Mode พร้อมกัน · โปรไฟล์จะแสดงต่อสาธารณะเมื่อเปิด Mode
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {MODE_CONFIG.map(m => {
              const active = modes[m.key]
              return (
                <button key={m.key} type="button"
                  onClick={() => setModes(prev => ({ ...prev, [m.key]: !prev[m.key] }))}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    active
                      ? MODE_COLOR[m.color]
                      : 'border-gray-200 bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <m.icon size={16} />
                    <span className="font-black text-sm">{m.label}</span>
                    {active && <span className="ml-auto text-xs font-black">✓ เปิด</span>}
                  </div>
                  <p className="text-xs font-bold opacity-70">{m.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── ประวัติพ่อแม่ ── */}
        <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper">
          <h2 className="font-black text-lg mb-4">🧬 ประวัติพ่อ-แม่ (ไม่บังคับ)</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-black text-sm">ชื่อพ่อ</label>
              <input value={form.father_name}
                onChange={e => setForm(f => ({ ...f, father_name: e.target.value }))}
                placeholder="ชื่อพ่อน้อง"
                className="ori-input" />
            </div>
            <div className="space-y-1">
              <label className="font-black text-sm">ชื่อแม่</label>
              <input value={form.mother_name}
                onChange={e => setForm(f => ({ ...f, mother_name: e.target.value }))}
                placeholder="ชื่อแม่น้อง"
                className="ori-input" />
            </div>
          </div>
        </div>

        {/* ── ผู้ติดต่อฉุกเฉิน ── */}
        <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper">
          <h2 className="font-black text-lg mb-1">🆘 ผู้ติดต่อฉุกเฉิน</h2>
          <p className="text-sm font-bold text-ori-ink-l mb-4">
            ถ้าติดต่อเจ้าของไม่ได้ คนที่พบน้องจะเห็นข้อมูลนี้
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-black text-sm">ชื่อ</label>
              <input value={form.emergency_name}
                onChange={e => setForm(f => ({ ...f, emergency_name: e.target.value }))}
                placeholder="ชื่อผู้ติดต่อสำรอง"
                className="ori-input" />
            </div>
            <div className="space-y-1">
              <label className="font-black text-sm">เบอร์โทร</label>
              <input value={form.emergency_tel}
                onChange={e => setForm(f => ({ ...f, emergency_tel: e.target.value }))}
                placeholder="08x-xxx-xxxx"
                className="ori-input" />
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && !atLimit && (
          <div className="p-4 bg-red-50 border-2 border-red-400 rounded-2xl
            flex items-center gap-3 text-red-800">
            <AlertCircle size={18} className="shrink-0" />
            <span className="font-bold text-sm">{error}</span>
          </div>
        )}

        {/* ── Save ── */}
        <button onClick={handleSave} disabled={saving || !!atLimit || (planChecked && error && !atLimit)}
          className="w-full py-5 bg-ori-ink text-white font-black text-lg
            rounded-2xl border-4 border-ori-ink shadow-paper
            hover:shadow-paper-lg hover:-translate-y-1 transition-all
            flex items-center justify-center gap-2 disabled:opacity-50
            disabled:cursor-not-allowed disabled:translate-y-0">
          {saving
            ? <><Loader2 size={20} className="animate-spin" /> กำลังบันทึก...</>
            : <><PawPrint size={20} /> บันทึกโปรไฟล์น้อง <ChevronRight size={18} /></>
          }
        </button>
      </div>
    </div>
  )
}