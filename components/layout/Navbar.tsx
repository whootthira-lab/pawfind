'use client'
// components/layout/Navbar.tsx — Origami design system update
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, LogOut, User, CalendarPlus, Trophy, CalendarDays, ShieldCheck, LogIn, ChevronDown } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { SearchBar } from '@/components/layout/SearchBar'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<{ display_name?: string; avatar_url?: string } | null>(null)
  const [publishOpen, setPublishOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobilePublishOpen, setMobilePublishOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
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

  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }
    const fetchProfile = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle()
        if (data) {
          setProfile(data)
        } else {
          setProfile({
            display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url
          })
        }
      } catch (err) {
        console.error('Error fetching profile for navbar:', err)
      }
    }
    fetchProfile()
  }, [user, supabase])

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
        
        <div className="hidden lg:flex items-center gap-6 text-sm font-black text-ori-ink-m whitespace-nowrap relative">
          {/* โหมดลงประกาศ Dropdown */}
          <div 
            className="relative group"
            onMouseEnter={() => setPublishOpen(true)}
            onMouseLeave={() => setPublishOpen(false)}
          >
            <button className="flex items-center gap-1 hover:text-ori-orange transition-colors font-black text-base py-2 focus:outline-none">
              📢 โหมดลงประกาศ <ChevronDown size={16} className={`transition-transform duration-200 ${publishOpen ? 'rotate-180' : ''}`} />
            </button>
            {publishOpen && (
              <div className="absolute left-0 top-full mt-1 bg-white border-[2.5px] border-ori-ink rounded-xl shadow-paper-sm py-2 min-w-[240px] z-[250] flex flex-col font-bold">
                <Link 
                  href="/report?status=lost" 
                  className="px-4 py-2.5 hover:bg-wagashi-sakura hover:text-ori-orange-d border-b border-black/5 last:border-b-0 flex items-center gap-2 transition-colors text-black"
                  onClick={() => setPublishOpen(false)}
                >
                  🔔 โพสต์ประกาศหาน้อง
                </Link>
                <Link 
                  href="/report?status=found" 
                  className="px-4 py-2.5 hover:bg-wagashi-sora hover:text-ori-blue flex items-center gap-2 border-b border-black/5 last:border-b-0 transition-colors text-black"
                  onClick={() => setPublishOpen(false)}
                >
                  👀 โพสต์แจ้งพบสัตว์หลง
                </Link>
                <Link 
                  href="/report?status=adoption" 
                  className="px-4 py-2.5 hover:bg-wagashi-matcha hover:text-ori-green flex items-center gap-2 border-b border-black/5 last:border-b-0 transition-colors text-black"
                  onClick={() => setPublishOpen(false)}
                >
                  💖 ลงประกาศหาบ้านให้น้อง
                </Link>
                <Link 
                  href="/events/create" 
                  className="px-4 py-2.5 hover:bg-yellow-50 hover:text-yellow-600 flex items-center gap-2 transition-colors text-black"
                  onClick={() => setPublishOpen(false)}
                >
                  📅 สร้างประกาศกิจกรรม & ข่าวสาร
                </Link>
              </div>
            )}
          </div>

          {/* โหมดค้นหา Dropdown */}
          <div 
            className="relative group"
            onMouseEnter={() => setSearchOpen(true)}
            onMouseLeave={() => setSearchOpen(false)}
          >
            <button className="flex items-center gap-1 hover:text-ori-blue transition-colors font-black text-base py-2 focus:outline-none">
              🔍 โหมดค้นหา <ChevronDown size={16} className={`transition-transform duration-200 ${searchOpen ? 'rotate-180' : ''}`} />
            </button>
            {searchOpen && (
              <div className="absolute left-0 top-full mt-1 bg-white border-[2.5px] border-ori-ink rounded-xl shadow-paper-sm py-2 min-w-[280px] z-[250] flex flex-col font-bold">
                <Link 
                  href="/search?tab=lost" 
                  className="px-4 py-2.5 hover:bg-wagashi-sakura hover:text-ori-orange-d flex items-center gap-2 border-b border-black/5 last:border-b-0 transition-colors text-black"
                  onClick={() => setSearchOpen(false)}
                >
                  🚨 เข้าดูประกาศตามหาน้อง (หาย)
                </Link>
                <Link 
                  href="/search?tab=found" 
                  className="px-4 py-2.5 hover:bg-wagashi-sora hover:text-ori-blue flex items-center gap-2 border-b border-black/5 last:border-b-0 transition-colors text-black"
                  onClick={() => setSearchOpen(false)}
                >
                  👀 เข้าดูประกาศพบสัตว์หลง
                </Link>
                <Link 
                  href="/search?tab=mating" 
                  className="px-4 py-2.5 hover:bg-[#FFF0F5] hover:text-pink-600 flex items-center gap-2 border-b border-black/5 last:border-b-0 transition-colors text-black"
                  onClick={() => setSearchOpen(false)}
                >
                  ❤️ เข้าดูประกาศหาคู่ให้น้อง
                </Link>
                <Link 
                  href="/search?tab=adoption" 
                  className="px-4 py-2.5 hover:bg-wagashi-matcha hover:text-ori-green flex items-center gap-2 border-b border-black/5 last:border-b-0 transition-colors text-black"
                  onClick={() => setSearchOpen(false)}
                >
                  💖 เข้าดูประกาศหาบ้านให้น้อง
                </Link>
                <Link 
                  href="/search?tab=showcase" 
                  className="px-4 py-2.5 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2 border-b border-black/5 last:border-b-0 transition-colors text-black"
                  onClick={() => setSearchOpen(false)}
                >
                  ✨ เข้าดูทำเนียบโชว์โปรไฟล์น้อง
                </Link>
                <Link 
                  href="/events" 
                  className="px-4 py-2.5 hover:bg-blue-50 hover:text-ori-blue-d flex items-center gap-2 transition-colors text-black"
                  onClick={() => setSearchOpen(false)}
                >
                  🏆 ดูกระดานกิจกรรม & ข่าวสาร
                </Link>
              </div>
            )}
          </div>
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

              <Link href="/profile" className="ori-btn ori-btn-white ori-btn-sm text-sm px-3 flex items-center gap-2 shadow-paper-sm ml-2 overflow-hidden hover:bg-gray-50 transition-all">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-5 h-5 rounded-full border border-black object-cover shrink-0"
                    onError={(e) => {
                      if (profile.avatar_url && !profile.avatar_url.includes('/avatars/')) {
                        const parts = profile.avatar_url.split('/profile-images/');
                        if (parts.length === 2) {
                          (e.target as HTMLImageElement).src = `${parts[0]}/profile-images/avatars/${parts[1]}`;
                        }
                      }
                    }}
                  />
                ) : (
                  <User size={16} className="shrink-0" />
                )}
                <span className="max-w-[80px] truncate">{profile?.display_name || 'บัญชี'}</span>
              </Link>
              <button onClick={handleLogout} className="ori-btn ori-btn-white ori-btn-sm text-sm px-3 text-red-600 hover:bg-red-50">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link href="/login" className="ori-btn ori-btn-white ori-btn-sm text-sm">เข้าสู่ระบบ</Link>
          )}
          <Link href="/donate" className="ori-btn ori-btn-orange ori-btn-sm text-sm hidden xl:flex">เกี่ยวกับเรา</Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {user && (
            <Link href="/profile" className="flex items-center gap-1.5 bg-white border-2 border-ori-ink px-2.5 py-1.5 rounded-xl shadow-paper-sm hover:scale-105 active:scale-95 transition-all">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-6 h-6 rounded-full border border-black object-cover shrink-0"
                  onError={(e) => {
                    if (profile.avatar_url && !profile.avatar_url.includes('/avatars/')) {
                      const parts = profile.avatar_url.split('/profile-images/');
                      if (parts.length === 2) {
                        (e.target as HTMLImageElement).src = `${parts[0]}/profile-images/avatars/${parts[1]}`;
                      }
                    }
                  }}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-wagashi-kinako border border-black flex items-center justify-center text-[10px] font-black shrink-0">
                  {profile?.display_name?.charAt(0) || 'P'}
                </div>
              )}
              <span className="text-xs font-black truncate max-w-[85px] text-black">
                {profile?.display_name || 'บัญชี'}
              </span>
            </Link>
          )}
          <button className="p-2 border-2 border-ori-ink rounded-xl bg-white shadow-paper-sm hover:scale-105 active:scale-95 transition-all" onClick={() => setOpen(!open)}>
            {open ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
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
          <div className="flex flex-col gap-2 font-bold text-black">
            {/* โหมดลงประกาศ (Mobile) */}
            <div className="border-b border-black/5">
              <button 
                onClick={() => setMobilePublishOpen(!mobilePublishOpen)} 
                className="w-full text-left py-3 flex items-center justify-between text-base font-black text-black"
              >
                📢 โหมดลงประกาศ
                <ChevronDown size={18} className={`transition-transform duration-200 ${mobilePublishOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobilePublishOpen && (
                <div className="pl-4 flex flex-col gap-2 pb-3 text-sm text-gray-700">
                  <Link href="/report?status=lost" className="py-2 flex items-center gap-2 border-b border-black/5 hover:text-ori-orange text-black" onClick={() => setOpen(false)}>
                    🔔 โพสต์ประกาศหาน้อง
                  </Link>
                  <Link href="/report?status=found" className="py-2 flex items-center gap-2 border-b border-black/5 hover:text-ori-blue text-black" onClick={() => setOpen(false)}>
                    👀 โพสต์แจ้งพบสัตว์หลง
                  </Link>
                  <Link href="/report?status=adoption" className="py-2 flex items-center gap-2 border-b border-black/5 hover:text-ori-green text-black" onClick={() => setOpen(false)}>
                    💖 ลงประกาศหาบ้านให้น้อง
                  </Link>
                  <Link href="/events/create" className="py-2 flex items-center gap-2 hover:text-yellow-600 text-black" onClick={() => setOpen(false)}>
                    📅 สร้างประกาศกิจกรรม & ข่าวสาร
                  </Link>
                </div>
              )}
            </div>

            {/* โหมดค้นหา (Mobile) */}
            <div className="border-b border-black/5">
              <button 
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)} 
                className="w-full text-left py-3 flex items-center justify-between text-base font-black text-black"
              >
                🔍 โหมดค้นหา
                <ChevronDown size={18} className={`transition-transform duration-200 ${mobileSearchOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileSearchOpen && (
                <div className="pl-4 flex flex-col gap-2 pb-3 text-sm text-gray-700">
                  <Link href="/search?tab=lost" className="py-2 flex items-center gap-2 border-b border-black/5 hover:text-ori-orange-d text-black" onClick={() => setOpen(false)}>
                    🚨 เข้าดูประกาศตามหาน้อง (หาย)
                  </Link>
                  <Link href="/search?tab=found" className="py-2 flex items-center gap-2 border-b border-black/5 hover:text-ori-blue text-black" onClick={() => setOpen(false)}>
                    👀 เข้าดูประกาศพบสัตว์หลง
                  </Link>
                  <Link href="/search?tab=mating" className="py-2 flex items-center gap-2 border-b border-black/5 hover:text-pink-600 text-black" onClick={() => setOpen(false)}>
                    ❤️ เข้าดูประกาศหาคู่ให้น้อง
                  </Link>
                  <Link href="/search?tab=adoption" className="py-2 flex items-center gap-2 border-b border-black/5 hover:text-ori-green text-black" onClick={() => setOpen(false)}>
                    💖 เข้าดูประกาศหาบ้านให้น้อง
                  </Link>
                  <Link href="/search?tab=showcase" className="py-2 flex items-center gap-2 border-b border-black/5 hover:text-amber-700 text-black" onClick={() => setOpen(false)}>
                    ✨ เข้าดูทำเนียบโชว์โปรไฟล์น้อง
                  </Link>
                  <Link href="/events" className="py-2 flex items-center gap-2 hover:text-ori-blue-d text-black" onClick={() => setOpen(false)}>
                    🏆 ดูกระดานกิจกรรม & ข่าวสาร
                  </Link>
                </div>
              )}
            </div>
            
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