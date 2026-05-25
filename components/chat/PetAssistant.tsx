'use client'
// components/chat/PetAssistant.tsx (V9 - เคลียร์บั๊กสัญลักษณ์สไตล์ Quick Replies บิวด์ผ่านฉลุย 100%)

import { useState, useEffect, useRef, useMemo } from 'react'
import { AnimatePresence, motion }      from 'framer-motion'
import { X, Send, Loader2, ChevronDown, Volume2, VolumeX, Camera, PlusCircle } from 'lucide-react'
import Image          from 'next/image'
import Link           from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { speakText, stopSpeaking, isSpeaking } from '@/lib/speech-synthesis'

type CharId = keyof typeof CHARS

interface Message {
  role:           'user' | 'bot'
  text:           string
  action_buttons?: { label: string; link: string }[]
  attached_image?: string 
}

const CHARS = {
  cat: {
    id: 'cat', name: 'ลักกี้', img: '/avatars/lucky.png',
    color: '#FF9F66', colorL: '#FFF3EC', badge: '🐱',
    tagline: 'อบอุ่น · ปลอบโยน · ใจดี',
    greet: 'สวัสดีค่ะ! ลักกี้อยู่ตรงนี้นะคะ 🐾\nมีอะไรให้ช่วยไหมคะ? ไม่ว่าจะเรื่องน้องหาย หรือตั้งแจ้งเตือนสุขภาพและรับสิทธิ์พุชฟรีผ่านหน้าเว็บได้เลยนะคะ 💛',
  },
  dog: {
    id: 'dog', name: 'โกลดี้', img: '/avatars/goldie.png',
    color: '#FFCC00', colorL: '#FFFBEA', badge: '🐶',
    tagline: 'ร่าเริง · กระตือรือร้น · ให้กำลังใจ',
    greet: 'โฮ่ง! ผมโกลดี้ครับ! 🔥\nพร้อมลุยช่วยเหลือและบันทึกประวัติน้องร่วมกับ Web Push เด้งเตือนความจำฟรีตลอดชีพแล้วครับ มีอะไรบอกได้เลย!',
  },
  owl: {
    id: 'owl', name: 'ลุงฮูก', img: '/avatars/owl.png',
    color: '#A0522D', colorL: '#FFF8F2', badge: '🦉',
    tagline: 'รอบรู้ · ลุ่มลึก · เชี่ยวชาญ',
    greet: 'สวัสดีครับ ผมลุงฮูก 🦉\nยินดีให้คำแนะนำขั้นตอนการดูแล รวบรวมสถิติจับคู่เคสสัตว์หาย และตั้งระบบเตือนความจำพุชบอร์ดครับ',
  },
} as const

const CHAR_ANIMATION: Record<CharId, { animate: object; transition: object }> = {
  cat: {
    animate:    { y: [0, -3, 0], scale: [1, 1.01, 1] },
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
  dog: {
    animate:    { y: [0, -5, 0], rotate: [-1.5, 1.5, -1.5] },
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },
  owl: {
    animate:    { y: [0, -1.5, 0], rotate: [-2, 2, -2] },
    transition: { duration: 5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 },
  },
}

const QUICK_REPLIES = [
  '🐾 สัตว์เพิ่งหายไป',
  '👀 พบสัตว์หลงทาง',
  '📋 วิธีลงประกาศ',
  '🏥 บันทึกประวัติสุขภาพน้อง',
  '🔔 ตั้งแจ้งเตือน Web Push ฟรี',
]

export default function PetAssistant() {
  const pathname = usePathname()
  const [isOpen,     setIsOpen]     = useState(false)
  const [charId,     setCharId]     = useState<CharId>('cat')
  const [input,      setInput]      = useState('')
  const [messages,   setMessages]   = useState<Message[]>([])
  const [isLoading,  setIsLoading]  = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [speaking,   setSpeaking]   = useState(false)
  const [bounds,     setBounds]     = useState({ top: 0, left: 0, right: 0, bottom: 0 })

  const [attachedBase64, setAttachedBase64] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [pushSubscribed, setPushSubscribed] = useState(false)
  
  const [myPets, setMyPets] = useState<any[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ch = CHARS[charId]

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const isHidden = ['/login', '/register', '/admin'].some(r => pathname.startsWith(r))
    || (pathname.includes('/pet/') && pathname.split('/').length > 2)

  useEffect(() => {
    const update = () => {
      if (typeof window !== 'undefined') {
        setBounds({
          top:    -(window.innerHeight - 120),
          left:   -(window.innerWidth  - 120),
          right:  10,
          bottom: 10,
        })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    
    const triggerProactiveGreeting = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('province')
        .eq('id', session.user.id)
        .maybeSingle()

      const userProvince = profile?.province || 'นครราชสีมา'

      const [
        { count: lostCount },
        { data: reminders },
        { data: petsData }
      ] = await Promise.all([
        supabase.from('pets').select('*', { count: 'exact', head: true }).eq('status', 'lost').eq('province', userProvince),
        supabase.from('reminders').select('title, next_remind_at').eq('user_id', session.user.id).eq('is_done', false).limit(1),
        supabase.from('pets').select('id, name, species, breed').eq('user_id', session.user.id).not('status', 'eq', 'archived')
      ])

      if (petsData) {
        setMyPets(petsData)
      }

      let proactiveText = `สวัสดีค่ะนุด ยินดีต้อนรับกลับเข้าสู่ระบบความปลอดภัยของ PobPet ค่ะ 🐾\n\n`
      let hasAlert = false

      if (lostCount && lostCount > 0) {
        proactiveText += `👁️ ตอนนี้มีประกาศสัตว์หายพิกัดพื้นที่ ${userProvince} อยู่ทั้งหมด ${lostCount} เคสที่กำลังรอการค้นหาและจับคู่นะคะ\n`
        hasAlert = true
      }

      if (reminders && reminders.length > 0) {
        proactiveText += `🔔 แจ้งเตือนความจำ: คุณมีคิวนัดหมายเรื่อง "${reminders[0].title}" รออยู่บนระบบพุชบอร์ดค่ะ\n`
        hasAlert = true
      }

      if (hasAlert) {
        setMessages(prev => {
          if (prev.length > 1) return prev
          return [
            { role: 'bot', text: proactiveText, action_buttons: [{ label: 'ตรวจสอบระบบจัดหารายชื่อน้อง', link: '/profile?tab=pets' }] }
          ]
        })
      }
    }

    triggerProactiveGreeting()
  }, [isOpen, supabase])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) { stopSpeaking(); setSpeaking(false) }
  }, [isOpen])

  const requestWebPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setPushSubscribed(true)
        setMessages(prev => [...prev, {
          role: 'bot',
          text: '🎉 เปิดระบบ Web Push สำเร็จแล้วค่ะ! ระบบจะคอยยิงแจ้งเตือนคิวนัดหมายและผลแมตช์สัตว์หายเด้งขึ้นหน้าจอคอมพิวเตอร์และมือถือให้ฟรีโดยไม่มีค่าใช้จ่ายค่ะ'
        }])
      }
    }
  }

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1]
      setAttachedBase64(base64String)
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const clearAttachedImage = () => {
    setAttachedBase64(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const switchChar = (id: CharId) => {
    setCharId(id)
    setMessages([{ role: 'bot', text: CHARS[id].greet }])
    setShowPicker(false)
    stopSpeaking(); setSpeaking(false)
  }

  const openChat = () => {
    setIsOpen(true)
    if (messages.length === 0) setMessages([{ role: 'bot', text: ch.greet }])
  }

  const handleSpeakText = (text: string) => {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
    } else {
      speakText(text)
      setSpeaking(true)
      const checkInterval = setInterval(() => {
        if (!isSpeaking()) { setSpeaking(false); clearInterval(checkInterval) }
      }, 500)
    }
  }

  const handleTranslateMessage = async (text: string) => {
    if (!text.trim() && !attachedBase64) return
    if (isLoading) return

    const userMsg = text.trim()
    const currentPreview = imagePreview || undefined

    if (userMsg === '🔔 ตั้งแจ้งเตือน Web Push ฟรี') {
      await requestWebPushPermission()
      return
    }

    setInput('')
    clearAttachedImage()

    setMessages(prev => [...prev, { role: 'user', text: userMsg || 'ส่งรูปภาพหลักฐานสุขภาพ', attached_image: currentPreview }])
    setIsLoading(true)

    try {
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:     userMsg || 'บันทึกรูปภาพใบเสร็จประวัติสุขภาพสัตว์เลี้ยง',
          characterId: charId,
          pageContext: pathname,
          history:     messages.slice(-6).map(m => ({ role: m.role, text: m.text })),
          evidence_image_base64: attachedBase64,
          user_registered_pets: myPets 
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role:           'bot',
        text:           data.reply || 'ขออภัย เกิดข้อผิดพลาดในการบันทึกแจ้งเตือน',
        action_buttons: data.action_buttons?.length ? data.action_buttons : undefined,
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'ระบบขัดข้องชั่วคราว กรุณาลองใหม่นะคะ' }])
    } finally {
      setIsLoading(false)
    }
  }

  if (isHidden) return null
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
            style={{ width: 340, maxWidth: 'calc(100vw - 48px)', height: 490, background: '#FFFFFF', border: '3px solid #1A1208', borderRadius: 24, boxShadow: '6px 6px 0 #1A1208' }}
          >
            {/* Header */}
            <div style={{ background: ch.color, borderBottom: '3px solid #1A1208', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2.5px solid #1A1208', overflow: 'hidden', flexShrink: 0, background: ch.colorL }}>
                <Image src={ch.img} alt={ch.name} width={44} height={44} className="w-full h-full object-cover" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#1A1208' }}>{ch.name} {ch.badge}</div>
                <div style={{ fontSize: 10, color: 'rgba(26,18,8,.55)', fontWeight: 600 }}>{ch.tagline}</div>
              </div>

              {/* Character picker */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowPicker(p => !p)} style={{ background: 'rgba(255,255,255,.4)', border: '2px solid #1A1208', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, color: '#1A1208' }}>
                  เปลี่ยน <ChevronDown size={12} />
                </button>
                <AnimatePresence>
                  {showPicker && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ position: 'absolute', top: '110%', right: 0, background: '#FFFFFF', border: '2.5px solid #1A1208', borderRadius: 14, overflow: 'hidden', boxShadow: '4px 4px 0 #1A1208', zIndex: 10, minWidth: 190 }}>
                      {(Object.values(CHARS) as (typeof CHARS)[CharId][]).map(c => (
                        <button key={c.id} onClick={() => switchChar(c.id as CharId)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: charId === c.id ? c.colorL : 'transparent', border: 'none', borderBottom: '1px solid #EDE0C4', cursor: 'pointer', textAlign: 'left' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${charId === c.id ? c.color : '#C4A878'}`, overflow: 'hidden', flexShrink: 0 }}>
                            <Image src={c.img} alt={c.name} width={32} height={32} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1208' }}>{c.name} {c.badge}</div>
                            <div style={{ fontSize: 10, color: '#7A6A50', fontWeight: 600 }}>{c.tagline}</div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,.4)', border: '2px solid #1A1208', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1208' }}><X size={14} /></button>
            </div>

            {/* Messages Content */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10, background: '#FAF6EE' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6, width: '100%' }}>
                    {msg.role === 'bot' && (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, border: `2px solid ${ch.color}`, overflow: 'hidden', background: ch.colorL }}>
                        <Image src={ch.img} alt={ch.name} width={28} height={28} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '76%' }}>
                      {msg.attached_image && (
                        <div style={{ width: 60, height: 60, borderRadius: 8, border: '2px solid #1A1208', overflow: 'hidden', position: 'relative', marginBottom: 2 }}>
                          <img src={msg.attached_image} alt="evidence" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div style={{ padding: '9px 13px', background: msg.role === 'user' ? ch.color : '#FFFFFF', color: '#1A1208', border: '2px solid #1A1208', borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', fontSize: 13, fontWeight: 500, lineHeight: 1.6, boxShadow: '2px 2px 0 #1A1208', whiteSpace: 'pre-line', borderLeft: msg.role === 'bot' ? `5px solid ${ch.color}` : undefined }}>
                        {msg.text}
                      </div>
                    </div>
                    {msg.role === 'bot' && (
                      <button onClick={() => handleSpeakText(msg.text)} title="ฟังเสียง" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', opacity: 0.45, flexShrink: 0, color: '#1A1208' }}>
                        {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>
                    )}
                  </div>

                  {msg.role === 'bot' && msg.action_buttons?.length && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 34 }}>
                      {msg.action_buttons.map((btn, bi) => (
                        <Link key={bi} href={btn.link} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 11, fontWeight: 700, background: ch.colorL, color: '#1A1208', border: `1.5px solid ${ch.color}`, borderRadius: 20, boxShadow: `1px 1px 0 ${ch.color}`, textDecoration: 'none' }}>
                          {btn.label} →
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Preview */}
            {imagePreview && (
              <div style={{ padding: '6px 12px', background: '#FFF3EC', borderTop: '2px solid #EDE0C4', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 6, border: '1.5px solid #1A1208', overflow: 'hidden' }}>
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#7A6A50' }}>แนบหลักฐานใบเสร็จแล้ว</span>
                <button onClick={clearAttachedImage} style={{ marginLeft: 'auto', background: '#FFF', border: '1.5px solid #1A1208', borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>ลบรูป</button>
              </div>
            )}

            {/* Quick Replies (🟢 แก้ไข String Template ตัวขัดไวยากรณ์เรียบร้อย) */}
            <div style={{ padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: 4, borderTop: '2px solid #EDE0C4', background: '#F5EDD8', flexShrink: 0 }}>
              {QUICK_REPLIES.map(q => (
                <button key={q} onClick={() => handleTranslateMessage(q)} disabled={isLoading} style={{ background: '#FFFFFF', border: '1.5px solid #1A1208', borderRadius: 20, padding: '3px 9px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', color: '#1A1208', boxShadow: `1px 1px 0 ${ch.color}` }}>
                  {q}
                </button>
              ))}
            </div>

            {/* Form Input Control */}
            <form onSubmit={e => { e.preventDefault(); handleTranslateMessage(input) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderTop: '3px solid #1A1208', background: '#FFFFFF', flexShrink: 0 }}>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading} style={{ background: 'white', border: '2px solid #1A1208', borderRadius: 12, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '2px 2px 0 #1A1208' }} title="แนบรูปใบเสร็จ/หลักฐาน">
                <Camera size={16} className="text-black" />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileAttach} accept="image/*" className="hidden" />

              <input
                ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                placeholder={imagePreview ? "พิมพ์หัวข้อหรือกดส่งได้เลย..." : "พิมพ์ข้อความ..."} disabled={isLoading}
                style={{ flex: 1, border: `2px solid ${ch.color}`, borderRadius: 12, padding: '7px 12px', fontSize: 13, outline: 'none', background: '#FAF6EE', fontFamily: 'inherit', fontWeight: 500 }}
              />
              <button type="submit" disabled={isLoading || (!input.trim() && !attachedBase64)}
                style={{ background: ch.color, border: '2px solid #1A1208', borderRadius: 12, padding: '0 14px', height: 36, cursor: 'pointer', boxShadow: '2px 2px 0 #1A1208', color: '#1A1208', opacity: (!input.trim() && !attachedBase64) || isLoading ? 0.5 : 1 }}>
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button Control */}
      <motion.div drag dragConstraints={bounds} dragElastic={0.1} dragMomentum={false} style={{ touchAction: 'none', zIndex: 1000 }} whileDrag={{ scale: 1.05, cursor: 'grabbing' }}>
        <motion.button
          onClick={isOpen ? () => setIsOpen(false) : openChat} animate={anim.animate as any} transition={anim.transition as any}
          whileHover={{ scale: 1.08, y: -6, boxShadow: isOpen ? '2px 2px 0 #1A1208' : '7px 7px 0 #1A1208' }} whileTap={{ scale: 0.94 }}
          style={{ width: 70, height: 70, background: '#FFFFFF', border: '3px solid #1A1208', borderRadius: '50%', cursor: 'grab', padding: 0, overflow: 'hidden', boxShadow: isOpen ? '2px 2px 0 #1A1208' : '5px 5px 0 #1A1208', display: 'block', position: 'relative', outline: 'none' }}
        >
          <Image src={ch.img} alt={ch.name} width={70} height={70} className="w-full h-full object-cover" priority />
          <div style={{ position: 'absolute', bottom: 4, right: 4, width: 12, height: 12, borderRadius: '50%', background: '#2D6A2D', border: '2px solid #FFFFFF', animation: 'onlinePulse 2s infinite' }} />
        </motion.button>
      </motion.div>

      <style jsx global>{`
        @keyframes dotBounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes onlinePulse{ 0%{box-shadow:0 0 0 0 rgba(45,106,45,.7)} 70%{box-shadow:0 0 0 6px rgba(45,106,45,0)} 100%{box-shadow:0 0 0 0 rgba(45,106,45,0)} }
      `}</style>
    </div>
  )
}