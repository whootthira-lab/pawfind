'use client'
// components/pet/MatchResult.tsx — พร้อม Delete Reason Modal + Return tracking

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, BookmarkCheck, Loader2, MapPin, Edit3, Trash2, ArrowRight, X } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  trackOwnerReturn,
  trackDeleteReason,
  DELETE_REASON_OPTIONS,
  type DeleteReason,
} from '@/lib/analytics'

interface PetResult {
  id:               string
  name:             string
  breed:            string
  province:         string
  image_url:        string
  status:           string
  user_id?:         string
  match_percentage?: number
}

export function MatchResultCard({ result }: { result: PetResult }) {
  const router = useRouter()

  const [isPinned,          setIsPinned]          = useState(false)
  const [isLoadingPin,      setIsLoadingPin]       = useState(false)
  const [isNavigating,      setIsNavigating]       = useState(false)
  const [isDeleting,        setIsDeleting]         = useState(false)
  const [isCheckingInitial, setIsCheckingInitial]  = useState(true)
  const [userId,            setUserId]             = useState<string | null>(null)

  // ── Delete Reason Modal state ─────────────────────────────────
  const [showDeleteModal,   setShowDeleteModal]    = useState(false)
  const [selectedReason,    setSelectedReason]     = useState<DeleteReason | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
        const { data } = await supabase
          .from('saved_pets').select('id')
          .eq('user_id', session.user.id).eq('pet_id', result.id).single()
        if (data) setIsPinned(true)

        // ── track return frequency ถ้าเป็นเจ้าของ ──────────────
        if (session.user.id === result.user_id) {
          trackOwnerReturn(result.id)
        }
      }
      setIsCheckingInitial(false)
    }
    check()
  }, [supabase, result.id, result.user_id])

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

  // ── Step 1: เปิด modal ถามเหตุผลก่อน ─────────────────────────
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setSelectedReason(null)
    setShowDeleteModal(true)
  }

  // ── Step 2: ยืนยันลบหลังเลือกเหตุผล ─────────────────────────
  const handleConfirmDelete = async () => {
    if (!selectedReason) return
    setIsDeleting(true)
    try {
      // track ก่อน delete จริง (เผื่อ network fail ยังมีข้อมูล)
      trackDeleteReason(result.id, selectedReason)

      const res = await fetch(`/api/pets/${result.id}`, { method: 'DELETE' })
      if (res.ok) {
        setShowDeleteModal(false)
        const opt = DELETE_REASON_OPTIONS.find(o => o.value === selectedReason)
        if (opt?.isSuccess) {
          alert('🎉 ยินดีด้วย! ดีใจที่น้องได้กลับบ้านหรือมีเจ้าของติดต่อมาแล้ว')
        } else {
          alert('ลบประกาศเรียบร้อยแล้ว')
        }
        window.location.reload()
      } else {
        throw new Error('Delete failed')
      }
    } catch {
      alert('ไม่สามารถลบได้ กรุณาลองใหม่')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatSrc = (src: string) =>
    src?.startsWith('http') ? src : `data:image/jpeg;base64,${src}`

  const statusCfg: Record<string, { label: string; color: string }> = {
    lost:     { label: '🚨 ประกาศตามหาน้อง', color: '#D94F1E' },
    found:    { label: '👀 พบน้องหลงทาง',    color: '#2D6A2D' },
    adoption: { label: '💖 หาบ้านให้น้อง',   color: '#1A5EA8' },
  }
  const cfg    = statusCfg[result.status] || { label: result.status, color: '#1A1208' }
  const isOwner = userId === result.user_id

  return (
    <>
      <div className="ori-card flex flex-col h-full group relative">

        {/* AI Match % */}
        {result.match_percentage && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-ori-yellow border-2 border-ori-ink px-2.5 py-1 rounded-full font-black text-xs text-ori-ink shadow-[2px_2px_0_#A07800]">
            🤖 {result.match_percentage.toFixed(0)}%
          </div>
        )}

        {/* Pin Button */}
        <motion.button whileTap={{ scale: .9 }} onClick={handleTogglePin}
          disabled={isLoadingPin || isCheckingInitial}
          className={`absolute top-2.5 right-2.5 z-20 p-1.5 rounded-lg border-2 border-ori-ink shadow-[2px_2px_0_#1A1208] transition-colors
            ${isCheckingInitial ? 'opacity-50 bg-gray-100' : ''}
            ${isPinned ? 'bg-ori-yellow hover:bg-ori-yellow-l' : 'bg-white hover:bg-ori-cream'}`}>
          {isLoadingPin ? <Loader2 size={18} className="animate-spin" /> : isPinned ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </motion.button>

        {/* Image */}
        <div className="relative h-48 overflow-hidden border-b-2 border-ori-ink shrink-0"
          style={{ background: 'linear-gradient(135deg, #FDE8ED, #E4F0E5)' }}>
          <img src={formatSrc(result.image_url)} alt={result.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: cfg.color }} />
          <div className="absolute bottom-2 left-2 text-xs font-black px-2 py-0.5 rounded-full border-2 border-ori-ink bg-white"
            style={{ color: cfg.color }}>{cfg.label}</div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-grow flex-col gap-2">
          <h3 className="font-display font-black text-xl text-ori-ink truncate">{result.name || 'ไม่ทราบชื่อ'}</h3>
          <p className="text-sm text-ori-ink-l font-medium truncate">{result.breed || 'ไม่ระบุสายพันธุ์'}</p>
          <div className="flex items-start gap-1.5 text-sm font-bold text-ori-ink-m bg-ori-cream border border-ori-cream-d rounded-lg px-3 py-1.5 w-full">
            <MapPin size={14} className="shrink-0 mt-0.5" />
            <span className="line-clamp-2">{result.province}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="px-4 pb-4 space-y-2">
          <button
            onClick={() => { setIsNavigating(true); router.push(`/pet/${result.id}`) }}
            disabled={isNavigating}
            className="ori-btn ori-btn-orange w-full text-sm flex items-center justify-center gap-2">
            {isNavigating ? <Loader2 size={16} className="animate-spin" /> : null}
            {isNavigating ? 'กำลังโหลด...' : 'ดูรายละเอียด'} <ArrowRight size={16} />
          </button>

          {isOwner && (
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed border-ori-ink/20">
              <Link href={`/pet/${result.id}/edit`}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-ori-ink bg-blue-50 text-blue-700 text-xs font-black hover:bg-blue-100 transition-colors">
                <Edit3 size={14} /> แก้ไข
              </Link>
              <button onClick={handleDeleteClick} disabled={isDeleting}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-ori-ink bg-red-50 text-red-600 text-xs font-black hover:bg-red-100 transition-colors">
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {isDeleting ? 'ลบ...' : 'ลบ'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          DELETE REASON MODAL
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: .9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: .9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white border-4 border-ori-ink rounded-2xl shadow-[8px_8px_0_#1A1208] w-full max-w-sm p-6 relative"
            >
              {/* Close */}
              <button onClick={() => setShowDeleteModal(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>

              <div className="text-2xl mb-1">🗑️</div>
              <h3 className="font-display font-black text-lg mb-1">ลบประกาศนี้?</h3>
              <p className="text-sm text-ori-ink-l mb-4">
                ช่วยบอกเหตุผลด้วยนะครับ ข้อมูลนี้ช่วยให้แพลตฟอร์มดีขึ้น
              </p>

              {/* Reason options */}
              <div className="flex flex-col gap-2 mb-5">
                {DELETE_REASON_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => setSelectedReason(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all
                      ${selectedReason === opt.value
                        ? 'border-ori-orange bg-ori-orange text-white shadow-[3px_3px_0_#A03010]'
                        : 'border-ori-ink bg-white hover:bg-ori-cream'
                      }`}
                  >
                    {opt.label}
                    {opt.isSuccess && selectedReason === opt.value && (
                      <span className="ml-2 text-xs opacity-80">← ขอบคุณที่แจ้งให้ทราบ!</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Confirm / Cancel */}
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-ori-ink bg-gray-50 font-bold text-sm hover:bg-gray-100 transition-colors">
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={!selectedReason || isDeleting}
                  className="flex-1 py-3 rounded-xl border-2 border-ori-ink bg-red-500 text-white font-black text-sm hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
