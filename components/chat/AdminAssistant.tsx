'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Send, Loader2, ChevronDown, Bot, BarChart2, Key, ShieldAlert } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface Message {
  role: 'user' | 'bot'
  text: string
  action_buttons?: { label: string; link: string }[]
}

const ADMIN_EMAILS = ['whootthira@gmail.com', 'pobpet.th@gmail.com']

const QUICK_REPLIES = [
  '📊 ดูสถิติระบบ',
  '🤖 ยอดใช้งาน Token',
  '⏳ ประกาศรออนุมัติ',
]

export default function AdminAssistant() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [bounds, setBounds] = useState({ top: 0, left: 0, right: 0, bottom: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isIdle, setIsIdle] = useState(false)
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 })

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // ตรวจสอบสิทธิ์แอดมินก่อนแสดงผล
  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setIsAdmin(false)
        return
      }

      const email = session.user.email
      const isExplicit = email && ADMIN_EMAILS.includes(email)
      const isRole = session.user.app_metadata?.role === 'admin'

      setIsAdmin(!!(isExplicit || isRole))
    };

    checkAdminStatus()
  }, [supabase])

  // อัปเดตขอบเขตการลากปุ่มลอย
  useEffect(() => {
    const update = () => {
      if (typeof window !== 'undefined') {
        setBounds({
          top: -(window.innerHeight - 120),
          left: -(window.innerWidth - 120),
          right: 10,
          bottom: 10,
        })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // ตั้งเวลาทำปุ่มโปร่งแสงเมื่อไม่ได้ใช้งาน
  const resetIdleTimer = useCallback(() => {
    setIsIdle(false)
    if (idleTimer.current) clearTimeout(idleTimer.current)
    if (!isOpen) {
      idleTimer.current = setTimeout(() => setIsIdle(true), 5000)
    }
  }, [isOpen])

  useEffect(() => {
    resetIdleTimer()
    window.addEventListener('mousemove', resetIdleTimer)
    window.addEventListener('touchstart', resetIdleTimer)
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      window.removeEventListener('mousemove', resetIdleTimer)
      window.removeEventListener('touchstart', resetIdleTimer)
    }
  }, [isOpen, resetIdleTimer])

  // การดูดปุ่มกลับชิดขอบจอ
  const snapToEdge = (offset: { x: number; y: number }) => {
    if (typeof window === 'undefined') return
    const btnW = 70
    const margin = 12
    const winW = window.innerWidth
    const absX = winW - 24 - btnW + btnPos.x + offset.x
    const newX = absX + btnW / 2 < winW / 2
      ? margin - (winW - 24 - btnW)
      : winW - margin - btnW - (winW - 24 - btnW)
    setBtnPos({ x: newX, y: btnPos.y + offset.y })
  }

  // เลื่อนตำแหน่ง scroll แชตลงล่างสุดอัตโนมัติ
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  // โฟกัสช่องกรอก
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  const openChat = () => {
    setIsOpen(true)
    if (messages.length === 0) {
      setMessages([
        {
          role: 'bot',
          text: 'สวัสดีค่ะแอดมิน ยินดีต้อนรับสู่แผง AI วิเคราะห์ข้อมูล PobPet Analytics 📊\n\nต้องการให้รายงานข้อมูลสถิติ ดึงโพสต์รอตรวจ หรือสั่งจัดการประกาศอะไร บอกมาได้เลยนะคะ 🤖🐾'
        }
      ])
    }
  }

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return
    if (isLoading) return

    const userMsg = text.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setIsLoading(true)

    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(-8).map(m => ({ role: m.role, text: m.text })),
        }),
      })

      const data = await res.json()
      if (res.status === 403) {
        setMessages(prev => [...prev, { role: 'bot', text: data.error || 'คุณไม่มีสิทธิ์ใช้งานบอทแอดมินค่ะ' }])
      } else {
        setMessages(prev => [...prev, {
          role: 'bot',
          text: data.reply || 'ขออภัย เกิดข้อผิดพลาดในการประมวลผลคำสั่ง',
          action_buttons: data.action_buttons?.length ? data.action_buttons : undefined,
        }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'ระบบแชตบอทหลังบ้านขัดข้อง กรุณาลองใหม่อีกครั้งค่ะ' }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleButtonClick = (btn: { label: string; link: string }) => {
    if (btn.link.startsWith('action:')) {
      const command = btn.link.replace('action:', '')
      handleSendMessage(command)
    } else {
      router.push(btn.link)
    }
  }

  // ไม่แสดงผลหากไม่ใช่แอดมิน
  if (!isAdmin) return null

  return (
    <div className="fixed bottom-6 right-6 z-[999]" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="mb-3 flex flex-col overflow-hidden"
            style={{ width: 350, maxWidth: 'calc(100vw - 48px)', height: 500, background: '#FFFFFF', border: '3px solid #1A1208', borderRadius: 24, boxShadow: '6px 6px 0 #1A1208' }}
          >
            {/* Header */}
            <div style={{ background: '#FF9F66', borderBottom: '3px solid #1A1208', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2.5px solid #1A1208', overflow: 'hidden', flexShrink: 0, background: '#FFF3EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={28} className="text-ori-orange-d" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#1A1208' }}>แอดมิน AI Analytics 🤖</div>
                <div style={{ fontSize: 10, color: 'rgba(26,18,8,.65)', fontWeight: 700 }}>ระบบวิเคราะห์ข้อมูล PobPet</div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,.4)', border: '2px solid #1A1208', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1208' }}><X size={14} /></button>
            </div>

            {/* Chat Body */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10, background: '#FAF6EE' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6, width: '100%' }}>
                    {msg.role === 'bot' && (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, border: `2px solid #FF9F66`, overflow: 'hidden', background: '#FFF3EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bot size={16} className="text-ori-orange-d" />
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '78%' }}>
                      <div style={{ padding: '9px 13px', background: msg.role === 'user' ? '#FF9F66' : '#FFFFFF', color: '#1A1208', border: '2px solid #1A1208', borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', fontSize: 13, fontWeight: 500, lineHeight: 1.6, boxShadow: '2px 2px 0 #1A1208', whiteSpace: 'pre-line', borderLeft: msg.role === 'bot' ? '5px solid #FF9F66' : undefined }}>
                        {msg.text}
                      </div>
                    </div>
                  </div>

                  {msg.role === 'bot' && msg.action_buttons?.length && (
                    <div className="flex flex-wrap gap-2 pl-9 mt-1">
                      {msg.action_buttons.map((btn, bi) => (
                        <button key={bi} onClick={() => handleButtonClick(btn)} className="bg-ori-cream border border-black px-3 py-1.5 rounded-lg text-xs font-black shadow-paper-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform flex items-center gap-1 text-black">
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Replies */}
            <div style={{ padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: 4, borderTop: '2px solid #EDE0C4', background: '#F5EDD8', flexShrink: 0 }}>
              {QUICK_REPLIES.map(q => (
                <button key={q} onClick={() => handleSendMessage(q)} disabled={isLoading} style={{ background: '#FFFFFF', border: '1.5px solid #1A1208', borderRadius: 20, padding: '3px 9px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', color: '#1A1208', boxShadow: '1px 1px 0 #FF9F66' }}>
                  {q}
                </button>
              ))}
            </div>

            {/* Form Input Control */}
            <form onSubmit={e => { e.preventDefault(); handleSendMessage(input) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderTop: '3px solid #1A1208', background: '#FFFFFF', flexShrink: 0 }}>
              <input
                ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                placeholder="สั่งการผู้ช่วยแอดมิน..." disabled={isLoading}
                style={{ flex: 1, border: '2px solid #FF9F66', borderRadius: 12, padding: '7px 12px', fontSize: 13, outline: 'none', background: '#FAF6EE', fontFamily: 'inherit', fontWeight: 500 }}
              />
              <button type="submit" disabled={isLoading || !input.trim()}
                style={{ background: '#FF9F66', border: '2px solid #1A1208', borderRadius: 12, padding: '0 14px', height: 36, cursor: 'pointer', boxShadow: '2px 2px 0 #1A1208', color: '#1A1208', opacity: !input.trim() || isLoading ? 0.5 : 1 }}>
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.div
        drag
        dragConstraints={bounds}
        dragElastic={0.08}
        dragMomentum={false}
        animate={btnPos}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        onDragStart={() => { setIsDragging(true); setIsIdle(false) }}
        onDragEnd={(_, info) => {
          setIsDragging(false)
          snapToEdge(info.offset)
          resetIdleTimer()
        }}
        style={{ touchAction: 'none', zIndex: 1000 }}
        whileDrag={{ scale: 1.08, cursor: 'grabbing' }}
      >
        <motion.button
          onClick={() => {
            if (!isDragging) {
              if (isOpen) { setIsOpen(false) } else { openChat() }
            }
          }}
          animate={{
            opacity: isIdle && !isOpen ? 0.35 : 1,
            scale: isIdle && !isOpen ? 0.88 : 1,
          }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.1, y: -4, opacity: 1, boxShadow: isOpen ? '2px 2px 0 #1A1208' : '8px 8px 0 #1A1208' }}
          whileTap={{ scale: 0.92 }}
          style={{ width: 70, height: 70, background: '#FF9F66', border: '3px solid #1A1208', borderRadius: '50%', cursor: isDragging ? 'grabbing' : 'grab', padding: 0, overflow: 'hidden', boxShadow: isOpen ? '2px 2px 0 #1A1208' : '5px 5px 0 #1A1208', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none', flexDirection: 'column' }}
        >
          <Bot size={28} className="text-black" />
          <span className="text-[8px] font-black text-black -mt-1 leading-none uppercase">Admin AI</span>
        </motion.button>
      </motion.div>
    </div>
  )
}
