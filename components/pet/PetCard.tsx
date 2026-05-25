'use client'
// components/pet/PetCard.tsx — เพิ่มปุ่มสลับ 3 โหมดเชิงรุกพร้อมปุ่มปิดสถานะหยุดค้นหาฟรี

import { Pet }  from '@/types/pet'
import Link     from 'next/link'
import { useState, useMemo } from 'react'
import { MapPin, Share2, AlertCircle, Heart, Search, Trophy, Check } from 'lucide-react'
import { trackCardClick, buildShareUrl } from '@/lib/analytics'
import { createBrowserClient } from '@supabase/ssr'

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

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const imgUrl      = pet.primary_image || pet.image_url
  const cfg         = statusCfg(pet.status || 'lost')
  const icon        = speciesIcon(pet.species || pet.type || 'other')

  // ── 🟢 ฟังก์ชันแก้ไขเปลี่ยนโหมดและอัปเดตสลับสายพุชบอร์ดหน้าเว็บโดยตรงฟรี ──
  const handleChangeMode = async (targetMode: 'lost' | 'adoption' | 'mating' | 'showcase') => {
    if (modeChanging) return
    setModeChanging(true)

    try {
      const { error } = await supabase
        .from('pets')
        .update({
          status: targetMode,
          mode_lost: targetMode === 'lost',
          mode_adoption: targetMode === 'adoption',
          mode_mating: targetMode === 'mating',
          mode_showcase: targetMode === 'showcase'
        })
        .eq('id', pet.id)

      if (error) throw error
      setPet((prev: any) => ({ ...prev, status: targetMode }))
      alert(`🎉 สลับโหมดน้องเป็นกลุ่ม "${statusCfg(targetMode).label}" เรียบร้อยแล้วค่ะ! AI เริ่มตรวจข้อมูลพุชทันที`)
    } catch (err: any) {
      alert(`สลับโหมดไม่สำเร็จ: ${err.message}`)
    } finally {
      setModeChanging(false)
    }
  }

  // ── 🟢 ฟังก์ชันกดปิดสถานะหยุดค้นหาเมื่อเคสสำเร็จ (เจอน้อง/ได้บ้าน/ได้คู่เรียบร้อย) ──
  const handleResolveCase = async () => {
    if (!window.confirm('⚠️ ยืนยันการปิดประกาศเคสนี้สำเร็จเรียบร้อยแล้วใช่ไหมคะ? ระบบจะทำการหยุดแจ้งเตือนบนพุชบอร์ดทันทีค่ะ')) return
    
    try {
      const { error } = await supabase
        .from('pets')
        .update({
          status: 'showcase', // ปรับกลับเป็นโหมดโชว์โปรไฟล์ทั่วไป
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
      alert('❤️ ยินดีด้วยกับน้องด้วยนะคะ! ระบบได้ทำการเคลียร์สัญญานคิวนัดหมายบนพุชบอร์ดเสร็จสิ้นแล้วค่ะ')
    } catch (err: any) {
      alert(`ปิดเคสไม่สำเร็จ: ${err.message}`)
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

        {/* ── 🟢 กล่องปุ่มกดแผงควบคุมสลับสถานะ 3 โหมดเชิงรุก และปุ่มปิดเคสสำเร็จบนตัวการ์ดโดยตรง ── */}
        <div className="mt-3 pt-2 border-t border-dashed border-gray-200 space-y-1.5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">🛠️ แผงควบคุมโหมดพุชบอร์ดฟรี:</p>
          
          <div className="grid grid-cols-3 gap-1">
            <button onClick={() => handleChangeMode('lost')} className={`text-[9px] font-black p-1 border border-black rounded ${pet.status === 'lost' ? 'bg-blue-200' : 'bg-white hover:bg-gray-50'}`}>🚨 หาย</button>
            <button onClick={() => handleChangeMode('adoption')} className={`text-[9px] font-black p-1 border border-black rounded ${pet.status === 'adoption' ? 'bg-green-200' : 'bg-white hover:bg-gray-50'}`}>🏡 หาบ้าน</button>
            <button onClick={() => handleChangeMode('mating')} className={`text-[9px] font-black p-1 border border-black rounded ${pet.status === 'mating' ? 'bg-pink-200' : 'bg-white hover:bg-gray-50'}`}>❤️ หาคู่</button>
          </div>

          {/* แสดงปุ่มปิดสัญญานตามสถานะที่ผู้ใช้สลับเปิดใช้เชิงรุกค้างไว้ */}
          {(pet.status === 'lost' || pet.status === 'adoption' || pet.status === 'mating') && (
            <button 
              onClick={handleResolveCase}
              className="w-full mt-1.5 py-1 bg-black text-white border border-black hover:bg-gray-800 text-[10px] font-black rounded flex items-center justify-center gap-1 shadow-paper-sm transition-all"
            >
              <Check size={11}/> {pet.status === 'lost' ? 'เจอน้องเรียบร้อยแล้ว' : pet.status === 'adoption' ? 'น้องได้บ้านอบอุ่นแล้ว' : 'น้องได้คู่แมตช์แล้ว'}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        <Link href={`/pets/${pet.id}`} className="ori-btn ori-btn-orange w-full text-xs font-black text-center block border-2 border-black py-1.5 rounded-xl shadow-paper-sm">
          ดูรายละเอียดสมุดสุขภาพ →
        </Link>
      </div>
    </div>
  )
}