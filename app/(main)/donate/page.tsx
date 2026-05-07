'use client'

import Image from 'next/image'
import { HeartHandshake, Target, Sparkles, Users, QrCode, ExternalLink, Activity } from 'lucide-react'

export default function DonateAboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8 mb-20">
      
      {/* ── 1. Header & Philosophy ── */}
      <div className="bg-wagashi-kinako border-4 border-ori-ink rounded-3xl p-8 md:p-12 shadow-paper text-center relative overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-black mb-4 text-ori-ink tracking-tight uppercase italic">
          เกี่ยวกับเรา
        </h1>
        <p className="text-xl md:text-2xl font-bold text-ori-orange-d mb-6">
          โดยดำเนินการตามแนวทางของธุรกิจเพื่อสังคม (Social Enterprise) เพื่อช่วยให้สังคมดีขึ้นทีละนิดเท่าที่ทำได้ ทุกคนอยู่ได้และเติบโตไปด้วยกัน
        </p>
        <div className="bg-white/90 p-6 md:p-8 rounded-2xl border-4 border-ori-ink text-left shadow-paper-sm">
          <p className="font-bold text-lg leading-relaxed text-ori-ink-m">
            PobPet เรามีจุดมุ่งหมายในการขับเคลื่อนเพื่อให้สังคมดีขึ้นจากจุดเล็กๆ เพื่อส่งต่อความหวังและสิ่งดีๆ
            <span className="text-ori-ink font-black bg-ori-yellow/30 px-2 rounded mx-1">ธุรกิจเพื่อสังคม (Social Enterprise)</span> 
            ที่มุ่งเน้นให้ทุกคนใน Ecosystem สามารถอยู่ได้และเติบโตได้อย่างยั่งยืน เราผสานเทคโนโลยี นวัตกรรม และความเป็นมนุษย์ที่เชื่อว่าเราช่วยให้สิ่งรอบตัวและสังคมน่าอยู่ขึ้นได้โดยเริ่มจากจุดเล็กๆ สู่การสร้างสิ่งดีๆและความหวังให้ค่อยๆ ขยายกว้างขึ้นเรื่อยๆ เพื่อยกระดับคุณภาพชีวิตของทั้งสัตว์เลี้ยงและผู้คน
          </p>
        </div>
      </div>

      {/* ── 2. Past Works & Innovations (นวัตกรรมขาเทียม) ── */}
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 md:p-10 shadow-paper">
        <div className="flex items-center gap-3 mb-8 border-b-4 border-ori-ink pb-4">
          <Sparkles className="text-ori-orange w-10 h-10 shrink-0" />
          <h2 className="text-3xl font-black text-ori-ink">นวัตกรรมเพื่อชีวิตใหม่</h2>
        </div>

        <div className="space-y-12">
          {/* นกกระเรียน */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="text-ori-green-d" />
              <h3 className="text-2xl font-black text-ori-green-d">ทดลองทำขาเทียมให้นกกระเรียนไทย</h3>
            </div>
            <p className="font-bold text-ori-ink-l mb-6 text-lg">
              ตั้งแต่ปี 2566 เราได้ริเริ่มโครงการทดลองออกแบบและสร้างขาเทียมให้กับนกกระเรียนพันธุ์ไทย ในนามส่วนตัวร่วมกับสวนสัตว์นครราชสีมา เพื่อพยายามให้นกที่สูญเสียขาสามารถกลับมาเดินและใช้ชีวิตได้อีกครั้ง
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-4 border-ori-ink rounded-2xl overflow-hidden shadow-paper-sm relative aspect-[4/3] group">
                <Image src="/crane-fitting.png" alt="การใส่ขาเทียมให้นกกระเรียน" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="border-4 border-ori-ink rounded-2xl overflow-hidden shadow-paper-sm relative aspect-[4/3] group">
                <Image src="/crane-prosthetic-closeup.png" alt="รายละเอียดขาเทียมนกกระเรียน" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="border-4 border-ori-ink rounded-2xl overflow-hidden shadow-paper-sm relative aspect-[4/3] group">
                <Image src="/crane-walking.png" alt="นกกระเรียนทดลองเดิน" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
            <a 
              href="https://www.facebook.com/profile.php?id=61564284895721" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-6 text-blue-600 font-black hover:underline bg-blue-50 px-4 py-2 rounded-xl border-2 border-blue-200"
            >
              <ExternalLink size={20} /> ดูผลงานเพิ่มเติมที่ Facebook
            </a>
          </div>

          {/* แมวและสุนัข */}
          <div className="pt-8 border-t-4 border-dashed border-gray-200">
            <h3 className="text-2xl font-black mb-3 text-ori-orange-d">โครงการทดลองขาเทียมสำหรับสุนัขและแมว</h3>
            <p className="font-bold text-ori-ink-l mb-6 text-lg">
              เรากำลังนำองค์ความรู้จากการทำขาเทียมนกกระเรียน มาพัฒนาต่อยอดเพื่อสร้างขาเทียมสำหรับสัตว์เลี้ยงขนาดเล็ก ซึ่งปัจจุบันกำลังอยู่ในระหว่างการทดลองทางคลินิกอย่างใกล้ชิด
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
              <div className="border-4 border-ori-ink rounded-2xl overflow-hidden shadow-paper-sm bg-gray-100 relative aspect-[3/4] group">
                <Image src="/cat-prosthetic-1.png" alt="ทดลองขาเทียมแมว 1" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="border-4 border-ori-ink rounded-2xl overflow-hidden shadow-paper-sm bg-gray-100 relative aspect-[3/4] group">
                <Image src="/cat-prosthetic-2.png" alt="ทดลองขาเทียมแมว 2" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Future Goals & Community (วิสัยทัศน์และการสร้างอาชีพ) ── */}
      <div className="bg-wagashi-matcha/30 border-4 border-ori-ink rounded-3xl p-6 md:p-10 shadow-paper">
        <div className="flex items-center gap-3 mb-8 border-b-4 border-ori-ink pb-4">
          <Target className="text-ori-green-d w-10 h-10 shrink-0" />
          <h2 className="text-3xl font-black text-ori-ink">เป้าหมายและการพัฒนาชุมชน</h2>
        </div>

        <div className="space-y-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="bg-white p-4 rounded-full border-4 border-ori-ink shadow-paper-sm shrink-0">
              <HeartHandshake className="text-ori-orange w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-xl mb-2 text-ori-ink">ต่อยอดทุนเพื่อสังคม (Free Prosthetics)</h3>
              <p className="font-bold text-ori-ink-m text-lg">
                ในอนาคต หากเรามีเงินทุนสนับสนุนที่เพียงพอ เรามีความตั้งใจที่จะนำทุนมาพัฒนางานด้านนี้ให้สมบูรณ์ และจัดทำโครงการ <span className="text-ori-orange-d">&quot;สร้างขาเทียมให้สุนัขและแมวฟรี&quot;</span> สำหรับผู้ที่ขาดแคลนทุนทรัพย์
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="bg-white p-4 rounded-full border-4 border-ori-ink shadow-paper-sm shrink-0">
              <Users className="text-ori-blue-d w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-xl mb-2 text-ori-ink">สร้างอาชีพใหม่ระดับนานาชาติ</h3>
              <p className="font-bold text-ori-ink-m text-lg">
                งานด้านขาเทียมสัตว์เลี้ยงเป็น Know-how และ Knowledge เฉพาะทางที่ยังมีผู้ทำน้อยมาก เราตั้งเป้าที่จะสร้างเครือข่ายชุมชน จัดอบรมและถ่ายทอดความรู้ เพื่อผลักดันให้เกิด <span className="text-ori-blue-d">&quot;อาชีพใหม่&quot;</span> ที่ยกระดับไปสู่ระดับนานาชาติได้
              </p>
            </div>
          </div>
        </div>

        {/* เครือข่ายความร่วมมือ */}
        <div className="mt-10 bg-white p-6 md:p-8 rounded-2xl border-4 border-ori-ink shadow-paper-sm">
          <h4 className="font-black text-xl text-ori-ink mb-4 flex items-center gap-2">
            🤝 เครือข่ายความร่วมมือของเรา
          </h4>
          <ul className="flex flex-col gap-3 font-bold text-ori-ink-m text-lg">
            <li className="flex items-start gap-2">
              <span className="text-ori-green mt-1">●</span> วิสาหกิจชุมชนเศรษฐกิจสร้างสรรค์และเศรษฐกิจดิจิทัลด่านขุนทด
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ori-orange mt-1">●</span> เครือข่ายวิสาหกิจชุมชนพัฒนาเศรษฐกิจสร้างสรรค์อำเภอด่านขุนทด
            </li>
          </ul>
        </div>
      </div>

      {/* ── 4. QR Code Section (ดึงดีไซน์จากหน้าแรกมาใช้) ── */}
      <div className="bg-ori-orange text-white border-4 border-black p-8 md:p-12 rounded-3xl shadow-paper text-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <QrCode className="w-16 h-16 mb-4 text-white drop-shadow-md" />
          <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
            ร่วมสมทบทุนเพื่อขับเคลื่อน <br className="hidden md:block" />โปรเจกต์ขาเทียมและชุมชน 💖
          </h2>
          <p className="font-bold text-lg md:text-xl opacity-90 mb-8 max-w-2xl">
            ทุกการสนับสนุนของคุณจะถูกนำไปใช้พัฒนาระบบเพื่อให้น้องกลับบ้าน พัฒนาชุมชน และสานต่อโครงการทำขาเทียมฟรีให้กับน้องๆ สัตว์เลี้ยง
          </p>
          
          <div className="flex flex-col items-center gap-4 bg-white/20 p-6 rounded-3xl border-4 border-black backdrop-blur-md w-fit mx-auto shadow-paper-sm">
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl border-4 border-black overflow-hidden relative bg-white">
              <Image src="/qr-code.jpg" alt="QR Code รับบริจาค" fill className="object-cover" />
            </div>
            <div className="bg-white text-ori-orange font-black py-3 px-8 rounded-xl border-4 border-black shadow-paper-sm text-lg md:text-xl w-full tracking-wide">
              ชื่อบัญชี: KRUTH APEX
            </div>
          </div>
        </div>

        {/* ลายพื้นหลังตกแต่ง */}
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-80 h-80 bg-black opacity-10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

    </div>
  )
}