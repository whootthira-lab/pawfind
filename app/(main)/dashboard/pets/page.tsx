'use client'
// app/(main)/dashboard/pets/page.tsx (V3 - หน้าจัดการโปรไฟล์คลังสัตว์เลี้ยง แสดงเพศ ทำหมัน คำนวณอายุอัตโนมัติสมบูรณ์ 100%)

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient }          from '@supabase/ssr'
import { useRouter }                    from 'next/navigation'
import Link                             from 'next/link'
import {
  PawPrint, Plus, Edit3, Eye, Archive,
  AlertCircle, Crown, Search, Heart,
  Home, Trophy, MoreVertical, Loader2,
  ChevronRight
} from 'lucide-react'

const MODE_ICONS: Record<string, any> = {
  mode_lost:     Search,
  mode_mating:   Heart,
  mode_adoption: Home,
  mode_showcase: Trophy,
}
const MODE_LABELS: Record<string, string> = {
  mode_lost:     'หาย',
  mode_mating:   'หาคู่',
  mode_adoption: 'หาบ้าน',
  mode_showcase: 'โชว์',
}

export default function DashboardPetsPage() {
  const router   = useRouter()
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [pets,      setPets]      = useState<any[]>([])
  const [archived,  setArchived]  = useState<any[]>([])
  const [sub,       setSub]       = useState<{ plan: string; limit: number }>({
    plan: 'free', limit: 1,
  })
  const [loading,   setLoading]   = useState(true)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  // ── 🟢 ฟังก์ชันคำนวณอายุอัตโนมัติสำหรับพ่นแสดงผลบนตัวการ์ดจัดการรายตัว ──
  const calculateAge = (birthdayString: string | null) => {
    if (!birthdayString) return 'ไม่ระบุอายุ'
    const birth = new Date(birthdayString)
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
      return months <= 0 ? 'วัยแรกเกิด' : `${months} เดือน`
    }
    return months <= 0 ? `${years} ขวบ` : `${years} ขวบ ${months} เดือน`
  }

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      // Subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', session.user.id)
        .single()
      const plan  = subData?.plan || 'free'
      const limit = plan === 'member' ? 3 : 1
      setSub({ plan, limit })

      // คิวรีแบบ Relation ดึงข้อมูลรูปภาพ และประวัติสุขภาพตัวล่าสุดพ่วงออกมาพร้อมกัน
      const { data: activePets } = await supabase
        .from('pets')
        .select(`
          *,
          pet_images(storage_url, is_primary),
          pet_health_events(event_date, event_type)
        `)
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      const mappedPets = (activePets || []).map(pet => {
        const vaccineEvents = (pet.pet_health_events || [])
          .filter((e: any) => e.event_type === 'vaccine' || e.event_type === 'rabies_vaccine')
          .sort((a: any, b: any) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
        
        return {
          ...pet,
          last_vaccine_date: vaccineEvents[0]?.event_date || null
        }
      })
      setPets(mappedPets)

      // Archived pets
      const { data: archivedPets } = await supabase
        .from('pets')
        .select('id, name, species, archived_at, delete_after')
        .eq('user_id', session.user.id)
        .eq('status', 'archived')
        .order('archived_at', { ascending: false })
      setArchived(archivedPets || [])

      setLoading(false)
    }
    load()
  }, [supabase, router])

  const getThumb = (pet: any) => {
    const imgs = pet.pet_images || []
    return imgs.find((i: any) => i.is_primary)?.storage_url
      || imgs[0]?.storage_url
      || null
  }

  const getActiveModes = (pet: any) =>
    Object.keys(MODE_ICONS).filter(k => pet[k])

  const daysUntilDelete = (deleteAfter: string) => {
    const diff = new Date(deleteAfter).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / 86400000))
  }

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 size={48} className="animate-spin text-ori-orange" />
    </div>
  )

  const atLimit = pets.length >= sub.limit

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 mb-20" onClick={() => setActiveMenu(null)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2">
            <PawPrint size={28} /> โปรไฟล์น้อง
          </h1>
          <p className="text-sm font-bold text-ori-ink-l mt-0.5">
            {sub.plan === 'member' ? '⭐ Member' : '🐾 Free'} · {pets.length}/{sub.limit} ตัว
          </p>
        </div>

        {!atLimit ? (
          <Link href="/pets/new"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-ori-ink
              text-white font-black text-sm rounded-xl border-2 border-ori-ink
              shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5
              transition-all">
            <Plus size={16} /> เพิ่มน้อง
          </Link>
        ) : (
          <div className="text-right">
            {sub.plan === 'free' ? (
              <Link href="/pricing"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500
                  text-white font-black text-sm rounded-xl border-2 border-amber-600
                  shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5
                  transition-all">
                <Crown size={16} /> อัปเกรด
              </Link>
            ) : (
              <span className="text-xs font-bold text-gray-400">
                เพิ่มได้สูงสุด {sub.limit} ตัว
              </span>
            )}
          </div>
        )}
      </div>

      {sub.plan === 'free' && pets.length >= 1 && (
        <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-300
          rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Crown size={20} className="text-amber-500 shrink-0" />
            <div>
              <p className="font-black text-sm text-amber-800">อัปเกรด Member เพิ่มได้ถึง 3 ตัว</p>
              <p className="text-xs font-bold text-amber-600">พร้อมสมุดสุขภาพ · LINE OA · QR Code</p>
            </div>
          </div>
          <Link href="/pricing"
            className="text-xs font-black text-amber-700 bg-amber-200
              px-3 py-2 rounded-xl border border-amber-400 shrink-0
              hover:bg-amber-300 transition-all">
            ฿399/ปี →
          </Link>
        </div>
      )}

      {pets.length === 0 ? (
        <div className="text-center py-20 bg-white border-4 border-dashed border-gray-300 rounded-3xl">
          <PawPrint size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="font-black text-xl text-ori-ink-l mb-2">ยังไม่มีโปรไฟล์น้อง</p>
          <p className="text-sm font-bold text-gray-400 mb-6">สร้างโปรไฟล์เพื่อ AI ช่วยหาน้องได้แม่นขึ้น</p>
          <Link href="/pets/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-ori-ink
              text-white font-black rounded-xl border-2 border-ori-ink
              shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5
              transition-all">
            <Plus size={18} /> สร้างโปรไฟล์แรก
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pets.map(pet => {
            const thumb     = getThumb(pet)
            const actModes  = getActiveModes(pet)
            const menuOpen  = activeMenu === pet.id
            const petAge    = calculateAge(pet.birthday || pet.birthdate)

            return (
              <div key={pet.id} className="bg-white border-4 border-ori-ink rounded-3xl overflow-hidden shadow-paper">
                <div className="flex items-stretch">
                  <div className="w-28 shrink-0 bg-gray-100 relative border-r-2 border-ori-ink">
                    {thumb ? (
                      <img src={thumb} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PawPrint size={32} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-lg leading-tight">{pet.name}</p>
                          {/* 🟢 บล็อกป้ายเพศขนาดเล็กเด่นหราสไตล์ Origami */}
                          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded border border-black ${pet.gender === 'male' ? 'bg-blue-100 text-blue-700' : pet.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-600'}`}>
                            {pet.gender === 'male' ? '♂ ผู้' : pet.gender === 'female' ? '♀ เมีย' : '❓ ไม่ระบุ'}
                          </span>
                        </div>
                        
                        <p className="text-sm font-bold text-ori-ink-l mt-0.5">
                          {[pet.species, pet.breed].filter(Boolean).join(' · ')} • <span className="text-ori-ink font-extrabold">{petAge}</span>
                        </p>

                        {/* 🟢 แสดงสถานะการทำหมันร่วมสัญญาน Badge สมุดสุขภาพ */}
                        <div className="flex gap-1.5 items-center mt-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${pet.is_sterilized ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                            {pet.is_sterilized ? '🩺 ทำหมันแล้ว' : '❌ ยังไม่ทำหมัน'}
                          </span>
                          {pet.last_vaccine_date && (
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                              🛡️ มีประวัติวัคซีนล่าสุด
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="relative">
                        <button
                          onClick={e => { e.stopPropagation(); setActiveMenu(menuOpen ? null : pet.id) }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-all">
                          <MoreVertical size={18} />
                        </button>
                        {menuOpen && (
                          <div className="absolute right-0 top-8 bg-white border-2 border-ori-ink rounded-2xl shadow-paper z-10 overflow-hidden min-w-[150px]" onClick={e => e.stopPropagation()}>
                            <Link href={`/pets/${pet.id}`} className="flex items-center gap-2 px-4 py-3 text-sm font-bold hover:bg-gray-50 transition-all">
                              <Eye size={14} /> ดูโปรไฟล์
                            </Link>
                            <Link href={`/pets/${pet.id}/edit`} className="flex items-center gap-2 px-4 py-3 text-sm font-bold hover:bg-gray-50 transition-all border-t border-gray-100">
                              <Edit3 size={14} /> แก้ไข
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    {actModes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {actModes.map(k => {
                          const Icon = MODE_ICONS[k]
                          return (
                            <span key={k} className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs font-black text-ori-ink-l border border-gray-200">
                              <Icon size={10} /> {MODE_LABELS[k]}
                            </span>
                          )
                        })}
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Link href={`/pets/${pet.id}`} className="flex items-center gap-1 px-3 py-1.5 text-xs font-black border-2 border-ori-ink rounded-lg hover:bg-gray-50 transition-all shadow-paper-sm">
                        <Eye size={12} /> ดูสมุดสุขภาพ
                      </Link>
                      <Link href={`/pets/${pet.id}/edit`} className="flex items-center gap-1 px-3 py-1.5 text-xs font-black border-2 border-ori-ink rounded-lg hover:bg-gray-50 transition-all shadow-paper-sm">
                        <Edit3 size={12} /> แก้ไขข้อมูล
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {archived.length > 0 && (
        <div className="mt-10">
          <h2 className="font-black text-lg mb-3 flex items-center gap-2 text-ori-ink-l">
            <Archive size={18} /> โปรไฟล์ที่ซ่อนอยู่
          </h2>

          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl mb-4 flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-red-700">Ref Layer Constraint: โปรไฟล์เหล่านี้ถูกซ่อนเพราะแพ็คเกจหมดอายุ ต่ออายุเพื่อดึงข้อมูลกลับมาก่อนที่จะถูกลบถาวร</p>
          </div>

          <div className="space-y-3">
            {archived.map(pet => {
              const days = pet.delete_after ? daysUntilDelete(pet.delete_after) : null
              const urgent = days !== null && days <= 7

              return (
                <div key={pet.id} className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-4 flex items-center justify-between gap-3 opacity-70">
                  <div>
                    <p className="font-black">{pet.name}</p>
                    <p className="text-xs font-bold text-ori-ink-l">{pet.species}</p>
                  </div>
                  {days !== null && (
                    <div className={`text-xs font-black px-2 py-1 rounded-lg ${urgent ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>
                      ลบใน {days} วัน
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <Link href="/pricing" className="mt-4 flex items-center justify-center gap-2 py-3 px-6 bg-ori-ink text-white font-black rounded-2xl border-4 border-ori-ink shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5 transition-all">
            <Crown size={18} className="text-amber-400" /> ต่ออายุ Member เพื่อดึงข้อมูลกลับ <ChevronRight size={16} />
          </Link>
        </div>
      )}
    </div>
  )
}