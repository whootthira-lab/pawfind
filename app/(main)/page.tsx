import { Metadata } from 'next'
import Link from 'next/link'
import { 
  Search, 
  PlusCircle, 
  MessageCircle, 
  TrendingUp, 
  Wallet,
  ChevronDown,
  Share2,
  Youtube
} from 'lucide-react'

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
  const financialStats = {
    revenue: 12500,
    expense: 8400,
  }
  
  const total = Math.max(financialStats.revenue, financialStats.expense, 1)
  const revPercent = (financialStats.revenue / total) * 100
  const expPercent = (financialStats.expense / total) * 100

  return (
    <div className="flex flex-col gap-12 pb-20">
      
      {/* --- Section 1: Hero & Action Buttons --- */}
      <section className="bg-white border-4 border-black rounded-3xl p-8 md:p-12 shadow-paper text-center overflow-visible">
        <h1 className="text-4xl md:text-6xl font-black mb-4">PobPet 🐾</h1>
        <p className="text-xl font-bold text-gray-600 mb-8">หาสัตว์หายด้วย AI และพลังของชุมชน</p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center flex-wrap">
          <div className="relative group z-30">
            <button className="w-full md:w-64 bg-wagashi-matcha border-2 border-black p-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-paper-sm hover:-translate-y-1 transition-all">
              <Search size={22} /> ค้นหาน้องสัตว์ <ChevronDown size={18} />
            </button>
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute top-full left-0 w-full bg-white border-4 border-black rounded-2xl mt-3 p-2 shadow-paper transition-all">
              <Link href="/search?status=lost" className="block p-4 hover:bg-gray-100 rounded-xl font-bold text-left border-b-2 border-gray-100 text-black">🚨 ตามหาเจ้าของ</Link>
              <Link href="/search?status=found" className="block p-4 hover:bg-gray-100 rounded-xl font-bold text-left border-b-2 border-gray-100 text-black">👀 พบน้องหลงทาง</Link>
              <Link href="/search?status=adoption" className="block p-4 hover:bg-gray-100 rounded-xl font-bold text-left text-black">💖 หาบ้านใหม่</Link>
            </div>
          </div>

          <div className="relative group z-20">
            <button className="w-full md:w-64 bg-black text-white border-2 border-black p-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-paper-sm hover:-translate-y-1 transition-all">
              <PlusCircle size={22} /> ลงประกาศใหม่ <ChevronDown size={18} />
            </button>
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute top-full left-0 w-full bg-white border-4 border-black rounded-2xl mt-3 p-2 shadow-paper transition-all">
              <Link href="/report?type=lost" className="block p-4 hover:bg-gray-100 rounded-xl font-bold text-left border-b-2 border-gray-100 text-black">📢 แจ้งสัตว์หาย</Link>
              <Link href="/report?type=found" className="block p-4 hover:bg-gray-100 rounded-xl font-bold text-left border-b-2 border-gray-100 text-black">📍 แจ้งพบสัตว์หลง</Link>
              <Link href="/report?type=adoption" className="block p-4 hover:bg-gray-100 rounded-xl font-bold text-left text-black">🏠 หาบ้านให้น้อง</Link>
            </div>
          </div>

          <a 
            href={`https://www.facebook.com/sharer/sharer.php?u=https://pawfind-eta.vercel.app`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto bg-[#1877F2] text-white border-2 border-black p-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-paper-sm hover:-translate-y-1 transition-all z-10"
          >
            <Share2 size={22} /> แชร์แพลตฟอร์ม
          </a>
        </div>
      </section>

      {/* --- Section 2: Financial Dashboard & Donation --- */}
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-black px-2 flex items-center gap-2">
          <TrendingUp className="text-ori-orange" /> รายงานความคืบหน้าและทุนสนับสนุน
        </h2>
        
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-4 border-black p-8 rounded-3xl shadow-paper flex flex-col justify-center">
            <h3 className="text-xl font-black mb-6 border-b-4 border-black pb-2 inline-block">📊 กราฟรายรับ - รายจ่าย</h3>
            
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="font-black text-green-600 flex items-center gap-2"><TrendingUp size={20}/> รายรับ / สนับสนุน</span>
                <span className="font-black text-green-600 text-lg">฿{financialStats.revenue.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8 border-2 border-black overflow-hidden shadow-inner">
                <div className="bg-green-500 h-8 transition-all duration-1000" style={{ width: `${revPercent}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="font-black text-red-500 flex items-center gap-2"><Wallet size={20}/> รายจ่ายสะสม</span>
                <span className="font-black text-red-500 text-lg">฿{financialStats.expense.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8 border-2 border-black overflow-hidden shadow-inner">
                <div className="bg-red-500 h-8 transition-all duration-1000" style={{ width: `${expPercent}%` }}></div>
              </div>
              <p className="text-xs font-bold text-gray-400 mt-2 text-right">*รวมค่า API, AI และ Server</p>
            </div>
          </div>

          <div className="bg-ori-orange text-white border-4 border-black p-8 rounded-3xl shadow-paper flex flex-col items-center text-center justify-center gap-4 relative overflow-hidden">
            <h3 className="text-2xl font-black z-10 leading-tight">ร่วมสมทบทุนเพื่อให้น้องๆ <br/>ได้มีโอกาสกลับบ้าน 💖</h3>
            {/* 💡 แก้ไขข้อความสนับสนุนใหม่ */}
            <p className="font-bold opacity-90 z-10">ทุกการสนับสนุนช่วยต่อลมหายใจให้เราได้ไปต่อ</p>
            
            <div className="flex gap-4 mt-2 z-10">
              <img src="/qr-code.jpg" alt="QR Code รับบริจาค" className="w-32 h-32 md:w-40 md:h-40 rounded-xl border-4 border-white shadow-paper-sm object-cover bg-white" />
              
              {/* 💡 นำรูปโปสเตอร์หลัก (home-og.png) มาแสดงเพื่อสื่อถึงประกาศสัตว์หายและสัตว์หลง */}
              <img src="/home-og.png" alt="ประกาศสัตว์หายและพบสัตว์หลง" className="w-32 h-32 md:w-40 md:h-40 rounded-xl border-4 border-white shadow-paper-sm object-cover bg-white object-center" />
            </div>
            
            {/* 💡 แก้ไขชื่อบัญชี */}
            <p className="font-black bg-white text-ori-orange px-4 py-2 rounded-xl mt-2 z-10 shadow-paper-sm border-2 border-black">
              ชื่อบัญชี: KRUTH APEX
            </p>
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
            <div className="bg-[#1877F2] p-2 rounded-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </div> Facebook
          </a>
          
          <a href="https://tiktok.com/@YOUR_TIKTOK" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white border-2 border-black p-4 rounded-xl font-bold shadow-paper-sm hover:scale-105 transition-all text-black">
            <div className="bg-black p-2 rounded-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
            </div> TikTok
          </a>

          <a href="https://youtube.com/@YOUR_YOUTUBE" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white border-2 border-black p-4 rounded-xl font-bold shadow-paper-sm hover:scale-105 transition-all text-black">
            <div className="bg-[#FF0000] p-2 rounded-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
              </svg>
            </div> YouTube
          </a>
        </div>
      </section>

    </div>
  )
}