import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PetGallery } from '@/components/pet/PetGallery'

export default async function PetProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: pet } = await supabase
    .from('pets')
    .select('*, pet_images(storage_url, is_primary)')
    .eq('id', params.id)
    .single()

  if (!pet) {
    notFound()
  }

  const images = pet.pet_images || []
  const primaryImage = images.find((i: any) => i.is_primary)?.storage_url || pet.image_url

  // 💡 จัดรูปแบบ วัน และ เวลา ที่แจ้งข้อมูล
  const createdAt = new Date(pet.created_at)
  const formattedDate = createdAt.toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const formattedTime = createdAt.toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="max-w-3xl mx-auto mb-12">
      <div className="bg-white border-2 border-black rounded-lg shadow-paper overflow-hidden">
        
        <PetGallery 
          primaryImage={primaryImage} 
          images={images} 
          petName={pet.name} 
        />

        <div className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{pet.name || 'ไม่ทราบชื่อ'}</h1>
              <p className="text-xl font-bold text-gray-700">
                {pet.breed || 'ไม่ระบุสายพันธุ์'} • {pet.province} {pet.district ? `(${pet.district})` : ''}
              </p>
              {/* 💡 แสดง วัน-เวลา ที่แจ้งข้อมูล */}
              <p className="text-sm font-bold text-gray-500 mt-2 bg-gray-100 border border-gray-300 inline-block px-3 py-1 rounded-full">
                🕒 แจ้งข้อมูลเมื่อ: {formattedDate} เวลา {formattedTime} น.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="bg-wagashi-matcha border-2 border-black px-4 py-2 rounded-lg font-bold shadow-paper-sm text-lg text-center min-w-[140px]">
                {pet.status === 'lost' ? '🚨 ตามหาเจ้าของ' : pet.status === 'found' ? '👀 พบน้องหลงทาง' : '💖 หาบ้านใหม่'}
              </span>
              {pet.reward_amount > 0 && (
                <span className="bg-red-500 text-white border-2 border-black px-3 py-1 rounded font-bold shadow-paper-sm">
                  💰 รางวัล {pet.reward_amount.toLocaleString()} บาท
                </span>
              )}
            </div>
          </div>

          <hr className="border-black border-1 mb-6" />

          {/* 💡 ส่วนแสดงพิกัด GPS และปุ่มเปิด Google Maps (แสดงเฉพาะเมื่อมีพิกัด) */}
          {pet.latitude && pet.longitude && (
            <div className="bg-white border-2 border-black p-5 rounded-lg mb-8 shadow-paper-sm flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
              {/* ตกแต่งพื้นหลังสไตล์แผนที่นิดหน่อย */}
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-wagashi-sora p-3 rounded-full border-2 border-black text-2xl shadow-paper-sm">
                  📍
                </div>
                <div>
                  <h3 className="font-bold text-lg">พิกัดที่พบสัตว์เลี้ยง</h3>
                  <p className="text-sm font-medium text-gray-600 font-mono mt-1">Lat: {pet.latitude.toFixed(5)}, Lng: {pet.longitude.toFixed(5)}</p>
                </div>
              </div>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${pet.latitude},${pet.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto relative z-10"
              >
                <Button className="w-full bg-wagashi-kinako text-black hover:bg-yellow-400 border-2 border-black px-6 py-5 text-md font-bold shadow-paper-sm hover:-translate-y-1 transition-transform">
                  🗺️ เปิดดูใน Google Maps
                </Button>
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="border-2 border-black p-5 rounded-lg bg-wagashi-kinako shadow-paper-sm md:col-span-2">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                ✨ ตำหนิหรือลักษณะพิเศษ
              </h3>
              <p className="text-black font-medium leading-relaxed">
                {pet.distinctive_features || "ผู้แจ้งไม่ได้ระบุลักษณะพิเศษไว้"}
              </p>
            </div>

            <div className="border-2 border-black p-5 rounded-lg bg-wagashi-sakura shadow-paper-sm">
              <div className="text-sm font-bold text-gray-600 mb-1 uppercase">สีของสัตว์เลี้ยง</div>
              <div className="text-xl font-bold">{pet.color || "ไม่ระบุ"}</div>
            </div>

            <div className="border-2 border-black p-5 rounded-lg bg-wagashi-sora shadow-paper-sm">
              <div className="text-sm font-bold text-gray-600 mb-1 uppercase">ประเภทสัตว์</div>
              <div className="text-xl font-bold capitalize">
                {pet.species === 'dog' ? 'สุนัข' : pet.species === 'cat' ? 'แมว' : pet.species || 'ไม่ระบุ'}
              </div>
            </div>
          </div>

          <div className="bg-washi border-2 border-black p-6 rounded-lg mb-8 shadow-paper-sm">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              🤖 บทวิเคราะห์จาก Gemini AI
            </h3>
            <p className="text-gray-800 leading-relaxed italic">
              &quot;{pet.ai_description}&quot;
            </p>
          </div>

          {/* 💡 แก้ไขข้อความปุ่มติดต่อ */}
          <div className="bg-black text-white p-6 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm opacity-80">ติดต่อผู้ที่แจ้ง</p>
              <p className="text-2xl font-bold">{pet.contact_info}</p>
            </div>
            {pet.contact_info && (
              <a href={`tel:${pet.contact_info.replace(/[- ]/g, '')}`} className="w-full md:w-auto">
                <Button className="w-full md:w-auto bg-white text-black hover:bg-wagashi-matcha border-2 border-white px-8 py-6 text-xl font-bold transition-colors">
                  📞 โทรหาผู้ที่แจ้ง
                </Button>
              </a>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}