import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    // ปรับความสูงให้เต็มจอและเพิ่มการ Fade-in เบาๆ
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center gap-8 animate-in fade-in duration-500">
      
      {/* ส่วนหัวใจหลัก: วงแหวนหมุนและไอคอนรอยเท้า */}
      <div className="relative flex items-center justify-center">
        {/* วงแหวนหมุน: ปรับขนาดให้เด่นและใช้สีส้มที่สดใสขึ้น */}
        <Loader2 
          className="w-24 h-24 text-orange-500 animate-spin opacity-80" 
          strokeWidth={1.5}
        />
        
        {/* รอยเท้า: ตั้งค่าให้เด้งเบาๆ (bounce) สลับกับวงแหวนที่หมุน */}
        <span className="absolute text-4xl animate-bounce mb-1">
          🐾
        </span>
      </div>
      
      {/* ส่วนข้อความแจ้งสถานะ */}
      <div className="text-center space-y-3 px-4">
        <h2 className="font-black text-3xl text-gray-800 tracking-tight">
          กำลังเตรียมข้อมูล...
        </h2>
        
        <div className="flex items-center justify-center gap-2">
          {/* จุดไข่ปลาวิ่งๆ เพิ่มความรู้สึกว่าระบบกำลังทำงานอยู่จริง */}
          <p className="font-bold text-gray-500 text-lg">
            รอสักครู่นะครับ ระบบกำลังพาไปหาน้อง
          </p>
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></span>
          </span>
        </div>
      </div>

      {/* ตกแต่งพื้นหลังเล็กน้อยเพื่อให้ดูไม่โล่งเกินไป */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-20 -z-10"></div>
    </div>
  )
}