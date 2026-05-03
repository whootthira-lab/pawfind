import { ReactNode } from 'react'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-washi font-sans text-foreground">
      <header className="bg-white border-b-2 border-black p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          {/* โลโก้ */}
          <Link href="/" className="text-2xl font-bold hover:-translate-y-1 transition-transform">
            🐾 PawFind
          </Link>
          
          {/* เมนูนำทาง */}
          <nav className="flex items-center gap-4 font-bold text-sm md:text-base">
            <Link href="/" className="hover:underline hidden sm:block">กลับหน้าแรก</Link>
            <Link href="/search" className="hover:underline">ค้นหาน้อง</Link>
            <Link href="/donate" className="hover:underline hidden md:block">บริจาค</Link>
            
            {/* 📌 ปุ่มรายการที่บันทึก (ใหม่) */}
            <Link 
              href="/saved"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-wagashi-kinako hover:bg-yellow-400 text-black border-2 border-black rounded-lg shadow-paper-sm hover:shadow-paper hover:-translate-y-1 transition-all"
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">ที่บันทึกไว้</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 py-8">
        {children}
      </main>

      <footer className="bg-wagashi-kinako border-t-2 border-black p-8 mt-12">
        <div className="max-w-4xl mx-auto text-center font-bold">
          <p>PawFind ตามหาน้อง © 2026</p>
        </div>
      </footer>
    </div>
  )
}