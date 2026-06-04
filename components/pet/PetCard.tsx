'use client'
// components/pet/PetCard.tsx (V4 - ซ่อมแซมระบบดึงรูปภาพลักษณะเด่น แก้ไขบั๊กทลายแคช JSON และตั้งค่าสิทธิ์ความเป็นส่วนตัวสมบูรณ์)

import { Pet }  from '@/types/pet'
import Link     from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import { MapPin, Check, Loader2, Eye, EyeOff, MessageSquare } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { DonationModal } from '@/components/DonationModal'

function CommentBadge({ petId, comments }: { petId: string; comments: any[] }) {
  const [hasNew, setHasNew] = useState(false)
  const count = comments?.length || 0

  useEffect(() => {
    if (typeof window !== 'undefined' && count > 0) {
      const lastViewedStr = localStorage.getItem(`last_viewed_comments_${petId}`)
      const lastViewed = lastViewedStr ? parseInt(lastViewedStr) : 0
      const latestCommentTime = comments && comments.length > 0
        ? Math.max(...comments.map((c: any) => new Date(c.created_at).getTime()))
        : 0
      setHasNew(latestCommentTime > lastViewed)
    }
  }, [petId, comments, count])

  const handleClick = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`last_viewed_comments_${petId}`, Date.now().toString())
    }
    setHasNew(false)
  }

  if (count === 0) return null

  return (
    <Link 
      href={`/pet/${petId}#comments`}
      onClick={handleClick}
      className={`absolute -top-3 -left-3 z-30 min-w-[32px] h-8 px-2.5 rounded-full flex items-center justify-center border-4 border-black shadow-paper-sm font-black text-xs cursor-pointer hover:scale-105 active:scale-95 transition-all ${
        hasNew 
          ? 'bg-ori-orange text-white animate-bounce' 
          : 'bg-ori-cream text-black'
      }`}
      title={hasNew ? 'มีความคิดเห็นใหม่! กดเพื่อดูความคิดเห็น' : 'ความคิดเห็น กดเพื่อดู'}
    >
      <MessageSquare size={12} className="mr-1 shrink-0" />
      <span>{hasNew ? `+${count}` : count}</span>
    </Link>
  )
}

function speciesIcon(type: string) {
  return ({ dog:'🐕', cat:'🐈', bird:'🦜', rabbit:'🐰', fish:'🐟', other:'🐾' } as any)[type] ?? '🐾'
}

function statusCfg(status: string) {
  return ({
    lost:     { label:'หาย 🚨',    color:'#D94F1E', bg:'#FDEEE8' },
    found:    { label:'พบเห็น 👀', color:'#2D6A2D', bg:'#E8F3E8' },
    adoption: { label:'หาบ้าน 💖', color:'#1A5EA8', bg:'#E3EEF8' },
    mating:   { label:'หาคู่ ❤️',  color:'#C2185B', bg:'#FCE4EC' },
    showcase: { label:'โชว์ ✨',  color:'#F57C00', bg:'#FFF3E0' },
  } as any)[status] ?? { label: status, color:'#1A1208', bg:'#F5EDD8' }
}

export function PetCard({ pet: initialPet }: { pet: Pet }) {
  const [pet, setPet] = useState<any>(initialPet)
  const [modeChanging, setModeChanging] = useState(false)
  const [showDonation, setShowDonation] = useState(false)
  const [isOwner, setIsOwner] = useState(false) // ดักจับสิทธิ์ความปลอดภัยตรวจสอบความเป็นเจ้าของ



  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // ── 🟢 แก้บั๊กข้อ 9: ระบบเรียกรูปภาพแบบ Fallback เช็คตารางลูกสลับตารางหลัก ป้องกันภาพไม่แสดงผล ──
  const imgUrl = useMemo(() => {
    // 1. เช็คคลังรูปจากตารางย่อย pet_images ก่อน
    if (pet.pet_images && pet.pet_images.length > 0) {
      const primary = pet.pet_images.find((img: any) => img.is_primary)
      return primary ? primary.storage_url : pet.pet_images[0].storage_url
    }
    // 2. เช็คตัวแปร Array โครงสร้างดั้งเดิม pets.images
    if (pet.images && pet.images.length > 0) {
      return pet.images[0]
    }
    // 3. ปล่อยพ่นค่า Default กรณีหาลิงก์รูปไม่เจอ
    return pet.primary_image || pet.image_url || null
  }, [pet])

  // ── 🟢 แก้บั๊กข้อ 8: ป้องกันรายละเอียด JSON Metadata แปลกปลอมหลุดพ่นออกมาในช่องลักษณะเด่น ──
  const sanitizedFeatures = useMemo(() => {
    const rawText = pet.distinctive_features || pet.special_marks
    if (!rawText) return 'ไม่มีการระบุตำหนิพิเศษไว้ค่ะ'
    
    // ดักจับกรณีดึงก้อนอักขระพิเศษผิดพลาดหลุดส่ง JSON String เข้ามา
    if (typeof rawText === 'string' && (rawText.trim().startsWith('{') || rawText.trim().startsWith('['))) {
      try {
        const parsed = JSON.parse(rawText)
        if (Array.isArray(parsed)) {
          return parsed[0]?.message || parsed[0]?.text || 'ระบุข้อมูลไว้ในแฟ้มรูปภาพลักษณะพิเศษ'
        }
        return parsed.message || parsed.text || 'ระบุข้อมูลลักษณะเด่นแล้ว'
      } catch (e) {
        // หากพาร์สพังให้ถอยกลับไปส่งอักขระดิบปกติ
      }
    }
    return rawText
  }, [pet])

  const cfg  = statusCfg(pet.status || 'lost')
  const icon = speciesIcon(pet.species || pet.type || 'other')

  // ── คำนวณ effective status จาก mode columns (fallback กรณี status เก่า = 'active') ──
  const effectiveStatus = (() => {
    // ถ้า status ตรงกับ mode อยู่แล้ว → ใช้เลย
    const validStatuses = ['lost', 'found', 'mating', 'adoption', 'showcase', 'resolved', 'matched', 'claimed']
    if (pet.status && validStatuses.includes(pet.status)) return pet.status
    // fallback: อ่านจาก mode_* columns
    if (pet.mode_lost)     return 'lost'
    if (pet.mode_mating)   return 'mating'
    if (pet.mode_adoption) return 'adoption'
    if (pet.mode_showcase) return 'showcase'
    return pet.status || 'showcase'
  })()

  const displayCfg = statusCfg(effectiveStatus)

  // ดักเช็คสิทธิ์ความเป็นเจ้าของเพื่อเปิดแผงควบคุมหลังบ้าน
  useEffect(() => {
    const checkOwnership = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id === pet.user_id) {
        setIsOwner(true)
      }
    }
    checkOwnership()
  }, [pet.user_id, supabase])

  // ── ฟังก์ชันสลับโหมดพร้อมปรับค่าการมองเห็นผ่าน Dropdown (Constraint Mapping) ──
  const handleDropdownChange = async (value: string) => {
    if (modeChanging) return
    setModeChanging(true)

    const isPublicMode  = ['lost', 'found', 'mating', 'adoption', 'showcase'].includes(value)
    const newVisibility = value === 'private' ? 'private' : 'public'
    const targetStatus  = value === 'private' ? effectiveStatus : value

    try {
      const { error } = await supabase
        .from('pets')
        .update({
          status: targetStatus,
          visibility: newVisibility,
          mode_lost: targetStatus === 'lost',
          mode_adoption: targetStatus === 'adoption',
          mode_mating: targetStatus === 'mating',
          mode_showcase: targetStatus === 'showcase'
        })
        .eq('id', pet.id)

      if (error) throw error
      
      setPet((prev: any) => ({ 
        ...prev, 
        status: targetStatus,
        visibility: newVisibility,
        mode_lost: targetStatus === 'lost',
        mode_adoption: targetStatus === 'adoption',
        mode_mating: targetStatus === 'mating',
        mode_showcase: targetStatus === 'showcase'
      }))
      
      alert(`🎉 ปรับโหมดเป็น "${
        value === 'private' ? 'เฉพาะฉัน' :
        value === 'lost' ? 'ประกาศหาย' :
        value === 'found' ? 'พบสัตว์หลง' :
        value === 'adoption' ? 'หาบ้านให้น้อง' :
        value === 'mating' ? 'หาคู่ให้น้อง' : 'โชว์โปรไฟล์'
      }" เรียบร้อยค่ะ`)
    } catch (err: any) {
      alert(`ปรับโหมดไม่สำเร็จ: ${err.message}`)
    } finally {
      setModeChanging(false)
    }
  }

  // ── ฟังก์ชันปิดเคสสำเร็จพ่วงเปิดการเด้งป๊อปอัป DonationModal บริจาค ──
  const handleResolveCase = async () => {
    let checkText = 'เจอน้องเรียบร้อยแล้วใช่ไหมคะ?'
    let titleText = '🎉 พบน้องแล้ว!'
    let descText  = 'ยินดีด้วยค่ะ น้องได้กลับบ้านอย่างปลอดภัยเรียบร้อยแล้ว'
    
    if (effectiveStatus === 'adoption') {
      checkText = 'น้องได้บ้านที่อบอุ่นใหม่เรียบร้อยแล้วใช่ไหมคะ?'
      titleText = '🏡 น้องได้บ้านแล้ว!'
      descText  = 'ยินดีด้วยค่ะ น้องได้รับอุปการะสู่บ้านใหม่ที่อบอุ่นเรียบร้อยแล้ว'
    }
    if (effectiveStatus === 'mating') {
      checkText = 'น้องจับคู่แมตช์สำเร็จเรียบร้อยแล้วใช่ไหมคะ?'
      titleText = '❤️ น้องได้คู่แล้ว!'
      descText  = 'ยินดีด้วยค่ะ น้องจับคู่แมตช์และผสมพันธุ์สำเร็จเรียบร้อยแล้ว'
    }

    if (!window.confirm(`⚠️ ยืนยันปิดประกาศสถานะเคสนี้สำเร็จ: ${checkText}`)) return
    
    setModeChanging(true)
    try {
      const { error } = await supabase
        .from('pets')
        .update({
          status: 'showcase', 
          mode_lost: false,
          mode_adoption: false,
          mode_mating: false,
          mode_showcase: true,
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', pet.id)

      if (error) throw error

      // บันทึกลงประวัติสุขภาพสัตว์เลี้ยง (pet_health_events)
      await supabase
        .from('pet_health_events')
        .insert({
          pet_id: pet.id,
          event_type: 'other',
          title: titleText,
          description: descText,
          event_date: new Date().toISOString().split('T')[0]
        })

      setPet((prev: any) => ({ 
        ...prev, 
        status: 'showcase',
        is_resolved: true,
        mode_lost: false,
        mode_adoption: false,
        mode_mating: false,
        mode_showcase: true
      }))
      
      setShowDonation(true)
    } catch (err: any) {
      alert(`ปิดเคสไม่สำเร็จ: ${err.message}`)
    } finally {
      setModeChanging(false)
    }
  }

  return (
    <div className="ori-card flex flex-col group text-black">
      <div className="relative w-full aspect-square overflow-hidden border-b-2 border-ori-ink shrink-0">
        <CommentBadge petId={pet.id} comments={pet.comments} />

        {imgUrl ? (
          <img src={imgUrl} alt={pet.name || 'pet'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">{icon}</div>
        )}

        <div className="absolute top-2.5 left-2.5 text-xs font-black px-2.5 py-1 rounded-full border-2 border-black shadow-paper-sm" style={{ background: displayCfg.bg, color: displayCfg.color }}>
          {displayCfg.label}
        </div>

        {/* แผงป้ายแสดงสถานะการมองเห็น ปรากฏที่มุมขวาบนของการ์ด */}
        <div className="absolute top-2.5 right-2.5 flex gap-1">
          {pet.visibility === 'private' ? (
            <div className="bg-red-500 text-white p-1 rounded-md border border-black shadow-paper-sm flex items-center gap-1 text-[9px] font-black">
              <EyeOff size={10} /> เฉพาะฉัน
            </div>
          ) : (
            <div className="bg-green-500 text-white p-1 rounded-md border border-black shadow-paper-sm flex items-center gap-1 text-[9px] font-black">
              <Eye size={10} /> สาธารณะ
            </div>
          )}
        </div>


      </div>

      <div className="p-4 flex flex-col gap-1.5 flex-1 text-left">
        <h3 className="font-black text-lg text-ori-ink flex items-center justify-between">
          <span>{pet.name || 'ไม่ทราบชื่อ'} {icon}</span>
        </h3>
        
        {/* ── เรียกใช้ข้อความที่ผ่านการล้างบั๊กเรียบร้อยแล้ว ไม่พ่น API Key หรือก้อนสัญญานแปลกปลอมออกหน้าต่างแสดงผล ── */}
        <p className="text-xs font-bold text-gray-500 truncate">{sanitizedFeatures}</p>
        
        <div className="flex items-center gap-1 text-xs font-bold text-gray-600">
          <MapPin size={12} />
          <span>{pet.province || 'ไม่ระบุพื้นที่'}</span>
        </div>

        {/* แผงปุ่มตั้งค่า (จะแสดงและให้สิทธิ์เข้าถึงเฉพาะนุดที่เป็นเจ้าของสัตว์เลี้ยงตัวจริงเท่านั้น) */}
        {isOwner && (
          <div className="mt-3 pt-2 border-t border-dashed border-gray-200 space-y-3">
            <div>
              <p className="text-[10px] font-black text-gray-400 tracking-wider mb-1 uppercase">⚙️ ปรับสถานะ / โหมดของน้อง:</p>
              <div className="relative">
                <select
                  value={pet.visibility === 'private' ? 'private' : effectiveStatus}
                  disabled={modeChanging}
                  onChange={(e) => handleDropdownChange(e.target.value)}
                  className="w-full bg-white border-2 border-black rounded-lg p-2 font-black text-xs cursor-pointer shadow-paper-sm hover:bg-gray-50 focus:outline-none text-black"
                >
                  <option value="lost">📢 ประกาศหาย (สาธารณะ)</option>
                  <option value="mating">❤️ หาคู่ให้น้อง (สาธารณะ)</option>
                  <option value="adoption">🏡 หาบ้านให้น้อง (สาธารณะ)</option>
                  <option value="showcase">✨ โชว์โปรไฟล์ (สาธารณะ)</option>
                  <option value="private">🔒 เฉพาะฉัน (ส่วนตัว)</option>
                </select>
              </div>
            </div>

            {!pet.is_resolved && (effectiveStatus === 'lost' || effectiveStatus === 'adoption' || effectiveStatus === 'mating') && pet.visibility !== 'private' && (
              <button 
                type="button"
                onClick={handleResolveCase}
                disabled={modeChanging}
                className={`w-full py-2 border-2 border-black font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-paper-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 text-white
                  ${effectiveStatus === 'lost'     ? 'bg-[#2D6A2D] hover:bg-[#3E803E]' : ''}
                  ${effectiveStatus === 'mating'   ? 'bg-[#C2185B] hover:bg-[#D81B60]' : ''}
                  ${effectiveStatus === 'adoption' ? 'bg-[#1A5EA8] hover:bg-[#1E71C9]' : ''}
                `}
              >
                {modeChanging ? <Loader2 className="animate-spin" size={12}/> : null} 
                {modeChanging ? 'กำลังบันทึก...'
                  : effectiveStatus === 'lost'     ? 'พบน้องแล้ว 🚨'
                  : effectiveStatus === 'mating'   ? 'น้องได้คู่แล้ว ❤️'
                  : 'น้องได้บ้านแล้ว 🏡'
                }
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pb-4 flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/pet/${pet.id}`} className="bg-ori-orange text-white hover:bg-ori-orange-d border-2 border-black py-2 rounded-xl text-xs font-black text-center block shadow-paper-sm transition-transform active:scale-95">
            ดูรายละเอียด →
          </Link>
          <Link href={`/pets/${pet.id}?tab=health`} className="bg-white text-black hover:bg-gray-50 border-2 border-black py-2 rounded-xl text-xs font-black text-center block shadow-paper-sm transition-transform active:scale-95">
            🏥 สมุดสุขภาพ
          </Link>
        </div>
        <Link href="/profile?tab=pets" className="bg-wagashi-matcha text-black hover:bg-wagashi-matcha/80 border-2 border-black py-2 rounded-xl text-xs font-black text-center block shadow-paper-sm transition-transform active:scale-95">
          📋 ประวัติสุขภาพสัตว์เลี้ยง
        </Link>
      </div>

      <DonationModal isOpen={showDonation} onClose={() => setShowDonation(false)} />
    </div>
  )
}