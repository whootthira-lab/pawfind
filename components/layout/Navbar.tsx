'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  User, 
  LogOut, 
  Bookmark, 
  Menu, 
  X, 
  ChevronDown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. ติดตามสถานะการ Auth
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'หน้าแรก' },
    { href: '/search', label: 'ค้นหาน้อง' },
    { href: '/report', label: 'แจ้งสัตว์หาย' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b-4 border-black shadow-paper-sm">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-black p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
            🐾
          </div>
          <span className="text-2xl font-black tracking-tighter">PAWFIND</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-bold hover:text-gray-600 transition-colors ${
                pathname === link.href ? 'underline decoration-4 underline-offset-8' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="h-8 w-1 bg-black/10 mx-2" />

          {/* User Status Section */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 border-2 border-black rounded-full hover:bg-gray-50 transition-all shadow-paper-sm">
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full border border-black"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-wagashi-kinako flex items-center justify-center border border-black">
                      <User size={18} />
                    </div>
                  )}
                  <ChevronDown size={16} className="mr-1" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-4 border-black rounded-xl p-2 shadow-paper mt-2">
                <DropdownMenuLabel className="font-bold text-lg">บัญชีของฉัน</DropdownMenuLabel>
                <p className="px-2 pb-2 text-xs font-medium text-gray-500 truncate">{user.email}</p>
                <DropdownMenuSeparator className="bg-black/10" />
                <DropdownMenuItem asChild className="cursor-pointer font-bold focus:bg-wagashi-matcha focus:text-black rounded-lg">
                  <Link href="/saved" className="flex items-center">
                    <Bookmark className="mr-2 h-4 w-4" />
                    รายการที่บันทึกไว้
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-black/10" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer font-bold text-red-600 focus:bg-wagashi-sakura focus:text-red-700 rounded-lg"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="bg-black text-white border-2 border-black font-bold px-6 py-2 rounded-xl shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5 transition-all">
              <Link href="/login">เข้าสู่ระบบ</Link>
            </Button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden border-t-4 border-black bg-white p-4 flex flex-col gap-4 animate-in slide-in-from-top">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="text-xl font-bold py-2 border-b-2 border-black/5"
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/saved" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold py-2 border-b-2 border-black/5 flex items-center gap-2">
                <Bookmark size={20} /> รายการที่บันทึกไว้
              </Link>
              <button onClick={handleLogout} className="text-xl font-bold py-2 text-red-600 flex items-center gap-2">
                <LogOut size={20} /> ออกจากระบบ
              </button>
            </>
          ) : (
            <Button asChild className="w-full bg-black text-white font-bold py-4 rounded-xl mt-2">
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>เข้าสู่ระบบ</Link>
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}