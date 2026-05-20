'use client'
// app/(main)/pricing/addon/page.tsx

import Link from 'next/link'
import { Plus, PawPrint, Crown, ChevronLeft, ChevronRight } from 'lucide-react'

const ADDONS = [
  {
    id:      'addon_1',
    slots:   1,
    price:   79,
    label:   '+1 ตัว',
    desc:    'เพิ่มโปรไฟล์น้อง 1 ตัว',
    per:     '฿79/ปี ต่อ 1 ตัว',
    popular: false,
  },
  {
    id:      'addon_3',
    slots:   3,
    price:   199,
    label:   '+3 ตัว',
    desc:    'เพิ่มโปรไฟล์น้อง 3 ตัว ประหยัดกว่า 16%',
    per:     '฿66/ปี ต่อ 1 ตัว',
    popular: true,
  },
]

export default function AddonPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-10 mb-20">

      {/* Back */}
      <Link href="/account/subscription"
        className="inline-flex items-center gap-1 text-sm font-black
          text-ori-ink-l hover:text-ori-ink mb-6 transition-colors">
        <ChevronLeft size={16} /> กลับหน้าจัดการแพ็คเกจ
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
          <Plus size={28} /> ซื้อ Slot น้องเพิ่ม
        </h1>
        <p className="text-ori-ink-l font-bold text-sm">
          สำหรับ Member เท่านั้น · Slot ผูกกับ Member — ต่ออายุ Member แล้ว Slot ยังอยู่
        </p>
      </div>

      {/* Addon cards */}
      <div className="space-y-4 mb-8">
        {ADDONS.map(addon => (
          <div key={addon.id}
            className={`border-4 rounded-3xl p-6 shadow-paper relative ${
              addon.popular ? 'border-ori-orange bg-amber-50' : 'border-ori-ink bg-white'
            }`}>
            {addon.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2
                bg-ori-orange text-white px-4 py-1 rounded-full
                text-xs font-black border-2 border-amber-600">
                ประหยัดกว่า!
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <PawPrint size={20} className="text-ori-ink" />
                  <span className="text-xl font-black">{addon.label}</span>
                </div>
                <p className="text-sm font-bold text-ori-ink-l">{addon.desc}</p>
                <p className="text-xs font-black text-amber-600 mt-0.5">{addon.per}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black">฿{addon.price}</p>
                <p className="text-xs font-bold text-ori-ink-l">/ปี</p>
              </div>
            </div>

            <Link
              href={`/payment/slip?type=${addon.id}&amount=${addon.price}`}
              className={`flex items-center justify-center gap-2 py-3 px-6
                font-black rounded-xl border-2 transition-all
                shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5 ${
                addon.popular
                  ? 'bg-ori-ink text-white border-ori-ink'
                  : 'bg-white text-ori-ink border-ori-ink'
              }`}>
              ซื้อ {addon.label} ฿{addon.price}
              <ChevronRight size={16} />
            </Link>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper">
        <h2 className="font-black text-lg mb-3">คำถามที่พบบ่อย</h2>
        {[
          {
            q: 'ซื้อ Add-on แล้ว slot เพิ่มทันทีไหม?',
            a: 'ทันทีหลังสลิปผ่าน AI ตรวจ ภายใน 30 วินาทีค่ะ',
          },
          {
            q: 'ถ้าซื้อ +1 สองครั้ง จะมีกี่ slot?',
            a: 'สะสมได้ครับ 3 (base) + 1 + 1 = 5 slot รวม',
          },
          {
            q: 'ถ้า Member หมดอายุ Addon จะหายไหม?',
            a: 'ไม่หาย แต่จะหยุดใช้งานชั่วคราว ต่ออายุ Member แล้ว Addon กลับมาเองค่ะ',
          },
          {
            q: 'Free user ซื้อ Addon ได้ไหม?',
            a: 'ไม่ได้ครับ ต้องเป็น Member ก่อน แล้วค่อยซื้อ Addon เพิ่ม',
          },
        ].map((item, i) => (
          <div key={i} className={`py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
            <p className="font-black text-sm text-ori-ink">{item.q}</p>
            <p className="text-sm font-bold text-ori-ink-l mt-1">{item.a}</p>
          </div>
        ))}
      </div>

      {/* Not member nudge */}
      <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-300
        rounded-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Crown size={18} className="text-amber-500 shrink-0" />
          <p className="text-sm font-bold text-amber-800">
            ยังไม่ได้เป็น Member? สมัครก่อนเพื่อใช้ Add-on
          </p>
        </div>
        <Link href="/pricing"
          className="text-xs font-black text-amber-700 bg-amber-200
            px-3 py-2 rounded-xl border border-amber-400 shrink-0
            hover:bg-amber-300 transition-all">
          ฿399/ปี →
        </Link>
      </div>
    </div>
  )
}
