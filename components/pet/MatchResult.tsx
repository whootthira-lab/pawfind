'use client'
// components/pet/MatchResult.tsx — เพิ่มปุ่มแชร์ขยายมิติโซเชียล (Facebook, Threads, X) พร้อมผูกชุดข้อมูล OG (ชื่อ, โหมด, สายพันธุ์, จังหวัด, เพศ) ครบถ้วน 100%

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, BookmarkCheck, Loader2, MapPin, Edit3, Trash2, ArrowRight, X, Share2, MessageSquare } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  trackOwnerReturn,
  trackDeleteReason,
  DELETE_REASON_OPTIONS,
  type DeleteReason,
} from '@/lib/analytics'

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

interface PetResult {
  id:               string
  name:             string
  breed:            string
  province:         string
  image_url:        string
  status:           string
  gender?:          string // ── 🟢 เพิ่มการรับฟิลด์เพศเพื่อนำมาประกอบชุดข้อมูล OG
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

  // ── 🟢 State สำหรับเปิด-ปิดแผงเลือกช่องทางการแชร์ ─────────────────
  const [showShareModal,    setShowShareModal]     = useState(false)

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

  const [loadingResolve, setLoadingResolve] = useState<boolean>(false)

  const handleResolveCase = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    let checkText = 'เจอน้องเรียบร้อยแล้วใช่ไหมคะ?'
    let titleText = '🎉 พบน้องแล้ว!'
    let descText = 'ยินดีด้วยค่ะ น้องได้กลับบ้านอย่างปลอดภัยเรียบร้อยแล้ว'
    
    if (result.status === 'adoption') {
      checkText = 'น้องได้บ้านที่อบอุ่นใหม่เรียบร้อยแล้วใช่ไหมคะ?'
      titleText = '🏡 น้องได้บ้านแล้ว!'
      descText = 'ยินดีด้วยค่ะ น้องได้รับอุปการะสู่บ้านใหม่ที่อบอุ่นเรียบร้อยแล้ว'
    }
    if (result.status === 'mating') {
      checkText = 'น้องจับคู่แมตช์สำเร็จเรียบร้อยแล้วใช่ไหมคะ?'
      titleText = '❤️ น้องได้คู่แล้ว!'
      descText = 'ยินดีด้วยค่ะ น้องจับคู่แมตช์และผสมพันธุ์สำเร็จเรียบร้อยแล้ว'
    }

    if (!window.confirm(`⚠️ ยืนยันปิดประกาศสถานะเคสนี้สำเร็จ: ${checkText}`)) return
    
    setLoadingResolve(true)
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
        .eq('id', result.id)

      if (error) throw error

      await supabase
        .from('pet_health_events')
        .insert({
          pet_id: result.id,
          event_type: 'other',
          title: titleText,
          description: descText,
          event_date: new Date().toISOString().split('T')[0]
        })

      alert('🎉 ปิดเคสสำเร็จเรียบร้อยแล้วค่ะ!')
      window.location.reload()
    } catch (err: any) {
      alert(`ปิดเคสไม่สำเร็จ: ${err.message}`)
    } finally {
      setLoadingResolve(false)
    }
  }

  const formatSrc = (src: string) => {
    if (!src) return ''
    if (src.startsWith('http') || src.startsWith('data:')) return src
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ajjvtazuncdtxjwcplcv.supabase.co'
    return `${supabaseUrl}/storage/v1/object/public/pet-images/${src}`
  }

  const determineStatus = (): string => {
    const validStatuses = ['lost', 'found', 'adoption', 'mating', 'showcase']
    if (result.status && validStatuses.includes(result.status)) {
      return result.status
    }
    const r = result as any
    if (r.mode_lost) return 'lost'
    if (r.mode_mating) return 'mating'
    if (r.mode_adoption) return 'adoption'
    if (r.mode_showcase) return 'showcase'
    return result.status || 'showcase'
  }

  const currentStatus = determineStatus()

  const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
    lost:     { label: '🚨 ประกาศตามหาน้อง', color: '#D94F1E', bg: '#FFF1EC' },
    found:    { label: '👀 พบน้องหลงทาง',    color: '#2D6A2D', bg: '#EBF5EB' },
    adoption: { label: '💖 หาบ้านให้น้อง',   color: '#1A5EA8', bg: '#EEF6FF' },
    mating:   { label: '❤️ หาคู่ให้น้อง',     color: '#C2185B', bg: '#FCE4EC' },
    showcase: { label: '✨ โชว์โปรไฟล์น้อง',  color: '#A07800', bg: '#FFFDE7' },
  }
  
  const cfg = statusCfg[currentStatus] || { label: '🐾 สัตว์เลี้ยงคอมมูนิตี้', color: '#1A1208', bg: '#FFFFFF' }
  const isOwner = userId === result.user_id

  // ── 🟢 ฟังก์ชันจัดเรียงเนื้อหาสำหรับแชร์ไปโซเชียลมีเดียพร้อมชุดข้อมูล OG เต็มอัตรา ──
  const getSharePayload = () => {
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://pobpet.com'}/pet/${result.id}`
    const genderText = result.gender === 'male' ? 'เพศผู้ ♂' : result.gender === 'female' ? 'เพศเมีย ♀' : 'ไม่ระบุเพศ'
    
    // ร้อยเรียงชุดข้อความกระชับความกว้าง ดึงข้อมูลครบ (ชื่อ, โหมด, สายพันธุ์, จังหวัด, เพศ)
    const shareTitle = `🐾 PobPet: ${cfg.label} -> น้อง ${result.name || 'ไม่ระบุชื่อ'}`
    const shareText = `📌 ข้อมูลน้องสี่ขา\n• ชื่อ: ${result.name || 'ไม่ระบุชื่อ'}\n• โหมด: ${cfg.label}\n• สายพันธุ์: ${result.breed || 'ไม่ระบุ'}\n• พิกัดจังหวัด: ${result.province}\n• เพศ: ${genderText}\n\nช่วยพาน้องกลับบ้านและส่งต่อความอบอุ่นด้วยพลังชุมชนด่านขุนทดกันค่ะ! ❤️`
    
    return { url: shareUrl, title: shareTitle, text: shareText }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setSelectedReason(null)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedReason) return
    setIsDeleting(true)
    try {
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

  return (
    <>
      <div className="ori-card flex flex-col h-full group relative" style={{ backgroundColor: cfg.bg, overflow: 'visible' }}>
        <CommentBadge petId={result.id} comments={(result as any).comments} />

        {/* AI Match % */}
        {result.match_percentage && (
          <div className="absolute top-2.5 left-2.5 z-20 bg-ori-yellow border-2 border-ori-ink px-2.5 py-1 rounded-full font-black text-xs text-ori-ink shadow-[2px_2px_0_#A07800]">
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
        <div className="relative w-full pt-[100%] overflow-hidden border-b-2 border-ori-ink shrink-0 block rounded-t-ori"
          style={{ background: 'linear-gradient(135deg, #FDE8ED, #E4F0E5)' }}>
          <img src={formatSrc(result.image_url)} alt={result.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          
          <div className="absolute bottom-0 left-0 right-0 h-1 z-10" style={{ background: cfg.color }} />
          
          <div className="absolute bottom-2 left-2 z-10 text-xs font-black px-2.5 py-1 rounded-full border-2 border-ori-ink bg-white shadow-[2px_2px_0_rgba(0,0,0,1)]"
            style={{ color: cfg.color }}>{cfg.label}</div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-grow flex-col gap-2 bg-white text-left">
          <h3 className="font-display font-black text-xl text-ori-ink truncate">{result.name || 'ไม่ทราบชื่อ'}</h3>
          <p className="text-sm text-ori-ink-l font-medium truncate">{result.breed || 'ไม่ระบุสายพันธุ์'}</p>
          <div className="flex items-start gap-1.5 text-sm font-bold text-ori-ink-m bg-ori-cream border border-ori-cream-d rounded-lg px-3 py-1.5 w-full">
            <MapPin size={14} className="shrink-0 mt-0.5" />
            <span className="line-clamp-2">{result.province}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="px-4 pb-4 space-y-2 bg-white">
          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={() => { setIsNavigating(true); router.push(`/pet/${result.id}`) }}
              disabled={isNavigating}
              className="bg-ori-orange text-white hover:bg-ori-orange-d border-2 border-black py-2.5 rounded-xl text-[11px] font-black text-center flex items-center justify-center gap-1 shadow-paper-sm transition-transform active:scale-95 col-span-2"
            >
              {isNavigating ? <Loader2 size={12} className="animate-spin" strokeWidth={3} /> : null}
              ดูรายละเอียด
            </button>

            <button
              onClick={() => { router.push(`/pets/${result.id}?tab=health`) }}
              className="bg-white text-black hover:bg-gray-50 border-2 border-black py-2.5 rounded-xl text-[11px] font-black text-center flex items-center justify-center gap-1 shadow-paper-sm transition-transform active:scale-95 col-span-2"
            >
              🏥 สมุดสุขภาพ
            </button>

            {/* ── 🟢 ปุ่มเปิดโมดอลเลือกช่องทางการแชร์ไปยังโซเชียลมีเดีย ── */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowShareModal(true); }}
              title="เลือกแชร์ประกาศไปยังโซเชียลมีเดีย"
              className="ori-btn bg-white border-2 border-black p-0 rounded-xl flex items-center justify-center shadow-paper-sm hover:bg-gray-50 transition-all text-black active:translate-y-0 col-span-1"
            >
              <Share2 size={16} strokeWidth={2.5} />
            </button>
          </div>

          <button
            onClick={() => { router.push('/profile?tab=pets') }}
            className="w-full bg-wagashi-matcha text-black hover:bg-wagashi-matcha/80 border-2 border-black py-2 rounded-xl text-[11px] font-black text-center block shadow-paper-sm transition-transform active:scale-95"
          >
            📋 ประวัติสุขภาพสัตว์เลี้ยง
          </button>

          {isOwner && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link href={`/pet/${result.id}/edit`}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-ori-ink bg-blue-50 text-blue-700 text-xs font-black hover:bg-blue-100 transition-colors shadow-paper-sm">
                <Edit3 size={14} /> แก้ไข
              </Link>
              <button onClick={handleDeleteClick} disabled={isDeleting}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-ori-ink bg-red-50 text-red-600 text-xs font-black hover:bg-red-100 transition-colors shadow-paper-sm">
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {isDeleting ? 'ลบ...' : 'ลบ'}
              </button>
            </div>
          )}

          {isOwner && (currentStatus === 'lost' || currentStatus === 'mating' || currentStatus === 'adoption' || currentStatus === 'showcase') && (
            <button
              onClick={handleResolveCase}
              disabled={loadingResolve}
              className={`w-full py-2.5 rounded-xl border-2 border-black font-black text-xs flex items-center justify-center gap-1.5 shadow-paper-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 text-white mt-1
                ${currentStatus === 'lost' ? 'bg-[#2D6A2D] hover:bg-[#3E803E]' : ''}
                ${currentStatus === 'mating' ? 'bg-[#C2185B] hover:bg-[#D81B60]' : ''}
                ${currentStatus === 'adoption' ? 'bg-[#1A5EA8] hover:bg-[#1E71C9]' : ''}
                ${currentStatus === 'showcase' ? 'bg-[#A07800] hover:bg-[#B38F1B]' : ''}
              `}
            >
              {loadingResolve ? <Loader2 className="animate-spin" size={12}/> : null}
              {loadingResolve ? 'กำลังบันทึก...' : currentStatus === 'lost' ? 'พบน้องแล้ว 🚨' : currentStatus === 'mating' ? 'น้องได้คู่แล้ว ❤️' : currentStatus === 'adoption' ? 'น้องได้บ้านแล้ว 🏡' : 'อัปเดตสถานะโชว์ ✨'}
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          ADVANCED ADVANCED SOCIAL SHARE MODAL (Facebook, Threads, X)
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: .9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white border-4 border-ori-ink rounded-2xl shadow-[8px_8px_0_#1A1208] w-full max-w-sm p-6 relative text-black"
            >
              <button onClick={() => setShowShareModal(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>

              <div className="text-2xl mb-1">📢</div>
              <h3 className="font-display font-black text-lg mb-1">แชร์ประกาศตามหาน้อง</h3>
              <p className="text-xs font-bold text-gray-400 mb-4">
                เลือกแพลตฟอร์มโซเชียลเพื่อเรนเดอร์พรีวิวข้อมูลการ์ด OG ลงหน้าฟีด
              </p>

              {/* รายการปุ่มแชร์ 3 โซเชียลหลัก + 1 ปุ่มก็อปปี้ลิงก์นิรภัย */}
              <div className="flex flex-col gap-2.5 mb-4">
                
                {/* ปุ่มแชร์ไปยัง Facebook */}
                <button
                  onClick={() => {
                    const payload = getSharePayload()
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(payload.url)}`, '_blank')
                  }}
                  className="w-full text-left px-4 py-3 bg-[#1877F2] text-white border-2 border-black rounded-xl font-black text-sm transition-all hover:-translate-y-0.5 shadow-paper-sm flex items-center gap-2.5"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  <span>แชร์ไปยัง Facebook</span>
                </button>

                {/* ปุ่มแชร์ไปยัง Threads */}
                <button
                  onClick={() => {
                    const payload = getSharePayload()
                    window.open(`https://threads.net/intent/post?text=${encodeURIComponent(payload.text + '\n' + payload.url)}`, '_blank')
                  }}
                  className="w-full text-left px-4 py-3 bg-black text-white border-2 border-black rounded-xl font-black text-sm transition-all hover:-translate-y-0.5 shadow-paper-sm flex items-center gap-2.5"
                >
                  <MessageSquare size={20} className="fill-current" />
                  <span>แชร์ไปยัง Threads</span>
                </button>

                {/* ปุ่มแชร์ไปยัง X (Twitter) */}
                <button
                  onClick={() => {
                    const payload = getSharePayload()
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(payload.text)}&url=${encodeURIComponent(payload.url)}`, '_blank')
                  }}
                  className="w-full text-left px-4 py-3 bg-[#111111] text-white border-2 border-black rounded-xl font-black text-sm transition-all hover:-translate-y-0.5 shadow-paper-sm flex items-center gap-2.5"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  <span>แชร์ไปยัง X (Twitter)</span>
                </button>

                <div className="h-px bg-black/10 my-1"></div>

                {/* ปุ่มคัดลอกลิงก์เป็นทางเลือกสำรอง */}
                <button
                  onClick={async () => {
                    const payload = getSharePayload()
                    try {
                      await navigator.clipboard.writeText(payload.url)
                      alert('📋 คัดลอกลิงก์ประกาศไปรันเป็นโพสต์ OG สำเร็จเรียบร้อยแล้วค่ะ!')
                    } catch {
                      alert(`ลิงก์สำหรับคัดลอก: ${payload.url}`)
                    }
                    setShowShareModal(false)
                  }}
                  className="w-full text-center px-4 py-2.5 bg-gray-50 border-2 border-dashed border-gray-300 hover:bg-gray-100 rounded-xl font-bold text-xs transition-colors"
                >
                  🔗 คัดลอกลิงก์เก็บไว้ในคลิปบอร์ด
                </button>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════
          DELETE REASON MODAL
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: .9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white border-4 border-ori-ink rounded-2xl shadow-[8px_8px_0_#1A1208] w-full max-w-sm p-6 relative"
            >
              <button onClick={() => setShowDeleteModal(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>

              <div className="text-2xl mb-1">🗑️</div>
              <h3 className="font-display font-black text-lg mb-1">ลบประกาศนี้?</h3>
              <p className="text-sm text-ori-ink-l mb-4">
                ช่วยบอกเหตุผลด้วยนะครับ ข้อมูลนี้ช่วยให้แพลตฟอร์มดีขึ้น
              </p>

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