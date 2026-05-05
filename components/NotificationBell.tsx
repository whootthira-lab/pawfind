'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Bell, MessageCircle, User } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

interface Notification {
  id: string
  content: string
  link: string
  is_read: boolean
  created_at: string
  actor_id: string
  type: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))

  const fetchNotifications = useCallback(async () => {
    try {
      // ดึง Session ล่าสุดเสมอเพื่อแก้ปัญหา Error 406 (Not Acceptable)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.user) {
        // หากไม่มี Session ให้หยุดทำงานเงียบๆ ไม่ต้องแสดง Error ใน Console ถี่ๆ
        return
      }

      // ปรับคำสั่ง Query ให้เป็นมาตรฐานสูงสุดเพื่อเลี่ยง Error 400
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        // หากยังเจอ 406 หรือ 400 ให้แจ้ง Error เพียงครั้งเดียวเพื่อการตรวจสอบ[cite: 1]
        console.error('❌ Notification Fetch Error:', error.message)
        return
      }

      if (data) {
        setNotifications(data)
        const unread = data.filter(n => !n.is_read).length
        setUnreadCount(unread)
        // เมื่อสำเร็จแล้ว Log แจ้งเพื่อความมั่นใจในการ Debug[cite: 1]
        if (unread > 0) console.log(`🔔 พบแจ้งเตือนใหม่ ${unread} รายการ`)
      }
    } catch (err) {
      // ดักจับ Error ระดับ Network[cite: 1]
    }
  }, [supabase])

  useEffect(() => {
    // ดึงข้อมูลทันทีครั้งแรกที่โหลด Component[cite: 1]
    fetchNotifications()

    // ตั้งเวลา Polling ทุก 3 วินาทีตามความต้องการ[cite: 1]
    const interval = setInterval(fetchNotifications, 3000)

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      clearInterval(interval) // สำคัญ: ต้องล้าง Interval เพื่อไม่ให้เกิด Memory Leak[cite: 1]
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [fetchNotifications])

  const markAsRead = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    // อัปเดต UI ทันทีเพื่อให้ผู้ใช้รู้สึกลื่นไหล
    setUnreadCount(0)
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => { setIsOpen(!isOpen); if(!isOpen) markAsRead(); }}
        className="relative p-2 text-ori-ink-l hover:bg-ori-cream rounded-full transition-all focus:outline-none"
      >
        <Bell className="w-6 h-6" />
        {/* จุดแดงจะขึ้นเฉพาะเมื่อมี unreadCount > 0 เท่านั้น */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-paper border-2 border-ori-ink overflow-hidden z-50">
          <div className="p-4 border-b-2 border-ori-ink bg-ori-cream-d">
            <h3 className="font-bold text-ori-ink text-sm">การแจ้งเตือนล่าสุด 🐾</h3>
          </div>

          <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <Link 
                  key={notif.id} 
                  href={notif.link}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-start gap-3 p-4 hover:bg-ori-cream transition-colors border-b border-ori-ink last:border-0 ${!notif.is_read ? 'bg-orange-50/50' : ''}`}
                >
                  <div className="bg-white border border-ori-ink p-2 rounded-full flex-shrink-0 shadow-paper-sm">
                    {notif.type === 'comment' ? <MessageCircle size={14} className="text-orange-500" /> : <User size={14} className="text-blue-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ori-ink leading-relaxed break-words">
                      {notif.content}
                    </p>
                    <p className="text-[10px] text-ori-ink-l mt-1 opacity-60">
                      {new Date(notif.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                    </p>
                  </div>
                  {!notif.is_read && <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0 animate-pulse"></div>}
                </Link>
              ))
            ) : (
              <div className="p-10 text-center text-ori-ink-l text-xs italic">
                ยังไม่มีการแจ้งเตือนใหม่ในตอนนี้...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}