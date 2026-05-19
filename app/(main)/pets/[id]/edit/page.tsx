'use client'
// app/(main)/pets/[id]/edit/page.tsx
// ── แก้ไขโปรไฟล์น้อง — pre-fill จากข้อมูลเดิม ──

import { useState, useRef, useMemo, useEffect } from 'react'
import { createBrowserClient }                  from '@supabase/ssr'
import { useRouter, useParams }                 from 'next/navigation'
import Link                                     from 'next/link'
import {
  Upload, Sparkles, Loader2, ChevronLeft,
  PawPrint, Heart, Home, Trophy, Search,
  X, Plus, AlertCircle, Save, Trash2
} from 'lucide-react'

// ── Types & Constants (เหมือน new page) ─────────────────────
type Mode = 'mode_lost' | 'mode_mating' | 'mode_adoption' | 'mode_showcase'

const SPECIES_OPTIONS = [
  '', 'สุนัข', 'แมว', 'นกสวยงาม', 'ปลาสวยงาม',
  'กระต่าย', 'แฮมสเตอร์', 'เต่า', 'งู', 'กิ้งก่า', 'อื่นๆ',
]
const GENDER_OPTIONS = [
  { value: '',        label: '-- เลือก --' },
  { value: 'male',    label: '♂ เพศผู้'   },
  { value: 'female',  label: '♀ เพศเมีย'  },
  { value: 'unknown', label: '❓ ไม่ทราบ' },
]
const MODE_CONFIG: { key: Mode; icon: any; label: string; color: string; desc: string }[] = [
  { key: 'mode_lost',     icon: Search, label: 'ประกาศหาย',     color: 'blue',  desc: 'เปิดเมื่อน้องหาย AI จะช่วยหาคู่ Match' },
  { key: 'mode_mating',   icon: Heart,  label: 'หาคู่ให้น้อง',  color: 'pink',  desc: 'จับคู่กับสัตว์ที่ต้องการผสมพันธุ์'    },
  { key: 'mode_adoption', icon: Home,   label: 'หาบ้านให้น้อง', color: 'green', desc: 'ให้คนอื่นมารับเลี้ยงน้องต่อ'           },
  { key: 'mode_showcase', icon: Trophy, label: 'โชว์โปรไฟล์',   color: 'amber', desc: 'แสดงในฟีดและชมรมสัตว์เลี้ยง'          },
]
const MODE_COLOR: Record<string, string> = {
  blue:  'border-blue-400 bg-blue-50 text-blue-700',
  pink:  'border-pink-400 bg-pink-50 text-pink-700',
  green: 'border-green-400 bg-green-50 text-green-700',
  amber: 'border-amber-400 bg-amber-50 text-amber-700',
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
  // รูปเดิมจาก DB
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  // รูปใหม่ที่เพิ่ม
  const [newFiles,    setNewFiles]    = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  // index ของรูปหลัก — negative = existing, positive = new
  // ใช้ string: &quot;existing-0&quot;, &quot;new-0&quot;
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

      // ตรวจสิทธิ์ + ดึงข้อมูล pet
      const { data: pet } = await supabase
        .from('pets')
        .select('*, pet_images(id, storage_url, is_primary)')
        .eq('id', id)
        .eq('user_id', session.user.id)   // ต้องเป็นเจ้าของ
        .single()

      if (!pet) { router.push('/dashboard/pets'); return }

      // Pre-fill form
      const ec = pet.emergency_contact || {}
      setForm({
        name:           pet.name          || '',
        species:        pet.species        || '',
        breed:          pet.breed          || '',
        gender:         pet.gender         || '',
        color:          pet.color          || '',
        birthday:       pet.birthday       || '',
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
      setModes({
        mode_lost:     pet.mode_lost     || false,
        mode_mating:   pet.mode_mating   || false,
        mode_adoption: pet.mode_adoption || false,
        mode_showcase: pet.mode_showcase || false,
      })

      // Pre-fill images
      const imgs: ExistingImage[] = (pet.pet_images || [])
        .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
      setExistingImages(imgs)

      // Set primary key
      const primaryImg = imgs.find((i: ExistingImage) => i.is_primary)
      if (primaryImg) {
        const idx = imgs.indexOf(primaryImg)
        setPrimaryKey(`existing-${idx}`)
      }

      // Subscription
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
    // ถ้าลบรูปหลัก → reset primary
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
    // ใช้รูปหลักหรือรูปแรกที่มี
    const src = primaryKey.startsWith('existing-')
      ? activeImages[parseInt(primaryKey.split('-')[1])]?.storage_url
      : newPreviews[parseInt(primaryKey.split('-')[1])]

    if (!src) return
    setCaptioning(true)
    try {
      // ถ้าเป็น URL ของรูปเดิม ต้อง fetch มาก่อน แล้ว convert เป็น base64
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

      // ── 1. Update pet record ────────────────────────────
      const { error: petErr } = await supabase
        .from('pets')
        .update({
          name:           form.name.trim(),
          species:        form.species,
          breed:          form.breed          || null,
          gender:         form.gender         || null,
          color:          form.color          || null,
          birthday:       form.birthday       || null,
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)

      if (petErr) throw petErr

      // ── 2. ลบรูปที่ mark toDelete ───────────────────────
      const toDeleteIds = existingImages
        .filter(img => img.toDelete)
        .map(img => img.id)

      if (toDeleteIds.length > 0) {
        await supabase.from('pet_images').delete().in('id', toDeleteIds)
      }

      // ── 3. อัปโหลดรูปใหม่ (Promise.all) ─────────────────
      let uploadedUrls: { storage_url: string; newIndex: number }[] = []
      if (newFiles.length > 0) {
        uploadedUrls = await uploadNewImages(id, userId)
        if (uploadedUrls.length > 0) {
          await supabase.from('pet_images').insert(
            uploadedUrls.map(u => ({
              pet_id:      id,
              storage_url: u.storage_url,
              is_primary:  false,  // จะ set primary ทีหลัง
            }))
          )
        }
      }

      // ── 4. อัปเดต is_primary ─────────────────────────────
      // Reset primary ทั้งหมดก่อน
      await supabase.from('pet_images')
        .update({ is_primary: false })
        .eq('pet_id', id)

      // Set primary ใหม่
      if (primaryKey.startsWith('existing-')) {
        const idx = parseInt(primaryKey.split('-')[1])
        const img = activeImages[idx]
        if (img && !img.toDelete) {
          await supabase.from('pet_images')
            .update({ is_primary: true })
            .eq('id', img.id)
        }
      } else {
        // primary คือรูปใหม่ที่เพิ่ง upload
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

  // ── Delete pet ──────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Archive แทนการลบทันที
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

  // ── Loading ─────────────────────────────────────────────
  if (loading) return (
    <div className=&quot;min-h-[60vh] flex items-center justify-center&quot;>
      <Loader2 size={48} className=&quot;animate-spin text-ori-orange&quot; />
    </div>
  )

  const hasPrimarySelection = totalImages > 0

  return (
    <div className=&quot;max-w-2xl mx-auto px-4 py-10 mb-20&quot;>

      {/* ── Header ── */}
      <div className=&quot;flex items-center gap-3 mb-8&quot;>
        <Link href={`/pets/${id}`}
          className=&quot;p-2 hover:bg-gray-100 rounded-xl transition-all&quot;>
          <ChevronLeft size={22} />
        </Link>
        <div>
          <h1 className=&quot;text-3xl font-black flex items-center gap-2&quot;>
            <PawPrint size={28} /> แก้ไขโปรไฟล์น้อง
          </h1>
          <p className=&quot;text-sm font-bold text-ori-ink-l&quot;>
            {form.name || 'โหลดข้อมูล...'}
          </p>
        </div>
      </div>

      <div className=&quot;space-y-6&quot;>

        {/* ── รูปภาพ ── */}
        <div className=&quot;bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper&quot;>
          <h2 className=&quot;font-black text-lg mb-4 flex items-center justify-between&quot;>
            <span>📸 รูปภาพน้อง</span>
            <span className=&quot;text-sm font-bold text-ori-ink-l&quot;>
              {totalImages}/{maxPhotos} รูป
            </span>
          </h2>

          {/* Existing images */}
          {(existingImages.length > 0 || newFiles.length > 0) && (
            <div className=&quot;flex flex-wrap gap-3 mb-4&quot;>

              {/* Existing */}
              {existingImages.map((img, i) => {
                const key      = `existing-${i}`
                const isPrimary = primaryKey === key
                const deleted   = img.toDelete
                return (
                  <div key={img.id} className=&quot;relative&quot;>
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
                      <img src={img.storage_url} alt=&quot;&quot; className=&quot;w-full h-full object-cover&quot; />
                    </div>
                    {isPrimary && !deleted && (
                      <div className=&quot;absolute -top-1.5 -left-1.5 bg-ori-orange
                        text-white text-[9px] font-black px-1.5 py-0.5
                        rounded-full border border-white&quot;>
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
                      <div className=&quot;absolute inset-0 flex items-center justify-center
                        pointer-events-none&quot;>
                        <span className=&quot;text-[9px] font-black text-red-600
                          bg-white/90 px-1 rounded&quot;>จะลบ</span>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* New images */}
              {newPreviews.map((src, i) => {
                const key      = `new-${i}`
                const isPrimary = primaryKey === key
                return (
                  <div key={`new-${i}`} className=&quot;relative&quot;>
                    <div
                      onClick={() => setPrimaryKey(key)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-4
                        cursor-pointer transition-all ${
                        isPrimary
                          ? 'border-ori-orange shadow-paper-sm'
                          : 'border-blue-300 hover:border-blue-500'
                      }`}
                    >
                      <img src={src} alt=&quot;&quot; className=&quot;w-full h-full object-cover&quot; />
                      {/* ใหม่ badge */}
                      <div className=&quot;absolute bottom-0 left-0 right-0 bg-blue-500/80
                        text-white text-[8px] font-black text-center py-0.5&quot;>
                        ใหม่
                      </div>
                    </div>
                    {isPrimary && (
                      <div className=&quot;absolute -top-1.5 -left-1.5 bg-ori-orange
                        text-white text-[9px] font-black px-1.5 py-0.5
                        rounded-full border border-white&quot;>
                        หลัก
                      </div>
                    )}
                    <button onClick={() => removeNewImage(i)}
                      className=&quot;absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500
                        text-white rounded-full border-2 border-white
                        flex items-center justify-center hover:bg-red-700&quot;>
                      <X size={10} />
                    </button>
                  </div>
                )
              })}

              {/* Add more */}
              {totalImages < maxPhotos && (
                <button onClick={() => fileRef.current?.click()}
                  className=&quot;w-20 h-20 rounded-xl border-4 border-dashed
                    border-gray-300 hover:border-ori-ink flex flex-col
                    items-center justify-center text-gray-400
                    hover:text-ori-ink transition-all&quot;>
                  <Plus size={20} />
                  <span className=&quot;text-[9px] font-bold mt-0.5&quot;>เพิ่ม</span>
                </button>
              )}
            </div>
          )}

          {/* Empty state */}
          {totalImages === 0 && (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleNewImages(e.dataTransfer.files) }}
              className=&quot;border-4 border-dashed border-gray-300 rounded-2xl
                min-h-[120px] flex flex-col items-center justify-center gap-2
                cursor-pointer hover:border-ori-ink hover:bg-gray-50 transition-all&quot;
            >
              <Upload size={32} className=&quot;text-gray-400&quot; />
              <p className=&quot;font-black text-sm&quot;>กดเพื่อเพิ่มรูปน้อง</p>
              <p className=&quot;text-xs font-bold text-gray-400&quot;>สูงสุด {maxPhotos} รูป</p>
            </div>
          )}

          <input ref={fileRef} type=&quot;file&quot; multiple accept=&quot;image/*&quot;
            className=&quot;hidden&quot;
            onChange={e => handleNewImages(e.target.files)} />

          {/* Primary hint */}
          {totalImages > 1 && (
            <p className=&quot;text-xs font-bold text-ori-ink-l mt-2&quot;>
              💡 กดที่รูปเพื่อเลือกเป็นรูปหลัก
            </p>
          )}

          {/* AI Caption */}
          {totalImages > 0 && (
            <div className=&quot;mt-4&quot;>
              <div className=&quot;flex items-center justify-between mb-2&quot;>
                <label className=&quot;font-black text-sm&quot;>
                  🤖 คำบรรยาย AI (ช่วย Matching)
                </label>
                <button onClick={generateCaption} disabled={captioning}
                  className=&quot;flex items-center gap-1.5 px-3 py-1.5 text-xs
                    font-black bg-purple-100 text-purple-700 border border-purple-300
                    rounded-xl hover:bg-purple-200 transition-all disabled:opacity-50&quot;>
                  {captioning
                    ? <Loader2 size={12} className=&quot;animate-spin&quot; />
                    : <Sparkles size={12} />
                  }
                  สร้างใหม่
                </button>
              </div>
              <textarea
                value={form.ai_caption}
                onChange={e => setForm(f => ({ ...f, ai_caption: e.target.value }))}
                placeholder=&quot;คำบรรยายสำหรับ AI Matching&quot;
                rows={2}
                className=&quot;ori-input resize-none text-sm&quot;
              />
            </div>
          )}
        </div>

        {/* ── ข้อมูลพื้นฐาน ── */}
        <div className=&quot;bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper&quot;>
          <h2 className=&quot;font-black text-lg mb-4&quot;>🐾 ข้อมูลพื้นฐาน</h2>
          <div className=&quot;grid grid-cols-1 sm:grid-cols-2 gap-4&quot;>

            <div className=&quot;space-y-1&quot;>
              <label className=&quot;font-black text-sm&quot;>ชื่อน้อง *</label>
              <input value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className=&quot;ori-input&quot; />
            </div>

            <div className=&quot;space-y-1&quot;>
              <label className=&quot;font-black text-sm&quot;>ประเภทสัตว์ *</label>
              <select value={form.species}
                onChange={e => setForm(f => ({ ...f, species: e.target.value }))}
                className=&quot;ori-input bg-white cursor-pointer&quot;>
                {SPECIES_OPTIONS.map(s => (
                  <option key={s} value={s}>{s || '-- เลือก --'}</option>
                ))}
              </select>
            </div>

            <div className=&quot;space-y-1&quot;>
              <label className=&quot;font-black text-sm&quot;>สายพันธุ์</label>
              <input value={form.breed}
                onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
                className=&quot;ori-input&quot; />
            </div>

            <div className=&quot;space-y-1&quot;>
              <label className=&quot;font-black text-sm&quot;>เพศ</label>
              <select value={form.gender}
                onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                className=&quot;ori-input bg-white cursor-pointer&quot;>
                {GENDER_OPTIONS.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            <div className=&quot;space-y-1&quot;>
              <label className=&quot;font-black text-sm&quot;>สี / ลักษณะขน</label>
              <input value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className=&quot;ori-input&quot; />
            </div>

            <div className=&quot;space-y-1&quot;>
              <label className=&quot;font-black text-sm&quot;>วันเกิด</label>
              <input type=&quot;date&quot; value={form.birthday}
                onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
                className=&quot;ori-input&quot; />
            </div>

            <div className=&quot;space-y-1&quot;>
              <label className=&quot;font-black text-sm&quot;>น้ำหนัก (กก.)</label>
              <input type=&quot;number&quot; step=&quot;0.1&quot; value={form.weight}
                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                placeholder=&quot;0.0&quot;
                className=&quot;ori-input&quot; />
            </div>

            <div className=&quot;space-y-1&quot;>
              <label className=&quot;font-black text-sm&quot;>เลขไมโครชิป</label>
              <input value={form.microchip_id}
                onChange={e => setForm(f => ({ ...f, microchip_id: e.target.value }))}
                placeholder=&quot;15 หลัก (ถ้ามี)&quot;
                className=&quot;ori-input&quot; />
            </div>

            <div className=&quot;sm:col-span-2 space-y-1&quot;>
              <label className=&quot;font-black text-sm&quot;>ตำหนิพิเศษ</label>
              <input value={form.special_marks}
                onChange={e => setForm(f => ({ ...f, special_marks: e.target.value }))}
                placeholder=&quot;เช่น แผลเป็นที่ขาซ้าย หูขาดเล็กน้อย&quot;
                className=&quot;ori-input&quot; />
            </div>
          </div>
        </div>

        {/* ── Mode ── */}
        <div className=&quot;bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper&quot;>
          <h2 className=&quot;font-black text-lg mb-1&quot;>🔀 Mode</h2>
          <p className=&quot;text-sm font-bold text-ori-ink-l mb-4&quot;>
            เปิด/ปิด Mode ได้ตลอดเวลา · โปรไฟล์จะแสดงต่อสาธารณะเมื่อเปิด Mode
          </p>
          <div className=&quot;grid sm:grid-cols-2 gap-3&quot;>
            {MODE_CONFIG.map(m => {
              const active = modes[m.key]
              return (
                <button key={m.key} type=&quot;button&quot;
                  onClick={() => setModes(prev => ({ ...prev, [m.key]: !prev[m.key] }))}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    active ? MODE_COLOR[m.color] : 'border-gray-200 bg-gray-50 hover:border-gray-400'
                  }`}>
                  <div className=&quot;flex items-center gap-2 mb-1&quot;>
                    <m.icon size={16} />
                    <span className=&quot;font-black text-sm&quot;>{m.label}</span>
                    {active && <span className=&quot;ml-auto text-xs font-black&quot;>✓ เปิด</span>}
                  </div>
                  <p className=&quot;text-xs font-bold opacity-70&quot;>{m.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── ประวัติพ่อแม่ ── */}
        <div className=&quot;bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper&quot;>
          <h2 className=&quot;font-black text-lg mb-4&quot;>🧬 ประวัติพ่อ-แม่</h2>
          <div className=&quot;grid sm:grid-cols-2 gap-4&quot;>
            <div className=&quot;space-y-1&quot;>
              <label className=&quot;font-black text-sm&quot;>ชื่อพ่อ</label>
              <input value={form.father_name}
                onChange={e => setForm(f => ({ ...f, father_name: e.target.value }))}
                className=&quot;ori-input&quot; />
            </div>
            <div className=&quot;space-y-1&quot;>
              <label className=&quot;font-black text-sm&quot;>ชื่อแม่</label>
              <input value={form.mother_name}
                onChange={e => setForm(f => ({ ...f, mother_name: e.target.value }))}
                className=&quot;ori-input&quot; />
            </div>
          </div>
        </div>

        {/* ── ผู้ติดต่อฉุกเฉิน ── */}
        <div className=&quot;bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper&quot;>
          <h2 className=&quot;font-black text-lg mb-1&quot;>🆘 ผู้ติดต่อฉุกเฉิน</h2>
          <p className=&quot;text-sm font-bold text-ori-ink-l mb-4&quot;>
            ถ้าติดต่อเจ้าของไม่ได้ คนที่พบน้องจะเห็นข้อมูลนี้
          </p>
          <div className=&quot;grid sm:grid-cols-2 gap-4&quot;>
            <div className=&quot;space-y-1&quot;>
              <label className=&quot;font-black text-sm&quot;>ชื่อ</label>
              <input value={form.emergency_name}
                onChange={e => setForm(f => ({ ...f, emergency_name: e.target.value }))}
                className=&quot;ori-input&quot; />
            </div>
            <div className=&quot;space-y-1&quot;>
              <label className=&quot;font-black text-sm&quot;>เบอร์โทร</label>
              <input value={form.emergency_tel}
                onChange={e => setForm(f => ({ ...f, emergency_tel: e.target.value }))}
                className=&quot;ori-input&quot; />
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className=&quot;p-4 bg-red-50 border-2 border-red-400 rounded-2xl
            flex items-center gap-3 text-red-800&quot;>
            <AlertCircle size={18} className=&quot;shrink-0&quot; />
            <span className=&quot;font-bold text-sm&quot;>{error}</span>
          </div>
        )}

        {/* ── Save ── */}
        <button onClick={handleSave} disabled={saving}
          className=&quot;w-full py-5 bg-ori-ink text-white font-black text-lg
            rounded-2xl border-4 border-ori-ink shadow-paper
            hover:shadow-paper-lg hover:-translate-y-1 transition-all
            flex items-center justify-center gap-2 disabled:opacity-50&quot;>
          {saving
            ? <><Loader2 size={20} className=&quot;animate-spin&quot; /> กำลังบันทึก...</>
            : <><Save size={20} /> บันทึกการแก้ไข</>
          }
        </button>

        {/* ── Danger zone ── */}
        <div className=&quot;border-4 border-dashed border-red-300 rounded-3xl p-6&quot;>
          <h3 className=&quot;font-black text-red-700 mb-1 flex items-center gap-2&quot;>
            <Trash2 size={18} /> Danger Zone
          </h3>
          <p className=&quot;text-sm font-bold text-red-500 mb-4&quot;>
            ลบโปรไฟล์น้อง — ข้อมูลจะถูกซ่อน 60 วัน ก่อนลบถาวร
          </p>
          {!showDelete ? (
            <button onClick={() => setShowDelete(true)}
              className=&quot;px-4 py-2 text-sm font-black text-red-600 border-2
                border-red-400 rounded-xl hover:bg-red-50 transition-all&quot;>
              ลบโปรไฟล์น้อง
            </button>
          ) : (
            <div className=&quot;p-4 bg-red-50 rounded-2xl border-2 border-red-400&quot;>
              <p className=&quot;font-black text-red-800 mb-3&quot;>
                ยืนยันลบโปรไฟล์ &quot;{form.name}&quot;?
              </p>
              <div className=&quot;flex gap-2&quot;>
                <button onClick={handleDelete} disabled={deleting}
                  className=&quot;px-4 py-2 bg-red-600 text-white font-black text-sm
                    rounded-xl border-2 border-red-700 hover:bg-red-700
                    transition-all disabled:opacity-50 flex items-center gap-1.5&quot;>
                  {deleting
                    ? <Loader2 size={14} className=&quot;animate-spin&quot; />
                    : <Trash2 size={14} />
                  }
                  ยืนยันลบ
                </button>
                <button onClick={() => setShowDelete(false)}
                  className=&quot;px-4 py-2 text-sm font-black border-2 border-gray-300
                    rounded-xl hover:bg-gray-50 transition-all&quot;>
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
