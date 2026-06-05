import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Search, 
  PlusCircle, 
  MessageCircle, 
  ChevronDown,
  Share2,
  Heart,
  PawPrint,
  Info
} from 'lucide-react'
import DonationSection from '@/components/DonationSection' 
import RecentPetsGrid from './RecentPetsGrid' 

export const metadata: Metadata = {
  title: 'PobPet | ตามหาสัตว์หายด้วย AI',
  description: 'ช่วยพาเพื่อนรักสี่ขากลับบ้านด้วยระบบค้นหาอัจฉริยะและพลังชุมชนชาวด่านขุนทด',
  openGraph: {
    title: 'PobPet หาสัตว์หายด้วย AI',
    description: 'แพลตฟอร์มตามหาสัตว์เลี้ยงอัจฉริยะ เพื่อทุกคน',
    url: 'https://pobpet.com',
    siteName: 'PobPet หาสัตว์หายด้วย AI',
    images: [{ url: '/logo-og.png', width: 1200, height: 630 }],
    locale: 'th_TH',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-14 pb-20 text-black">
      
      {/* --- Section 1: Hero Banner --- */}
      <section className="bg-white border-4 border-black rounded-3xl p-8 md:p-12 shadow-paper text-center overflow-visible max-w-5xl mx-auto w-full mt-4">
        
        {/* ส่วนแสดงโลโก้ ปรับขนาดให้เข้ากับทรงกลม */}
        <div className="flex justify-center mb-8 relative">
          <div className="relative w-48 h-48 md:w-56 md:h-56 hover:scale-105 transition-transform duration-300">
            <Image 
              src="/logo-og.png" 
              alt="PobPet Logo" 
              fill
              className="object-contain drop-shadow-xl"
              priority
              sizes="(max-width: 768px) 192px, 224px"
            />
          </div>
        </div>
        
        <p className="text-lg md:text-xl font-bold text-ori-ink-m mb-12 max-w-4xl mx-auto leading-loose md:leading-[2.5]">
          หาสัตว์หายด้วย AI โดยดำเนินการตามแนวทาง
          <span className="text-ori-green-d bg-ori-green-bg/40 px-4 py-2 rounded-xl border-2 border-ori-green inline-block mx-2 shadow-paper-sm whitespace-nowrap align-middle">
            &apos;Pay it Forward&apos;
          </span> 
        โดยการให้ก่อนและผู้ที่มีก็ส่งต่อสิ่งดีๆต่อไป  เพื่อช่วยให้สังคมดีขึ้นทีละนิดเท่าที่ทำได้ ทุกคนอยู่ได้และเติบโตไปด้วยกัน 💖
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center flex-wrap">
          <div className="relative group z-30">
            <button className="w-full md:w-64 bg-wagashi-matcha border-2 border-black p-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-paper-sm hover:-translate-y-1 transition-all">
              <Search size={22} /> ค้นหา <ChevronDown size={18} />
            </button>
            {/* ── 🟢 ปรับปรุงเมนูดรอปดาวน์สืบค้นให้ครบถ้วน 5 หมวดหมู่หลัก วิ่งเข้าหาคีย์ tab ตามระบบค้นหาฉบับแก้ไข ── */}
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute top-full left-0 w-full bg-white border-4 border-black rounded-2xl mt-3 p-2 shadow-paper transition-all">
              <Link href="/search?tab=lost" className="block p-3.5 hover:bg-gray-100 rounded-xl font-bold text-left border-b-2 border-gray-100 text-black">🚨 เข้าดูประกาศตามหาน้อง (หาย)</Link>
              <Link href="/search?tab=found" className="block p-3.5 hover:bg-gray-100 rounded-xl font-bold text-left border-b-2 border-gray-100 text-black">👀 เข้าดูประกาศพบสัตว์หลง</Link>
              <Link href="/search?tab=mating" className="block p-3.5 hover:bg-gray-100 rounded-xl font-bold text-left border-b-2 border-gray-100 text-black">❤️ เข้าดูประกาศหาคู่ให้น้อง</Link>
              <Link href="/search?tab=adoption" className="block p-3.5 hover:bg-gray-100 rounded-xl font-bold text-left border-b-2 border-gray-100 text-black">💖 เข้าดูประกาศหาบ้านให้น้อง</Link>
              <Link href="/search?tab=showcase" className="block p-3.5 hover:bg-gray-100 rounded-xl font-bold text-left text-black">✨ เข้าดูทำเนียบโชว์โปรไฟล์น้อง</Link>
            </div>
          </div>

          <div className="relative group z-20">
            <button className="w-full md:w-64 bg-black text-white border-2 border-black p-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-paper-sm hover:-translate-y-1 transition-all">
              <PlusCircle size={22} /> ลงประกาศใหม่ <ChevronDown size={18} />
            </button>
            {/* ── 🟢 ปรับเมนูแจ้งเหตุให้วิ่งเข้าหาคีย์ status ตามโครงสร้างแผงควบคุม ReportForm ตัวอัปเกรด ── */}
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute top-full left-0 w-full bg-white border-4 border-black rounded-2xl mt-3 p-2 shadow-paper transition-all">
              <Link href="/report?status=lost" className="block p-3.5 hover:bg-gray-100 rounded-xl font-bold text-left border-b-2 border-gray-100 text-black">📢 ลงประกาศหาสัตว์หาย</Link>
              <Link href="/report?status=found" className="block p-3.5 hover:bg-gray-100 rounded-xl font-bold text-left border-b-2 border-gray-100 text-black">📍 ลงประกาศพบสัตว์หลง</Link>
              <Link href="/report?status=mating" className="block p-3.5 hover:bg-gray-100 rounded-xl font-bold text-left border-b-2 border-gray-100 text-black">❤️ ลงประกาศหาคู่ให้น้อง</Link>
              <Link href="/report?status=adoption" className="block p-3.5 hover:bg-gray-100 rounded-xl font-bold text-left border-b-2 border-gray-100 text-black">🏠 ลงประกาศหาบ้านให้น้อง</Link>
              <Link href="/report?status=showcase" className="block p-3.5 hover:bg-gray-100 rounded-xl font-bold text-left text-black">✨ ลงทะเบียนโชว์โปรไฟล์</Link>
            </div>
          </div>

          <Link 
            href="/profile?tab=pets"
            className="w-full md:w-64 bg-wagashi-sakura text-black border-2 border-black p-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-paper-sm hover:-translate-y-1 transition-all z-10"
          >
            <PawPrint size={22} /> ลงทะเบียนสัตว์เลี้ยง
          </Link>

          <Link 
            href="/donate"
            className="w-full md:w-auto bg-ori-orange text-white border-2 border-black p-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-paper-sm hover:-translate-y-1 transition-all z-10"
          >
            <Info size={22} /> เกี่ยวกับเรา
          </Link>
        </div>
      </section>

      {/* --- Section 2: Recent Pets Grid --- */}
      <RecentPetsGrid />

      {/* --- Section 3: Donation Section --- */}
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full px-4">
        <h2 className="text-2xl font-black flex items-center gap-2 text-ori-ink">
          <Heart className="text-ori-orange" fill="currentColor" size={28} /> ทุนสนับสนุนโครงการ
        </h2>
        <DonationSection />
      </div>

      {/* --- Section 4: Contact Channels --- */}
      <section className="bg-wagashi-sora border-4 border-black rounded-3xl p-8 shadow-paper max-w-6xl mx-auto w-full mx-4 xl:mx-auto">
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