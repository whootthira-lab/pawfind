'use client'

import { Share2, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function ShareButton({ petName, status }: { petName: string, status: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareData = {
      title: `${status}: ${petName} - PawFind`,
      text: `ช่วยแชร์พิกัดและข้อมูลของ ${petName} เพื่อสนับสนุนคอมมูนิตี้ PawFind ของเราครับ`,
      url: window.location.href, // ดึงลิงก์ปัจจุบันไปแชร์อัตโนมัติ
    }

    // ถ้ามือถือรองรับระบบแชร์ (เด้งเข้า Line/FB ได้เลย)
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('ยกเลิกการแชร์')
      }
    } else {
      // ถ้าเปิดบนคอมฯ หรือเบราว์เซอร์เก่า จะใช้การก๊อปปี้ลิงก์แทน
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button
      onClick={handleShare}
      className="bg-wagashi-sora text-black hover:bg-blue-300 border-2 border-black px-4 py-2 rounded-lg font-bold shadow-paper-sm flex items-center gap-2 hover:-translate-y-1 transition-all active:translate-y-0"
    >
      {copied ? <Check size={18} /> : <Share2 size={18} />}
      {copied ? 'คัดลอกลิงก์แล้ว' : 'แชร์โพสต์นี้'}
    </Button>
  )
}