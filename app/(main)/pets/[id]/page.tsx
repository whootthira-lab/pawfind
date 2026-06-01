'use client'
// app/(main)/pets/[id]/page.tsx (V4 - สมุดสุขภาพหน้าเว็บฟรี เพิ่มอินพุตเพศและทำหมันลงใน Modal หน้างานตามรูปภาพภาพสมบูรณ์ 100%)

import { useState, useEffect, useMemo, useRef } from 'react'
import { createBrowserClient }          from '@supabase/ssr'
import { useParams, useRouter }         from 'next/navigation'
import Link                             from 'next/link'
import {
  PawPrint, Heart, Home, Trophy, Search,
  QrCode, Shield, Edit3, Share2,
  CheckCircle2, Loader2, ChevronLeft,
  Bell, Clock, Repeat, PlusCircle, Calendar, FileText, Image as ImageIcon, X, Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const MODE_BADGE: Record<string, { label: string; color: string; icon: any }> = {
  mode_lost:     { label: 'ประกาศหาย',     color: 'bg-blue-100 text-blue-700 border-blue-300',   icon: Search },
  mode_mating:   { label: 'หาคู่ให้น้อง',  color: 'bg-pink-100 text-pink-700 border-pink-300',   icon: Heart  },
  mode_adoption: { label: 'หาบ้านให้น้อง', color: 'bg-green-100 text-green-700 border-green-300', icon: Home   },
  mode_showcase: { label: 'โชว์โปรไฟล์',   color: 'bg-amber-100 text-amber-700 border-amber-300', icon: Trophy },
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  vaccine:        '💉 วัคซีน',
  rabies_vaccine: '💉 วัคซีนพิษสุนัขบ้า',
  deworming:      '🐛 ถ่ายพยาธิ',
  flea_treatment: '🦟 หยอดหมัด/เห็บ',
  checkup:        '🏥 ตรวจสุขภาพ',
  treatment:      '💊 รักษาโรค',
  award:          '🏆 รางวัล',
  other:          '📝 อื่นๆ',
}

const REPEAT_LABEL: Record<string, string> = {
  none:    'ไม่ทำซ้ำ',
  daily:   '🔁 ทุกวัน',
  weekly:  '🔁 ทุกสัปดาห์',
  monthly: '🔁 ทุกเดือน',
  yearly:  '🔁 ทุกปี',
}

type Tab = 'info' | 'health' | 'reminders'

export default function PetProfilePage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // ── States ──────────────────────────────────────────────────
  const petInitialRef = useRef<any>(null)
  const [pet,         setPet]         = useState<any>(null)
  const [images,      setImages]      = useState<any[]>([])
  const [events,      setEvents]      = useState<any[]>([])
  const [reminders,   setReminders]   = useState<any[]>([])
  const [owner,       setOwner]       = useState<any>(null)
  const [isOwner,     setIsOwner]     = useState(false)
  const [activeImg,   setActiveImg]   = useState(0)
  const [activeTab,   setActiveTab]   = useState<Tab>('info')
  const [loading,     setLoading]     = useState(true)
  const [qrLoading,   setQrLoading]   = useState(false)
  const [qrUrl,       setQrUrl]       = useState<string | null>(null)
  const [showQr,      setShowQr]      = useState(false)
  const [shared,      setShared]      = useState(false)
  const [justCreated, setJustCreated] = useState(false)
  const [justUpdated, setJustUpdated] = useState(false)

  // States ฟอร์มเพิ่มประวัติสุขภาพและตั้งเตือน Web Push ฟรี
  const [showFormModal, setShowFormModal] = useState(false)
  const [formSaving,    setFormSaving]    = useState(false)

  // States สำหรับฟอร์มเพิ่มการแจ้งเตือนด่วน (Reminder Creator Modal)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [evidenceFile,  setEvidenceFile]  = useState<File | null>(null)
  const [imgFilePreview, setImgFilePreview] = useState<string | null>(null)
  
  // 🟢 เพิ่มค่าดักจับ State เพศ, การทำหมัน, น้ำหนัก และสายพันธุ์ เพื่อความปลอดภัยสูงสุดในการอัปเดตข้อมูลของสัตว์เลี้ยงหลัก
  const [healthForm,    setHealthForm]    = useState({
    title: '',
    event_type: 'vaccine',
    event_type_custom: '',   // 🟢 เพิ่มฟิลด์กิจกรรมอื่นๆ ตามที่ผู้ใช้ระบุเพิ่มเติม
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    gender: 'unknown',       // 🟢 รองรับสลับเพศในฟอร์มย่อยหน้าเว็บ
    is_sterilized: false,    // 🟢 รองรับการเลือกทำหมันในฟอร์มย่อยหน้าเว็บ
    weight: '',              // 🟢 รองรับน้ำหนัก
    breed: '',               // 🟢 รองรับสายพันธุ์
    set_reminder: false,
    next_remind_at: '',
    repeat_type: 'none'
  })

  // State สำหรับคลังเปิดขยายรูปใบเสร็จขนาดใหญ่ (Lightbox Modal)
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null)

  // ฟังก์ชันคำนวณอายุอัตโนมัติจากวันเกิดแบบยืดหยุ่นแม่นยำ
  const calculatedAge = useMemo(() => {
    const targetDate = pet?.birthday || pet?.birthdate
    if (!targetDate) return 'ไม่ระบุอายุ'
    
    const birth = new Date(targetDate)
    const today = new Date()
    
    let years = today.getFullYear() - birth.getFullYear()
    let months = today.getMonth() - birth.getMonth()
    
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--
      months += 12
    }
    if (today.getDate() < birth.getDate()) {
      months--
    }

    if (years <= 0) {
      return months <= 0 ? 'แรกเกิด (วัยเด็ก)' : `${months} เดือน`
    }
    return months <= 0 ? `${years} ขวบ` : `${years} ขวบ ${months} เดือน`
  }, [pet])

  const fetchHealthAndReminders = async () => {
    const { data: evData } = await supabase
      .from('pet_health_events').select('*')
      .eq('pet_id', id).order('event_date', { ascending: false }).limit(20)
    setEvents(evData || [])

    const { data: remData } = await supabase
      .from('reminders').select('*')
      .eq('pet_id', id).eq('is_done', false)
      .order('next_remind_at', { ascending: true })
    setReminders(remData || [])
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setJustCreated(params.get('created') === 'true')
      setJustUpdated(params.get('updated') === 'true')
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      const { data: petData } = await supabase
        .from('pets').select('*').eq('id', id).single()
      if (!petData) { router.push('/'); return }
      
      const isOwnerUser = session?.user?.id === petData.user_id
      if (petData.visibility === 'private' && !isOwnerUser) {
        router.push('/')
        return
      }

      setPet(petData)
      petInitialRef.current = petData
      
      // เอาค่าเดิมที่มีอยู่แล้วในระบบมาหยอดลงในฟอร์มรอก่อนล่วงหน้าเพื่อความลื่นไหล
      setHealthForm(prev => ({
        ...prev,
        gender: petData.gender || 'unknown',
        is_sterilized: petData.is_sterilized ?? false,
        weight: petData.weight?.toString() || '',
        breed: petData.breed || ''
      }))

      setIsOwner(session?.user?.id === petData.user_id)
      setQrUrl(petData.qr_code_url || null)

      const { data: imgData } = await supabase
        .from('pet_images').select('storage_url, is_primary')
        .eq('pet_id', id).order('is_primary', { ascending: false })
      setImages(imgData || [])

      await fetchHealthAndReminders()

      const { data: ownerData } = await supabase
        .from('profiles').select('display_name, avatar_url, province, district, subdistrict, address, phone_number, line_id, contact_link, is_public')
        .eq('id', petData.user_id).single()
      setOwner(ownerData)

      setLoading(false)
    }
    load()
  }, [id])

  const activeModes = pet ? Object.keys(MODE_BADGE).filter(k => pet[k]) : []

  const generateQR = async () => {
    setQrLoading(true)
    const res  = await fetch('/api/pets/qr', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ petId: id }),
    })
    const data = await res.json()
    if (data.qrDataUrl) { setQrUrl(data.qrDataUrl); setShowQr(true) }
    setQrLoading(false)
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/pets/${id}`
    if (navigator.share) {
      await navigator.share({ title: `${pet?.name} — PobPet`, url })
    } else {
      navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEvidenceFile(file)
      setImgFilePreview(URL.createObjectURL(file))
    }
  }

  // 🟢 ฟังก์ชันสำหรับเปิด Modal และดึงข้อมูลของสัตว์เลี้ยงตัวนี้มาแสดงทันที
  const openHealthModal = () => {
    if (pet) {
      setHealthForm({
        title: pet.name || '',
        event_type: 'vaccine',
        event_type_custom: '',
        description: '',
        event_date: new Date().toISOString().split('T')[0],
        gender: pet.gender || 'unknown',
        is_sterilized: pet.is_sterilized ?? false,
        weight: pet.weight?.toString() || '',
        breed: pet.breed || '',
        set_reminder: false,
        next_remind_at: '',
        repeat_type: 'none'
      })
    }
    setShowFormModal(true)
  }

  const handleSaveHealthEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!healthForm.title.trim() || formSaving || !pet) return
    setFormSaving(true)

    try {
      let evidenceUrl = null

      if (evidenceFile) {
        const fileExt = evidenceFile.name.split('.').pop()
        const fileName = `${pet.user_id}/${Date.now()}-evidence.${fileExt}`
        const { error: uploadErr } = await supabase.storage
          .from('pet-images') 
          .upload(`health_evidences/${fileName}`, evidenceFile, { cacheControl: '3600', upsert: true })

        if (uploadErr) throw uploadErr

        const { data: { publicUrl } } = supabase.storage
          .from('pet-images')
          .getPublicUrl(`health_evidences/${fileName}`)
        
        evidenceUrl = publicUrl
      }

      // 1. บันทึกข้อมูลลงตารางประวัติสุขภาพดั้งเดิมปกติ
      const { error: evErr } = await supabase
        .from('pet_health_events')
        .insert({
          pet_id: id,
          event_type: healthForm.event_type === 'other' && healthForm.event_type_custom.trim()
            ? healthForm.event_type_custom.trim()
            : healthForm.event_type,
          title: healthForm.title.trim(),
          description: healthForm.description.trim() || null,
          event_date: healthForm.event_date,
          medicine_name: healthForm.event_type.includes('vaccine') ? healthForm.title.trim() : null,
          notes: evidenceUrl 
        })

      if (evErr) throw evErr

      // ── 🟢 2. สั่งบันทึกแก้ไขและอัปเดตฟิลด์ เพศ, การทำหมัน, น้ำหนัก และสายพันธุ์ วิ่งกลับเข้าไปอัปเดตที่โปรไฟล์น้องโดยตรง ──
      const { error: petUpdateErr } = await supabase
        .from('pets')
        .update({
          gender: healthForm.gender,
          is_sterilized: healthForm.is_sterilized,
          weight: healthForm.weight ? parseFloat(healthForm.weight) : null,
          breed: healthForm.breed.trim() || null
        })
        .eq('id', id)

      if (petUpdateErr) throw petUpdateErr

      // รีเฟรชสัญญานข้อมูล State บนหน้าจอให้อัปเดตเรียลไทม์ทันที
      setPet((prev: any) => ({
        ...prev,
        gender: healthForm.gender,
        is_sterilized: healthForm.is_sterilized,
        weight: healthForm.weight ? parseFloat(healthForm.weight) : null,
        breed: healthForm.breed.trim() || null
      }))

      if (healthForm.set_reminder && healthForm.next_remind_at) {
        const { error: remErr } = await supabase
          .from('reminders')
          .insert({
            user_id: pet.user_id,
            pet_id: id,
            title: `⏰ ถึงกำหนด: ${healthForm.title.trim()} รอบต่อไป`,
            body: `ระบบนำส่งแจ้งเตือนอัตโนมัติเกี่ยวกับน้อง ${pet.name} สำหรับคิวนัดหมายประจำวันนี้ค่ะ`,
            remind_at: new Date(healthForm.next_remind_at).toISOString(),
            next_remind_at: new Date(healthForm.next_remind_at).toISOString(),
            repeat_type: healthForm.repeat_type,
            is_done: false
          })
        if (remErr) throw remErr
      }

      if (imgFilePreview) URL.revokeObjectURL(imgFilePreview)
      setEvidenceFile(null)
      setImgFilePreview(null)
      
      // ปิดกล่องโมดอลและรีเฟรชประวัติตารางความจำสุขภาพด้านล่าง
      setShowFormModal(false)
      await fetchHealthAndReminders()

    } catch (err: any) {
      alert(`เกิดข้อผิดพลาดในการบันทึกสมุดสุขภาพ: ${err.message || 'กรุณาลองใหม่อีกครั้งค่ะ'}`)
    } finally {
      setFormSaving(false)
    }
  }

  // ── 🟢 ฟังก์ชันสำหรับลบประวัติรายการสุขภาพเฉพาะรายการ (ลบข้อมูลโดยเจ้าของบัญชีเท่านั้น) ──
  const handleDeleteHealthEvent = async (eventId: string) => {
    if (!window.confirm('⚠️ ยืนยันที่จะลบรายการประวัติสุขภาพนี้ใช่หรือไม่?')) return

    try {
      const { error } = await supabase
        .from('pet_health_events')
        .delete()
        .eq('id', eventId)

      if (error) throw error

      alert('✅ ลบรายการประวัติสุขภาพเรียบร้อยแล้วค่ะ')
      await fetchHealthAndReminders()
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาดในการลบประวัติสุขภาพ: ${err.message || 'กรุณาลองใหม่อีกครั้งค่ะ'}`)
    }
  }

  // ── 🟢 ฟังก์ชันสำหรับลบรายการแจ้งเตือนความจำ (ลบข้อมูลโดยเจ้าของบัญชีเท่านั้น) ──
  const handleDeleteReminder = async (reminderId: string) => {
    if (!window.confirm('⚠️ ยืนยันที่จะลบรายการแจ้งเตือนความจำนี้ใช่หรือไม่?')) return

    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId)

      if (error) throw error

      alert('✅ ลบรายการแจ้งเตือนความจำเรียบร้อยแล้วค่ะ')
      await fetchHealthAndReminders()
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาดในการลบรายการแจ้งเตือน: ${err.message || 'กรุณาลองใหม่อีกครั้งค่ะ'}`)
    }
  }

  // ── 🟢 ฟังก์ชันสำหรับบันทึกรายการแจ้งเตือนความจำย่อยหน้าเว็บ ──
  const [reminderSaving,    setReminderSaving]    = useState(false)
  const [reminderForm,      setReminderForm]      = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    category: 'หยอดยาหมัด',
    category_custom: '',
    description: ''
  })

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalCategory = reminderForm.category === 'other' ? reminderForm.category_custom.trim() : reminderForm.category
    if (!finalCategory) {
      alert('กรุณาระบุหมวดหมู่การแจ้งเตือนด้วยค่ะ')
      return
    }
    
    setReminderSaving(true)
    try {
      const remindDateTime = new Date(`${reminderForm.date}T${reminderForm.time}`).toISOString()
      const title = `${finalCategory}${pet.name || ''}`
      const body = reminderForm.description.trim() || `อย่าลืม${finalCategory}ให้น้อง${pet.name || ''}นะคะ!`

      const { error } = await supabase
        .from('reminders')
        .insert({
          user_id: pet.user_id,
          pet_id: id,
          title: title,
          body: body,
          remind_at: remindDateTime,
          next_remind_at: remindDateTime,
          repeat_type: 'none',
          is_done: false
        })

      if (error) throw error

      alert('✅ เพิ่มการแจ้งเตือนความจำเรียบร้อยแล้วค่ะ!')
      setShowReminderModal(false)
      setReminderForm({
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        category: 'หยอดยาหมัด',
        category_custom: '',
        description: ''
      })
      await fetchHealthAndReminders()
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาดในการบันทึกการแจ้งเตือน: ${err.message || 'กรุณาลองใหม่อีกครั้งค่ะ'}`)
    } finally {
      setReminderSaving(false)
    }
  }

  function getHealthStatus() {
    if (!events.length) return null
    const vaccines = events.filter(e =>
      e.event_type === 'vaccine' || e.event_type === 'rabies_vaccine'
    )
    if (!vaccines.length) return null
    const latest   = new Date(vaccines[0].event_date)
    const monthsAgo = (Date.now() - latest.getTime()) / (1000 * 60 * 60 * 24 * 30)
    if (monthsAgo <= 11) return { dot: '🟢', label: 'วัคซีนครบ',    color: 'text-green-600 bg-green-50 border-green-300' }
    if (monthsAgo <= 13) return { dot: '🟡', label: 'ใกล้ถึงกำหนด', color: 'text-amber-600 bg-amber-50 border-amber-300' }
    return                       { dot: '🔴', label: 'เลยกำหนดวัคซีน', color: 'text-red-600 bg-red-50 border-red-300' }
  }
  const healthStatus = getHealthStatus()

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 size={48} className="animate-spin text-ori-orange" />
    </div>
  )
  if (!pet) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 mb-24 text-black">

      {justCreated && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-400 rounded-2xl flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          <p className="font-black text-green-800">สร้างโปรไฟล์น้องเรียบร้อยแล้ว! 🐾 ฟีเจอร์พรีเมียมทุกอย่างเปิดใช้งานให้คุณฟรีทั้งหมดค่ะ</p>
        </div>
      )}
      {justUpdated && (
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-400 rounded-2xl flex items-center gap-3">
          <CheckCircle2 size={20} className="text-blue-600 shrink-0" />
          <p className="font-black text-blue-800">บันทึกการแก้ไขเรียบร้อยแล้วค่ะ ✅</p>
        </div>
      )}

      <Link href="/dashboard/pets" className="inline-flex items-center gap-1 text-sm font-black text-ori-ink-l hover:text-ori-ink mb-4 transition-colors">
        <ChevronLeft size={16} /> จัดการโปรไฟล์น้อง
      </Link>

      {/* ── Hero Profile Card ── */}
      <div className="bg-white border-4 border-ori-ink rounded-3xl overflow-hidden shadow-paper mb-6">
        {images.length > 0 ? (
          <div>
            <div className="aspect-square w-full bg-gray-100 overflow-hidden">
              <img src={images[activeImg]?.storage_url} alt={pet.name} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${i === activeImg ? 'border-ori-ink' : 'border-gray-200 opacity-60 hover:opacity-100'}`}>
                    <img src={img.storage_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-square w-full bg-gray-100 flex items-center justify-center">
            <PawPrint size={64} className="text-gray-300" />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-3xl font-black">{pet.name}</h1>
              <p className="text-ori-ink-l font-bold">{parseInt(pet.reward_amount) > 0 ? `💵 มีสินน้ำใจนำส่ง: ฿${pet.reward_amount}` : [pet.species, pet.breed].filter(Boolean).join(' · ')}</p>
            </div>
            {isOwner && (
              <Link href={`/pets/${id}/edit`} className="flex items-center gap-1.5 px-3 py-2 text-sm font-black border-2 border-ori-ink rounded-xl hover:bg-gray-50 transition-all shadow-paper-sm">
                <Edit3 size={14} /> แก้ไขโปรไฟล์
              </Link>
            )}
          </div>

          {activeModes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {activeModes.map(k => {
                const m = MODE_BADGE[k]
                return (
                  <span key={k} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border ${m.color}`}>
                    <m.icon size={12} /> {m.label}
                  </span>
                )
              })}
            </div>
          )}

          {healthStatus && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-black mb-3 ${healthStatus.color}`}>
              {healthStatus.dot} {healthStatus.label}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button onClick={handleShare} className="flex items-center gap-1.5 px-4 py-2 text-sm font-black bg-white border-2 border-ori-ink rounded-xl hover:bg-gray-50 transition-all shadow-paper-sm">
              <Share2 size={14} /> {shared ? 'คัดลอกลิงก์แล้ว!' : 'แชร์โปรไฟล์'}
            </button>
            {isOwner && (
              <button onClick={qrUrl ? () => setShowQr(true) : generateQR} disabled={qrLoading} className="flex items-center gap-1.5 px-4 py-2 text-sm font-black bg-white border-2 border-ori-ink rounded-xl hover:bg-gray-50 transition-all shadow-paper-sm disabled:opacity-50">
                {qrLoading ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />} QR Code ปลอกคอ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── QR Collar Modal ── */}
      {showQr && qrUrl && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowQr(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-xs w-full text-center border-4 border-ori-ink shadow-paper" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-lg mb-4">QR Code ปลอกคอ</h3>
            <img src={qrUrl} alt="QR" className="w-full rounded-xl mb-4" />
            <p className="text-xs font-bold text-ori-ink-l mb-4">พิมพ์ติดปลอกคอหรือห้อยคอน้องไว้ คนเจอสแกนแล้วจะสืบค้นเจอข้อมูลเจ้าของเพื่อส่งกลับบ้านได้ทันที</p>
            <a href={qrUrl} download={`qr-${pet.name}.png`} className="inline-block px-6 py-2 bg-ori-ink text-white font-black text-sm rounded-xl border-2 border-ori-ink hover:bg-gray-800 transition-all">ดาวน์โหลดไฟล์</a>
          </div>
        </div>
      )}

      {/* ── Tab Selector Switchers ── */}
      <div className="flex gap-2 mb-4 border-b-4 border-ori-ink pb-2">
        {([
          { key: 'info',      label: '📋 ข้อมูลทั่วไป' },
          { key: 'health',    label: `💉 สมุดบันทึกสุขภาพ${events.length ? ` (${events.length})` : ''}` },
          { key: 'reminders', label: `🔔 คิวแจ้งเตือนความจำ${reminders.length ? ` (${reminders.length})` : ''}`, ownerOnly: true },
        ] as { key: Tab; label: string; ownerOnly?: boolean }[])
          .filter(t => !t.ownerOnly || isOwner)
          .map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 font-black text-sm rounded-xl transition-all border-2 ${activeTab === tab.key ? 'bg-ori-ink text-white border-ori-ink' : 'bg-white text-ori-ink-l border-gray-200 hover:border-ori-ink hover:text-ori-ink'}`}>
              {tab.label}
            </button>
          ))
        }
      </div>

      {/* ══ Tab: ข้อมูลพื้นฐาน ═════════════════════════════════════ */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper">
            <h2 className="font-black text-lg mb-4">ข้อมูลลักษณะสัตว์เลี้ยง</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-ori-ink-l">เพศของน้อง</p>
                <p className="font-black text-sm mt-0.5">{pet.gender === 'male' ? '♂ เพศผู้' : pet.gender === 'female' ? '♀ เพศเมีย' : '❓ ไม่ระบุ'}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-ori-ink-l">การทำหมัน</p>
                <p className="font-black text-sm mt-0.5">{pet.is_sterilized ? '🩺 ทำหมันแล้ว' : '❌ ยังไม่ได้ทำหมัน'}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-ori-ink-l">อายุปัจจุบัน (คำนวณจากวันเกิด)</p>
                <p className="font-black text-sm mt-0.5 text-ori-ink">{calculatedAge}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-ori-ink-l">จังหวัดเกิดเหตุ / พื้นที่</p>
                <p className="font-black text-sm mt-0.5 truncate">{pet.province || 'ไม่ระบุ'}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-ori-ink-l">อำเภอ / ตำบล</p>
                <p className="font-black text-xs mt-0.5 truncate">{[pet.district, pet.sub_district].filter(Boolean).join('/') || 'ไม่ระบุ'}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-ori-ink-l">เงินรางวัลนำส่ง</p>
                <p className="font-black text-sm text-ori-orange mt-0.5">฿{pet.reward_amount || 0}</p>
              </div>
            </div>

            {pet.details && (
              <div className="p-4 bg-amber-50/50 rounded-2xl border-2 border-dashed border-amber-300 mt-4 text-left">
                <p className="text-xs font-black text-amber-700 mb-1">📝 ข้อมูลและจุดสังเกตเพิ่มเติม:</p>
                <p className="text-sm font-bold text-gray-700 leading-relaxed">{pet.details}</p>
              </div>
            )}
          </div>

          {owner && !isOwner && (
            <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper text-left">
              <h2 className="font-black text-lg mb-4">👤 ข้อมูลติดต่อเจ้าของสัตว์เลี้ยง</h2>
              
              <div className="flex items-start gap-4 border-2 border-black p-4 rounded-2xl bg-wagashi-matcha/5 mb-4">
                <div className="w-12 h-12 rounded-full border-2 border-black overflow-hidden bg-gray-200 shrink-0">
                  {owner.avatar_url ? <img src={owner.avatar_url} alt="" className="w-full h-full object-cover" /> : <PawPrint size={24} className="m-2 text-gray-400" />}
                </div>
                <div>
                  <p className="font-black text-lg">{owner.display_name || 'สมาชิก PobPet'}</p>
                  <p className="text-xs font-bold text-gray-600 mt-1">📍 จังหวัด: {owner.province || 'ไม่ระบุ'}</p>
                  {owner.is_public !== false && (
                    <>
                      {owner.district && <p className="text-xs font-bold text-gray-600">อำเภอ: {owner.district} {owner.subdistrict && ` • ตำบล: ${owner.subdistrict}`}</p>}
                      {owner.address && <p className="text-xs font-bold text-gray-500 mt-0.5">🏠 ที่อยู่: {owner.address}</p>}
                    </>
                  )}
                  {owner.is_public === false && (
                    <p className="text-xs font-bold text-red-500 mt-1">🔒 เจ้าของระบุความเป็นส่วนตัวระดับเฉพาะฉัน (ซ่อนที่อยู่ละเอียด)</p>
                  )}
                </div>
              </div>

              {owner.is_public !== false ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(owner.phone_number || pet.contact_tel) && (
                    <a href={`tel:${owner.phone_number || pet.contact_tel}`} className="flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-black bg-wagashi-kinako text-black text-xs font-black hover:bg-yellow-400 transition-all shadow-paper-sm text-center">
                      📱 โทรติดต่อ
                    </a>
                  )}
                  {owner.line_id && (
                    <a href={`https://line.me/ti/p/~${owner.line_id}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-black bg-[#00B900] text-white text-xs font-black hover:bg-[#009E00] transition-all shadow-paper-sm text-center">
                      💬 แอดไลน์
                    </a>
                  )}
                  {owner.contact_link && (
                    <a href={owner.contact_link.startsWith('http') ? owner.contact_link : `https://${owner.contact_link}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-black bg-black text-white text-xs font-black hover:bg-gray-800 transition-all shadow-paper-sm text-center">
                      🔗 ช่องทางอื่น
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center py-3 bg-gray-100 rounded-xl border border-gray-300">
                  <p className="text-sm font-bold text-gray-500">กรุณาติดต่อเจ้าของผ่านการแชทบอตในระบบ PobPet หรือช่องทางแชทหน้ารายละเอียด 🐾</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ Tab: ประวัติสมุดสุขภาพ (Health Records) ════════════════ */}
      {activeTab === 'health' && (
        <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b-2 border-gray-100 pb-4">
            <div>
              <h2 className="font-black text-xl">💉 สมุดบันทึกประวัติสุขภาพสัตว์</h2>
              <p className="text-xs font-bold text-gray-500 mt-0.5">รวมสถิติทางการแพทย์และการบันทึกรางวัลของน้องฟรี</p>
            </div>
            {isOwner && (
              <Button onClick={openHealthModal} className="bg-black text-white font-black hover:bg-gray-800 rounded-xl px-4 py-2.5 flex items-center gap-1.5 border-2 border-black shadow-paper-sm">
                <PlusCircle size={16} /> ➕ บันทึกประวัติสุขภาพ/ตั้งเตือน
              </Button>
            )}
          </div>

          {events.length === 0 ? (
            <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
              <FileText size={44} className="mx-auto mb-3 opacity-30" />
              <p className="font-black text-sm">ยังไม่มีการบันทึกประวัติสุขภาพในระบบเลยค่ะ</p>
              {isOwner && <p className="text-xs text-gray-400 mt-1">กดปุ่มเพิ่มประวัติด้านบนเพื่อเริ่มต้นใช้งานได้ทันที</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {events.map(ev => (
                <div key={ev.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-2xl border-2 border-black/10 hover:border-black/30 transition-all">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-lg shrink-0 mt-0.5 shadow-paper-sm">
                      {EVENT_TYPE_LABEL[ev.event_type]?.split(' ')[0] || '📝'}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-base leading-none text-ori-ink">{ev.title}</p>
                        <span className="text-[10px] font-black bg-white border border-black px-2 py-0.5 rounded-md text-gray-600">
                          {EVENT_TYPE_LABEL[ev.event_type] || ev.event_type}
                        </span>
                      </div>
                      {ev.description && <p className="text-sm font-bold text-gray-500">{ev.description}</p>}
                      
                      {/* ── 🟢 การแสดงประวัติสุขภาพ: ดึงค่าวันแจ้งเตือนความจำรอบถัดไปขึ้นมาแสดงผล (ถ้ามี) ── */}
                      {(() => {
                        const matchingReminder = reminders.find(r => 
                          r.title.toLowerCase().includes(ev.title.toLowerCase()) ||
                          r.body?.toLowerCase().includes(ev.title.toLowerCase())
                        )
                        if (!matchingReminder) return null
                        return (
                          <div className="text-[11px] font-black text-blue-600 flex items-center gap-1 mt-1.5 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md inline-flex">
                            <Bell size={10} className="animate-swing text-blue-600 shrink-0" />
                            <span>คิวแจ้งเตือนถัดไป: {new Date(matchingReminder.next_remind_at || matchingReminder.remind_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        )
                      })()}
                      
                      {ev.notes && ev.notes.startsWith('http') && (
                        <div className="pt-1">
                          <button 
                            type="button" 
                            onClick={() => setActiveLightboxImg(ev.notes)}
                            className="w-12 h-12 rounded-lg border-2 border-black overflow-hidden relative block hover:scale-105 active:scale-95 transition-transform shadow-paper-sm bg-white"
                            title="กดเพื่อเปิดขยายดูใบเสร็จหลักฐาน"
                          >
                            <img src={ev.notes} alt="Receipt Thumbnail" className="w-full h-full object-cover" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-row sm:flex-col items-center sm:items-end gap-2">
                    <p className="text-xs font-black bg-black text-white px-2 py-1 rounded-md flex items-center gap-1"><Calendar size={12}/> {new Date(ev.event_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteHealthEvent(ev.id)}
                        className="text-xs font-black bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded-md border-2 border-red-200 hover:border-red-300 transition-all flex items-center gap-1 shadow-paper-sm active:translate-y-0"
                        title="ลบรายการประวัตินี้"
                      >
                        <Trash2 size={10} /> ลบ
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ Tab: คิวแจ้งเตือนความจำ (Reminders) ═══════════════════ */}
      {activeTab === 'reminders' && isOwner && (
        <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b-2 border-gray-100 pb-3">
            <div>
              <h2 className="font-black text-xl">🔔 คิวแจ้งเตือนความจำของน้อง</h2>
              <p className="text-xs font-bold text-gray-500 mt-0.5">ระบบจะนำไปยิงแจ้งเตือนผ่านบราวเซอร์พุชหน้าจอให้อัตโนมัติ</p>
            </div>
            <button
              onClick={() => setShowReminderModal(true)}
              className="bg-black text-white font-black border-2 border-black shadow-paper-sm rounded-xl px-4 py-2 hover:bg-gray-800 flex items-center gap-1.5 transition-all text-sm self-start sm:self-center"
            >
              ➕ เพิ่มการแจ้งเตือน
            </button>
          </div>

          {reminders.length === 0 ? (
            <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
              <Bell size={44} className="mx-auto mb-3 opacity-30 animate-bounce" />
              <p className="font-black text-sm">ยังไม่มีการตั้งคิวแจ้งเตือนพุชของน้องตัวนี้เลยค่ะ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map(r => {
                const daysLeft = Math.ceil((new Date(r.next_remind_at || r.remind_at).getTime() - Date.now()) / 86400000)
                const urgent = daysLeft <= 0
                return (
                  <div key={r.id} className={`flex items-start justify-between gap-3 p-4 rounded-2xl border-2 ${urgent ? 'bg-red-50/70 border-red-400' : 'bg-gray-50 border-black/10'}`}>
                    <div className="flex items-start gap-3">
                      <Bell size={18} className={`shrink-0 mt-0.5 ${urgent ? 'text-red-600' : 'text-gray-500'}`} />
                      <div className="space-y-0.5">
                        <p className="font-black text-base text-ori-ink">{r.title}</p>
                        {r.body && <p className="text-sm font-bold text-gray-500">{r.body}</p>}
                        {r.repeat_type !== 'none' && (
                          <span className="inline-flex items-center gap-1 text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 mt-1">
                            <Repeat size={10} /> {REPEAT_LABEL[r.repeat_type]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                      <p className="text-xs font-black bg-gray-200 border border-gray-400 text-gray-700 px-2 py-1 rounded-md font-mono">{new Date(r.next_remind_at || r.remind_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</p>
                      {urgent ? <p className="text-xs font-black text-red-600">🚨 เลยกำหนดนัด</p> : daysLeft <= 7 ? <p className="text-xs font-black text-amber-600">อีก {daysLeft} วัน</p> : null}
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteReminder(r.id)}
                          className="text-xs font-black bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded-md border-2 border-red-200 hover:border-red-300 transition-all flex items-center gap-1 shadow-paper-sm active:translate-y-0 mt-0.5"
                          title="ลบรายการแจ้งเตือนนี้"
                        >
                          <Trash2 size={10} /> ลบ
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ ➕ MODAL ฟอร์มบันทึกข้อมูลประวัติและตั้งเตือนพุชฟรี ══ */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-xs" onClick={() => !formSaving && setShowFormModal(false)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full text-left border-4 border-black shadow-paper max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-4">
              <h3 className="font-black text-xl flex items-center gap-1.5">💉 เพิ่มบันทึกสมุดสุขภาพและตั้งเตือนพุช</h3>
              <button onClick={() => setShowFormModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveHealthEvent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-black text-sm">ชื่อของน้องสัตว์เลี้ยง <span className="text-red-500">*</span></label>
                  <input type="text" required value={healthForm.title} onChange={e => setHealthForm({...healthForm, title: e.target.value})} placeholder="เช่น ชาเย็น, นมสด" className="ori-input" />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-sm">ประเภทกิจกรรม</label>
                  <select value={healthForm.event_type} onChange={e => setHealthForm({...healthForm, event_type: e.target.value, event_type_custom: ''})} className="ori-input bg-white cursor-pointer font-bold">
                    {Object.entries(EVENT_TYPE_LABEL).map(([val, lbl]) => (
                      <option key={val} value={val}>{lbl}</option>
                    ))}
                  </select>
                  {/* ── ช่องกรอกเพิ่มเติมเมื่อเลือก "อื่นๆ" ── */}
                  {healthForm.event_type === 'other' && (
                    <div className="mt-2 animate-fadeIn">
                      <input
                        type="text"
                        value={healthForm.event_type_custom}
                        onChange={e => setHealthForm({...healthForm, event_type_custom: e.target.value})}
                        placeholder="ระบุประเภทกิจกรรม เช่น อาบน้ำตัดขน..."
                        className="ori-input border-2 border-dashed border-black focus:border-solid text-xs font-bold"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* ── 🟢 ช่องกรอกข้อมูลเพศ และการทำหมัน ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="font-black text-sm">เพศของน้อง 🐾</label>
                  <select 
                    value={healthForm.gender} 
                    onChange={e => setHealthForm({...healthForm, gender: e.target.value})} 
                    className="ori-input bg-white cursor-pointer font-bold"
                  >
                    <option value="unknown">❓ ไม่ทราบ / ไม่ระบุ</option>
                    <option value="male">♂ เพศผู้ (Male)</option>
                    <option value="female">♀ เพศเมีย (Female)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-black text-sm">การทำหมันของน้อง 🩺</label>
                  <select 
                    value={healthForm.is_sterilized ? "true" : "false"} 
                    onChange={e => setHealthForm({...healthForm, is_sterilized: e.target.value === "true"})} 
                    className="ori-input bg-white cursor-pointer font-bold"
                  >
                    <option value="false">❌ ยังไม่ได้ทำหมัน</option>
                    <option value="true">✨ ทำหมันเรียบร้อยแล้ว</option>
                  </select>
                </div>
              </div>

              {/* ── 🟢 [ฟิลด์แทรกใหม่] ช่องกรอกข้อมูลน้ำหนัก และสายพันธุ์เพิ่มเติมดึงจากตัวประวัติน้อง ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-black text-sm">น้ำหนักของน้อง (กก.)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={healthForm.weight} 
                    onChange={e => setHealthForm({...healthForm, weight: e.target.value})} 
                    placeholder="เช่น 4.5" 
                    className="ori-input font-bold" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-sm">สายพันธุ์ของน้อง</label>
                  <input 
                    type="text" 
                    value={healthForm.breed} 
                    onChange={e => setHealthForm({...healthForm, breed: e.target.value})} 
                    placeholder="เช่น ชิสุ, ไทยบ้าน" 
                    className="ori-input font-bold" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-black text-sm">รายละเอียดบันทึกเพิ่มเติม</label>
                <textarea rows={2} value={healthForm.description} onChange={e => setHealthForm({...healthForm, description: e.target.value})} placeholder="เช่น น้ำหนัก 4.5 กก. สัตวแพทย์นัดตรวจซ้ำรอบหน้าซองยาสีชมพู" className="ori-input resize-none" />
              </div>

              <div className="space-y-1">
                <label className="font-black text-xs text-gray-600 flex items-center gap-1"><ImageIcon size={14}/> แนบรูปถ่ายใบเสร็จหรือหลักฐานทางการแพทย์ (สูงสุด 1 รูป)</label>
                <div className="flex items-center gap-3 mt-1.5">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-xs font-black bg-white border-2 border-black rounded-lg hover:bg-gray-50 shadow-paper-sm">เลือกรูปภาพ</button>
                  <input type="file" ref={fileInputRef} onChange={handleImageFileChange} accept="image/*" className="hidden" />
                  {imgFilePreview && (
                    <div className="w-12 h-12 rounded-lg border-2 border-black overflow-hidden relative bg-white">
                      <img src={imgFilePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="border-2 border-black p-4 rounded-2xl bg-wagashi-matcha/5 space-y-3">
                <label className="flex items-center gap-2 font-black text-sm cursor-pointer select-none">
                  <input type="checkbox" checked={healthForm.set_reminder} onChange={e => setHealthForm({...healthForm, set_reminder: e.target.checked})} className="w-4 h-4 accent-black rounded" />
                  🔔 ตั้งคิวแจ้งเตือนพุชหน้าจอ (Web Push) รอบถัดไปอัตโนมัติ
                </label>

                {healthForm.set_reminder && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <label className="font-black text-xs text-gray-600">วันที่ต้องนัดหมายถัดไป</label>
                      <input type="date" required={healthForm.set_reminder} value={healthForm.next_remind_at} onChange={e => setHealthForm({...healthForm, next_remind_at: e.target.value})} className="ori-input" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-black text-xs text-gray-600">การทำซ้ำแจ้งเตือน</label>
                      <select value={healthForm.repeat_type} onChange={e => setHealthForm({...healthForm, repeat_type: e.target.value})} className="ori-input bg-white font-bold cursor-pointer text-xs">
                        {Object.entries(REPEAT_LABEL).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" disabled={formSaving} className="w-full bg-black text-white font-black py-4 text-base rounded-xl border-2 border-black shadow-paper-sm hover:shadow-paper transition-all disabled:opacity-50">
                {formSaving ? <><Loader2 className="animate-spin" /> กำลังประมวลผลเซฟสมุดสุขภาพดิจิทัล...</> : "💾 บันทึกลงสมุดสุขภาพและคิวแจ้งเตือนพุช"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ══ ➕ MODAL ฟอร์มเพิ่มการแจ้งเตือนความจำของสัตว์เลี้ยง ══ */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-xs" onClick={() => !reminderSaving && setShowReminderModal(false)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full text-left border-4 border-black shadow-paper max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-4">
              <h3 className="font-black text-xl flex items-center gap-1.5">🔔 ตั้งเวลาแจ้งเตือนความจำน้อง</h3>
              <button onClick={() => setShowReminderModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveReminder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-black text-sm">วันที่ต้องการแจ้งเตือน <span className="text-red-500">*</span></label>
                  <input type="date" required value={reminderForm.date} onChange={e => setReminderForm({...reminderForm, date: e.target.value})} className="ori-input" />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-sm">เวลาที่แจ้งเตือน <span className="text-red-500">*</span></label>
                  <input type="time" required value={reminderForm.time} onChange={e => setReminderForm({...reminderForm, time: e.target.value})} className="ori-input" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-black text-sm">หมวดหมู่การแจ้งเตือน <span className="text-red-500">*</span></label>
                <select value={reminderForm.category} onChange={e => setReminderForm({...reminderForm, category: e.target.value, category_custom: ''})} className="ori-input bg-white cursor-pointer font-bold">
                  <option value="หยอดยาหมัด">หยอดยาหมัด</option>
                  <option value="ฉีดวัคซีน">ฉีดวัคซีน</option>
                  <option value="ตรวจสุขภาพ">ตรวจสุขภาพ</option>
                  <option value="อาบน้ำตัดขน">อาบน้ำตัดขน</option>
                  <option value="นัดพบแพทย์">นัดพบแพทย์</option>
                  <option value="other">อื่นๆ (กรอกระบุเอง)</option>
                </select>
              </div>

              {reminderForm.category === 'other' && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="font-black text-sm">ระบุหมวดหมู่การแจ้งเตือนเพิ่มเติม <span className="text-red-500">*</span></label>
                  <input type="text" required={reminderForm.category === 'other'} placeholder="เช่น ทำหมัน, ให้ยาบำรุง" value={reminderForm.category_custom} onChange={e => setReminderForm({...reminderForm, category_custom: e.target.value})} className="ori-input" />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-black text-sm">รายละเอียด / คำเตือนความจำ (เลือกกรอกหรือไม่กรอกก็ได้)</label>
                <textarea rows={3} placeholder="เช่น อย่าลืมพาไปงดน้ำอาหารก่อนพบนัดนะคะ หรือหากเว้นว่างไว้ระบบจะตั้งหัวข้อให้อัตโนมัติ" value={reminderForm.description} onChange={e => setReminderForm({...reminderForm, description: e.target.value})} className="ori-input resize-none py-2.5" />
              </div>

              <div className="bg-ori-cream-d/10 border-2 border-black/10 p-3.5 rounded-2xl text-xs font-bold text-gray-500 flex flex-col gap-1">
                <p>💡 ข้อมูลชื่อของสัตว์เลี้ยงที่จะบันทึกอัตโนมัติ: <span className="font-black text-black">น้อง {pet?.name || 'ไม่ระบุ'}</span></p>
                <p>💡 ข้อความประกาศพุชที่จะใช้พรีวิว: <span className="font-black text-ori-orange-d">{(reminderForm.category === 'other' ? reminderForm.category_custom : reminderForm.category) || 'หยอดยาหมัด'}{pet?.name || ''}</span></p>
              </div>

              <div className="flex gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowReminderModal(false)} disabled={reminderSaving} className="flex-1 py-5 border-2 border-black font-black rounded-xl">
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={reminderSaving} className="flex-1 py-5 bg-black text-white font-black rounded-xl hover:bg-gray-800 border-2 border-black flex items-center justify-center gap-1.5">
                  {reminderSaving ? <Loader2 className="animate-spin" size={16} /> : 'บันทึกแจ้งเตือน'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX MODAL ส่วนขยายภาพใบเสร็จหลักฐานขนาดใหญ่ ── */}
      {activeLightboxImg && (
        <div 
          className="fixed inset-0 bg-black/85 z-[200] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setActiveLightboxImg(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img src={activeLightboxImg} alt="Evidence Receipt Max Size" className="max-w-full max-h-full object-contain rounded-2xl border-4 border-white shadow-2xl" />
            <button 
              onClick={() => setActiveLightboxImg(null)} 
              className="absolute -top-4 -right-4 md:top-2 md:right-2 bg-white text-black border-2 border-black p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer shadow-xl"
              title="กดปิดแสดงภาพ"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

    </div>
  )
}