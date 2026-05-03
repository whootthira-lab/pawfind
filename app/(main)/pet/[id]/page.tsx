import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function PetProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  // 💡 ดึงข้อมูลแบบ Join table เพื่อเอารูปภาพทั้งหมดมาแสดง
  const { data: pet } = await supabase
    .from('pets')
    .select('*, pet_images(storage_url, is_primary)')
    .eq('id', params.id)
    .single()

  if (!pet) {
    notFound()
  }

  // แยกรูปหลักและรูปประกอบ
  const images = pet.pet_images || []
  const primaryImage = images.find((i: any) => i.is_primary)?.storage_url || pet.image_url
  const secondaryImages = images.filter((i: any) => !i.is_primary)

  return (
    <div className="max-w-3xl mx-auto mb-12">
      <div className="bg-white border-2 border-black rounded-lg shadow-paper overflow-hidden">
        
        {/* ส่วนแสดงรูปภาพ (Gallery) */}
        <div className="flex flex-col border-b-2 border-black">
          {primaryImage && (
            <img 
              src={primaryImage.startsWith('http') ? primaryImage : `data:image/jpeg;base64,${primaryImage}`} 
              alt={pet.name} 
              className="w-full h-[450px] object-cover" 
            />
          )}
          
          {/* 💡 แสดงรูปอื่นๆ ที่แนบมา (ถ้ามี) */}
          {secondaryImages.length > 0 && (
            <div className="flex gap-2 p-4 bg-gray-50 border-t-2 border-black overflow-x-auto">
              {secondaryImages.map((img: any, idx: number) => (
                <img 
                  key={idx}
                  src={img.storage_url.startsWith('http') ? img.storage_url : `data:image/jpeg;base64,${img.storage_url}`}
                  className="w-24 h-24 object-cover border-2 border-black rounded shadow-paper-sm flex-shrink-0"
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{pet.name || 'ไม่ทราบชื่อ'}</h1>
              <p className="text-xl font-bold text-gray-700">
                {pet.breed || 'ไม่ระบุสายพันธุ์'} • {pet.province} {pet.district ? `(${pet.district})` : ''}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="bg-wagashi-matcha border-2 border-black px-4 py-2 rounded-lg font-bold shadow-paper-sm text-lg">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* 💡 ส่วนแสดงตำหนิ/ลักษณะพิเศษ (ใหม่) */}
            <div className="border-2 border-black p-5 rounded-lg bg-wagashi-kinako shadow-paper-sm md:col-span-2">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                ✨ ตำหนิหรือลักษณะพิเศษ
              </h3>
              <p className="text-black font-medium leading-relaxed">
                {pet.distinctive_features || "เจ้าของไม่ได้ระบุลักษณะพิเศษไว้"}
              </p>
            </div>

            <div className="border-2 border-black p-5 rounded-lg bg-wagashi-sakura shadow-paper-sm">
              <div className="text-sm font-bold text-gray-600 mb-1 uppercase">สีของสัตว์เลี้ยง</div>
              <div className="text-xl font-bold">{pet.color || "ไม่ระบุ"}</div>
            </div>

            <div className="border-2 border-black p-5 rounded-lg bg-wagashi-sora shadow-paper-sm">
              <div className="text-sm font-bold text-gray-600 mb-1 uppercase">ประเภทสัตว์</div>
              <div className="text-xl font-bold capitalize">{pet.species === 'dog' ? 'สุนัข' : pet.species === 'cat' ? 'แมว' : pet.species}</div>
            </div>
          </div>

          {/* ข้อมูลจาก AI */}
          <div className="bg-washi border-2 border-black p-6 rounded-lg mb-8 shadow-paper-sm">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              🤖 บทวิเคราะห์จาก Gemini AI
            </h3>
            <p className="text-gray-800 leading-relaxed italic">
              "{pet.ai_description}"
            </p>
          </div>

          {/* ช่องทางติดต่อ */}
          <div className="bg-black text-white p-6 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm opacity-80">หากพบเบาะแสหรือต้องการติดต่อเจ้าของ</p>
              <p className="text-2xl font-bold">{pet.contact_info}</p>
            </div>
            <a href={`tel:${pet.contact_info?.replace(/[- ]/g, '')}`} className="w-full md:w-auto">
              <Button className="w-full md:w-auto bg-white text-black hover:bg-wagashi-matcha border-2 border-white px-8 py-6 text-xl font-bold transition-colors">
                📞 โทรหาเจ้าของทันที
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}