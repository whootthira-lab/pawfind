import { RandomPetGrid } from '@/components/donate/RandomPetGrid'
import { Button } from '@/components/ui/button'

export default function DonatePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">ช่วยให้น้องได้กลับบ้าน 💛</h1>
        <p className="text-xl">ทุกการบริจาคของคุณ ช่วยสนับสนุนค่าเซิร์ฟเวอร์ AI และรางวัลนำจับให้น้องๆ</p>
      </div>

      {/* Section 1: Dashboard โปร่งใส */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-washi border-2 border-black p-6 rounded-lg shadow-paper text-center">
          <h3 className="font-bold mb-2">ค่าใช้จ่ายเดือนนี้</h3>
          <div className="text-3xl font-bold text-red-600">8,500 ฿</div>
        </div>
        <div className="bg-wagashi-matcha border-2 border-black p-6 rounded-lg shadow-paper text-center">
          <h3 className="font-bold mb-2">ได้รับบริจาค</h3>
          <div className="text-3xl font-bold text-green-700">6,200 ฿</div>
        </div>
        <div className="bg-wagashi-kinako border-2 border-black p-6 rounded-lg shadow-paper text-center">
          <h3 className="font-bold mb-2">Community Fund คงเหลือ</h3>
          <div className="text-3xl font-bold">2,450 ฿</div>
        </div>
      </section>

      {/* Section 3: Donation Options */}
      <section className="bg-white border-2 border-black p-8 rounded-lg shadow-paper text-center">
        <h2 className="text-2xl font-bold mb-6">เลือกจำนวนที่ต้องการสมทบทุน</h2>
        <div className="flex flex-wrap gap-4 justify-center mb-4">
          <Button className="bg-wagashi-sakura hover:bg-pink-300 text-black border-2 border-black shadow-paper-sm text-lg font-bold px-6 py-4">
            💛 20 บาท
          </Button>
          <Button className="bg-wagashi-matcha hover:bg-green-300 text-black border-2 border-black shadow-paper-sm text-lg font-bold px-6 py-4">
            50 บาท
          </Button>
          <Button className="bg-wagashi-sora hover:bg-blue-300 text-black border-2 border-black shadow-paper-sm text-lg font-bold px-6 py-4">
            100 บาท
          </Button>
          <Button className="bg-washi hover:bg-gray-100 text-black border-2 border-black shadow-paper-sm text-lg font-bold px-6 py-4">
            ระบุเอง
          </Button>
        </div>
        <p className="text-sm font-bold text-gray-600">เงิน 1.74 บาท ช่วยวิเคราะห์รูปด้วย AI ได้ 1 เคส</p>
      </section>

      {/* Section 2: RandomPetGrid */}
      <section className="bg-washi border-2 border-black p-8 rounded-lg shadow-paper">
        <RandomPetGrid />
      </section>

      {/* Section 4: Impact Numbers */}
      <section className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-white border-2 border-black p-6 rounded-lg shadow-paper flex items-center justify-between">
          <div className="font-bold text-lg">สัตว์ที่กลับบ้านเพราะ PawFind</div>
          <div className="text-3xl font-bold bg-wagashi-sora px-3 py-1 border-2 border-black shadow-paper-sm rounded">892</div>
        </div>
        <div className="flex-1 bg-white border-2 border-black p-6 rounded-lg shadow-paper flex items-center justify-between">
          <div className="font-bold text-lg">PawScout ที่ Active</div>
          <div className="text-3xl font-bold bg-wagashi-kinako px-3 py-1 border-2 border-black shadow-paper-sm rounded">1,450</div>
        </div>
      </section>
    </div>
  )
}
