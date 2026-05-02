import { ReactNode } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-washi font-sans text-foreground">
      <header className="bg-white border-b-2 border-black p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">🐾 PawFind</h1>
          <nav className="space-x-4 font-bold">
            <a href="/" className="hover:underline">กลับหน้าแรก</a>
            <a href="/search" className="hover:underline">ค้นหาน้อง</a>
            <a href="/donate" className="hover:underline">บริจาค</a>
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
