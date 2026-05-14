'use client'
// components/layout/Navbar.tsx — Origami design system update
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, LogOut, User, CalendarPlus, Trophy, CalendarDays, ShieldCheck, LogIn } from 'lucide-react'
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

  const isAdmin = user?.user_metadata?.role === 'admin'

  return (
    <nav className="sticky top-0 z-[200] border-b-[2.5px] border-ori-ink flex flex-col"
      style={{ background: 'rgba(245,237,216,.96)', backdropFilter: 'blur(12px)' }}>
      
      {/* ชั้นที่ 1: โลโก้ และ เมนูหลัก (Desktop) */}
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
              {isAdmin && (
                <Link href="/admin/moderation" className="p-2 hover:bg-ori-orange/10 rounded-full text-ori-orange transition-all group relative">
                  <ShieldCheck size={22} strokeWidth={2.5} />
                  <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">ระบบตรวจสอบ (Admin)</span>
                </Link>
              )}

              <Link href="/account/my-events" className="p-2 hover:bg-ori-green/10 rounded-full text-ori-green-d transition-all group relative">
                <CalendarDays size={22} strokeWidth={2.5} />
                <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">ประกาศของฉัน</span>
              </Link>

              <Link href="/events/create" className="p-2 hover:bg-ori-blue-d/10 rounded-full text-ori-blue-d transition-all group relative">
                <CalendarPlus size={22} strokeWidth={2.5} />
                <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">สร้างประกาศข่าว</span>
              </Link>

              <Link href="/profile" className="ori-btn ori-btn-white ori-btn-sm text-sm px-4 flex items-center gap-2 shadow-paper-sm ml-2">
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
          <Link href="/events" className="flex items-center gap-2 shrink-0 font-black text-sm text-ori-blue-d hover:bg-ori-blue-d hover:text-white px-4 py-2 rounded-full border-2 border-ori-blue-d transition-all shadow-paper-sm bg-white">
            <Trophy size={16} /> ข่าวสารชุมชน
          </Link>
          
          <div className="flex-grow">
            <SearchBar />
          </div>
        </div>
      </div>
      
      {/* Mobile Menu (อัปเดตปุ่ม Login/Logout แล้ว) */}
      {open && (
        <div className="md:hidden border-t-2 border-ori-ink px-5 py-4 flex flex-col gap-4 bg-[#F5EDD8] h-screen overflow-y-auto pb-20">
          <SearchBar />
          <div className="flex flex-col gap-2 font-bold">
            <Link href="/report?status=lost" className="py-2 border-b border-black/5" onClick={() => setOpen(false)}>🔔 ลงประกาศหาน้อง</Link>
            <Link href="/report?status=found" className="py-2 border-b border-black/5" onClick={() => setOpen(false)}>👀 แจ้งพบสัตว์หลง</Link>
            <Link href="/report?status=adoption" className="py-2 border-b border-black/5" onClick={() => setOpen(false)}>💖 ลงประกาศหาบ้านให้น้อง</Link>
            
            <Link href="/events" className="py-2 border-b border-black/5 text-ori-blue-d font-black mt-2" onClick={() => setOpen(false)}>🏆 ข่าวสารชุมชน (ทั้งหมด)</Link>
            
            {/* 💡 ตรวจสอบว่าล็อกอินหรือยัง สำหรับมือถือ */}
            {user ? (
              <div className="bg-white/50 p-3 rounded-xl mt-2 border-2 border-ori-ink/10 flex flex-col gap-3">
                <Link href="/events/create" className="text-ori-blue-d font-black flex items-center gap-2" onClick={() => setOpen(false)}>
                  <CalendarPlus size={18}/> สร้างข่าวประชาสัมพันธ์
                </Link>
                <Link href="/account/my-events" className="text-ori-green-d font-black flex items-center gap-2" onClick={() => setOpen(false)}>
                  <CalendarDays size={18}/> จัดการประกาศของฉัน
                </Link>
                {isAdmin && (
                  <Link href="/admin/moderation" className="text-ori-orange font-black flex items-center gap-2" onClick={() => setOpen(false)}>
                    <ShieldCheck size={18}/> ระบบตรวจสอบ (Admin)
                  </Link>
                )}
                
                <div className="h-px bg-black/10 my-1"></div> {/* เส้นคั่น */}
                
                <Link href="/profile" className="text-black font-black flex items-center gap-2" onClick={() => setOpen(false)}>
                  <User size={18}/> บัญชีของฉัน
                </Link>
                <button 
                  onClick={() => { handleLogout(); setOpen(false); }} 
                  className="text-red-600 font-black flex items-center gap-2 text-left"
                >
                  <LogOut size={18}/> ออกจากระบบ
                </button>
              </div>
            ) : (
              <div className="mt-4 border-t-2 border-black/10 pt-4">
                <Link 
                  href="/login" 
                  className="w-full bg-[#00B900] text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-paper-sm border-2 border-transparent hover:border-black transition-all" 
                  onClick={() => setOpen(false)}
                >
                  <LogIn size={20} /> เข้าสู่ระบบ / สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}