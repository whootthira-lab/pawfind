'use client'
// components/layout/Navbar.tsx — Origami style
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="sticky top-0 z-[200] border-b-[2.5px] border-ori-ink"
      style={{ background: 'rgba(245,237,216,.96)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 select-none">
          <div className="w-9 h-9 rounded-full bg-ori-orange border-[2.5px] border-ori-ink flex items-center justify-center text-lg"
            style={{ boxShadow: '3px 3px 0 #A03010' }}>🐾</div>
          <span className="font-brand text-2xl leading-none">
            <span className="text-ori-green">Pob</span><span className="text-ori-orange">Pet</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-bold text-ori-ink-m">
          <Link href="/search?status=lost" className="hover:text-ori-orange transition-colors">🔔 ตามหาน้อง</Link>
          <Link href="/search?status=found" className="hover:text-ori-blue transition-colors">👀 พบเห็นสัตว์</Link>
          <Link href="/search?status=adoption" className="hover:text-ori-green transition-colors">💖 หาบ้าน</Link>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Link href="/login" className="ori-btn ori-btn-white ori-btn-sm text-sm">เข้าสู่ระบบ</Link>
          <Link href="/report" className="ori-btn ori-btn-orange ori-btn-sm text-sm">⚡ แจ้งหายด่วน</Link>
        </div>
        <button className="md:hidden p-2 border-2 border-ori-ink rounded-lg bg-white"
          style={{ boxShadow: '2px 2px 0 #1A1208' }} onClick={() => setOpen(!open)}>
          {open ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t-2 border-ori-ink px-5 py-4 flex flex-col gap-3"
          style={{ background: '#F5EDD8' }}>
          <Link href="/search?status=lost" onClick={() => setOpen(false)} className="font-bold py-2 border-b border-ori-cream-d">🔔 ตามหาน้อง</Link>
          <Link href="/search?status=found" onClick={() => setOpen(false)} className="font-bold py-2 border-b border-ori-cream-d">👀 พบเห็นสัตว์</Link>
          <Link href="/search?status=adoption" onClick={() => setOpen(false)} className="font-bold py-2 border-b border-ori-cream-d">💖 หาบ้าน</Link>
          <div className="flex gap-2 pt-2">
            <Link href="/login" className="ori-btn ori-btn-white ori-btn-sm flex-1 text-sm">เข้าสู่ระบบ</Link>
            <Link href="/report" className="ori-btn ori-btn-orange ori-btn-sm flex-1 text-sm">⚡ แจ้งหาย</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
