'use client'
// app/(main)/pets/[id]/page.tsx

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient }          from '@supabase/ssr'
import { useParams, useRouter }         from 'next/navigation'
import Link                             from 'next/link'
import {
  PawPrint, Heart, Home, Trophy, Search,
  QrCode, Shield, Edit3, Share2, Phone,
  Calendar, Weight, Dna, AlertCircle,
  CheckCircle2, Loader2, ChevronLeft
} from 'lucide-react'

const MODE_BADGE: Record<string, { label: string; color: string; icon: any }> = {
  mode_lost:     { label: 'ประกาศหาย',     color: 'bg-blue-100 text-blue-700 border-blue-300',   icon: Search },
  mode_mating:   { label: 'หาคู่ให้น้อง',  color: 'bg-pink-100 text-pink-700 border-pink-300',   icon: Heart  },
  mode_adoption: { label: 'หาบ้านให้น้อง', color: 'bg-green-100 text-green-700 border-green-300', icon: Home   },
  mode_showcase: { label: 'โชว์โปรไฟล์',   color: 'bg-amber-100 text-amber-700 border-amber-300', icon: Trophy },
}

export default function PetProfilePage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [pet,         setPet]         = useState<any>(null)
  const [images,      setImages]      = useState<any[]>([])
  const [events,      setEvents]      = useState<any[]>([])
  const [owner,       setOwner]       = useState<any>(null)
  const [isOwner,     setIsOwner]     = useState(false)
  const [activeImg,   setActiveImg]   = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [qrLoading,   setQrLoading]   = useState(false)
  const [qrUrl,       setQrUrl]       = useState<string | null>(null)
  const [showQr,      setShowQr]      = useState(false)
  const [shared,      setShared]      = useState(false)
  const [justCreated, setJustCreated] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setJustCreated(params.get('created') === 'true')
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()

      // Pet data
      const { data: petData } = await supabase
        .from('pets')
        .select('*')
        .eq('id', id)
        .single()

      if (!petData) { router.push('/'); return }
      setPet(petData)
      setIsOwner(session?.user?.id === petData.user_id)
      setQrUrl(petData.qr_code_url || null)

      // Images
      const { data: imgData } = await supabase
        .from('pet_images')
        .select('storage_url, is_primary')
        .eq('pet_id', id)
        .order('is_primary', { ascending: false })
      setImages(imgData || [])

      // Health events
      const { data: evData } = await supabase
        .from('pet_health_events')
        .select('*')
        .eq('pet_id', id)
        .order('event_date', { ascending: false })
        .limit(10)
      setEvents(evData || [])

      // Owner profile
      const { data: ownerData } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, province')
        .eq('id', petData.user_id)
        .single()
      setOwner(ownerData)

      setLoading(false)
    }
    load()
  }, [id])

  const activeModes = pet
    ? Object.keys(MODE_BADGE).filter(k => pet[k])
    : []

  const generateQR = async () => {
    setQrLoading(true)
    const res  = await fetch('/api/pets/qr', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ petId: id }),
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

  const EVENT_TYPE_LABEL: Record<string, string> = {
    vaccine:         '💉 วัคซีน',
    deworming:       '🐛 ถ่ายพยาธิ',
    flea_treatment:  '🦟 หยอดหมัด/เห็บ',
    checkup:         '🏥 ตรวจสุขภาพ',
    treatment:       '💊 รักษาโรค',
    award:           '🏆 รางวัล',
    other:           '📝 อื่นๆ',
  }

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 size={48} className="animate-spin text-ori-orange" />
    </div>
  )

  if (!pet) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 mb-20">

      {/* Just created toast */}
      {justCreated && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-400
          rounded-2xl flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          <p className="font-black text-green-800">
            สร้างโปรไฟล์น้องเรียบร้อยแล้ว! 🐾
          </p>
        </div>
      )}

      {/* Back */}
      <Link href="/dashboard/pets"
        className="inline-flex items-center gap-1 text-sm font-black
          text-ori-ink-l hover:text-ori-ink mb-4 transition-colors">
        <ChevronLeft size={16} /> จัดการโปรไฟล์น้อง
      </Link>

      {/* ── Hero ── */}
      <div className="bg-white border-4 border-ori-ink rounded-3xl
        overflow-hidden shadow-paper mb-6">

        {/* Images */}
        {images.length > 0 ? (
          <div>
            <div className="aspect-square w-full bg-gray-100 overflow-hidden">
              <img
                src={images[activeImg]?.storage_url}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2
                      shrink-0 transition-all ${
                      i === activeImg
                        ? 'border-ori-ink'
                        : 'border-gray-200 opacity-60 hover:opacity-100'
                    }`}>
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

        {/* Info */}
        <div className="p-6">
          {/* Name + modes */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-3xl font-black">{pet.name}</h1>
              <p className="text-ori-ink-l font-bold">
                {[pet.species, pet.breed].filter(Boolean).join(' · ')}
              </p>
            </div>
            {isOwner && (
              <Link href={`/pets/${id}/edit`}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-black
                  border-2 border-ori-ink rounded-xl hover:bg-gray-50 transition-all">
                <Edit3 size={14} /> แก้ไข
              </Link>
            )}
          </div>

          {/* Mode badges */}
          {activeModes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeModes.map(k => {
                const m = MODE_BADGE[k]
                return (
                  <span key={k}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full
                      text-xs font-black border ${m.color}`}>
                    <m.icon size={12} /> {m.label}
                  </span>
                )
              })}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {pet.gender && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-ori-ink-l">เพศ</p>
                <p className="font-black text-sm mt-0.5">
                  {pet.gender === 'male' ? '♂ ผู้' : pet.gender === 'female' ? '♀ เมีย' : '❓'}
                </p>
              </div>
            )}
            {pet.birthday && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-ori-ink-l">วันเกิด</p>
                <p className="font-black text-sm mt-0.5">
                  {new Date(pet.birthday).toLocaleDateString('th-TH', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </p>
              </div>
            )}
            {pet.weight && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-ori-ink-l">น้ำหนัก</p>
                <p className="font-black text-sm mt-0.5">{pet.weight} กก.</p>
              </div>
            )}
            {pet.microchip_id && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-ori-ink-l">ไมโครชิป</p>
                <p className="font-black text-sm mt-0.5 truncate">{pet.microchip_id}</p>
              </div>
            )}
          </div>

          {/* AI Caption */}
          {pet.ai_caption && (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 mb-4">
              <p className="text-xs font-black text-purple-600 mb-1">🤖 AI Caption</p>
              <p className="text-sm font-bold text-ori-ink">{pet.ai_caption}</p>
            </div>
          )}

          {/* Special marks */}
          {pet.special_marks && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 mb-4">
              <p className="text-xs font-black text-amber-600 mb-1">⚡ ตำหนิพิเศษ</p>
              <p className="text-sm font-bold">{pet.special_marks}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-black
                bg-white border-2 border-ori-ink rounded-xl hover:bg-gray-50
                transition-all shadow-paper-sm">
              <Share2 size={14} />
              {shared ? 'คัดลอกแล้ว!' : 'แชร์'}
            </button>

            {isOwner && (
              <button
                onClick={qrUrl ? () => setShowQr(true) : generateQR}
                disabled={qrLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-black
                  bg-white border-2 border-ori-ink rounded-xl hover:bg-gray-50
                  transition-all shadow-paper-sm disabled:opacity-50">
                {qrLoading
                  ? <Loader2 size={14} className="animate-spin" />
                  : <QrCode size={14} />
                }
                QR Code ปลอกคอ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── QR Modal ── */}
      {showQr && qrUrl && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center
          justify-center p-4" onClick={() => setShowQr(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-xs w-full text-center
            border-4 border-ori-ink shadow-paper"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-lg mb-4">QR Code ปลอกคอ</h3>
            <img src={qrUrl} alt="QR" className="w-full rounded-xl mb-4" />
            <p className="text-xs font-bold text-ori-ink-l mb-4">
              พิมพ์แล้วติดปลอกคอน้อง<br />
              คนเจอสแกนแล้วเห็นโปรไฟล์น้องทันที
            </p>
            <a href={qrUrl} download={`qr-${pet.name}.png`}
              className="inline-block px-6 py-2 bg-ori-ink text-white
                font-black text-sm rounded-xl border-2 border-ori-ink
                hover:bg-gray-800 transition-all">
              ดาวน์โหลด
            </a>
          </div>
        </div>
      )}

      {/* ── Owner info ── */}
      {owner && !isOwner && activeModes.length > 0 && (
        <div className="bg-white border-4 border-ori-ink rounded-3xl p-6
          shadow-paper mb-6">
          <h2 className="font-black text-lg mb-4">👤 ข้อมูลเจ้าของ</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-ori-orange text-white
              flex items-center justify-center font-black text-lg overflow-hidden">
              {owner.avatar_url
                ? <img src={owner.avatar_url} alt="" className="w-full h-full object-cover" />
                : owner.display_name?.[0] || '?'}
            </div>
            <div>
              <p className="font-black">{owner.display_name || 'เจ้าของ'}</p>
              {owner.province && (
                <p className="text-sm font-bold text-ori-ink-l">📍 {owner.province}</p>
              )}
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-xl border text-xs
            font-bold text-ori-ink-l flex items-center gap-2">
            <Shield size={12} className="shrink-0" />
            ข้อมูลติดต่อจะแสดงหลังจากยืนยันตัวตนในระบบ
          </div>
        </div>
      )}

      {/* ── Family ── */}
      {(pet.father_name || pet.mother_name) && (
        <div className="bg-white border-4 border-ori-ink rounded-3xl p-6
          shadow-paper mb-6">
          <h2 className="font-black text-lg mb-4">🧬 ประวัติพ่อ-แม่</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {pet.father_name && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-xs font-black text-blue-600">พ่อ</p>
                <p className="font-black mt-0.5">{pet.father_name}</p>
              </div>
            )}
            {pet.mother_name && (
              <div className="p-3 bg-pink-50 rounded-xl border border-pink-200">
                <p className="text-xs font-black text-pink-600">แม่</p>
                <p className="font-black mt-0.5">{pet.mother_name}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Health Timeline ── */}
      {(isOwner || events.length > 0) && (
        <div className="bg-white border-4 border-ori-ink rounded-3xl p-6
          shadow-paper">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-lg">📋 ประวัติสุขภาพ</h2>
            {isOwner && (
              <p className="text-xs font-bold text-ori-ink-l">
                พิมพ์ใน Chatbot เพื่อบันทึก
              </p>
            )}
          </div>

          {events.length === 0 ? (
            <div className="text-center py-8 text-ori-ink-l">
              <p className="font-bold text-sm">ยังไม่มีประวัติสุขภาพ</p>
              {isOwner && (
                <p className="text-xs mt-1">
                  พิมพ์ใน Chatbot ว่า "วันนี้ฉีดวัคซีน{pet.name}"
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {events.map(ev => (
                <div key={ev.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-white border-2
                    border-gray-200 flex items-center justify-center
                    text-sm shrink-0 mt-0.5">
                    {EVENT_TYPE_LABEL[ev.event_type]?.split(' ')[0] || '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm">{ev.title}</p>
                    {ev.description && (
                      <p className="text-xs font-bold text-ori-ink-l mt-0.5">
                        {ev.description}
                      </p>
                    )}
                  </div>
                  <p className="text-xs font-bold text-ori-ink-l shrink-0">
                    {new Date(ev.event_date).toLocaleDateString('th-TH', {
                      day: 'numeric', month: 'short',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
