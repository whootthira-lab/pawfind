'use client'
// components/chat/PetAssistant.tsx

import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Send, Loader2, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const CHARS = {
  cat: {
    id: 'cat', name: 'ลักกี้', img: '/avatars/lucky.png',
    color: '#FF9F66', colorL: '#FFF3EC', badge: '🐱',
    tagline: 'อบอุ่น · ปลอบโยน · ใจดี',
    greet: 'สวัสดีค่ะ! ลักกี้อยู่ตรงนี้นะคะ 🐾\nมีอะไรให้ช่วยไหมคะ? ไม่ว่าจะเรื่องน้องหาย วิธีใช้เว็บ หรืออยากระบายก็ได้เลยนะคะ 💛',
  },
  dog: {
    id: 'dog', name: 'โกลดี้', img: '/avatars/goldie.png',
    color: '#FFCC00', colorL: '#FFFBEA', badge: '🐶',
    tagline: 'ร่าเริง · กระตือรือร้น · ให้กำลังใจ',
    greet: 'โฮ่ง! ผมโกลดี้ครับ! 🔥\nพร้อมลุยหาน้องด้วยกันแล้ว! มีอะไรให้ผมช่วยบอกได้เลยครับ ไม่ต้องเกรงใจ!',
  },
  owl: {
    id: 'owl', name: 'ลุงฮูก', img: '/avatars/owl.png',
    color: '#A0522D', colorL: '#FFF8F2', badge: '🦉',
    tagline: 'รอบรู้ · ลุ่มลึก · เชี่ยวชาญ',
    greet: 'สวัสดีครับ ผมลุงฮูก 🦉\n子曰 "การเรียนรู้โดยไม่คิด ย่อมสูญเปล่า"\nยินดีให้คำแนะนำทุกเรื่องเกี่ยวกับสัตว์เลี้ยงและระบบครับ',
  },
} as const

// 🎬 ══════════════════════════════════════════════════════════════
// CHAR_ANIMATION — แก้ไขเรื่อง Type ให้รองรับ Framer Motion บน Vercel
// ══════════════════════════════════════════════════════════════
const CHAR_ANIMATION: Record<CharId, { animate: any; transition: any }> = {
  cat: {
    // แมว: หายใจช้าๆ แบบขี้เกียจ ยืดขยายสเกลบางเบา
    animate: { y: [0, -3, 0], scale: [1, 1.01, 1] },
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
  },
  dog: {
    // หมา: ขยับส่ายซ้ายขวาและขึ้นลงเร็วหน่อยเหมือนตื่นเต้นกระดิกหาง
    animate: { y: [0, -5, 0], rotate: [-1.5, 1.5, -1.5] },
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
  },
  owl: {
    // ลุงฮูก: นิ่งๆ สุขุม แล้วขยับหมุนองศานิดนึงเหมือนหันมองรอบข้าง
    animate: { y: [0, -1.5, 0], rotate: [-2, 2, -2] },
    transition: { duration: 5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }
  },
} 
// ✅ จบแค่วงเล็บปีกกา ไม่ต้องมีอะไรต่อท้ายครับ
type CharId = keyof typeof CHARS

const QUICK_REPLIES = [
  '🐾 สัตว์เพิ่งหายไป',
  '👀 พบสัตว์หลงทาง',
  '📋 วิธีลงประกาศ',
  '🏥 น้องป่วย/บาดเจ็บ',
  '❓ ระบบใช้งานอย่างไร',
]

export default function PetAssistant() {
  const pathname = usePathname()
  const [isOpen,     setIsOpen]     = useState(false)
  const [charId,     setCharId]     = useState<CharId>('cat')
  const [input,      setInput]      = useState('')
  const [messages,   setMessages]   = useState<{ role: 'user' | 'bot'; text: string }[]>([])
  const [isLoading,  setIsLoading]  = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const ch = CHARS[charId]

  // ซ่อนบน Pet detail และ admin
  const isHidden = ['/login', '/register', '/admin'].some(r => pathname.startsWith(r))
    || (pathname.includes('/pet/') && pathname.split('/').length > 2)

  // Proactive ที่หน้า report
  useEffect(() => {
    if (pathname !== '/report') return
    const t = setTimeout(() => {
      if (!isOpen && messages.length === 0) {
        setIsOpen(true)
        setMessages([{ role: 'bot', text: 'เห็นว่ากำลังกรอกฟอร์มอยู่นะคะ มีอะไรให้ช่วยแนะนำไหมคะ? 🐾' }])
      }
    }, 60_000)
    return () => clearTimeout(t)
  }, [pathname, isOpen, messages.length])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  const switchChar = (id: CharId) => {
    setCharId(id)
    setMessages([{ role: 'bot', text: CHARS[id].greet }])
    setShowPicker(false)
  }

  const openChat = () => {
    setIsOpen(true)
    if (messages.length === 0) setMessages([{ role: 'bot', text: ch.greet }])
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    const userMsg = text.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setIsLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          characterId: charId,
          pageContext: pathname,
          history: messages.slice(-6),
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'bot', text: data.reply || 'ขออภัย เกิดข้อผิดพลาด' }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'ระบบขัดข้องชั่วคราว กรุณาลองใหม่นะคะ' }])
    } finally {
      setIsLoading(false)
    }
  }

  if (isHidden) return null

  // เลือกชุดแอนิเมชันของตัวละครปัจจุบันมาใช้งาน
  const anim = CHAR_ANIMATION[charId]

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
            style={{
              width: 340, maxWidth: 'calc(100vw - 48px)', height: 480,
              background: '#FFFFFF', border: '3px solid #1A1208',
              borderRadius: 24, boxShadow: '6px 6px 0 #1A1208',
            }}
          >
            {/* Header */}
            <div style={{
              background: ch.color, borderBottom: '3px solid #1A1208',
              padding: '12px 14px', display: 'flex', alignItems: 'center',
              gap: 10, flexShrink: 0,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                border: '2.5px solid #1A1208', overflow: 'hidden',
                flexShrink: 0, background: ch.colorL,
              }}>
                <Image src={ch.img} alt={ch.name} width={44} height={44}
                  className="w-full h-full object-cover" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#1A1208' }}>
                  {ch.name} {ch.badge}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(26,18,8,.55)', fontWeight: 600 }}>
                  {ch.tagline}
                </div>
              </div>

              {/* Picker */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowPicker(p => !p)} style={{
                  background: 'rgba(255,255,255,.4)', border: '2px solid #1A1208',
                  borderRadius: 8, padding: '4px 8px', fontSize: 11,
                  fontWeight: 700, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: 3, color: '#1A1208',
                }}>
                  เปลี่ยน <ChevronDown size={12} />
                </button>
                <AnimatePresence>
                  {showPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      style={{
                        position: 'absolute', top: '110%', right: 0,
                        background: '#FFFFFF', border: '2.5px solid #1A1208',
                        borderRadius: 14, overflow: 'hidden',
                        boxShadow: '4px 4px 0 #1A1208', zIndex: 10, minWidth: 190,
                      }}
                    >
                      {(Object.values(CHARS) as (typeof CHARS)[CharId][]).map(c => (
                        <button key={c.id} onClick={() => switchChar(c.id as CharId)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px',
                            background: charId === c.id ? c.colorL : 'transparent',
                            border: 'none', borderBottom: '1px solid #EDE0C4',
                            cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            border: `2px solid ${charId === c.id ? c.color : '#C4A878'}`,
                            overflow: 'hidden', flexShrink: 0,
                          }}>
                            <Image src={c.img} alt={c.name} width={32} height={32}
                              className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1208' }}>
                              {c.name} {c.badge}
                            </div>
                            <div style={{ fontSize: 10, color: '#7A6A50', fontWeight: 600 }}>
                              {c.tagline}
                            </div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={() => setIsOpen(false)} style={{
                background: 'rgba(255,255,255,.4)', border: '2px solid #1A1208',
                borderRadius: 8, width: 30, height: 30, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#1A1208',
              }}>
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{
              flex: 1, overflowY: 'auto', padding: '12px',
              display: 'flex', flexDirection: 'column', gap: 10,
              background: '#FAF6EE',
            }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#C4A878', fontSize: 12,
                  fontWeight: 600, padding: '24px 0' }}>
                  เริ่มพิมพ์หรือเลือกปุ่มด้านล่างได้เลยนะคะ 🐾
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 16 : -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}
                >
                  {msg.role === 'bot' && (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${ch.color}`, overflow: 'hidden',
                      background: ch.colorL, alignSelf: 'flex-end',
                    }}>
                      <Image src={ch.img} alt={ch.name} width={28} height={28}
                        className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div style={{
                    maxWidth: '76%', padding: '9px 13px',
                    background: msg.role === 'user' ? ch.color : '#FFFFFF',
                    color: '#1A1208', border: '2px solid #1A1208',
                    borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    fontSize: 13, fontWeight: 500, lineHeight: 1.6,
                    boxShadow: '2px 2px 0 #1A1208', whiteSpace: 'pre-line',
                    borderLeft: msg.role === 'bot' ? `5px solid ${ch.color}` : undefined,
                  }}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${ch.color}`, overflow: 'hidden', background: ch.colorL,
                  }}>
                    <Image src={ch.img} alt={ch.name} width={28} height={28}
                      className="w-full h-full object-cover" />
                  </div>
                  <div style={{
                    display: 'flex', gap: 4, padding: '10px 14px',
                    background: '#fff', border: '2px solid #1A1208',
                    borderRadius: '4px 16px 16px 16px',
                    boxShadow: '2px 2px 0 #1A1208',
                    borderLeft: `5px solid ${ch.color}`,
                  }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%', background: ch.color,
                        animation: `dotBounce 0.9s ${i * 0.15}s infinite`,
                      }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Quick replies */}
            <div style={{
              padding: '7px 8px', display: 'flex', flexWrap: 'wrap', gap: 4,
              borderTop: '2px solid #EDE0C4', background: '#F5EDD8', flexShrink: 0,
            }}>
              {QUICK_REPLIES.map(q => (
                <button key={q} onClick={() => sendMessage(q)} disabled={isLoading}
                  style={{
                    background: '#FFFFFF', border: `1.5px solid ${ch.color}`,
                    borderRadius: 20, padding: '3px 9px', fontSize: 10.5,
                    fontWeight: 700, cursor: 'pointer', color: '#1A1208',
                    boxShadow: `1px 1px 0 ${ch.color}`,
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={e => { e.preventDefault(); sendMessage(input) }} style={{
              display: 'flex', gap: 6, padding: '8px 10px',
              borderTop: '3px solid #1A1208', background: '#FFFFFF', flexShrink: 0,
            }}>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                placeholder="พิมพ์ข้อความ..." disabled={isLoading}
                style={{
                  flex: 1, border: `2px solid ${ch.color}`, borderRadius: 12,
                  padding: '7px 12px', fontSize: 13, outline: 'none',
                  background: '#FAF6EE', fontFamily: 'inherit', fontWeight: 500,
                }}
              />
              <button type="submit" disabled={isLoading || !input.trim()}
                style={{
                  background: ch.color, border: '2px solid #1A1208', borderRadius: 12,
                  padding: '0 14px', cursor: 'pointer', boxShadow: '2px 2px 0 #1A1208',
                  color: '#1A1208', opacity: (!input.trim() || isLoading) ? 0.5 : 1,
                }}>
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎬 Floating Button — ใช้ motion.button ควบคุมไมโครแอนิเมชันทั้งหมดทดแทนสไตล์เดิม */}
      <motion.button
        onClick={isOpen ? () => setIsOpen(false) : openChat}
        animate={anim.animate}
        transition={anim.transition}
        whileHover={{ 
          scale: 1.08, 
          y: -6, 
          boxShadow: isOpen ? '2px 2px 0 #1A1208' : '7px 7px 0 #1A1208' 
        }}
        whileTap={{ scale: 0.94 }}
        style={{
          width: 70, height: 70, background: '#FFFFFF',
          border: '3px solid #1A1208', borderRadius: '50%',
          cursor: 'pointer', padding: 0, overflow: 'hidden',
          boxShadow: isOpen ? '2px 2px 0 #1A1208' : '5px 5px 0 #1A1208',
          display: 'block', position: 'relative', outline: 'none'
        }}
      >
        <Image src={ch.img} alt={ch.name} width={70} height={70}
          className="w-full h-full object-cover" priority />
        {/* Online dot */}
        <div style={{
          position: 'absolute', bottom: 4, right: 4, width: 12, height: 12,
          borderRadius: '50%', background: '#2D6A2D', border: '2px solid #FFFFFF',
          animation: 'onlinePulse 2s infinite',
        }} />
      </motion.button>

      <style jsx global>{`
        @keyframes dotBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes onlinePulse { 0%{box-shadow:0 0 0 0 rgba(45,106,45,.7)} 70%{box-shadow:0 0 0 6px rgba(45,106,45,0)} 100%{box-shadow:0 0 0 0 rgba(45,106,45,0)} }
      `}</style>
    </div>
  )
}