'use client'
// components/pet/PetCard.tsx

import { Pet }  from '@/types/pet'
import Link     from 'next/link'
import { useState, useMemo } from 'react'
import { MapPin, Check, Loader2, Eye, EyeOff } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { DonationModal } from '@/components/DonationModal'

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

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const imgUrl = pet.primary_image || pet.image_url
  const cfg    = statusCfg(pet.status || 'lost')
  const icon   = speciesIcon(pet.species || pet.type || 'other')

  // ── 🟢 1. ฟังก์ชันอัปเดตสถานะพร้อมปรับการมองเห็นเป็น "สาธารณะ" อัตโนมัติ (Constraint Mapping) ──
  const handleChangeMode = async (targetMode: 'lost' | 'found' | 'adoption' | 'mating' | 'showcase') => {
    if (modeChanging) return
    setModeChanging(true)

    // บังคับสิทธิ์อัตโนมัติ: ค้นหาน้อง (lost), หาคู่ให้น้อง (mating), พบสัตว์หลง (found) ปรับเป็น "public" ทันที
    const shouldBePublic = ['lost', 'found', 'mating'].includes(targetMode)
    const newVisibility = shouldBePublic ? 'public' : (pet.visibility || 'public')

    try {
      const { error } = await supabase
        .from('pets')
        .update({
          status: targetMode,
          visibility: newVisibility,
          mode_lost: targetMode === 'lost',
          mode_adoption: targetMode === 'adoption',
          mode_mating: targetMode === 'mating',
          mode_showcase: targetMode === 'showcase'
        })
        .eq('id', pet.id)

      if (error) throw error
      
      setPet((prev: any) => ({ 
        ...prev, 
        status: targetMode,
        visibility: newVisibility
      }))
      
      alert(`🎉 สลับโหมดน้องเป็น "${statusCfg(targetMode).label}" ${shouldBePublic ? 'และระบบปรับสถานะการมองเห็นเป็น สาธารณะ อัตโนมัติเรียบร้อยค่ะ' : ''}`)
    } catch (err: any) {
      alert(`สลับโหมดไม่สำเร็จ: ${err.message}`)
    } finally { // 🟢 แก้ไขคำสะกดผิดไวยากรณ์ (Typo) เรียบร้อยครับ
      setModeChanging(false)
    }
  }

  // ── 🟢 2. ฟังก์ชันเปลี่ยนเฉพาะสถานะการมองเห็นแมนนวล (ดักไม่ให้ซ่อนถ้าอยู่ในโหมดประกาศหลัก) ──
  const handleToggleVisibility = async (targetVisibility: 'public' | 'private') => {
    if (modeChanging) return
    
    if (targetVisibility === 'private' && ['lost', 'found', 'mating'].includes(pet.status)) {
      alert('⚠️ ไม่สามารถปรับเป็น "เฉพาะฉัน" ได้ในขณะที่น้องอยู่ในโหมด ค้นหาน้อง, หาคู่ หรือพบสัตว์หลง เพื่อให้ระบบ AI ทำการคัดกรองข้อมูลสาธารณะพุชบอร์ดได้ปกติค่ะ')
      return
    }

    setModeChanging(true)
    try {
      const { error } = await supabase
        .from('pets')
        .update({ visibility: targetVisibility })
        .eq('id', pet.id)

      if (error) throw error
      setPet((prev: any) => ({ ...prev, visibility: targetVisibility }))
    } catch (err: any) {
      alert(`ปรับการมองเห็นไม่สำเร็จ: ${err.message}`)
    } finally { // 🟢 แก้ไขคำสะกดผิดไวยากรณ์ (Typo) เรียบร้อยครับ
      setModeChanging(false)
    }
  }

  // ── 🟢 3. ฟังก์ชันปิดเคสสำเร็จร่วมกับการเด้ง Donation Pop-up บริจาคส่งต่อสิ่งดีๆ ──
  const handleResolveCase = async () => {
    let checkText = 'เจอน้องเรียบร้อยแล้วใช่ไหมคะ?'
    if (pet.status === 'adoption') checkText = 'น้องได้บ้านที่อบอุ่นใหม่เรียบร้อยแล้วใช่ไหมคะ?'
    if (pet.status === 'mating') checkText = 'น้องจับคู่แมตช์สำเร็จเรียบร้อยแล้วใช่ไหมคะ?'

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
      setPet((prev: any) => ({ ...prev, status: 'showcase' }))
      
      // เปิดป๊อปอัปภาพขอรับบริจาคที่พี่วุฒิ์ทำไว้ค้างก่อนหน้าทันที
      setShowDonation(true)
    } catch (err: any) {
      alert(`ปิดเคสไม่สำเร็จ: ${err.message}`)
    } finally { // 🟢 แก้ไขคำสะกดผิดไวยากรณ์ (Typo) เรียบร้อยครับ
      setModeChanging(false)
    }
  }

  return (
    <div className="ori-card flex flex-col group text-black">
      <div className="relative w-full aspect-square overflow-hidden border-b-2 border-ori-ink shrink-0">
        {imgUrl ? (
          <img src={imgUrl} alt={pet.name || 'pet'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">{icon}</div>
        )}

        <div className="absolute top-2.5 left-2.5 text-xs font-black px-2.5 py-1 rounded-full border-2 border-black shadow-paper-sm" style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </div>

        {/* แผงสถานะป้ายบอกการมองเห็นที่มุมขวาบนของการ์ด */}
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
        <p className="text-xs font-bold text-gray-500 truncate">{[pet.species, pet.breed].filter(Boolean).join(' · ')}</p>
        
        <div className="flex items-center gap-1 text-xs font-bold text-gray-600">
          <MapPin size={12} />
          <span>{pet.province || 'ไม่ระบุพื้นที่'}</span>
        </div>

        {/* แผงปุ่มสลับการมองเห็นและโหมดใช้งาน */}
        <div className="mt-3 pt-2 border-t border-dashed border-gray-200 space-y-2">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">🌍 ตั้งค่าสิทธิ์การมองเห็นการ์ด:</p>
            <div className="grid grid-cols-2 gap-1">
              <button type="button" disabled={modeChanging} onClick={() => handleToggleVisibility('public')} className={`text-[9px] font-black py-1 px-1.5 border border-black rounded flex items-center justify-center gap-1 ${pet.visibility !== 'private' ? 'bg-green-100' : 'bg-white hover:bg-gray-50'}`}><Eye size={10}/> สาธารณะ</button>
              <button type="button" disabled={modeChanging} onClick={() => handleToggleVisibility('private')} className={`text-[9px] font-black py-1 px-1.5 border border-black rounded flex items-center justify-center gap-1 ${pet.visibility === 'private' ? 'bg-red-100' : 'bg-white hover:bg-gray-50'}`}><EyeOff size={10}/> เฉพาะฉัน</button>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">🛠️ แผงควบคุมโหมดพุชบอร์ดฟรี:</p>
            <div className="grid grid-cols-4 gap-1">
              <button type="button" disabled={modeChanging} onClick={() => handleChangeMode('lost')} className={`text-[9px] font-black p-1 border border-black rounded ${pet.status === 'lost' ? 'bg-orange-200' : 'bg-white hover:bg-gray-50'}`}>🚨 หาย</button>
              <button type="button" disabled={modeChanging} onClick={() => handleChangeMode('found')} className={`text-[9px] font-black p-1 border border-black rounded ${pet.status === 'found' ? 'bg-green-200' : 'bg-white hover:bg-gray-50'}`}>👀 พบสัตว์</button>
              <button type="button" disabled={modeChanging} onClick={() => handleChangeMode('adoption')} className={`text-[9px] font-black p-1 border border-black rounded ${pet.status === 'adoption' ? 'bg-blue-200' : 'bg-white hover:bg-gray-50'}`}>🏡 หาบ้าน</button>
              <button type="button" disabled={modeChanging} onClick={() => handleChangeMode('mating')} className={`text-[9px] font-black p-1 border border-black rounded ${pet.status === 'mating' ? 'bg-pink-200' : 'bg-white hover:bg-gray-50'}`}>❤️ หาคู่</button>
            </div>
          </div>

          {(pet.status === 'lost' || pet.status === 'adoption' || pet.status === 'mating') && (
            <button 
              type="button"
              onClick={handleResolveCase}
              disabled={modeChanging}
              className="w-full mt-1.5 py-1 bg-black text-white border border-black hover:bg-gray-800 text-[10px] font-black rounded flex items-center justify-center gap-1 shadow-paper-sm transition-all"
            >
              {modeChanging ? <Loader2 className="animate-spin" size={11}/> : <Check size={11}/>} 
              {modeChanging ? 'กำลังบันทึก...' : pet.status === 'lost' ? 'เจอน้องเรียบร้อยแล้ว' : pet.status === 'adoption' ? 'น้องได้บ้านอบอุ่นแล้ว' : 'น้องได้คู่แมตช์แล้ว'}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        <Link href={`/pets/${pet.id}`} className="ori-btn ori-btn-orange w-full text-xs font-black text-center block border-2 border-black py-1.5 rounded-xl shadow-paper-sm">
          ดูรายละเอียดสมุดสุขภาพ →
        </Link>
      </div>

      <DonationModal isOpen={showDonation} onClose={() => setShowDonation(false)} />
    </div>
  )
}