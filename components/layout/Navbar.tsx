'use client'
// components/layout/Navbar.tsx — Origami style
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, LogOut, User, Search } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

// 💡 1. นำเข้า Component ช่องค้นหาที่เราสร้างไว้
import { SearchBar } from '@/components/layout/SearchBar'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [mobileQuery, setMobileQuery] = useState('') // สำหรับช่องค้นหาบนมือถือ
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

  // 💡 ฟังก์ชันค้นหาและเก็บสถิติสำหรับเวอร์ชันมือถือ
  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedQuery = mobileQuery.trim()
    if (trimmedQuery) {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_id: 'mobile_search_bar',
          target_type: 'search_query',
          metadata: { keyword: trimmedQuery }
        })
      }).catch(() => {}) 

      setOpen(false) // ปิดเมนูมือถือ
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
    }
  }

  return (
    <nav className="sticky top-0 z-[200] border-b-[2.5px] border-ori-ink"
      style={{ background: 'rgba(245,237,216,.96)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 select-none shrink-0">
          <div className="w-9 h-9 rounded-full bg-ori-orange border-[2.5px] border-ori-ink flex items-center justify-center text-lg"
            style={{ boxShadow: '3px 3px 0 #A03010' }}>🐾</div>
          <span className="font-brand text-2xl leading-none">
            <span className="text-ori-green">Pob</span><span className="text-ori-orange">Pet</span>
          </span>
        </Link>
        
        {/* 💡 เปลี่ยนจาก md:flex เป็น lg:flex เพื่อเว้นที่ให้ SearchBar บนหน้าจอขนาดกลาง */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-6 text-sm font-bold text-ori-ink-m whitespace-nowrap">
          <Link href="/report?status=lost" className="hover:text-ori-orange transition-colors">🔔 หาน้อง</Link>
          <Link href="/report?status=found" className="hover:text-ori-blue transition-colors">👀 พบสัตว์หลง</Link>
          <Link href="/report?status=adoption" className="hover:text-ori-green transition-colors">💖 หาบ้าน</Link>
        </div>
        
        <div className="hidden md:flex items-center gap-3 w-full max-w-md justify-end pl-4">
          {/* 💡 2. วาง SearchBar ไว้ตรงนี้สำหรับ Desktop */}
          <SearchBar />

          {user ? (
            <>
              <Link href="/profile" className="ori-btn ori-btn-white ori-btn-sm text-sm px-3 flex items-center gap-2 shrink-0">
                <User size={16} /> บัญชีของฉัน
              </Link>
              <button onClick={handleLogout} className="ori-btn ori-btn-white ori-btn-sm text-sm px-3 text-red-600 hover:bg-red-50 shrink-0">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link href="/login" className="ori-btn ori-btn-white ori-btn-sm text-sm shrink-0">เข้าสู่ระบบ</Link>
          )}
          <Link href="/report" className="ori-btn ori-btn-orange ori-btn-sm text-sm shrink-0 hidden lg:flex">⚡ แจ้งหายด่วน</Link>
        </div>

        <button className="md:hidden p-2 border-2 border-ori-ink rounded-lg bg-white shrink-0"
          style={{ boxShadow: '2px 2px 0 #1A1208' }} onClick={() => setOpen(!open)}>
          {open ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t-2 border-ori-ink px-5 py-4 flex flex-col gap-3"
          style={{ background: '#F5EDD8' }}>
          
          {/* 💡 3. เพิ่มช่องค้นหาสำหรับ Mobile โดยเฉพาะ */}
          <form onSubmit={handleMobileSearch} className="relative flex items-center w-full mb-2">
            <input 
              type="text" 
              placeholder="ค้นหาสัตว์หาย, ร้านค้า, กิจกรรม..." 
              value={mobileQuery}
              onChange={(e) => setMobileQuery(e.target.value)}
              className="w-full border-2 border-black rounded-xl py-3 pl-4 pr-10 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-ori-orange shadow-paper-sm transition-all"
            />
            <button type="submit" className="absolute right-2 text-gray-500 hover:text-ori-orange bg-white p-2 rounded-full transition-colors">
              <Search size={20} strokeWidth={3} />
            </button>
          </form>

          <Link href="/report?status=lost" onClick={() => setOpen(false)} className="font-bold py-2 border-b border-ori-cream-d">🔔 ลงประกาศหาน้อง</Link>
          <Link href="/report?status=found" onClick={() => setOpen(false)} className="font-bold py-2 border-b border-ori-cream-d">👀 แจ้งพบสัตว์หลง</Link>
          <Link href="/report?status=adoption" onClick={() => setOpen(false)} className="font-bold py-2 border-b border-ori-cream-d">💖 ประกาศหาบ้านให้น้อง</Link>
          
          <div className="flex gap-2 pt-2">
            {user ? (
              <>
                <Link href="/profile" onClick={() => setOpen(false)} className="ori-btn ori-btn-white ori-btn-sm flex-1 text-sm justify-center">โปรไฟล์</Link>
                <button onClick={() => { handleLogout(); setOpen(false); }} className="ori-btn ori-btn-white ori-btn-sm text-sm px-3 text-red-600 justify-center"><LogOut size={16} /></button>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="ori-btn ori-btn-white ori-btn-sm flex-1 text-sm justify-center">เข้าสู่ระบบ</Link>
            )}
            <Link href="/report" onClick={() => setOpen(false)} className="ori-btn ori-btn-orange ori-btn-sm flex-1 text-sm justify-center">⚡ แจ้งหาย</Link>
          </div>
        </div>
      )}
    </nav>
  )
}