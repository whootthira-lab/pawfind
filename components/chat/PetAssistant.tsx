'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader2, ChevronRight, User, Settings2 } from 'lucide-react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

// ข้อมูลคาแรคเตอร์
const CHARS = {
  cat: { id: 'cat', name: 'ลักกี้', img: '/avatars/lucky.png', color: '#FF9F66', greet: 'สวัสดีค่ะ ลักกี้พร้อมช่วยปลอบโยนและแนะนำทางให้นะคะ 🐾' },
  dog: { id: 'dog', name: 'โกลดี้', img: '/avatars/goldie.png', color: '#FFCC00', greet: 'โฮ่ง! ผมโกลดี้พร้อมลุยครับ! มีอะไรให้ผมช่วยหาน้องๆ ไหมฮะ? 🔥' },
  owl: { id: 'owl', name: 'ลุงฮูก', img: '/avatars/owl.png', color: '#A0522D', greet: 'สวัสดีครับ ผมลุงฮูก ยินดีให้คำแนะนำเรื่องระบบและสุขภาพสัตว์เบื้องต้นครับ 🦉' },
}

export default function PetAssistant() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [charId, setCharId] = useState<'cat' | 'dog' | 'owl'>('cat')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 💡 กฎการซ่อนตัว: ซ่อนถ้าอยู่ในหน้ารายละเอียดประกาศ (เพื่อไม่ให้บังรูปสัตว์)
  useEffect(() => {
    if (pathname.includes('/events/') && pathname.split('/').length > 2) {
      setIsHidden(true)
    } else {
      setIsHidden(false)
    }
  }, [pathname])

  // 💡 กฎการทักทายเชิงรุก: ถ้าอยู่หน้าฟอร์มเกิน 60 วินาที
  useEffect(() => {
    if (pathname === '/report') {
      const timer = setTimeout(() => {
        if (messages.length === 0) {
          setIsOpen(true)
          setMessages([{ role: 'bot', text: 'เห็นคุณกำลังตั้งใจกรอกฟอร์ม มีอะไรให้ช่วยแนะนำไหมคะ/ครับ?' }])
        }
      }, 60000)
      return () => clearTimeout(timer)
    }
  }, [pathname, messages.length])

  // Scroll ไปล่างสุดเมื่อมีข้อความใหม่
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
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
          pageContext: pathname
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'bot', text: data.reply || data.error }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'ขออภัย ระบบขัดข้องนิดหน่อย ลองใหม่อีกครั้งนะ!' }])
    } finally {
      setIsLoading(false)
    }
  }

  if (isHidden) return null

  return (
    <div className="fixed bottom-6 right-6 z-[999] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 w-[350px] max-w-[90vw] bg-white border-4 border-black rounded-[2.5rem] shadow-paper overflow-hidden flex flex-col"
          >
            {/* Header & Character Switcher */}
            <div className="p-4 border-b-4 border-black flex items-center justify-between bg-gray-50">
              <div className="flex gap-2">
                {(Object.keys(CHARS) as Array<keyof typeof CHARS>).map((id) => (
                  <button 
                    key={id}
                    onClick={() => { setCharId(id); setMessages([]); }}
                    className={`w-10 h-10 rounded-full border-2 border-black overflow-hidden transition-all ${charId === id ? 'scale-110 ring-4 ring-black/5' : 'opacity-40 grayscale'}`}
                  >
                    <Image src={CHARS[id].img} alt={id} width={40} height={40} />
                  </button>
                ))}
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-200 rounded-full border-2 border-black">
                <X size={18} />
              </button>
            </div>

            {/* Chat Body */}
            <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-4 bg-[#FDFCF0]">
              {messages.length === 0 && (
                <div className="text-center py-4 italic text-gray-400 text-sm font-bold">
                  เลือกผู้ช่วยที่ถูกใจแล้วเริ่มคุยได้เลยค่ะ/ครับ
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl border-2 border-black font-bold text-sm shadow-paper-sm ${
                    msg.role === 'user' ? 'bg-white' : 'bg-white'
                  }`} style={msg.role === 'bot' ? { borderLeft: `8px solid ${CHARS[charId].color}` } : {}}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl border-2 border-black shadow-paper-sm">
                    <Loader2 className="animate-spin" size={18} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t-4 border-black flex gap-2 bg-white">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="พิมพ์ถามอะไรก็ได้เลย..."
                className="flex-1 bg-gray-100 border-2 border-black rounded-xl px-4 py-2 text-sm font-bold outline-none"
              />
              <button type="submit" className="bg-black text-white p-2 rounded-xl border-2 border-black hover:bg-gray-800 transition-all">
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button (The Character Icon) */}
      <motion.button
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group"
      >
        <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full border-4 border-black shadow-paper flex items-center justify-center overflow-hidden hover:scale-110 transition-transform active:scale-95">
          <Image 
            src={CHARS[charId].img} 
            alt="Assistant" 
            width={80} 
            height={80} 
            className="object-contain"
          />
        </div>
        <div className="absolute -top-2 -right-2 bg-black text-white w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </motion.button>
    </div>
  )
}