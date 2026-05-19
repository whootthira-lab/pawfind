'use client'
// app/(main)/payment/success/page.tsx

import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { Crown, CheckCircle2, ChevronRight, PawPrint, Bell, QrCode, Heart } from 'lucide-react'

export default function PaymentSuccessPage() {
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      supabase
        .from('subscriptions')
        .select('expires_at')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.expires_at) {
            setExpiresAt(
              new Date(data.expires_at).toLocaleDateString('th-TH', {
                year: 'numeric', month: 'long', day: 'numeric'
              })
            )
          }
        })
    })
  }, [supabase])

  const features = [
    { icon: PawPrint, text: 'Pet Profile 3 ตัว พร้อมประวัติสุขภาพครบ' },
    { icon: Bell,     text: 'แจ้งเตือนวัคซีนและนัดหมออัตโนมัติ' },
    { icon: QrCode,   text: 'QR Code ปลอกคอ 3 อัน พร้อมใช้เลย' },
    { icon: Heart,    text: 'LINE OA แจ้งเตือน Match ด่วนทันที' },
  ]

  return (
    <div className="max-w-lg mx-auto px-4 py-16 mb-20 text-center">

      {/* Icon */}
      <div className="w-24 h-24 rounded-full bg-amber-100 border-4 border-amber-400
        flex items-center justify-center mx-auto mb-6 shadow-paper">
        <Crown size={44} className="text-amber-500" />
      </div>

      {/* Heading */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <CheckCircle2 size={22} className="text-green-500" />
        <h1 className="text-3xl font-black">ยินดีต้อนรับสู่ Member! 🎉</h1>
      </div>
      <p className="text-ori-ink-l font-bold mb-1">
        แพ็คเกจของคุณเปิดใช้งานแล้ว
      </p>
      {expiresAt && (
        <p className="text-sm font-bold text-amber-600 mb-8">
          หมดอายุ: {expiresAt}
        </p>
      )}

      {/* Features unlocked */}
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-6
        shadow-paper text-left mb-8">
        <p className="font-black text-sm text-ori-ink-l mb-4 uppercase tracking-wide">
          ฟีเจอร์ที่ปลดล็อคแล้ว
        </p>
        <ul className="space-y-3">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-300
                flex items-center justify-center shrink-0">
                <f.icon size={14} className="text-amber-600" />
              </div>
              <span className="font-bold text-ori-ink text-sm">{f.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3">
        <Link href="/pets/new"
          className="flex items-center justify-center gap-2 py-4 px-6
            bg-ori-ink text-white font-black text-lg rounded-2xl
            border-4 border-ori-ink shadow-paper
            hover:shadow-paper-lg hover:-translate-y-1 transition-all">
          <PawPrint size={20} /> สร้างโปรไฟล์น้องแรก
          <ChevronRight size={18} />
        </Link>
        <Link href="/dashboard/pets"
          className="flex items-center justify-center gap-2 py-3 px-6
            bg-white text-ori-ink font-black rounded-2xl
            border-4 border-ori-ink shadow-paper-sm
            hover:shadow-paper hover:-translate-y-0.5 transition-all">
          จัดการโปรไฟล์น้อง
        </Link>
        <Link href="/"
          className="text-sm font-bold text-ori-ink-l hover:text-ori-ink
            transition-colors underline underline-offset-2">
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  )
}
