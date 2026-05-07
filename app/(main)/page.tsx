import { Metadata } from 'next'
import Link from 'next/link'
import { 
  Search, 
  PlusCircle, 
  MessageCircle, 
  ChevronDown,
  Share2,
  Heart
} from 'lucide-react'
import DonationSection from './DonationSection'

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

      {/* --- Section 1.5: Vision / Social Enterprise (ส่วนที่เพิ่มใหม่) --- */}
      <div className="w-full max-w-5xl mx-auto px-4 -mt-4">
        <div className="bg-wagashi-kinako/30 border-4 border-black rounded-3xl p-6 md:p-10 shadow-paper text-center relative overflow-hidden">
          <div className="absolute top-4 left-4 text-ori-orange/20 text-5xl hidden md:block select-none pointer-events-none">🐾</div>
          <div className="absolute bottom-4 right-4 text-ori-green/20 text-5xl hidden md:block select-none pointer-events-none">🌿</div>
          
          <p className="font-bold text-lg md:text-xl leading-relaxed text-black relative z-10">
            <span className="font-black text-ori-orange-d text-2xl">PobPet</span> เรามีจุดมุ่งหมายในการขับเคลื่อนเพื่อให้สังคมดีขึ้นจากจุดเล็กๆ เพื่อส่งต่อความหวังและสิ่งดีๆ โดยดำเนินการตามแนวทางของ 
            <span className="font-black text-ori-green-d bg-white px-3 py-1.5 rounded-xl border-2 border-black inline-block mx-2 shadow-paper-sm my-2">ธุรกิจเพื่อสังคม (Social Enterprise)</span> 
            เพื่อช่วยให้สังคมดีขึ้นทีละนิดเท่าที่ทำได้ ทุกคนอยู่ได้และเติบโตไปด้วยกัน 💖
          </p>
        </div>
      </div>

      {/* --- Section 2: Donation Section (Expanded) --- */}
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-black px-2 flex items-center gap-2">
          <Heart className="text-ori-orange" fill="currentColor" size={28} /> ทุนสนับสนุนโครงการ
        </h2>
        
        {/* คอมโพเนนต์รับบริจาคแบบเต็มจอ */}
        <DonationSection />

      </div>

      {/* --- Section 3: Contact Channels --- */}
      <section className="bg-wagashi-sora border-4 border-black rounded-3xl p-8 shadow-paper">
        <h2 className="text-2xl font-black mb-6">ติดต่อเจ้าหน้าที่ / สอบถามเพิ่มเติม 📢</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="https://lin.ee/WM1T572" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white border-2 border-black p-4 rounded-xl font-bold shadow-paper-sm hover:scale-105 transition-all text-black">
            <div className="bg-[#00B900] p-2 rounded-lg text-white"><MessageCircle size={20} /></div> Line OA
          </a>
          <a href="https://www.facebook.com/profile.php?id=61564284895721" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white border-2 border-black p-4 rounded-xl font-bold shadow-paper-sm hover:scale-105 transition-all text-black">
            <div className="bg-[#1877F2] p-2 rounded-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </div> Facebook
          </a>
          
          <a href="https://www.tiktok.com/@pobpet0?_r=1&_t=ZS-969j6BVBTl7" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white border-2 border-black p-4 rounded-xl font-bold shadow-paper-sm hover:scale-105 transition-all text-black">
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