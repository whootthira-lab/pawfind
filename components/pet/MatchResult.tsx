'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, BookmarkCheck, Loader2, MapPin, Edit3, Trash2, ArrowRight } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PetResult {
  id: string
  name: string
  breed: string
  province: string
  image_url: string
  status: string
  user_id?: string // เพิ่มเพื่อตรวจสอบความเป็นเจ้าของ
  match_percentage?: number
}

export function MatchResultCard({ result }: { result: PetResult }) {
  const router = useRouter()
  const [isPinned, setIsPinned] = useState(false)
  const [isLoadingPin, setIsLoadingPin] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false) // 💡 สำหรับปุ่มดูรายละเอียด
  const [isDeleting, setIsDeleting] = useState(false)    // 💡 สำหรับปุ่มลบ
  const [isCheckingInitial, setIsCheckingInitial] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ตรวจสอบสถานะ Pin และ User ID
  useEffect(() => {
    const checkStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
        const { data } = await supabase
          .from('saved_pets').select('id')
          .eq('user_id', session.user.id).eq('pet_id', result.id).single()
        if (data) setIsPinned(true)
      }
      setIsCheckingInitial(false)
    }
    checkStatus()
  }, [supabase, result.id])

  // ฟังก์ชันสลับสถานะ Pin (Bookmark)
  const handleTogglePin = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!userId) { alert('กรุณาเข้าสู่ระบบก่อนครับ'); router.push('/login'); return }
    setIsLoadingPin(true)
    try {
      if (isPinned) {
        await fetch(`/api/saved-pets?petId=${result.id}`, { method: 'DELETE' })
        setIsPinned(false)
      } else {
        await fetch('/api/saved-pets', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ petId: result.id }),
        })
        setIsPinned(true)
      }
    } catch { alert('เกิดข้อผิดพลาด กรุณาลองใหม่') }
    finally { setIsLoadingPin(false) }
  }

  // ฟังก์ชันลบประกาศ
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!confirm("🚨 ยืนยันการลบประกาศนี้? ข้อมูลจะหายถาวรไม่สามารถกู้คืนได้")) return
    
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/pets/${result.id}`, { method: 'DELETE' })
      if (res.ok) {
        alert("ลบประกาศเรียบร้อยแล้วครับ")
        window.location.reload() 
      } else {
        throw new Error()
      }
    } catch {
      alert("ไม่สามารถลบได้ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsDeleting(false)
    }
  }

  const formatSrc = (src: string) =>
    src?.startsWith('http') ? src : `data:image/jpeg;base64,${src}`

  const statusCfg: Record<string, { label: string; color: string }> = {
    lost:     { label: 'สัตว์หาย',    color: '#D94F1E' },
    found:    { label: 'พบหลงทาง',   color: '#2D6A2D' },
    adoption: { label: 'หาบ้าน',      color: '#1A5EA8' },
  }
  const cfg = statusCfg[result.status] || { label: result.status, color: '#1A1208' }

  // ตรวจสอบว่าเป็นเจ้าของประกาศหรือไม่
  const isOwner = userId === result.user_id

  return (
    <div className="ori-card flex flex-col h-full group relative">

      {/* ── AI Match % ── */}
      {result.match_percentage && (
        <div className="absolute top-2.5 left-2.5 z-10 bg-ori-yellow border-2 border-ori-ink px-2.5 py-1 rounded-full font-black text-xs text-ori-ink shadow-[2px_2px_0_#A07800]">
          🤖 {result.match_percentage.toFixed(0)}%
        </div>
      )}

      {/* ── Pin Button ── */}
      <motion.button
        whileTap={{ scale: .9 }}
        onClick={handleTogglePin}
        disabled={isLoadingPin || isCheckingInitial}
        className={`absolute top-2.5 right-2.5 z-20 p-1.5 rounded-lg border-2 border-ori-ink shadow-[2px_2px_0_#1A1208] transition-colors
          ${isCheckingInitial ? 'opacity-50 bg-gray-100' : ''}
          ${isPinned ? 'bg-ori-yellow hover:bg-ori-yellow-l' : 'bg-white hover:bg-ori-cream'}`}
      >
        {isLoadingPin ? <Loader2 size={18} className="animate-spin" /> : isPinned ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
      </motion.button>

      {/* ── Image Section ── */}
      <div className="relative h-48 overflow-hidden border-b-2 border-ori-ink shrink-0" style={{ background: 'linear-gradient(135deg, #FDE8ED, #E4F0E5)' }}>
        <img src={formatSrc(result.image_url)} alt={result.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: cfg.color }} />
        <div className="absolute bottom-2 left-2 text-xs font-black px-2 py-0.5 rounded-full border-2 border-ori-ink bg-white" style={{ color: cfg.color }}>
          {cfg.label}
        </div>
      </div>

      {/* ── Info Section ── */}
      <div className="p-4 flex flex-grow flex-col gap-2">
        <h3 className="font-display font-black text-xl text-ori-ink truncate">{result.name || 'ไม่ทราบชื่อ'}</h3>
        <p className="text-sm text-ori-ink-l font-medium truncate">{result.breed || 'ไม่ระบุสายพันธุ์'}</p>
        <div className="flex items-center gap-1.5 text-sm font-bold text-ori-ink-m bg-ori-cream border border-ori-cream-d rounded-lg px-3 py-1.5 w-fit">
          <MapPin size={14} />
          <span className="truncate">{result.province}</span>
        </div>
      </div>

      {/* ── Action Buttons (CTA) ── */}
      <div className="px-4 pb-4 space-y-2">
        
        {/* 1. ปุ่มดูรายละเอียด (พร้อม Spinner) */}
        <button
          onClick={() => { setIsNavigating(true); router.push(`/pet/${result.id}`) }}
          disabled={isNavigating}
          className="ori-btn ori-btn-orange w-full text-sm flex items-center justify-center gap-2"
        >
          {isNavigating ? <Loader2 size={16} className="animate-spin" /> : null}
          {isNavigating ? 'กำลังนำทาง...' : 'ดูรายละเอียด'} <ArrowRight size={16} />
        </button>

        {/* 2. ปุ่มจัดการ (แก้ไข/ลบ) - จะขึ้นเฉพาะเจ้าของประกาศเท่านั้น */}
        {isOwner && (
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed border-ori-ink/20">
            <Link 
              href={`/pet/edit/${result.id}`}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-ori-ink bg-blue-50 text-blue-700 text-xs font-black hover:bg-blue-100 transition-colors"
            >
              <Edit3 size={14} /> แก้ไข
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-ori-ink bg-red-50 text-red-600 text-xs font-black hover:bg-red-100 transition-colors"
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {isDeleting ? 'ลบ...' : 'ลบ'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}