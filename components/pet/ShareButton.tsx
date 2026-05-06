'use client'
// components/pet/ShareButton.tsx — แทนที่ไฟล์เดิม

import { useState } from 'react'
import { Share2, Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { trackEvent } from '@/lib/analytics'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawfind-eta.vercel.app'

interface ShareButtonProps {
  petName: string
  status: string
  petId: string          // ← เพิ่ม prop นี้ (ใส่ params.id จาก page.tsx)
}

interface Platform {
  name: string
  icon: string
  color: string
  build: (url: string, text: string) => string
}

const PLATFORMS: Platform[] = [
  {
    name: 'Facebook',
    icon: '📘',
    color: '#1877F2',
    // Facebook ไม่รับ text ใน URL — ใช้แค่ URL แล้วดึง OG tag เอง
    build: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: 'X (Twitter)',
    icon: '🐦',
    color: '#000000',
    build: (url, text) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    name: 'LINE',
    icon: '💬',
    color: '#00B900',
    build: (url, text) =>
      `https://line.me/R/share?text=${encodeURIComponent(text + '\n' + url)}`,
  },
  {
    name: 'Threads',
    icon: '🧵',
    color: '#000000',
    build: (url, text) =>
      `https://threads.net/intent/post?text=${encodeURIComponent(text + '\n' + url)}`,
  },
  {
    name: 'WhatsApp',
    icon: '📱',
    color: '#25D366',
    build: (url, text) =>
      `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`,
  },
]

export default function ShareButton({ petName, status, petId }: ShareButtonProps) {
  const [copied, setCopied]     = useState(false)
  const [open, setOpen]         = useState(false)

  const pageUrl  = `${BASE_URL}/pet/${petId}`
  const shareText = `${status}: ${petName} - ช่วยแชร์เพื่อส่งน้องกลับบ้าน 🐾`

  // ── Native share (มือถือ iOS/Android) ──
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${status}: ${petName} - Pobpet`,
          text: shareText,
          url: pageUrl,
        })
        trackEvent('share_clicked', {
          targetId: petId,
          platform: 'native_share',
          metadata: { petName, status },
        })
      } catch {
        // user cancelled — ไม่ track
      }
      return
    }
    // Desktop → เปิด dropdown
    setOpen(prev => !prev)
  }

  // ── Copy link ──
  const handleCopy = async () => {
    await navigator.clipboard.writeText(pageUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setOpen(false)
    trackEvent('share_clicked', {
      targetId: petId,
      platform: 'copy_link',
      metadata: { petName, status },
    })
  }

  // ── Open platform popup ──
  const openPlatform = (platform: Platform) => {
    const url = platform.build(pageUrl, shareText)
    window.open(url, '_blank', 'width=600,height=500,noopener,noreferrer')
    setOpen(false)
    trackEvent('share_clicked', {
      targetId: petId,
      platform: platform.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      metadata: { petName, status },
    })
  }

  return (
    <div className="relative">
      {/* Main share button */}
      <div className="flex gap-2">
        <Button
          onClick={handleNativeShare}
          className="bg-wagashi-sora text-black hover:bg-blue-300 border-2 border-black px-4 py-2 rounded-lg font-bold shadow-paper-sm flex items-center gap-2 hover:-translate-y-1 transition-all active:translate-y-0"
        >
          {copied ? <Check size={18} /> : <Share2 size={18} />}
          {copied ? 'คัดลอกแล้ว!' : 'แชร์โพสต์นี้'}
        </Button>

        {/* Desktop: toggle dropdown */}
        <Button
          onClick={() => setOpen(prev => !prev)}
          className="bg-wagashi-sora text-black hover:bg-blue-300 border-2 border-black px-2 py-2 rounded-lg font-bold shadow-paper-sm hover:-translate-y-1 transition-all md:flex hidden"
          aria-label="เลือกช่องทางแชร์"
        >
          <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Dropdown — platform chooser */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white border-2 border-black rounded-xl shadow-paper-lg overflow-hidden min-w-[200px]">
          {PLATFORMS.map((p) => (
            <button
              key={p.name}
              onClick={() => openPlatform(p)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left font-bold text-sm border-b border-gray-100 last:border-none"
            >
              <span className="text-xl">{p.icon}</span>
              <span>{p.name}</span>
            </button>
          ))}
          {/* Copy link */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left font-bold text-sm border-t-2 border-black bg-gray-50"
          >
            <span className="text-xl">{copied ? '✅' : '🔗'}</span>
            <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
          </button>
        </div>
      )}

      {/* Click outside to close */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}