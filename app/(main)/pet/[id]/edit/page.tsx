'use client'
// app/(main)/pet/[id]/edit/page.tsx
// ── อัปเกรดแบบฟอร์มหน้าเว็บจริง: ยกระดับฟังก์ชัน Multi-photos, Primary Image Selector, AI Caption และประวัติสุขภาพสมบูรณ์แบบ 100% ──

import { useState, useRef, useMemo, useEffect } from 'react'
import { createBrowserClient }                  from '@supabase/ssr'
import { useRouter }                             from 'next/navigation'
import Link                                     from 'next/link'
import {
  Upload, Sparkles, Loader2, ChevronLeft,
  PawPrint, Heart, Home, Trophy, Search,
  X, Plus, AlertCircle, Save, Trash2, Shield
} from 'lucide-react'

// ── Types & Constants ─────────────────────────────────────
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

interface ExistingImage {
  id:          string
  storage_url: string
  is_primary:  boolean
  toDelete?:   boolean
}

// ══════════════════════════════════════════════════════════
export default function EditPetPage({ params }: { params: { id: string } }) {
  const router   = useRouter()
  const id       = params.id
  const fileRef  = useRef<HTMLInputElement>(null)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // ── Form State (เชื่อมสัญญานฟิลด์โมเดลและฟิลด์พิกัดบอร์ดเข้าด้วยกันอย่างสมบูรณ์) ──
  const [form, setForm] = useState({
    name:                 '',
    species:              '',
    breed:                '',
    gender:               'unknown',
    is_sterilized:        false,
    color:                '',
    birthday:             '',
    weight:               '',
    microchip_id:         '',
    distinctive_features: '', // ผูกเข้ากับฟิลด์ลักษณะพิเศษของบอร์ดหลัก
    ai_caption:           '',
    father_name:          '',
    mother_name:          '',
    contact_info:         '', // ผูกช่องทางติดต่อดั้งเดิมของบอร์ดหน้าแรก
    reward_amount:        '',
    tambon:               '', // ตำบล พิกัดหน้าบอร์ดจริง
    district:             '', // อำเภอ พิกัดหน้าบอร์ดจริง
    province:             '', // จังหวัด พิกัดหน้าบอร์ดจริง
    emergency_name:       '',
    emergency_tel:        '',
  })

  const [modes, setModes] = useState<Record<Mode, boolean>>({
    mode_lost: false, mode_mating: false,
    mode_adoption: false, mode_showcase: false,
    mode_private: false,
  })

  // ── Image Array State ───────────────────────────────────
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [newFiles,    setNewFiles]    = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [primaryKey,  setPrimaryKey]  = useState<string>('existing-0')

  // ── UI Control State ────────────────────────────────────
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

  // ── 1. ดึงและกรอกข้อมูลเดิมจากฐานระบบอย่างแม่นยำ (Pre-fill Setup) ──
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      // ดึงสิทธิ์ความปลอดภัยตรวจสอบตัวตนผู้ใช้งานประกบ ID สัตว์เลี้ยง
      const { data: pet, error: petErr } = await supabase
        .from('pets')
        .select('*, pet_images(id, storage_url, is_primary)')
        .eq('id', id)
        .single()

      if (petErr || !pet) { router.push('/dashboard/pets'); return }
      
      // ดักตรวจสิทธิ์ความเป็นเจ้าของประกาศ
      if (pet.user_id !== session.user.id) {
        alert('คุณไม่มีสิทธิ์แก้ไขประกาศนี้ครับ')
        router.push(`/pet/${id}`)
        return
      }

      const rawBirthday = pet.birthday || pet.birthdate || ''
      const formattedBirthday = rawBirthday ? rawBirthday.split('T')[0] : ''
      const ec = pet.emergency_contact || {}

      // นำข้อมูลลงฟิลด์อินพุต
      setForm({
        name:                 pet.name                 || '',
        species:              pet.species              || '',
        breed:                pet.breed                || '',
        gender:               pet.gender               || 'unknown',
        is_sterilized:        pet.is_sterilized        ?? false,
        color:                pet.color                || '',
        birthday:             formattedBirthday,
        weight:               pet.weight?.toString()   || '',
        microchip_id:         pet.microchip_id         || '',
        distinctive_features: (() => {
          if (!pet.distinctive_features) return ''
          if (pet.distinctive_features.startsWith('[')) {
            try {
              const parsed = JSON.parse(pet.distinctive_features)
              if (Array.isArray(parsed)) {
                return parsed.map((item: any) => item.description).filter(Boolean).join(', ')
              }
            } catch (e) {
              // ignore
            }
          }
          return pet.distinctive_features
        })(),
        ai_caption:           pet.ai_caption           || '',
        father_name:          pet.father_name          || '',
        mother_name:          pet.mother_name          || '',
        contact_info:         pet.contact_info         || '',
        reward_amount:        pet.reward_amount ? pet.reward_amount.toString() : '',
        tambon:               pet.tambon               || '',
        district:             pet.district             || '',
        province:             pet.province             || '',
        emergency_name:       ec.name                  || '',
        emergency_tel:        ec.tel                   || '',
      })

      // โหลดโหมดเดิมประจำการการ์ด
      const isPrivate = pet.visibility === 'private' || !pet.is_public
      setModes({
        mode_lost:     !isPrivate && (pet.mode_lost     || false),
        mode_mating:   !isPrivate && (pet.mode_mating   || false),
        mode_adoption: !isPrivate && (pet.mode_adoption || false),
        mode_showcase: !isPrivate && (pet.mode_showcase || false),
        mode_private:  isPrivate,
      })

      // ── 🟢 ปรับปรุงกลไก Safe Image Fallback เพื่อดึงคลังรูปภาพ 3 มุมกลับมาแสดงผลให้ครบถ้วน ──
      let imgs: ExistingImage[] = []
      
      if (pet.pet_images && pet.pet_images.length > 0) {
        // กรณีดึงความสัมพันธ์ผ่านตารางลูกมาสำเร็จ ให้แปลงค่า mapping ทันที
        imgs = pet.pet_images.map((img: any) => ({
          id: img.id,
          storage_url: img.storage_url,
          is_primary: !!img.is_primary
        }))
      } else if (pet.image_url) {
        // Fallback: ถ้าตารางลูกไม่ยอมดึง ให้ดักจับพิกัดรูปภาพหลักในตารางแม่มาสวมสิทธิ์เพื่อความปลอดภัยชั่วคราว
        imgs = [{
          id: 'primary-fallback-id',
          storage_url: pet.image_url,
          is_primary: true
        }]
      }

      // ทำการจัดคิวเรียงลำดับให้รูปภาพหลักขึ้นหน้าก่อน
      imgs.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
      setExistingImages(imgs)

      const primaryImg = imgs.find(i => i.is_primary) || imgs[0]
      if (primaryImg) {
        setPrimaryKey(`existing-${imgs.indexOf(primaryImg)}`)
      }

      // ตรวจสอบแพ็คเกจโควตาสมาชิกความจุคลัง
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
  }, [id, router, supabase])

  // ── Image Handling Functions ─────────────────────────────
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

  // ── AI Caption Generator ────────────────────────────────
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

  // ── 2. ตรรกะประมวลเซฟบันทึกทับชุดคำสั่งระดับสูง (Save Handler) ──
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.color.trim()) { setError('กรุณาระบุสีของสัตว์เลี้ยงค่ะ'); return }
    if (!form.species)      { setError('กรุณาเลือกประเภทสัตว์ค่ะ'); return }
    if (!form.contact_info.trim()) { setError('กรุณาระบุข้อมูลช่องทางติดต่อหลักค่ะ'); return }

    setSaving(true); setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const userId = session.user.id

      // อัปเดตข้อมูลโครงสร้างหลักผสมผสานฟิลด์พิกัดและประวัติสุขภาพสมบูรณ์แบบ
      const isPrivate = modes.mode_private

      const { error: petErr } = await supabase
        .from('pets')
        .update({
          name:                 form.name.trim() || 'ไม่ทราบชื่อ',
          species:              form.species,
          breed:                form.breed                || null,
          gender:               form.gender,
          is_sterilized:        form.is_sterilized,
          birthday:             form.birthday             || null,
          birthdate:            form.birthday             || null,
          color:                form.color.trim(),
          weight:               form.weight ? parseFloat(form.weight) : null,
          microchip_id:         form.microchip_id         || null,
          distinctive_features: form.distinctive_features || null,
          ai_caption:           form.ai_caption           || null,
          father_name:          form.father_name          || null,
          mother_name:          form.mother_name          || null,
          contact_info:         form.contact_info.trim(),
          reward_amount:        form.reward_amount ? parseFloat(form.reward_amount) : 0,
          tambon:               form.tambon               || null,
          district:             form.district             || null,
          province:             form.province,
          emergency_contact: (form.emergency_name || form.emergency_tel) ? {
            name: form.emergency_name,
            tel:  form.emergency_tel,
          } : null,
          mode_lost:            !isPrivate && modes.mode_lost,
          mode_mating:          !isPrivate && modes.mode_mating,
          mode_adoption:        !isPrivate && modes.mode_adoption,
          mode_showcase:        !isPrivate && modes.mode_showcase,
          is_public:            !isPrivate,
          visibility:           isPrivate ? 'private' : 'public',
          status:               isPrivate ? 'private' : (
            modes.mode_lost ? 'lost' : (
              modes.mode_adoption ? 'adoption' : (
                modes.mode_mating ? 'mating' : 'showcase'
              )
            )
          ),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)

      if (petErr) throw petErr

      // จัดการลบภาพถ่ายที่นุดสั่งลบออก
      const toDeleteIds = existingImages.filter(img => img.toDelete).map(img => img.id)
      if (toDeleteIds.length > 0) {
        await supabase.from('pet_images').delete().in('id', toDeleteIds)
      }

      // อัปโหลดไฟล์รูปภาพเซ็ตใหม่เติมเต็มโควตาคลังจัดเก็บไฟล์
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

      // บันทึกคำสั่งจัดการแต่งตั้งสถานะรูปภาพหลัก (Primary Image Mapping Setup)
      await supabase.from('pet_images').update({ is_primary: false }).eq('pet_id', id)

      if (primaryKey.startsWith('existing-')) {
        const idx = parseInt(primaryKey.split('-')[1])
        const img = activeImages[idx]
        if (img && !img.toDelete) {
          await supabase.from('pet_images').update({ is_primary: true }).eq('id', img.id)
          await supabase.from('pets').update({ primary_image: img.storage_url, image_url: img.storage_url }).eq('id', id)
        }
      } else {
        const newIdx    = parseInt(primaryKey.split('-')[1])
        const uploaded  = uploadedUrls[newIdx]
        if (uploaded) {
          await supabase.from('pet_images').update({ is_primary: true }).eq('pet_id', id).eq('storage_url', uploaded.storage_url)
          await supabase.from('pets').update({ primary_image: uploaded.storage_url, image_url: uploaded.storage_url }).eq('id', id)
        }
      }

      alert('บันทึกการซ่อมแซมโปรไฟล์ประกาศสำเร็จเรียบร้อยค่ะ 🎉')
      router.push(`/pet/${id}`)
      router.refresh()

    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดระหว่างบันทึกข้อมูลแก้ไข')
    } finally {
      setSaving(false)
    }
  }

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
      }).eq('id', id).eq('user_id', session.user.id)

      router.push('/dashboard/pets')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 size={48} className="animate-spin text-ori-orange" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 mb-20 text-black">
      
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/pet/${id}`} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
          <ChevronLeft size={22} />
        </Link>
        <div className="text-left">
          <h1 className="text-3xl font-black flex items-center gap-2">
            <PawPrint size={28} /> แก้ไขข้อมูลประกาศหน้าบอร์ด
          </h1>
          <p className="text-sm font-bold text-ori-ink-l">น้อง {form.name || 'ไม่ระบุชื่อ'}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── โซนแผงอัปโหลดรูปภาพแบบทวีคูณ (Multi-images Section) ── */}
        <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-paper">
          <h2 className="font-black text-lg mb-4 flex items-center justify-between">
            <span>📸 แฟ้มจัดเก็บรูปภาพน้อง</span>
            <span className="text-sm font-bold text-ori-ink-l">{totalImages}/{maxPhotos} รูป</span>
          </h2>

          {(existingImages.length > 0 || newFiles.length > 0) && (
            <div className="flex flex-wrap gap-3 mb-4">
              {existingImages.map((img, i) => {
                const key = `existing-${i}`
                const isPrimary = primaryKey === key
                const deleted = img.toDelete
                return (
                  <div key={img.id || i} className="relative">
                    <div
                      onClick={() => !deleted && setPrimaryKey(key)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-4 transition-all ${
                        deleted ? 'opacity-30 grayscale border-red-400' : isPrimary ? 'border-amber-500 shadow-paper-sm cursor-pointer' : 'border-gray-200 hover:border-gray-400 cursor-pointer'
                      }`}
                    >
                      <img src={img.storage_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    {isPrimary && !deleted && (
                      <div className="absolute -top-1.5 -left-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white">หลัก</div>
                    )}
                    <button type="button" onClick={() => markExistingDelete(i)} className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white transition-all ${deleted ? 'bg-gray-400' : 'bg-red-500'}`}>
                      {deleted ? <Plus size={10} /> : <X size={10} />}
                    </button>
                  </div>
                )
              })}

              {newPreviews.map((src, i) => {
                const key = `new-${i}`
                const isPrimary = primaryKey === key
                return (
                  <div key={`new-${i}`} className="relative">
                    <div onClick={() => setPrimaryKey(key)} className={`w-20 h-20 rounded-xl overflow-hidden border-4 cursor-pointer transition-all ${isPrimary ? 'border-amber-500 shadow-paper-sm' : 'border-blue-300'}`}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </div>
                    <button type="button" onClick={() => removeNewImage(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full border-2 border-white flex items-center justify-center"><X size={10} /></button>
                  </div>
                )
              })}

              {totalImages < maxPhotos && (
                <button type="button" onClick={() => fileRef.current?.click()} className="w-20 h-20 rounded-xl border-4 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-black transition-all">
                  <Plus size={20} /><span className="text-[9px] font-bold">เพิ่มรูป</span>
                </button>
              )}
            </div>
          )}

          {totalImages === 0 && (
            <div onClick={() => fileRef.current?.click()} className="border-4 border-dashed border-gray-300 rounded-2xl min-h-[120px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-all">
              <Upload size={32} className="text-gray-400" />
              <p className="font-black text-sm">กดเพื่ออัปโหลดรูปภาพน้อง</p>
            </div>
          )}
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleNewImages(e.target.files)} />

          {totalImages > 0 && (
            <div className="mt-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <label className="font-black text-sm">🤖 คำบรรยายภาพช่วยประมวลผลจับคู่ด้วย AI</label>
                <button type="button" onClick={generateCaption} disabled={captioning} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-purple-100 text-purple-700 border border-purple-300 rounded-xl disabled:opacity-50">
                  {captioning ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} วิเคราะห์ด้วย AI
                </button>
              </div>
              <textarea value={form.ai_caption} onChange={e => setForm({ ...form, ai_caption: e.target.value })} rows={2} className="ori-input resize-none text-sm" />
            </div>
          )}
        </div>

        {/* ── ข้อมูลลักษณะทั่วไปและข้อมูลสุขภาพเชิงรุก ── */}
        <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-paper text-left">
          <h2 className="font-black text-lg mb-4">🐾 ข้อมูลลักษณะประจำตัวสัตว์เลี้ยง</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-sm">ชื่อน้องสัตว์เลี้ยง</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="ori-input" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-sm">ประเภทสัตว์ *</label>
              <select value={form.species} onChange={e => setForm({ ...form, species: e.target.value })} required className="ori-input bg-white font-bold cursor-pointer">
                {SPECIES_OPTIONS.map(s => <option key={s} value={s}>{s || '-- เลือกประเภท --'}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-sm">สายพันธุ์เฉพาะ</label>
              <input value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} className="ori-input" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-sm">สีของสัตว์เลี้ยง *</label>
              <input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} required className="ori-input" />
            </div>

            {/* ── ส่วนอินพุตสุขภาพพรีเมียม สลับเลือกเพศ และสถานะทำหมัน ── */}
            <div className="space-y-1">
              <label className="font-bold text-sm">เพศของน้อง 🐾</label>
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="ori-input bg-white font-bold cursor-pointer">
                <option value="unknown">❓ ไม่ระบุ / ไม่ทราบเพศ</option>
                <option value="male">♂ เพศผู้ (Male)</option>
                <option value="female">♀ เพศเมีย (Female)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-sm">การทำหมันของน้อง 🩺</label>
              <select value={form.is_sterilized ? "true" : "false"} onChange={e => setForm({ ...form, is_sterilized: e.target.value === "true" })} className="ori-input bg-white font-bold cursor-pointer">
                <option value="false">❌ ยังไม่ได้ทำหมัน</option>
                <option value="true">✨ ทำหมันเรียบร้อยแล้ว</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-sm">วันเกิดน้อง (ระบุปฏิทินป้อนเลขอายุ) 🎂</label>
              <input type="date" value={form.birthday} onChange={e => setForm({ ...form, birthday: e.target.value })} className="ori-input cursor-pointer font-bold" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-sm">น้ำหนักตัว (กก.)</label>
              <input type="number" step="0.1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="0.0" className="ori-input" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-sm">เลขทะเบียนไมโครชิปประจำตัว</label>
              <input value={form.microchip_id} onChange={e => setForm({ ...form, microchip_id: e.target.value })} placeholder="เลขไมโครชิป 15 หลัก (ถ้ามี)" className="ori-input" />
            </div>
          </div>

          <div className="space-y-1 mt-4">
            <label className="font-bold text-sm">📝 รายละเอียดจุดสังเกตเด่น / ตำหนิพิเศษ</label>
            <textarea value={form.distinctive_features} onChange={e => setForm({ ...form, distinctive_features: e.target.value })} rows={3} className="ori-input resize-none" placeholder="เช่น หูตั้งข้างเดียว, ปลอกคอสะท้อนแสงสีเขียว" />
          </div>
        </div>

        {/* ── แผงสลับโหมดพรีเมียมบอร์ด (Mode Mapping Card Box) ── */}
        <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-paper text-left">
          <h2 className="font-black text-lg mb-1">🔀 สลับหมวดหมู่โหมดแสดงประกาศ</h2>
          <p className="text-xs font-bold text-gray-500 mb-4">เปิดหมวดหมู่เพื่อพุชกระจายข้อมูลขึ้นสู่ฟีดกระดานสาธารณะ</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {MODE_CONFIG.map(m => {
              const active = modes[m.key]
              return (
                <button key={m.key} type="button"
                  onClick={() => {
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
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${active ? MODE_COLOR[m.color] : 'border-gray-200 bg-gray-50 hover:border-gray-400'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <m.icon size={16} />
                    <span className="font-black text-sm">{m.label}</span>
                    {active && <span className="ml-auto text-xs font-black">✓ เปิดระบบ</span>}
                  </div>
                  <p className="text-xs font-bold opacity-70">{m.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── พิกัดพื้นที่สถานที่พบน้อง ── */}
        <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-paper text-left">
          <h2 className="font-black text-lg mb-4">📍 พิกัดข้อมูลพื้นที่และสถานที่เกิดเหตุ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-xs">ตำบล / แขวง</label>
              <input value={form.tambon} onChange={e => setForm({ ...form, tambon: e.target.value })} className="ori-input text-sm" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-xs">อำเภอ / เขต</label>
              <input value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} className="ori-input text-sm" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-xs">จังหวัดประจำพื้นที่ *</label>
              <input value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} required className="ori-input text-sm" />
            </div>
          </div>
        </div>

        {/* ── ข้อมูลผู้ติดต่อหลักและรางวัลนำส่ง ── */}
        <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-paper text-left">
          <h2 className="font-black text-lg mb-4">📞 ข้อมูลช่องทางติดต่อและสินน้ำใจ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-sm">ช่องทางติดต่อหลัก (เบอร์โทรศัพท์/Line ID) *</label>
              <input value={form.contact_info} onChange={e => setForm({ ...form, contact_info: e.target.value })} required className="ori-input" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-sm">เงินรางวัล / สินน้ำใจนำส่ง (บาท)</label>
              <input type="number" value={form.reward_amount} onChange={e => setForm({ ...form, reward_amount: e.target.value })} className="ori-input" />
            </div>
          </div>
        </div>

        {/* ── ประวัติสายเลือดและผู้ติดต่อสำรอง ── */}
        <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-paper text-left">
          <h2 className="font-black text-lg mb-4">🧬 ประวัติสายเลือดและผู้ติดต่อสำรอง</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-xs">ระบุชื่อพ่อพันธุ์</label>
              <input value={form.father_name} onChange={e => setForm({ ...form, father_name: e.target.value })} className="ori-input text-sm" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-xs">ระบุชื่อแม่พันธุ์</label>
              <input value={form.mother_name} onChange={e => setForm({ ...form, mother_name: e.target.value })} className="ori-input text-sm" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-xs">ชื่อผู้ติดต่อสำรองกรณีฉุกเฉิน</label>
              <input value={form.emergency_name} onChange={e => setForm({ ...form, emergency_name: e.target.value })} className="ori-input text-sm" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-xs">เบอร์โทรศัพท์ผู้ติดต่อสำรอง</label>
              <input value={form.emergency_tel} onChange={e => setForm({ ...form, emergency_tel: e.target.value })} className="ori-input text-sm" />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-400 rounded-2xl flex items-center gap-3 text-red-800 text-left">
            <AlertCircle size={18} className="shrink-0" />
            <span className="font-bold text-sm">{error}</span>
          </div>
        )}

        {/* ปุ่มเซฟประมวลผล */}
        <button type="submit" disabled={saving} className="w-full py-5 bg-black text-white font-black text-lg rounded-2xl border-4 border-black shadow-paper hover:shadow-paper-lg hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <><Loader2 size={20} className="animate-spin" /> กำลังประมวลผลบันทึกข้อมูลแก้ไข...</> : <><Save size={20} /> บันทึกการแก้ไขข้อมูลประกาศตัวเต็ม</>}
        </button>

        {/* โซนอันตรายซ่อนประกาศ */}
        <div className="border-4 border-dashed border-red-300 rounded-3xl p-6 text-left">
          <h3 className="font-black text-red-700 mb-1 flex items-center gap-2"><Trash2 size={18} /> Danger Zone</h3>
          <p className="text-sm font-bold text-red-500 mb-4">ลบประกาศนี้ — ข้อมูลจะถูกซ่อนไว้ในคลัง 60 วัน ก่อนถูกเคลียร์ระบบถาวร</p>
          {!showDelete ? (
            <button type="button" onClick={() => setShowDelete(true)} className="px-4 py-2 text-sm font-black text-red-600 border-2 border-red-400 rounded-xl bg-white hover:bg-red-50 transition-all shadow-paper-sm">ลบไฟล์ประกาศน้อง</button>
          ) : (
            <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-400">
              <p className="font-black text-red-800 mb-3">คุณแน่ใจใช่ไหมที่จะสั่งลบข้อมูลประกาศน้องตัวนี้?</p>
              <div className="flex gap-2">
                <button type="button" onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white font-black text-sm rounded-xl flex items-center gap-1.5">{deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} ยืนยันคำสั่งลบ</button>
                <button type="button" onClick={() => setShowDelete(false)} className="px-4 py-2 text-sm font-black border-2 border-gray-300 rounded-xl bg-white">ยกเลิก</button>
              </div>
            </div>
          )}
        </div>

      </form>
    </div>
  )
}