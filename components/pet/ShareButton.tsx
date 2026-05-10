'use client'
// components/pet/ShareButton.tsx

import { useState, useEffect } from 'react'
import { Share2, Check, ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackEvent, buildShareUrl } from '@/lib/analytics'
import { createBrowserClient } from '@supabase/ssr'

interface ShareButtonProps {
  petName: string
  status:  string
  petId:   string
}

interface Platform {
  name:  string
  icon:  string
  key:   string   // ← ชื่อสั้นสำหรับ UTM + analytics
  build: (url: string, text: string) => string
}

const PLATFORMS: Platform[] = [
  {
    name: 'Facebook', icon: '📘', key: 'facebook',
    build: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: 'X (Twitter)', icon: '🐦', key: 'twitter',
    build: (url, text) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    name: 'LINE', icon: '💬', key: 'line',
    build: (url, text) =>
      `https://line.me/R/share?text=${encodeURIComponent(text + '\n' + url)}`,
  },
  {
    name: 'Threads', icon: '🧵', key: 'threads',
    build: (url, text) =>
      `https://threads.net/intent/post?text=${encodeURIComponent(text + '\n' + url)}`,
  },
  {
    name: 'WhatsApp', icon: '📱', key: 'whatsapp',
    build: (url, text) =>
      `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`,
  },
]

export default function ShareButton({ petName, status, petId }: ShareButtonProps) {
  const [copied,  setCopied]  = useState(false)
  const [open,    setOpen]    = useState(false)
  const [isPreparing, setIsPreparing] = useState(false) // 💡 เพิ่ม State สำหรับโหลด
  const [userId,  setUserId]  = useState<string | null>(null)

  // ── ดึง userId เพื่อใส่ใน ref layer ──────────────────────────
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null)
    })
  }, [])

  const shareText = `${status}: ${petName} — ช่วยแชร์เพื่อส่งน้องกลับบ้าน 🐾`

  // 💡 ฟังก์ชันสั่งอุ่นเครื่องแคช
  const prewarmOgImage = async () => {
    try {
      await fetch(`/api/og?id=${petId}`)
    } catch (e) {
      console.error("OG prewarm failed", e)
    }
  }

  // ── Native share (มือถือ) ─────────────────────────────────────
  const handleNativeShare = async () => {
    if (navigator.share) {
      setIsPreparing(true) // เปิดโหลดติ้วๆ
      await prewarmOgImage() // รอวาดรูป
      setIsPreparing(false) // ปิดโหลด

      const shareUrl = buildShareUrl(petId, 'native_share', userId)

      try {
        await navigator.share({
          title: `${status}: ${petName} - PobPet`,
          text:  shareText,
          url:   shareUrl,
        })
        trackEvent('share_clicked', {
          targetId: petId,
          platform: 'native_share',
          metadata: { petName, status, hasUserId: !!userId },
        })
      } catch {
        // user กด cancel → ไม่ track
      }
      return
    }
    // Desktop → toggle dropdown
    setOpen(prev => !prev)
  }

  // ── Copy link ────────────────────────────────────────────────
  const handleCopy = async () => {
    setIsPreparing(true)
    await prewarmOgImage() // แอบวาดรูปรอไว้เลย พอยูสเซอร์เอาไปแปะเฟสจะได้ขึ้นทันที
    
    const copyUrl = buildShareUrl(petId, 'copy_link', userId)
    await navigator.clipboard.writeText(copyUrl)
    
    setIsPreparing(false)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setOpen(false)
    
    trackEvent('share_clicked', {
      targetId: petId,
      platform: 'copy_link',
      metadata: { petName, status },
    })
  }

  // ── Platform popup ───────────────────────────────────────────
  const openPlatform = async (p: Platform) => {
    setOpen(false) // ปิดเมนู dropdown ก่อน
    setIsPreparing(true) // ขึ้นโหลดที่ปุ่มหลัก
    
    await prewarmOgImage() // รอวาดรูปเสร็จ
    
    const shareUrl = buildShareUrl(petId, p.key, userId)
    const url      = p.build(shareUrl, shareText)
    
    window.open(url, '_blank', 'width=600,height=500,noopener,noreferrer')
    setIsPreparing(false)
    
    trackEvent('share_clicked', {
      targetId: petId,
      platform: p.key,
      metadata: { petName, status, hasUserId: !!userId },
    })
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Button
          onClick={handleNativeShare}
          disabled={isPreparing}
          className="bg-wagashi-sora text-black hover:bg-blue-300 border-2 border-black px-4 py-2 rounded-lg font-bold shadow-paper-sm flex items-center gap-2 hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-80 disabled:cursor-not-allowed"
        >
          {isPreparing ? (
            <Loader2 className="animate-spin" size={18} />
          ) : copied ? (
            <Check size={18} />
          ) : (
            <Share2 size={18} />
          )}
          {isPreparing ? 'กำลังเตรียมภาพ...' : copied ? 'คัดลอกแล้ว!' : 'แชร์โพสต์นี้'}
        </Button>

        <Button
          onClick={() => setOpen(prev => !prev)}
          disabled={isPreparing}
          className="bg-wagashi-sora text-black hover:bg-blue-300 border-2 border-black px-2 py-2 rounded-lg font-bold shadow-paper-sm hover:-translate-y-1 transition-all md:flex hidden disabled:opacity-80 disabled:cursor-not-allowed"
          aria-label="เลือกช่องทางแชร์"
        >
          <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white border-2 border-black rounded-xl shadow-paper-lg overflow-hidden min-w-[200px]">
          {PLATFORMS.map(p => (
            <button key={p.key} onClick={() => openPlatform(p)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left font-bold text-sm border-b border-gray-100 last:border-none">
              <span className="text-xl">{p.icon}</span>
              <span>{p.name}</span>
            </button>
          ))}
          <button onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left font-bold text-sm border-t-2 border-black bg-gray-50">
            <span className="text-xl">{copied ? '✅' : '🔗'}</span>
            <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
          </button>
        </div>
      )}

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  )
}