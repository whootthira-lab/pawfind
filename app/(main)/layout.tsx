import { ReactNode } from 'react'
import { Navbar } from '@/components/layout/Navbar' // ── 🟢 ดึง Navbar ชุดอัปเกรดพรีเมียม (Mobile-First + Pop-up ล็อกอิน) มาสวมแทน Header ดั้งเดิม

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-washi font-sans text-foreground flex flex-col">
      
      {/* ── 🟢 เรียกใช้คอมโพเนนต์ร่วม เพื่อเปิดใช้งานระบบกล่องป๊อปอัพล็อกอินและ Avatar บนหัวแถวหน้าแรกได้ทุกพิกัดหน้างาน (ข้อ 2, 3) ── */}
      <Navbar />

      {/* ── 🟢 ปรับขยายมาตรวัดสัดส่วนจาก max-w-4xl ขึ้นเป็น max-w-6xl เพื่อให้การ์ดสัตว์เลี้ยงเรียงตัว 3 คอลัมน์ได้สวยงามพอดี ไม่โดนบีบอัด (ข้อ 9) ── */}
      <main className="max-w-6xl w-full mx-auto p-4 py-8 flex-1">
        {children}
      </main>

      {/* ── 🟢 ปรับปรุงข้อมูลแบรนดิ้งประทับตราลิขสิทธิ์ PobPet ส่วนท้ายของเลย์เอาต์ร่วมให้ใสสะอาดสอดคล้องกันทั้งแพลตฟอร์ม ── */}
      <footer className="bg-wagashi-kinako border-t-4 border-black p-8 mt-12 text-black">
        <div className="max-w-6xl mx-auto text-center font-bold">
          <p>PobPet หาสัตว์หายด้วย AI © 2026</p>
        </div>
      </footer>
    </div>
  )
}