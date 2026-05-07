"use client"
import Image from 'next/image'

export default function DonationSection() {
  return (
    <section className="bg-ori-orange text-white border-4 border-black p-8 md:p-14 rounded-3xl shadow-paper flex flex-col items-center text-center relative overflow-hidden">
      
      <div className="relative z-10 flex flex-col items-center">
        <h3 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
          ร่วมสมทบทุนสนับสนุน <br className="hidden md:block" />ธุรกิจเพื่อสังคมของเรา 💖
        </h3>
        <p className="text-lg md:text-xl font-bold opacity-90 mb-10 max-w-2xl">
          สนับสนุนโครงการทำขาเทียมฟรีให้น้องๆ พัฒนาระบบ AI และสร้างอาชีพให้ชุมชนด่านขุนทด
        </p>
        
        <div className="flex flex-col items-center gap-4 bg-white/20 p-6 rounded-3xl border-4 border-black backdrop-blur-md w-fit mx-auto shadow-paper-sm">
          <div className="w-48 h-48 md:w-56 md:h-56 relative rounded-2xl border-4 border-black shadow-paper-sm overflow-hidden bg-white shrink-0">
            <Image 
              src="/qr-code.jpg" 
              alt="QR Code รับบริจาค" 
              fill
              className="object-cover" 
            />
          </div>
          
          <div className="bg-white text-ori-orange font-black py-3 px-8 rounded-xl border-4 border-black shadow-paper-sm text-lg md:text-xl w-full tracking-wide">
            ชื่อบัญชี: KRUTH APEX
          </div>
        </div>
      </div>

      {/* ลายพื้นหลังตกแต่ง */}
      <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-50px] left-[-50px] w-80 h-80 bg-black opacity-10 rounded-full blur-3xl pointer-events-none"></div>
    </section>
  )
}