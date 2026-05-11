'use client'
// components/layout/Navbar.tsx — Origami design system update
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, LogOut, User, CalendarPlus, Trophy } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { SearchBar } from '@/components/layout/SearchBar'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      router.refresh() 
    })
    return () => subscription.unsubscribe()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/') 
  }

  return (
    <nav className="sticky top-0 z-[200] border-b-[2.5px] border-ori-ink flex flex-col"
      style={{ background: 'rgba(245,237,216,.96)', backdropFilter: 'blur(12px)' }}>
      
      {/* ชั้นที่ 1: โลโก้ และ เมนูหลัก (เน้นภารกิจหลัก: ตามหาสัตว์) */}
      <div className="max-w-6xl w-full mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 select-none shrink-0">
          <div className="w-9 h-9 rounded-full bg-ori-orange border-[2.5px] border-ori-ink flex items-center justify-center text-lg shadow-paper-sm">🐾</div>
          <span className="font-brand text-2xl leading-none">
            <span className="text-ori-green">Pob</span><span className="text-ori-orange">Pet</span>
          </span>
        </Link>
        
        <div className="hidden lg:flex items-center gap-6 text-sm font-black text-ori-ink-m whitespace-nowrap">
          <Link href="/report?status=lost" className="hover:text-ori-orange transition-colors">🔔 โพสต์ประกาศหาน้อง</Link>
          <Link href="/report?status=found" className="hover:text-ori-blue transition-colors">👀 โพสต์แจ้งพบสัตว์หลง</Link>
          <Link href="/report?status=adoption" className="hover:text-ori-green transition-colors">💖 ลงประกาศหาบ้านให้น้อง</Link>
        </div>
        
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {/* ปุ่มสร้างประกาศข่าว (ไอคอนปฏิทิน) — สำหรับเข้าหน้าฟอร์ม /events/create */}
              <Link href="/events/create" className="p-2 hover:bg-ori-blue-d/10 rounded-full text-ori-blue-d transition-all group relative">
                <CalendarPlus size={22} strokeWidth={2.5} />
                <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">สร้างประกาศข่าว</span>
              </Link>
              <Link href="/profile" className="ori-btn ori-btn-white ori-btn-sm text-sm px-4 flex items-center gap-2 shadow-paper-sm">
                <User size={16} /> บัญชี
              </Link>
              <button onClick={handleLogout} className="ori-btn ori-btn-white ori-btn-sm text-sm px-3 text-red-600 hover:bg-red-50">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link href="/login" className="ori-btn ori-btn-white ori-btn-sm text-sm">เข้าสู่ระบบ</Link>
          )}
          <Link href="/report" className="ori-btn ori-btn-orange ori-btn-sm text-sm hidden xl:flex">⚡ แจ้งหายด่วน</Link>
        </div>

        <button className="md:hidden p-2 border-2 border-ori-ink rounded-lg bg-white" onClick={() => setOpen(!open)}>
          {open ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>

      {/* ชั้นที่ 2: ช่องค้นหาอัจฉริยะ และทางเข้ากระดานข่าวชุมชน (Desktop) */}
      <div className="hidden md:block bg-white/40 border-t-[1px] border-ori-ink/5 py-3">
        <div className="max-w-6xl mx-auto px-5 w-full flex items-center gap-6">
          {/* 💡 เพิ่มปุ่มสำหรับกดเข้าสู่กระดานข่าวรวม (/events) เพื่อแก้ปัญหาไม่มีหัวข้อให้กด */}
          <Link href="/events" className="flex items-center gap-2 shrink-0 font-black text-sm text-ori-blue-d hover:bg-ori-blue-d hover:text-white px-4 py-2 rounded-full border-2 border-ori-blue-d transition-all shadow-paper-sm bg-white">
            <Trophy size={16} /> ข่าวสารชุมชน
          </Link>
          
          <div className="flex-grow">
            <SearchBar />
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t-2 border-ori-ink px-5 py-4 flex flex-col gap-4 bg-[#F5EDD8]">
          <SearchBar />
          <div className="flex flex-col gap-2 font-bold">
            <Link href="/report?status=lost" className="py-2 border-b border-black/5" onClick={() => setOpen(false)}>🔔 ลงประกาศหาน้อง</Link>
            <Link href="/report?status=found" className="py-2 border-b border-black/5" onClick={() => setOpen(false)}>👀 แจ้งพบสัตว์หลง</Link>
            <Link href="/report?status=adoption" className="py-2 border-b border-black/5" onClick={() => setOpen(false)}>💖 ลงประกาศหาบ้านให้น้อง</Link>
            {/* ทางเข้ากระดานข่าวสำหรับมือถือ */}
            <Link href="/events" className="py-2 border-b border-black/5 text-ori-blue-d font-black" onClick={() => setOpen(false)}>🏆 ข่าวสารชุมชน</Link>
            <Link href="/events/create" className="py-2 text-ori-blue-d font-black italic" onClick={() => setOpen(false)}>📢 สร้างข่าวประชาสัมพันธ์ / กิจกรรม</Link>
          </div>
        </div>
      )}
    </nav>
  )
}