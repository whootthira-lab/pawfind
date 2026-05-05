import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center gap-6">
      {/* วงแหวนหมุนๆ พร้อมรอยเท้าตรงกลาง */}
      <div className="relative flex items-center justify-center">
        <Loader2 className="w-20 h-20 text-orange-500 animate-spin" />
        <span className="absolute text-3xl animate-pulse">
          🐾
        </span>
      </div>
      
      {/* ข้อความแจ้งเตือน */}
      <div className="text-center space-y-2">
        <h2 className="font-black text-2xl text-gray-800 animate-pulse">
          กำลังดึงข้อมูลน้อง...
        </h2>
        <p className="font-bold text-gray-500">
          รอสักครู่นะครับ ระบบกำลังรวบรวมรายละเอียด 🐶🐱
        </p>
      </div>
    </div>
  )
}