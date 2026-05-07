'use client'
// components/layout/Navbar.tsx — Origami style
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, LogOut, User } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  // สร้าง Supabase Client สำหรับฝั่ง Browser
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // 1. ดึงข้อมูล User ทันทีที่โหลดหน้า Navbar
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // 2. คอยดักฟัง (Listen) หากมีการ Login หรือ Logout เกิดขึ้น
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      router.refresh() // สั่งให้ Next.js รีเฟรชข้อมูลเบื้องหลัง
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  // ฟังก์ชันสำหรับออกจากระบบ
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/') // กลับหน้าแรกหลังออกจากระบบ
  }

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
        
        {/* แก้ไขชื่อปุ่มและลิงก์สำหรับ Desktop ตรงนี้ */}
        <div className="hidden md:flex items-center gap-6 text-sm font-bold text-ori-ink-m">
          <Link href="/report?status=lost" className="hover:text-ori-orange transition-colors">🔔 ลงประกาศหาน้อง</Link>
          <Link href="/report?status=found" className="hover:text-ori-blue transition-colors">👀 ลงประกาศแจ้งพบสัตว์หลง</Link>
          <Link href="/report?status=adoption" className="hover:text-ori-green transition-colors">💖 ลงประกาศหาบ้านให้น้อง</Link>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link href="/profile" className="ori-btn ori-btn-white ori-btn-sm text-sm px-3 flex items-center gap-2">
                <User size={16} /> บัญชีของฉัน
              </Link>
              <button onClick={handleLogout} className="ori-btn ori-btn-white ori-btn-sm text-sm px-3 text-red-600 hover:bg-red-50">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link href="/login" className="ori-btn ori-btn-white ori-btn-sm text-sm">เข้าสู่ระบบ</Link>
          )}
          <Link href="/report" className="ori-btn ori-btn-orange ori-btn-sm text-sm">⚡ แจ้งหายด่วน</Link>
        </div>

        <button className="md:hidden p-2 border-2 border-ori-ink rounded-lg bg-white"
          style={{ boxShadow: '2px 2px 0 #1A1208' }} onClick={() => setOpen(!open)}>
          {open ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>
      
      {/* แก้ไขชื่อปุ่มและลิงก์สำหรับ Mobile ตรงนี้ */}
      {open && (
        <div className="md:hidden border-t-2 border-ori-ink px-5 py-4 flex flex-col gap-3"
          style={{ background: '#F5EDD8' }}>
          <Link href="/report?status=lost" onClick={() => setOpen(false)} className="font-bold py-2 border-b border-ori-cream-d">🔔 ลงประกาศหาน้อง</Link>
          <Link href="/report?status=found" onClick={() => setOpen(false)} className="font-bold py-2 border-b border-ori-cream-d">👀 แจ้งพบสัตว์หลง</Link>
          <Link href="/report?status=adoption" onClick={() => setOpen(false)} className="font-bold py-2 border-b border-ori-cream-d">💖 ประกาศหาบ้านให้น้อง</Link>
          <div className="flex gap-2 pt-2">
            {user ? (
              <>
                <Link href="/profile" className="ori-btn ori-btn-white ori-btn-sm flex-1 text-sm justify-center">โปรไฟล์</Link>
                <button onClick={handleLogout} className="ori-btn ori-btn-white ori-btn-sm text-sm px-3 text-red-600 justify-center"><LogOut size={16} /></button>
              </>
            ) : (
              <Link href="/login" className="ori-btn ori-btn-white ori-btn-sm flex-1 text-sm justify-center">เข้าสู่ระบบ</Link>
            )}
            <Link href="/report" className="ori-btn ori-btn-orange ori-btn-sm flex-1 text-sm justify-center">⚡ แจ้งหาย</Link>
          </div>
        </div>
      )}
    </nav>
  )
}