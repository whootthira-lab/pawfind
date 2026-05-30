'use client'
// app/(main)/pet/[id]/edit/page.tsx (ฉบับปลดล็อคโครงข่ายอัปเดตประวัติการทำหมันและเพศสัตว์เลี้ยงครบมิติ 100%)

import { useState, useRef, useMemo, useEffect } from 'react'
import { createBrowserClient }                  from '@supabase/ssr'
import { useRouter }                             from 'next/navigation'
import Link                                     from 'next/link'
import {
  Upload, Sparkles, Loader2, ChevronLeft,
  PawPrint, Heart, Home, Trophy, Search,
  X, Plus, AlertCircle, Save, Trash2
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

export default function EditPetFormPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── States โครงสร้างฟอร์มแก้ไข ──
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [color, setColor] = useState('')
  
  // ── 🟢 ฟิลด์ประวัติสุขภาพรองรับการแก้ไขเปลี่ยนค่าภายหลัง (ข้อ 1) ──
  const [gender, setGender] = useState('unknown')
  const [isSterilized, setIsSterilized] = useState(false)
  const [birthday, setBirthday] = useState('')

  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [tambon, setTambon] = useState('')
  const [rewardAmount, setRewardAmount] = useState('0')
  const [distinctiveFeatures, setDistinctiveFeatures] = useState('')
  const [details, setDetails] = useState('')
  const [contactInfo, setContactInfo] = useState('')

  // โหมดประกาศ
  const [activeMode, setActiveMode] = useState<Mode>('mode_showcase')

  // คลังรูปภาพ
  const [images, setImages] = useState<{ id?: string; url: string; file?: File; isPrimary: boolean }[]>([])

  useEffect(() => {
    const fetchPetData = async () => {
      const { data: pet, error: petErr } = await supabase
        .from('pets')
        .select('*, pet_images(*)')
        .eq('id', params.id)
        .single()

      if (petErr || !pet) {
        setError('ไม่พบข้อมูลสัตว์เลี้ยงตัวนี้ในระบบค่ะ')
        setLoading(false)
        return
      }

      // ดึงสิทธิ์ความปลอดภัยเจ้าของป้องการการแฮกข้ามบัญชี
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || session.user.id !== pet.user_id) {
        setError('🔒 คุณไม่มีสิทธิ์เข้าถึงหรือแก้ไขฟอร์มประกาศฉบับนี้ค่ะ')
        setLoading(false)
        return
      }

      // แมปเข้า State
      setName(pet.name || '')
      setSpecies(pet.species || '')
      setBreed(pet.breed || '')
      setColor(pet.color || '')
      setGender(pet.gender || 'unknown')
      setIsSterilized(!!pet.is_sterilized)
      setBirthday(pet.birthday || pet.birthdate || '')
      setProvince(pet.province || '')
      setDistrict(pet.district || '')
      setTambon(pet.tambon || '')
      setRewardAmount(String(pet.reward_amount || 0))
      setDetails(pet.details || '')
      setContactInfo(pet.contact_info || '')

      // ล้างข้อมูลสตริง JSON ลักษณะเด่นพิเศษถอดออกมาเรนเดอร์ (ข้อ 8)
      if (pet.distinctive_features && pet.distinctive_features.startsWith('[')) {
        try {
          const parsed = JSON.parse(pet.distinctive_features)
          setDistinctiveFeatures(parsed[0]?.description || pet.distinctive_features)
        } catch {
          setDistinctiveFeatures(pet.distinctive_features)
        }
      } else {
        setDistinctiveFeatures(pet.distinctive_features || '')
      }

      // แกะค่าโหมด
      if (pet.mode_lost) setActiveMode('mode_lost')
      else if (pet.mode_mating) setActiveMode('mode_mating')
      else if (pet.mode_adoption) setActiveMode('mode_adoption')
      else setActiveMode('mode_showcase')

      // จัดการดึงคลังรูป (ข้อ 9)
      if (pet.pet_images && pet.pet_images.length > 0) {
        setImages(pet.pet_images.map((img: any) => ({
          id: img.id,
          url: img.storage_url,
          isPrimary: !!img.is_primary
        })))
      } else if (pet.image_url) {
        setImages([{ url: pet.image_url, isPrimary: true }])
      }

      setLoading(false)
    }

    fetchPetData()
  }, [params.id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)

    try {
      // 1. อัปโหลดรูปใหม่เข้าคลัง (ถ้ามี)
      const finalImages = [...images]
      for (let i = 0; i < finalImages.length; i++) {
        if (finalImages[i].file) {
          const file = finalImages[i].file!
          const fileExt = file.name.split('.').pop()
          const path = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          await supabase.storage.from('pet-images').upload(path, file)
          const { data: { publicUrl } } = supabase.storage.from('pet-images').getPublicUrl(path)
          finalImages[i].url = publicUrl
          delete finalImages[i].file
        }
      }

      // 2. เซฟค่าบันทึกลงตารางหลัก pets สอดคล้องตามคอลัมน์ดาต้าเบส
      const { error: updateErr } = await supabase
        .from('pets')
        .update({
          name,
          species,
          breed: breed || null,
          color,
          gender,
          is_sterilized: isSterilized,
          birthday: birthday || null,
          birthdate: birthday || null,
          province,
          district,
          tambon,
          reward_amount: parseFloat(rewardAmount) || 0,
          distinctive_features: distinctiveFeatures,
          details,
          contact_info: contactInfo,
          status: activeMode === 'mode_lost' ? 'lost' : (activeMode === 'mode_adoption' ? 'adoption' : activeMode === 'mode_mating' ? 'mating' : 'showcase'),
          mode_lost: activeMode === 'mode_lost',
          mode_mating: activeMode === 'mode_mating',
          mode_adoption: activeMode === 'mode_adoption',
          mode_showcase: activeMode === 'mode_showcase'
        })
        .eq('id', params.id)

      if (updateErr) throw updateErr

      // 3. ปรับระดับสลับรูปภาพในตารางย่อย pet_images
      await supabase.from('pet_images').delete().eq('pet_id', params.id)
      const imageRows = finalImages.map((img, index) => ({
        pet_id: params.id,
        storage_url: img.url,
        is_primary: index === 0
      }))
      await supabase.from('pet_images').insert(imageRows)

      alert('🎉 อัปเดตข้อมูลประวัติและโหมดประกาศของน้องสำเร็จเรียบร้อยค่ะ!')
      router.push(`/pet/${params.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    await supabase.from('pets').update({ status: 'archived' }).eq('id', params.id)
    router.push('/profile')
  }

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center font-bold text-black"><Loader2 className="animate-spin text-ori-orange mr-2" /> กำลังเรียกแฟ้มประวัติน้อง...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 text-black">
      <Link href={`/pet/${params.id}`} className="inline-flex items-center gap-1 font-black text-sm mb-4 text-gray-500 hover:text-black">
        <ChevronLeft size={16} /> ย้อนกลับหน้าสมุดสุขภาพ
      </Link>

      <div className="bg-white border-4 border-black p-6 md:p-8 rounded-3xl shadow-paper space-y-6">
        <h2 className="text-2xl font-black border-b-4 border-black pb-3 flex items-center gap-2">📝 แก้ไขและสลับโหมดโปรไฟล์</h2>

        {error && <div className="bg-red-50 border-2 border-red-500 p-4 rounded-xl text-red-700 font-bold">{error}</div>}

        {/* แผงปุ่ม Neubrutalism เลือกโหมด 4 ทิศทาง */}
        <div className="space-y-1 text-left">
          <label className="font-black text-sm text-gray-400">🚨 เลือกโหมดการโชว์ประกาศในบอร์ดสาธารณะ:</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setActiveMode('mode_lost')} className={`p-3 rounded-xl font-black border-2 border-black flex items-center justify-center gap-1.5 transition-all shadow-paper-sm ${activeMode === 'mode_lost' ? 'bg-red-400' : 'bg-white'}`}><Search size={16} /> ประกาศหาย</button>
            <button type="button" onClick={() => setActiveMode('mode_mating')} className={`p-3 rounded-xl font-black border-2 border-black flex items-center justify-center gap-1.5 transition-all shadow-paper-sm ${activeMode === 'mode_mating' ? 'bg-pink-400' : 'bg-white'}`}><Heart size={16} /> หาคู่ให้น้อง</button>
            <button type="button" onClick={() => setActiveMode('mode_adoption')} className={`p-3 rounded-xl font-black border-2 border-black flex items-center justify-center gap-1.5 transition-all shadow-paper-sm ${activeMode === 'mode_adoption' ? 'bg-blue-400' : 'bg-white'}`}><Home size={16} /> หาบ้านให้น้อง</button>
            <button type="button" onClick={() => setActiveMode('mode_showcase')} className={`p-3 rounded-xl font-black border-2 border-black flex items-center justify-center gap-1.5 transition-all shadow-paper-sm ${activeMode === 'mode_showcase' ? 'bg-amber-400' : 'bg-white'}`}><Trophy size={16} /> โชว์โปรไฟล์</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-black text-sm">ชื่อน้องสัตว์เลี้ยง</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border-2 border-black p-2.5 rounded-xl font-bold bg-white" />
            </div>
            <div className="space-y-1">
              <label className="font-black text-sm">ประเภทสัตว์</label>
              <select value={species} onChange={e => setSpecies(e.target.value)} className="w-full border-2 border-black p-2.5 rounded-xl font-bold bg-white cursor-pointer">
                {SPECIES_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'โปรดเลือกประเภท'}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-black text-sm">เพศ</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className="w-full border-2 border-black p-2.5 rounded-xl font-bold bg-white cursor-pointer">
                {GENDER_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-black text-sm">การทำหมันย้อนหลัง 🩺</label>
              <select value={isSterilized ? "true" : "false"} onChange={e => setIsSterilized(e.target.value === "true")} className="w-full border-2 border-black p-2.5 rounded-xl font-bold bg-white cursor-pointer">
                <option value="false">❌ ยังไม่ได้ทำหมัน</option>
                <option value="true">✨ ทำหมันเรียบร้อยแล้ว</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-black text-sm">วันเดือนปีเกิด 🎂</label>
              <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} className="w-full border-2 border-black p-2.5 rounded-xl font-bold bg-white cursor-pointer" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="font-black text-xs">จังหวัด</label>
              <input type="text" value={province} onChange={e => setProvince(e.target.value)} className="w-full border-2 border-black p-2 rounded-xl font-bold bg-white" />
            </div>
            <div className="space-y-1">
              <label className="font-black text-xs">อำเภอ</label>
              <input type="text" value={district} onChange={e => setDistrict(e.target.value)} className="w-full border-2 border-black p-2 rounded-xl font-bold bg-white" />
            </div>
            <div className="space-y-1">
              <label className="font-black text-xs">ตำบล</label>
              <input type="text" value={tambon} onChange={e => setTambon(e.target.value)} className="w-full border-2 border-black p-2 rounded-xl font-bold bg-white" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-black text-sm">ตำหนิเด่น / ลักษณะเด่นพิเศษ</label>
            <input type="text" value={distinctiveFeatures} onChange={e => setDistinctiveFeatures(e.target.value)} className="w-full border-2 border-black p-2.5 rounded-xl font-bold bg-white" />
          </div>

          <div className="space-y-1">
            <label className="font-black text-sm">เบอร์โทรศัพท์และช่องทางการติดต่อ</label>
            <input type="text" value={contactInfo} onChange={e => setContactInfo(e.target.value)} className="w-full border-2 border-black p-2.5 rounded-xl font-bold bg-white" />
          </div>

          <button type="submit" disabled={saving} className="w-full bg-black text-white font-black py-4 border-2 border-black shadow-paper-sm rounded-xl flex items-center justify-center gap-1.5 hover:bg-gray-800">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {saving ? 'กำลังบันทึกข้อมูลการแก้ไข...' : '💾 ยืนยันอัปเดตแฟ้มข้อมูลสัตว์เลี้ยง'}
          </button>
        </form>

        <div className="border-4 border-dashed border-red-300 rounded-3xl p-6 text-left">
          <h3 className="font-black text-red-700 mb-1 flex items-center gap-2"><Trash2 size={18} /> Danger Zone</h3>
          <p className="text-sm font-bold text-red-500 mb-4">ลบประกาศนี้ — ข้อมูลจะถูกซ่อนไว้ในคลัง 60 วัน ก่อนถูกเคลียร์ระบบถาวร</p>
          {!showDelete ? (
            <button type="button" onClick={() => setShowDelete(true)} className="px-4 py-2 text-sm font-black text-red-600 border-2 border-red-400 rounded-xl bg-white hover:bg-red-50 transition-all shadow-paper-sm">ลบไฟล์ประกาศน้อง</button>
          ) : (
            <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-400">
              <p className="font-black text-red-800 mb-3">คุณแน่ใจใช่ไหมที่จะสั่งลบข้อมูลประกาศน้องตัวนี้?</p>
              <div className="flex gap-2">
                <button type="button" onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white font-black text-sm rounded-xl flex items-center gap-1.5">{deleting ? <Loader2 className="animate-spin" size={12}/> : null} ยืนยันลบเด็ดขาด</button>
                <button type="button" onClick={() => setShowDelete(false)} className="px-4 py-2 bg-white text-black font-black text-sm border-2 border-black rounded-xl shadow-paper-sm">ยกเลิก</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}