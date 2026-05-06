import { Metadata } from 'next'
import Link from 'next/link'
import { 
  Search, 
  PlusCircle, 
  MessageCircle, 
  Facebook, 
  Phone, 
  TrendingUp, 
  Wallet,
  ArrowRight,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// 💡 1. ตั้งค่า Metadata สำหรับแชร์หน้าแรก
export const metadata: Metadata = {
  title: 'PobPet | หาสัตว์หายด้วย AI',
  description: 'ช่วยพาเพื่อนรักสี่ขากลับบ้านด้วยระบบค้นหาอัจฉริยะและพลังชุมชนชาวด่านขุนทด',
  openGraph: {
    title: 'PobPet หาสัตว์หายด้วย AI',
    description: 'แพลตฟอร์มตามหาสัตว์เลี้ยงอัจฉริยะ เพื่อทุกคน',
    url: 'https://pawfind-eta.vercel.app',
    siteName: 'PobPet หาสัตว์หายด้วย AI',
    images: [{ url: '/home-og.png', width: 1200, height: 630 }],
    locale: 'th_TH',
    type: 'website',
  },
}

export default function LandingPage() {
  // 💡 ข้อมูลสมมติสำหรับแสดงผลประกอบการ (ปรับเปลี่ยนตัวเลขจริงได้ที่นี่)
  const financialStats = {
    revenue: 12500,
    expense: 8400,
    costPerFound: 420, // ต้นทุนเฉลี่ยต่อการหาสัตว์เจอ 1 ราย
    bankAccount: "xxx-x-xxxxx-x (ธนาคารไทยพาณิชย์)"
  }

  return (
    <div className="flex flex-col gap-12 pb-20">
      
      {/* --- Section 1: Hero & Smart Mode Selection (Dropdown Style) --- */}
      <section className="bg-white border-4 border-black rounded-3xl p-8 md:p-12 shadow-paper text-center overflow-visible">
        <h1 className="text-4xl md:text-6xl font-black mb-4">PobPet 🐾</h1>
        <p className="text-xl font-bold text-gray-600 mb-8">หาสัตว์หายด้วย AI และพลังของชุมชน</p>
        
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          {/* Dropdown: ค้นหาน้อง */}
          <div className="relative group">
            <button className="w-full md:w-72 bg-wagashi-matcha border-2 border-black p-5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-paper-sm hover:-translate-y-1 transition-all">
              <Search size={24} /> ค้นหาน้องสัตว์ <ChevronDown size={20} />
            </button>
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute top-full left-0 w-full bg-white border-4 border-black rounded-2xl mt-3 p-2 z-50 shadow-paper transition-all">
              <Link href="/search?status=lost" className="block p-4 hover:bg-gray-100 rounded-xl font-bold text-left border-b-2 border-gray-100 last:border-0 text-black">🚨 ตามหาเจ้าของ</Link>
              <Link href="/search?status=found" className="block p-4 hover:bg-gray-100 rounded-xl font-bold text-left border-b-2 border-gray-100 last:border-0 text-black">👀 พบน้องหลงทาง</Link>
              <Link href="/search?status=adoption" className="block p-4 hover:bg-gray-100 rounded-xl font-bold text-left text-black">💖 หาบ้านใหม่</Link>
            </div>
          </div>

          {/* Dropdown: ลงประกาศ */}
          <div className="relative group">
            <button className="w-full md:w-72 bg-black text-white border-2 border-black p-5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-paper-sm hover:-translate-y-1 transition-all">
              <PlusCircle size={24} /> ลงประกาศใหม่ <ChevronDown size={20} />
            </button>
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute top-full left-0 w-full bg-white border-4 border-black rounded-2xl mt-3 p-2 z-50 shadow-paper transition-all">
              <Link href="/report?type=lost" className="block p-4 hover:bg-gray-100 rounded-xl font-bold text-left border-b-2 border-gray-100 last:border-0 text-black">📢 แจ้งสัตว์หาย</Link>
              <Link href="/report?type=found" className="block p-4 hover:bg-gray-100 rounded-xl font-bold text-left border-b-2 border-gray-100 last:border-0 text-black">📍 แจ้งพบสัตว์หลง</Link>
              <Link href="/report?type=adoption" className="block p-4 hover:bg-gray-100 rounded-xl font-bold text-left text-black">🏠 หาบ้านให้น้อง</Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- Section 2: Financial Dashboard (ความโปร่งใสของโครงการ) --- */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-black px-2 flex items-center gap-2">
          <TrendingUp className="text-ori-orange" /> รายงานความคืบหน้าและต้นทุน
        </h2>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-8 rounded-3xl shadow-paper">
            <div className="flex items-center gap-3 mb-2 text-green-600">
              <TrendingUp size={24} />
              <h3 className="text-lg font-black">รายรับรวม</h3>
            </div>
            <p className="text-4xl font-black">฿{financialStats.revenue.toLocaleString()}</p>
            <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase">สนับสนุนโครงการที่:</p>
              <p className="text-sm font-black text-ori-ink">{financialStats.bankAccount}</p>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-8 rounded-3xl shadow-paper">
            <div className="flex items-center gap-3 mb-2 text-red-500">
              <Wallet size={24} />
              <h3 className="text-lg font-black">รายจ่ายสะสม</h3>
            </div>
            <p className="text-4xl font-black">฿{financialStats.expense.toLocaleString()}</p>
            <p className="text-sm font-bold text-gray-400 mt-2 italic">*รวมค่า AI และ Server</p>
          </div>

          <div className="bg-ori-orange text-white border-4 border-black p-8 rounded-3xl shadow-paper flex flex-col justify-center">
            <h3 className="text-xl font-black mb-1">ความสำเร็จ 🏆</h3>
            <p className="text-sm font-bold opacity-90 mb-4 text-white">ต้นทุนในการหาสัตว์เจอ 1 ครั้ง:</p>
            <p className="text-4xl font-black">฿{financialStats.costPerFound}</p>
          </div>
        </section>
      </div>

      {/* --- Section 3: Contact Channels --- */}
      <section className="bg-wagashi-sora border-4 border-black rounded-3xl p-8 shadow-paper">
        <h2 className="text-2xl font-black mb-6">ติดต่อเจ้าหน้าที่ / สอบถามเพิ่มเติม 📢</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="https://line.me/ti/p/~YOUR_LINE_ID" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white border-2 border-black p-4 rounded-xl font-bold shadow-paper-sm hover:scale-105 transition-all text-black">
            <div className="bg-[#00B900] p-2 rounded-lg text-white"><MessageCircle size={20} /></div> Line OA
          </a>
          <a href="https://facebook.com/YOUR_PAGE" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white border-2 border-black p-4 rounded-xl font-bold shadow-paper-sm hover:scale-105 transition-all text-black">
            <div className="bg-[#1877F2] p-2 rounded-lg text-white"><Facebook size={20} /></div> Facebook
          </a>
          <a href="tel:0800000000" className="flex items-center gap-3 bg-white border-2 border-black p-4 rounded-xl font-bold shadow-paper-sm hover:scale-105 transition-all text-black">
            <div className="bg-ori-orange p-2 rounded-lg text-white"><Phone size={20} /></div> 080-XXX-XXXX
          </a>
          <Link href="/about" className="flex items-center gap-3 bg-black text-white border-2 border-black p-4 rounded-xl font-bold shadow-paper-sm hover:scale-105 transition-all">
            <ArrowRight size={20} /> เกี่ยวกับ PobPet
          </Link>
        </div>
      </section>

      {/* --- Section 4: 3 Steps (Simplified) --- */}
      <section className="bg-washi border-4 border-black rounded-3xl p-8 shadow-paper text-center">
        <h2 className="text-3xl font-black mb-10">3 ขั้นตอนง่ายๆ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-wagashi-sakura border-4 border-black rounded-full flex items-center justify-center text-5xl mb-4 shadow-paper-sm">📸</div>
            <h3 className="font-black text-xl mb-2">1. ส่งรูปภาพ</h3>
            <p className="font-bold text-gray-600">อัปโหลดรูปสัตว์เลี้ยงที่หาย หรือรูปที่คุณพบเจอ</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-wagashi-matcha border-4 border-black rounded-full flex items-center justify-center text-5xl mb-4 shadow-paper-sm">🤖</div>
            <h3 className="font-black text-xl mb-2">2. AI วิเคราะห์</h3>
            <p className="font-bold text-gray-600">ระบบ AI Vision จะวิเคราะห์จุดเด่นและจับคู่ให้ทันที</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-wagashi-kinako border-4 border-black rounded-full flex items-center justify-center text-5xl mb-4 shadow-paper-sm">🤝</div>
            <h3 className="font-black text-xl mb-2">3. พาพบเจ้าของ</h3>
            <p className="font-bold text-gray-600">ประสานงานช่วยเหลือเพื่อส่งน้องกลับบ้านอย่างปลอดภัย</p>
          </div>
        </div>
      </section>
    </div>
  )
}