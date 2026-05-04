import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="bg-wagashi-sakura border-2 border-black rounded-lg shadow-paper p-12 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">ทุกอุ้งเท้ามีคนรอ</h1>
        <p className="text-xl mb-8 font-medium">ตามหาสัตว์เลี้ยงแสนรักของคุณด้วยพลังของ AI Vision และชุมชน PawScout ทั่วไทย</p>
        <div className="flex gap-4 justify-center">
          <Link href="/report">
            <Button className="bg-white text-black border-2 border-black shadow-paper-sm hover:shadow-paper text-lg font-bold px-8 py-6">
              ลงประกาศ
            </Button>
          </Link>
          <Link href="/search">
            <Button className="bg-wagashi-matcha text-black border-2 border-black shadow-paper-sm hover:shadow-paper text-lg font-bold px-8 py-6">
              ค้นหาน้อง
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border-2 border-black p-6 rounded-lg shadow-paper text-center">
          <div className="text-4xl font-bold mb-2">1,240</div>
          <div className="font-bold">สัตว์ที่ลงทะเบียน</div>
        </div>
        <div className="bg-wagashi-sora border-2 border-black p-6 rounded-lg shadow-paper text-center">
          <div className="text-4xl font-bold mb-2">892</div>
          <div className="font-bold">กลับบ้านแล้ว</div>
        </div>
        <div className="bg-wagashi-kinako border-2 border-black p-6 rounded-lg shadow-paper text-center">
          <div className="text-4xl font-bold mb-2">4,500+</div>
          <div className="font-bold">PawScout ทั่วไทย</div>
        </div>
      </section>

      <section className="bg-washi border-2 border-black rounded-lg shadow-paper p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">3 ขั้นตอนง่ายๆ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-6xl mb-4">📸</div>
            <h3 className="font-bold text-lg mb-2">1. ส่งรูปภาพ</h3>
            <p>อัปโหลดรูปสัตว์เลี้ยงที่หาย หรือรูปที่คุณพบเจอ</p>
          </div>
          <div>
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="font-bold text-lg mb-2">2. AI วิเคราะห์</h3>
            <p>ระบบ AI จะวิเคราะห์จุดเด่นและจับคู่ให้ทันที</p>
          </div>
          <div>
            <div className="text-6xl mb-4">🤝</div>
            <h3 className="font-bold text-lg mb-2">3. ติดต่อเจ้าของ</h3>
            <p>เมื่อพบข้อมูลที่ตรงกัน สามารถติดต่อกันได้อย่างปลอดภัย</p>
          </div>
        </div>
      </section>
    </div>
  )
}
