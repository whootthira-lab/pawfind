'use client'
// app/(main)/pets/[id]/edit/page.tsx
// ── แก้ไขโปรไฟล์น้อง — pre-fill จากข้อมูลเดิมครบถ้วนสมบูรณ์ 100% ──

import { useState, useRef, useMemo, useEffect } from 'react'
import { createBrowserClient }                  from '@supabase/ssr'
import { useRouter, useParams }                 from 'next/navigation'
import Link                                     from 'next/link'
import {
  Upload, Sparkles, Loader2, ChevronLeft,
  PawPrint, Heart, Home, Trophy, Search,
  X, Plus, AlertCircle, Save, Trash2, Shield
} from 'lucide-react'

// ── Types & Constants (เหมือน new page) ─────────────────────
type Mode = 'mode_lost' | 'mode_mating' | 'mode_adoption' | 'mode_showcase' | 'mode_private'

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
  { key: 'mode_lost',     icon: Search, label: 'ประกาศหาย',     color: 'blue',  desc: 'เปิดเมื่อน้องหาย AI จะช่วยหาคู่ Match' },
  { key: 'mode_mating',   icon: Heart,  label: 'หาคู่ให้น้อง',  color: 'pink',  desc: 'จับคู่กับสัตว์ที่ต้องการผสมพันธุ์'    },
  { key: 'mode_adoption', icon: Home,   label: 'หาบ้านให้น้อง', color: 'green', desc: 'ให้คนอื่นมารับเลี้ยงน้องต่อ'           },
  { key: 'mode_showcase', icon: Trophy, label: 'โชว์โปรไฟล์',   color: 'amber', desc: 'แสดงในฟีดและชมรมสัตว์เลี้ยง'          },
  { key: 'mode_private',  icon: Shield, label: 'เฉพาะฉัน',     color: 'red',   desc: 'ซ่อนโปรไฟล์ทั้งหมดและดูได้เฉพาะคุณคนเดียว' },
]
const MODE_COLOR: Record<string, string> = {
  blue:  'border-blue-400 bg-blue-50 text-blue-700',
  pink:  'border-pink-400 bg-pink-50 text-pink-700',
  green: 'border-green-400 bg-green-50 text-green-700',
  amber: 'border-amber-400 bg-amber-50 text-amber-700',
  red:   'border-red-400 bg-red-50 text-red-700',
}

// ── Existing image type ────────────────────────────────────
interface ExistingImage {
  id:          string
  storage_url: string
  is_primary:  boolean
  toDelete?:   boolean
}

// ══════════════════════════════════════════════════════════
export default function EditPetPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // ── Geolocation states ──
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showGeoModal, setShowGeoModal] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoSuccess, setGeoSuccess] = useState(false)

  const requestGeoLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('บราวเซอร์ของคุณไม่รองรับการแชร์พิกัด GPS ค่ะ')
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoSuccess(true)
        setGeoLoading(false)
      },
      (err) => {
        console.warn("GPS Access Error:", err)
        alert('ไม่สามารถเข้าถึงพิกัดได้ กรุณาอนุญาตสิทธิ์เข้าถึงพิกัดในบราวเซอร์ของคุณค่ะ')
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ── Form state ──────────────────────────────────────────
  const [form, setForm] = useState({
    name:           '',
    species:        '',
    breed:          '',
    gender:         'unknown',
    is_sterilized:  false,    // 🟢 เพิ่มฟิลด์รองรับสถานะการทำหมันในฟอร์มแก้ไข[cite: 34]
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
    mode_private: false,
  })

  // ── Image state ─────────────────────────────────────────
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [newFiles,    setNewFiles]    = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [primaryKey,  setPrimaryKey]  = useState<string>('existing-0')
  const fileRef = useRef<HTMLInputElement>(null)

  // ── UI state ────────────────────────────────────────────
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [captioning, setCaptioning] = useState(false)
  const [error,      setError]      = useState('')
  const [plan,       setPlan]       = useState<'free' | 'member'>('free')
  const [showDelete, setShowDelete] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  const maxPhotos = plan === 'member' ? 10 : 3
  const activeImages = existingImages.filter(i => !i.toDelete)
  const totalImages  = activeImages.length + newFiles.length

  // ── Load existing data ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      // ตรวจสิทธิ์ + ดึงข้อมูล pet[cite: 34]
      const { data: pet } = await supabase
        .from('pets')
        .select('*, pet_images(id, storage_url, is_primary)')
        .eq('id', id)
        .eq('user_id', session.user.id)   // ต้องเป็นเจ้าของ[cite: 34]
        .single()

      if (!pet) { router.push('/dashboard/pets'); return }

      // ประมวลความเข้ากันของชื่อฟิลด์วันเกิด (birthday หรือ birthdate)
      const rawBirthday = pet.birthday || pet.birthdate || ''
      const formattedBirthday = rawBirthday ? rawBirthday.split('T')[0] : ''

      // Pre-fill form[cite: 34]
      const ec = pet.emergency_contact || {}
      setForm({
        name:           pet.name          || '',
        species:        pet.species        || '',
        breed:          pet.breed          || '',
        gender:         pet.gender         || 'unknown',
        is_sterilized:  pet.is_sterilized  ?? false, // 🟢 Pre-fill ดึงค่าสถานะทำหมันเดิมจากเบื้องหลังออกมารอไว้ทันที[cite: 34]
        color:          pet.color          || '',
        birthday:       formattedBirthday,
        weight:         pet.weight?.toString() || '',
        microchip_id:   pet.microchip_id   || '',
        special_marks:  pet.special_marks  || '',
        ai_caption:     pet.ai_caption     || '',
        father_name:    pet.father_name    || '',
        mother_name:    pet.mother_name    || '',
        emergency_name: ec.name            || '',
        emergency_tel:  ec.tel             || '',
      })

      // Pre-fill modes
      const isPrivate = pet.visibility === 'private' || !pet.is_public
      setModes({
        mode_lost:     !isPrivate && (pet.mode_lost     || false),
        mode_mating:   !isPrivate && (pet.mode_mating   || false),
        mode_adoption: !isPrivate && (pet.mode_adoption || false),
        mode_showcase: !isPrivate && (pet.mode_showcase || false),
        mode_private:  isPrivate,
      })

      // Pre-fill location
      if (pet.latitude && pet.longitude) {
        setLocation({ lat: pet.latitude, lng: pet.longitude })
        setGeoSuccess(true)
      }

      // Pre-fill images[cite: 34]
      const imgs: ExistingImage[] = (pet.pet_images || [])
        .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
      setExistingImages(imgs)

      // Set primary key[cite: 34]
      const primaryImg = imgs.find((i: ExistingImage) => i.is_primary)
      if (primaryImg) {
        const idx = imgs.indexOf(primaryImg)
        setPrimaryKey(`existing-${idx}`)
      }

      // Subscription[cite: 34]
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan, expires_at')
        .eq('user_id', session.user.id)
        .single()

      let effectivePlan: 'free' | 'member' = 'free'
      if (sub?.plan === 'member' && sub?.expires_at) {
        if (new Date(sub.expires_at) > new Date()) effectivePlan = 'member'
      }
      setPlan(effectivePlan)

      setLoading(false)
    }
    load()
  }, [id])

  // ── Image handlers ──────────────────────────────────────
  const handleNewImages = (files: FileList | null) => {
    if (!files) return
    const remaining = maxPhotos - totalImages
    const added     = Array.from(files).slice(0, remaining)
    setNewFiles(prev => [...prev, ...added])
    added.forEach(f => {
      const reader = new FileReader()
      reader.onload = e => setNewPreviews(prev => [...prev, e.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  const markExistingDelete = (idx: number) => {
    setExistingImages(prev => prev.map((img, i) =>
      i === idx ? { ...img, toDelete: !img.toDelete } : img
    ))
    if (primaryKey === `existing-${idx}`) {
      const next = existingImages.find((img, i) => i !== idx && !img.toDelete)
      if (next) setPrimaryKey(`existing-${existingImages.indexOf(next)}`)
      else if (newFiles.length > 0) setPrimaryKey('new-0')
    }
  }

  const removeNewImage = (idx: number) => {
    setNewFiles(prev     => prev.filter((_, i) => i !== idx))
    setNewPreviews(prev  => prev.filter((_, i) => i !== idx))
    if (primaryKey === `new-${idx}`) {
      if (activeImages.length > 0) setPrimaryKey('existing-0')
      else if (newFiles.length > 1) setPrimaryKey('new-0')
    }
  }

  // ── AI Caption ──────────────────────────────────────────
  const generateCaption = async () => {
    const src = primaryKey.startsWith('existing-')
      ? activeImages[parseInt(primaryKey.split('-')[1])]?.storage_url
      : newPreviews[parseInt(primaryKey.split('-')[1])]

    if (!src) return
    setCaptioning(true)
    try {
      let base64 = ''
      if (primaryKey.startsWith('existing-')) {
        const res  = await fetch(src)
        const blob = await res.blob()
        base64     = await new Promise<string>(r => {
          const reader = new FileReader()
          reader.onload = e => r((e.target?.result as string).split(',')[1])
          reader.readAsDataURL(blob)
        })
      } else {
        base64 = src.split(',')[1]
      }

      const res  = await fetch('/api/pets/caption', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ imageBase64: base64, petName: form.name, species: form.species }),
      })
      const data = await res.json()
      if (data.caption) setForm(f => ({ ...f, ai_caption: data.caption }))
    } finally {
      setCaptioning(false)
    }
  }

  // ── Upload new images (Promise.all — เหมือน new page) ───
  const uploadNewImages = async (petId: string, userId: string) => {
    const uploadPromises = newFiles.map(async (file, i) => {
      const ext  = file.name.split('.').pop()
      const path = `pets/${userId}/${petId}/${Date.now()}-${i}.${ext}`
      const { error: upErr } = await supabase.storage.from('pet-images').upload(path, file)
      if (upErr) return null
      const { data: { publicUrl } } = supabase.storage.from('pet-images').getPublicUrl(path)
      return { storage_url: publicUrl, newIndex: i }
    })
    const results = await Promise.all(uploadPromises)
    return results.filter((r): r is { storage_url: string; newIndex: number } => r !== null)
  }

  // ── Save ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { setError('กรุณาระบุชื่อน้อง'); return }
    if (!form.species)     { setError('กรุณาเลือกประเภทสัตว์'); return }

    setSaving(true); setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const userId = session.user.id

      const isPrivate = modes.mode_private

      // ── 1. Update pet record ────────────────────────────
      const { error: petErr } = await supabase
        .from('pets')
        .update({
          name:           form.name.trim(),
          species:        form.species,
          breed:          form.breed          || null,
          gender:         form.gender,
          is_sterilized:  form.is_sterilized, // 🟢 อัปเดตผูกบันทึกสถานะทำหมันเข้าสู่ Supabase
          birthday:       form.birthday       || null,
          birthdate:      form.birthday       || null, // รองรับชื่อฟิลด์ทั้งสองรูปแบบขนานกันเพื่อความปลอดภัยสากล
          color:          form.color          || null,
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
          mode_lost:      !isPrivate && modes.mode_lost,
          mode_mating:    !isPrivate && modes.mode_mating,
          mode_adoption:  !isPrivate && modes.mode_adoption,
          mode_showcase:  !isPrivate && modes.mode_showcase,
          is_public:      !isPrivate,
          visibility:     isPrivate ? 'private' : 'public',
          latitude:       location?.lat ?? null,
          longitude:      location?.lng ?? null,
          status:         modes.mode_lost ? 'lost' : (
            modes.mode_adoption ? 'adoption' : (
              modes.mode_mating ? 'mating' : 'showcase'
            )
          ),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)

      if (petErr) throw petErr

      // ── 2. ลบรูปที่ mark toDelete ───────────────────────[cite: 34]
      const toDeleteIds = existingImages
        .filter(img => img.toDelete)
        .map(img => img.id)

      if (toDeleteIds.length > 0) {
        await supabase.from('pet_images').delete().in('id', toDeleteIds)
      }

      // ── 3. อัปโหลดรูปใหม่ (Promise.all) ─────────────────[cite: 34]
      let uploadedUrls: { storage_url: string; newIndex: number }[] = []
      if (newFiles.length > 0) {
        uploadedUrls = await uploadNewImages(id, userId)
        if (uploadedUrls.length > 0) {
          await supabase.from('pet_images').insert(
            uploadedUrls.map(u => ({
              pet_id:      id,
              storage_url: u.storage_url,
              is_primary:  false,
            }))
          )
        }
      }

      // ── 4. อัปเดต is_primary ─────────────────────────────[cite: 34]
      await supabase.from('pet_images')
        .update({ is_primary: false })
        .eq('pet_id', id)

      if (primaryKey.startsWith('existing-')) {
        const idx = parseInt(primaryKey.split('-')[1])
        const img = activeImages[idx]
        if (img && !img.toDelete) {
          await supabase.from('pet_images')
            .update({ is_primary: true })
            .eq('id', img.id)
        }
      } else {
        const newIdx    = parseInt(primaryKey.split('-')[1])
        const uploaded  = uploadedUrls[newIdx]
        if (uploaded) {
          await supabase.from('pet_images')
            .update({ is_primary: true })
            .eq('pet_id', id)
            .eq('storage_url', uploaded.storage_url)
        }
      }

      router.push(`/pets/${id}?updated=true`)

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete pet ──────────────────────────────────────────[cite: 34]
  const handleDelete = async () => {
    setDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const deleteAfter = new Date()
      deleteAfter.setDate(deleteAfter.getDate() + 60)

      await supabase.from('pets').update({
        status:       'archived',
        archived_at:  new Date().toISOString(),
        delete_after: deleteAfter.toISOString(),
        mode_lost:    false, mode_mating:   false,
        mode_adoption: false, mode_showcase: false,
        is_public:    false,
      }).eq('id', id).eq('user_id', session.user.id)

      router.push('/dashboard/pets?deleted=true')
    } finally {
      setDeleting(false)
    }
  }

  const hasPrimarySelection = totalImages > 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 mb-20">

      {/* ── Header ──[cite: 34] */}
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/pets/${id}`}
          className="p-2 hover:bg-gray-100 rounded-xl transition-all">
          <ChevronLeft size={22} />
        </Link>
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2">
            <PawPrint size={28} /> แก้ไขโปรไฟล์น้อง
          </h1>
          <p className="text-sm font-bold text-ori-ink-l">
            {form.name || 'โหลดข้อมูล...'}
          </p>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── รูปภาพ ──[cite: 34] */}
        <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper">
          <h2 className="font-black text-lg mb-4 flex items-center justify-between">
            <span>📸 รูปภาพน้อง</span>
            <span className="text-sm font-bold text-ori-ink-l">
              {totalImages}/{maxPhotos} รูป
            </span>
          </h2>

          {/* Existing images[cite: 34] */}
          {(existingImages.length > 0 || newFiles.length > 0) && (
            <div className="flex flex-wrap gap-3 mb-4">

              {/* Existing[cite: 34] */}
              {existingImages.map((img, i) => {
                const key      = `existing-${i}`
                const isPrimary = primaryKey === key
                const deleted   = img.toDelete
                return (
                  <div key={img.id} className="relative">
                    <div
                      onClick={() => !deleted && setPrimaryKey(key)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-4
                        transition-all ${deleted
                          ? 'opacity-30 grayscale border-red-400'
                          : isPrimary
                            ? 'border-ori-orange shadow-paper-sm cursor-pointer'
                            : 'border-gray-200 hover:border-gray-400 cursor-pointer'
                        }`}
                    >
                      <img src={img.storage_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    {isPrimary && !deleted && (
                      <div className="absolute -top-1.5 -left-1.5 bg-ori-orange
                        text-white text-[9px] font-black px-1.5 py-0.5
                        rounded-full border border-white">
                        หลัก
                      </div>
                    )}
                    <button
                      onClick={() => markExistingDelete(i)}
                      title={deleted ? 'เลิกลบ' : 'ลบรูปนี้'}
                      className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full
                        border-2 border-white flex items-center justify-center
                        text-white transition-all ${deleted
                          ? 'bg-gray-400 hover:bg-gray-600'
                          : 'bg-red-500 hover:bg-red-700'
                        }`}
                    >
                      {deleted ? <Plus size={10} /> : <X size={10} />}
                    </button>
                    {deleted && (
                      <div className="absolute inset-0 flex items-center justify-center
                        pointer-events-none">
                        <span className="text-[9px] font-black text-red-600
                          bg-white/90 px-1 rounded">จะลบ</span>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* New images[cite: 34] */}
              {newPreviews.map((src, i) => {
                const key      = `new-${i}`
                const isPrimary = primaryKey === key
                return (
                  <div key={`new-${i}`} className="relative">
                    <div
                      onClick={() => setPrimaryKey(key)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-4
                        cursor-pointer transition-all ${
                        isPrimary
                          ? 'border-ori-orange shadow-paper-sm'
                          : 'border-blue-300 hover:border-blue-500'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-500/80
                        text-white text-[8px] font-black text-center py-0.5">
                        ใหม่
                      </div>
                    </div>
                    {isPrimary && (
                      <div className="absolute -top-1.5 -left-1.5 bg-ori-orange
                        text-white text-[9px] font-black px-1.5 py-0.5
                        rounded-full border border-white">
                        หลัก
                      </div>
                    )}
                    <button onClick={() => removeNewImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500
                        text-white rounded-full border-2 border-white
                        flex items-center justify-center hover:bg-red-700">
                      <X size={10} />
                    </button>
                  </div>
                )
              })}

              {/* Add more[cite: 34] */}
              {totalImages < maxPhotos && (
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

          {/* Empty state[cite: 34] */}
          {totalImages === 0 && (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleNewImages(e.dataTransfer.files) }}
              className="border-4 border-dashed border-gray-300 rounded-2xl
                min-h-[120px] flex flex-col items-center justify-center gap-2
                cursor-pointer hover:border-ori-ink hover:bg-gray-50 transition-all"
            >
              <Upload size={32} className="text-gray-400" />
              <p className="font-black text-sm">กดเพื่อเพิ่มรูปน้อง</p>
              <p className="text-xs font-bold text-gray-400">สูงสุด {maxPhotos} รูป</p>
            </div>
          )}

          <input ref={fileRef} type="file" multiple accept="image/*"
            className="hidden"
            onChange={e => handleNewImages(e.target.files)} />

          {totalImages > 1 && (
            <p className="text-xs font-bold text-ori-ink-l mt-2">
              💡 กดที่รูปเพื่อเลือกเป็นรูปหลัก
            </p>
          )}

          {/* AI Caption[cite: 34] */}
          {totalImages > 0 && (
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
                  สร้างใหม่
                </button>
              </div>
              <textarea
                value={form.ai_caption}
                onChange={e => setForm(f => ({ ...f, ai_caption: e.target.value }))}
                placeholder="คำบรรยายสำหรับ AI Matching"
                rows={2}
                className="ori-input resize-none text-sm"
              />
            </div>
          )}
        </div>

        {/* ── ข้อมูลพื้นฐาน ──[cite: 34] */}
        <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper">
          <h2 className="font-black text-lg mb-4">🐾 ข้อมูลพื้นฐาน</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="space-y-1">
              <label className="font-black text-sm">ชื่อน้อง *</label>
              <input value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="ori-input" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">ประเภทสัตว์ *</label>
              <select value={form.species}
                onChange={e => setForm(f => ({ ...f, species: e.target.value }))}
                className="ori-input bg-white cursor-pointer font-bold">
                {SPECIES_OPTIONS.map(s => (
                  <option key={s} value={s}>{s || '-- เลือก --'}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">สายพันธุ์</label>
              <input value={form.breed}
                onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
                className="ori-input" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">เพศ</label>
              <select value={form.gender}
                onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                className="ori-input bg-white cursor-pointer font-bold">
                {GENDER_OPTIONS.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            {/* ── 🟢 [แผงแทรกเสริม] ช่องกรอกการทำหมัน และอินพุตระบุปฏิทินวันเกิดอย่างสมบูรณ์แบบ ── */}
            <div className="space-y-1">
              <label className="font-black text-sm">การทำหมัน 🩺</label>
              <select 
                value={form.is_sterilized ? "true" : "false"} 
                onChange={e => setForm(f => ({ ...f, is_sterilized: e.target.value === "true" }))} 
                className="ori-input bg-white cursor-pointer font-bold"
              >
                <option value="false">❌ ยังไม่ได้ทำหมัน</option>
                <option value="true">✨ ทำหมันเรียบร้อยแล้ว</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">วันเกิดน้อง (เพื่อคำนวณอายุ) 🎂</label>
              <input type="date" value={form.birthday}
                onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
                className="ori-input cursor-pointer font-bold" />
            </div>

            <div className="space-y-1">
              <label className="font-black text-sm">สี / ลักษณะขน</label>
              <input value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
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
                placeholder="เช่น แผลเป็นที่ขาซ้าย หูขาดเล็กน้อย"
                className="ori-input" />
            </div>
          </div>
        </div>

        {/* ── Mode ──[cite: 34] */}
        <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper">
          <h2 className="font-black text-lg mb-1">🔀 Mode</h2>
          <p className="text-sm font-bold text-ori-ink-l mb-4">
            เปิด/ปิด Mode ได้ตลอดเวลา · โปรไฟล์จะแสดงต่อสาธารณะเมื่อเปิด Mode
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {MODE_CONFIG.map(m => {
              const active = modes[m.key]
              return (
                <button key={m.key} type="button"
                  onClick={() => {
                    const currentlyActive = modes[m.key]
                    const turningOn = !currentlyActive
                    if (turningOn && (m.key === 'mode_lost' || m.key === 'mode_mating' || m.key === 'mode_adoption')) {
                      setShowGeoModal(true)
                      setGeoSuccess(false)
                    }

                    setModes(prev => {
                      if (m.key === 'mode_private') {
                        return {
                          mode_lost: false,
                          mode_mating: false,
                          mode_adoption: false,
                          mode_showcase: false,
                          mode_private: !prev.mode_private
                        }
                      } else {
                        return {
                          ...prev,
                          [m.key]: !prev[m.key],
                          mode_private: false
                        }
                      }
                    })
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    active ? MODE_COLOR[m.color] : 'border-gray-200 bg-gray-50 hover:border-gray-400'
                  }`}>
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

        {/* ── ประวัติพ่อแม่ ──[cite: 34] */}
        <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper">
          <h2 className="font-black text-lg mb-4">🧬 ประวัติพ่อ-แม่</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-black text-sm">ชื่อพ่อ</label>
              <input value={form.father_name}
                onChange={e => setForm(f => ({ ...f, father_name: e.target.value }))}
                className="ori-input" />
            </div>
            <div className="space-y-1">
              <label className="font-black text-sm">ชื่อแม่</label>
              <input value={form.mother_name}
                onChange={e => setForm(f => ({ ...f, mother_name: e.target.value }))}
                className="ori-input" />
            </div>
          </div>
        </div>

        {/* ── ผู้ติดต่อฉุกเฉิน ──[cite: 34] */}
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
                className="ori-input" />
            </div>
            <div className="space-y-1">
              <label className="font-black text-sm">เบอร์โทร</label>
              <input value={form.emergency_tel}
                onChange={e => setForm(f => ({ ...f, emergency_tel: e.target.value }))}
                className="ori-input" />
            </div>
          </div>
        </div>

        {/* ── Error ──[cite: 34] */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-400 rounded-2xl
            flex items-center gap-3 text-red-800">
            <AlertCircle size={18} className="shrink-0" />
            <span className="font-bold text-sm">{error}</span>
          </div>
        )}

        {/* ── Save ──[cite: 34] */}
        <button onClick={handleSave} disabled={saving}
          className="w-full py-5 bg-ori-ink text-white font-black text-lg
            rounded-2xl border-4 border-ori-ink shadow-paper
            hover:shadow-paper-lg hover:-translate-y-1 transition-all
            flex items-center justify-center gap-2 disabled:opacity-50">
          {saving
            ? <><Loader2 size={20} className="animate-spin" /> กำลังบันทึก...</>
            : <><Save size={20} /> บันทึกการแก้ไข</>
          }
        </button>

        {/* ── Danger zone ──[cite: 34] */}
        <div className="border-4 border-dashed border-red-300 rounded-3xl p-6">
          <h3 className="font-black text-red-700 mb-1 flex items-center gap-2">
            <Trash2 size={18} /> Danger Zone
          </h3>
          <p className="text-sm font-bold text-red-500 mb-4">
            ลบโปรไฟล์น้อง — ข้อมูลจะถูกซ่อน 60 วัน ก่อนลบถาวร
          </p>
          {!showDelete ? (
            <button onClick={() => setShowDelete(true)}
              className="px-4 py-2 text-sm font-black text-red-600 border-2
                border-red-400 rounded-xl hover:bg-red-50 transition-all">
              ลบโปรไฟล์น้อง
            </button>
          ) : (
            <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-400">
              <p className="font-black text-red-800 mb-3">
                ยืนยันลบโปรไฟล์ &quot;{form.name}&quot;?
              </p>
              <div className="flex gap-2">
                <button onClick={handleDelete} disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white font-black text-sm
                    rounded-xl border-2 border-red-700 hover:bg-red-700
                    transition-all disabled:opacity-50 flex items-center gap-1.5">
                  {deleting
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Trash2 size={14} />
                  }
                  ยืนยันลบ
                </button>
                <button onClick={() => setShowDelete(false)}
                  className="px-4 py-2 text-sm font-black border-2 border-gray-300
                    rounded-xl hover:bg-gray-50 transition-all">
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ══ 📍 MODAL ขอเข้าถึงพิกัดค้นหาอัจฉริยะ ══ */}
      {showGeoModal && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-xs" onClick={() => setShowGeoModal(false)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center border-4 border-black shadow-paper" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">📍</div>
            <h3 className="font-black text-xl mb-1 text-black">ตั้งค่าพิกัดค้นหาอัจฉริยะ (AI Location)</h3>
            <p className="text-xs font-bold text-gray-500 mb-4 px-2">
              เพื่อให้ AI ใช้ในการค้นหาจากบริเวณโดยรอบ ข้อมูลนี้จะไม่แสดงให้บุคคลเห็น
            </p>

            <div className="space-y-4">
              <button
                type="button"
                onClick={requestGeoLocation}
                disabled={geoLoading}
                className="w-full py-3 bg-ori-orange text-white font-black text-sm rounded-xl border-2 border-black shadow-paper-sm hover:bg-ori-orange-d transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {geoLoading ? <Loader2 size={16} className="animate-spin" /> : 'ขอเข้าถึงพิกัด 🔍'}
              </button>

              {geoSuccess && location && (
                <div className="p-3 bg-green-50 border-2 border-green-400 rounded-xl text-green-800 text-xs font-bold animate-fadeIn">
                  ✅ ได้รับพิกัดเรียบร้อยแล้วค่ะ!
                  <div className="text-[10px] text-gray-500 mt-0.5">Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}</div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowGeoModal(false)}
                className="w-full py-2.5 bg-black text-white font-black text-xs rounded-xl border-2 border-black shadow-paper-sm hover:bg-gray-800 transition-all"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}