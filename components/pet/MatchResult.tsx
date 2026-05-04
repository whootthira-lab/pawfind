'use client'
// components/pet/MatchResult.tsx — Origami style

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, BookmarkCheck, Loader2, MapPin } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

interface PetResult {
  id: string
  name: string
  breed: string
  province: string
  image_url: string
  status: string
  match_percentage?: number
}

export function MatchResultCard({ result }: { result: PetResult }) {
  const router = useRouter()
  const [isPinned, setIsPinned] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingInitial, setIsCheckingInitial] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const checkPinStatus = async () => {
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
    checkPinStatus()
  }, [supabase, result.id])

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!userId) { alert('กรุณาเข้าสู่ระบบก่อนครับ'); router.push('/login'); return }
    setIsLoading(true)
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
    finally { setIsLoading(false) }
  }

  const formatSrc = (src: string) =>
    src?.startsWith('http') ? src : `data:image/jpeg;base64,${src}`

  const statusCfg: Record<string, { label: string; color: string }> = {
    lost:     { label: 'สัตว์หาย',    color: '#D94F1E' },
    found:    { label: 'พบหลงทาง',   color: '#2D6A2D' },
    adoption: { label: 'หาบ้าน',      color: '#1A5EA8' },
  }
  const cfg = statusCfg[result.status] || { label: result.status, color: '#1A1208' }

  return (
    <div className="ori-card flex flex-col h-full group">

      {/* ── AI Match % badge ── */}
      {result.match_percentage && (
        <div className="absolute top-2.5 left-2.5 z-10 bg-ori-yellow border-2 border-ori-ink px-2.5 py-1 rounded-full font-black text-xs text-ori-ink shadow-[2px_2px_0_#A07800]">
          🤖 {result.match_percentage.toFixed(0)}%
        </div>
      )}

      {/* ── Pin button ── */}
      <motion.button
        whileTap={{ scale: .9 }}
        onClick={handleTogglePin}
        disabled={isLoading || isCheckingInitial}
        className={`absolute top-2.5 right-2.5 z-20 p-1.5 rounded-lg border-2 border-ori-ink shadow-[2px_2px_0_#1A1208] transition-colors
          ${isCheckingInitial ? 'opacity-50 bg-gray-100' : ''}
          ${isPinned ? 'bg-ori-yellow hover:bg-ori-yellow-l' : 'bg-white hover:bg-ori-cream'}`}
      >
        {isLoading
          ? <Loader2 size={18} className="animate-spin" />
          : isPinned ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
      </motion.button>

      {/* ── Image ── */}
      <div className="relative h-48 overflow-hidden border-b-2 border-ori-ink shrink-0"
        style={{ background: 'linear-gradient(135deg, #FDE8ED, #E4F0E5)' }}>
        <img
          src={formatSrc(result.image_url)}
          alt={result.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Status bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: cfg.color }} />
        <div className="absolute bottom-2 left-2 text-xs font-black px-2 py-0.5 rounded-full border-2 border-ori-ink bg-white"
          style={{ color: cfg.color }}>
          {cfg.label}
        </div>
      </div>

      {/* ── Info ── */}
      <div className="p-4 flex flex-col gap-2 flex-grow">
        <h3 className="font-display font-black text-xl text-ori-ink truncate">
          {result.name || 'ไม่ทราบชื่อ'}
        </h3>
        <p className="text-sm text-ori-ink-l font-medium truncate">
          {result.breed || 'ไม่ระบุสายพันธุ์'}
        </p>
        <div className="flex items-center gap-1.5 text-sm font-bold text-ori-ink-m bg-ori-cream border border-ori-cream-d rounded-lg px-3 py-1.5 w-fit">
          <MapPin size={14} />
          <span className="truncate">{result.province}</span>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="px-4 pb-4">
        <button
          onClick={() => router.push(`/pet/${result.id}`)}
          className="ori-btn ori-btn-orange w-full text-sm">
          ดูรายละเอียด →
        </button>
      </div>
    </div>
  )
}
