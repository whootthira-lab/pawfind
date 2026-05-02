import { createClient } from '@/lib/supabase/server'
import { PetCard } from '@/components/pet/PetCard'
import { notFound } from 'next/navigation'

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

  const primaryImage = pet.pet_images?.find((i: any) => i.is_primary)?.storage_url

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border-2 border-black rounded-lg shadow-paper overflow-hidden">
        {primaryImage && (
          <img src={primaryImage} alt={pet.name} className="w-full h-96 object-cover border-b-2 border-black" />
        )}
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{pet.name || 'ไม่ทราบชื่อ'}</h1>
              <p className="text-lg font-medium">{pet.breed} • {pet.province}</p>
            </div>
            <span className="bg-wagashi-matcha border-2 border-black px-3 py-1 rounded font-bold shadow-paper-sm">
              {pet.status === 'lost' ? 'ตามหาน้อง' : pet.status === 'found' ? 'พบน้อง' : pet.status}
            </span>
          </div>

          <div className="bg-washi border-2 border-black p-4 rounded mb-6">
            <h3 className="font-bold mb-2">🐾 ข้อมูลจาก AI</h3>
            <p className="text-sm">{pet.ai_description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border-2 border-black p-4 rounded bg-wagashi-sakura shadow-paper-sm">
              <div className="text-sm font-bold mb-1">สีหลัก</div>
              <div>{pet.color}</div>
            </div>
            <div className="border-2 border-black p-4 rounded bg-wagashi-sora shadow-paper-sm">
              <div className="text-sm font-bold mb-1">ขนาด</div>
              <div>{pet.size}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
