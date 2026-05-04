'use client'

import { useEffect, useState, useRef } from 'react'
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
  
  // อัปเดตการเรียกใช้ Supabase แบบใหม่
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const loadNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!error && data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.is_read).length)
      }
    }

    loadNotifications()

    const channel = supabase
      .channel('notification_updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' }, 
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications(prev => [newNotif, ...prev].slice(0, 5))
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [supabase])

  const markAsRead = async () => {
    setUnreadCount(0)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => { setIsOpen(!isOpen); if(!isOpen) markAsRead(); }}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-800">การแจ้งเตือน</h3>
            <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">ทั้งหมด</span>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <Link 
                  key={notif.id} 
                  href={notif.link}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-start gap-3 p-4 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="bg-blue-100 p-2 rounded-full">
                    {notif.type === 'comment' ? <MessageCircle className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 leading-snug">
                      <span className="font-semibold text-gray-900">มีคนใหม่</span> {notif.content}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(notif.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                    </p>
                  </div>
                  {!notif.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>}
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                ยังไม่มีการแจ้งเตือนใหม่ 🐾
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}