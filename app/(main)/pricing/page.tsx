'use client'
// app/(main)/pricing/page.tsx

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Check, X, Crown, PawPrint, Zap,
  MessageCircle, Bell, QrCode, FileText,
  Heart, Shield, ChevronRight
} from 'lucide-react'

// ── Feature rows ────────────────────────────────────────────
const FEATURES = [
  { label: 'ประกาศสัตว์หาย / แจ้งพบ',     free: true,       member: true,        icon: PawPrint },
  { label: 'AI Matching อัตโนมัติ',          free: true,       member: true,        icon: Zap },
  { label: 'Web Push Notification',          free: true,       member: true,        icon: Bell },
  { label: 'Chatbot ถามตอบ',                free: '5 ครั้ง/วัน', member: 'ไม่จำกัด', icon: MessageCircle },
  { label: 'Pet Profile',                    free: '1 ตัว',    member: '3 ตัว',     icon: PawPrint },
  { label: 'รูปภาพต่อโปรไฟล์',              free: '3 รูป',    member: '10 รูป',    icon: null },
  { label: 'AI Caption รูปอัตโนมัติ',       free: false,      member: true,        icon: null },
  { label: 'ประวัติสุขภาพ / วัคซีน / ยา',  free: false,      member: true,        icon: Heart },
  { label: 'บันทึกผ่าน Chatbot ได้เลย',    free: false,      member: true,        icon: null },
  { label: 'แจ้งเตือนวัคซีน / นัดหมอ',    free: false,      member: true,        icon: Bell },
  { label: 'QR Code ปลอกคอ',               free: false,      member: '3 อัน',     icon: QrCode },
  { label: 'Export สมุดสุขภาพ PDF',         free: false,      member: true,        icon: FileText },
  { label: 'Mode: หาคู่ / หาบ้าน / โชว์',  free: false,      member: true,        icon: null },
  { label: 'LINE OA แจ้งเตือน Match ด่วน', free: false,      member: true,        icon: null },
  { label: 'ประวัติพ่อ-แม่ เชื่อม Profile', free: false,     member: true,        icon: null },
]

// ── Cell renderer ────────────────────────────────────────────
function Cell({ val }: { val: boolean | string }) {
  if (val === true)  return <Check size={18} className="text-green-600 mx-auto" />
  if (val === false) return <X    size={18} className="text-gray-300 mx-auto" />
  return <span className="text-sm font-bold text-ori-ink">{val}</span>
}

// ── Main ─────────────────────────────────────────────────────
export default function PricingPage() {
  const router  = useRouter()
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [plan,        setPlan]        = useState<'free' | 'member'>('free')
  const [isLoggedIn,  setIsLoggedIn]  = useState(false)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
      if (session) {
        supabase
          .from('subscriptions')
          .select('plan')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => { if (data) setPlan(data.plan as any) })
      }
      setLoading(false)
    })
  }, [supabase])

  const handleUpgrade = () => {
    if (!isLoggedIn) { router.push('/login?next=/pricing'); return }
    router.push('/payment/slip')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 mb-20">

      {/* ── Header ── */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black mb-3">เลือกแพ็คเกจ 🐾</h1>
        <p className="text-ori-ink-l font-bold max-w-lg mx-auto">
          ฟีเจอร์หลักใช้ฟรีตลอด · อัปเกรดเพื่อ LINE OA และสมุดสุขภาพน้อง
        </p>
      </div>

      {/* ── Plan cards ── */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">

        {/* Free */}
        <div className={`border-4 rounded-3xl p-8 transition-all ${
          plan === 'free'
            ? 'border-ori-ink bg-white shadow-paper'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <PawPrint size={28} className="text-ori-ink" />
            <h2 className="text-2xl font-black">Free</h2>
          </div>
          <div className="text-4xl font-black mb-1">฿0</div>
          <p className="text-sm text-ori-ink-l font-bold mb-6">ตลอดชีพ · ไม่มีวันหมดอายุ</p>
          <ul className="space-y-2 text-sm font-bold text-ori-ink-l">
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500 shrink-0" /> ประกาศหาย / แจ้งพบ ไม่จำกัด</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500 shrink-0" /> AI Matching อัตโนมัติ</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500 shrink-0" /> Pet Profile 1 ตัว</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500 shrink-0" /> Chatbot 5 ครั้ง/วัน</li>
            <li className="flex items-center gap-2"><X    size={16} className="text-gray-300 shrink-0" /> LINE OA แจ้งเตือน</li>
            <li className="flex items-center gap-2"><X    size={16} className="text-gray-300 shrink-0" /> สมุดสุขภาพน้อง</li>
          </ul>

          {plan === 'free' && (
            <div className="mt-6 w-full py-3 rounded-2xl border-2 border-gray-300
              bg-gray-100 text-center text-sm font-black text-gray-500">
              แพ็คเกจปัจจุบัน
            </div>
          )}
        </div>

        {/* Member */}
        <div className={`border-4 rounded-3xl p-8 relative transition-all ${
          plan === 'member'
            ? 'border-amber-400 bg-amber-50 shadow-paper'
            : 'border-amber-300 bg-white shadow-paper'
        }`}>
          {/* Popular badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2
            bg-amber-400 text-white px-4 py-1 rounded-full
            text-xs font-black border-2 border-amber-600">
            ⭐ แนะนำ
          </div>

          <div className="flex items-center gap-3 mb-2">
            <Crown size={28} className="text-amber-500" />
            <h2 className="text-2xl font-black">Member</h2>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-4xl font-black">฿399</span>
            <span className="text-ori-ink-l font-bold">/ปี</span>
          </div>
          <p className="text-sm text-ori-ink-l font-bold mb-1">
            เฉลี่ยแค่ <strong className="text-amber-600">฿33/เดือน</strong>
          </p>
          <p className="text-xs text-green-600 font-black mb-6">
            ถูกกว่าค่าวัคซีน 1 เข็ม · ได้ทุกอย่างตลอดปี
          </p>
          <ul className="space-y-2 text-sm font-bold text-ori-ink-l">
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500 shrink-0" /> ทุกอย่างใน Free</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500 shrink-0" /> Pet Profile 3 ตัว · รูป 10 รูป/ตัว</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500 shrink-0" /> สมุดสุขภาพ วัคซีน ยา ครบ</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500 shrink-0" /> บันทึกผ่าน Chatbot · แจ้งเตือนอัตโนมัติ</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500 shrink-0" /> QR Code ปลอกคอ 3 อัน</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500 shrink-0" /> LINE OA แจ้งเตือน Match ด่วน</li>
          </ul>

          {plan === 'member' ? (
            <div className="mt-6 w-full py-3 rounded-2xl border-2 border-amber-400
              bg-amber-100 text-center text-sm font-black text-amber-700">
              <Crown size={14} className="inline mr-1" /> แพ็คเกจปัจจุบัน
            </div>
          ) : (
            <button onClick={handleUpgrade}
              className="mt-6 w-full py-4 rounded-2xl border-4 border-ori-ink
                bg-ori-ink text-white font-black text-lg shadow-paper
                hover:shadow-paper-lg hover:-translate-y-1 transition-all
                flex items-center justify-center gap-2 active:translate-y-0">
              อัปเกรดเลย <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── Comparison table ── */}
      <div className="bg-white border-4 border-ori-ink rounded-3xl overflow-hidden shadow-paper mb-10">
        <div className="grid grid-cols-3 bg-ori-ink text-white">
          <div className="p-4 font-black text-sm">ฟีเจอร์</div>
          <div className="p-4 font-black text-sm text-center border-l-2 border-white/20">Free</div>
          <div className="p-4 font-black text-sm text-center border-l-2 border-white/20 bg-amber-500">
            <Crown size={14} className="inline mr-1" /> Member
          </div>
        </div>
        {FEATURES.map((f, i) => (
          <div key={i}
            className={`grid grid-cols-3 border-t-2 border-gray-100 ${
              i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
            }`}>
            <div className="p-3 text-sm font-bold text-ori-ink flex items-center gap-2">
              {f.icon && <f.icon size={14} className="text-ori-ink-l shrink-0" />}
              {f.label}
            </div>
            <div className="p-3 flex items-center justify-center border-l-2 border-gray-100">
              <Cell val={f.free} />
            </div>
            <div className="p-3 flex items-center justify-center border-l-2 border-gray-100 bg-amber-50/50">
              <Cell val={f.member} />
            </div>
          </div>
        ))}
      </div>

      {/* ── How to pay ── */}
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-8 shadow-paper mb-6">
        <h3 className="text-xl font-black mb-4 flex items-center gap-2">
          <Shield size={20} /> วิธีชำระเงิน
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm font-bold">
          {[
            { step: '1', title: 'โอนเงิน', desc: 'โอน ฿399 ผ่าน PromptPay หรือโอนธนาคาร' },
            { step: '2', title: 'ส่งสลิป', desc: 'อัปโหลดสลิปในหน้าถัดไป AI ตรวจสอบอัตโนมัติ' },
            { step: '3', title: 'เปิดใช้งาน', desc: 'ได้รับ Member ทันทีหลังสลิปผ่าน ภายใน 30 วินาที' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-ori-ink text-white
                flex items-center justify-center font-black shrink-0 text-sm">
                {s.step}
              </div>
              <div>
                <p className="font-black text-ori-ink">{s.title}</p>
                <p className="text-ori-ink-l text-xs mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-green-50 rounded-2xl border border-green-200
          text-xs font-bold text-green-700 flex items-start gap-2">
          <Shield size={14} className="shrink-0 mt-0.5" />
          ข้อมูลสลิปถูกตรวจสอบโดย AI และทีมงาน · ไม่มีการเก็บข้อมูลบัตรเครดิต
        </div>
      </div>

      {/* ── CTA ── */}
      {plan !== 'member' && (
        <div className="text-center">
          <button onClick={handleUpgrade}
            className="inline-flex items-center gap-2 px-10 py-5 bg-ori-ink
              text-white font-black text-xl rounded-2xl border-4 border-ori-ink
              shadow-paper hover:shadow-paper-lg hover:-translate-y-1 transition-all">
            <Crown size={22} className="text-amber-400" />
            อัปเกรด Member ฿399/ปี
            <ChevronRight size={20} />
          </button>
          <p className="mt-3 text-xs font-bold text-ori-ink-l">
            ยกเลิกได้ตลอด · ข้อมูลน้องปลอดภัย · Grace Period 30 วัน
          </p>
        </div>
      )}
    </div>
  )
}
