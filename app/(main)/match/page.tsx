import { SwipeInterface } from './SwipeInterface'
import { createClient } from '@/lib/supabase/server'
import { Pet } from '@/types/pet'

export default async function MatchPage() {
  // Fetch pets that need adoption or are lost, prioritizing some "special needs" pets.
  // In a real app, this would use a personalized embedding/vector search.
  // For now, we simulate the "Algorithm Injection" by fetching a mix of regular and special needs pets.
  const supabase = createClient()
  
  const { data: regularPets } = await supabase
    .from('pets')
    .select('*, pet_images(storage_url, is_primary)')
    .is('special_needs', false)
    .limit(10)
    
  const { data: specialPets } = await supabase
    .from('pets')
    .select('*, pet_images(storage_url, is_primary)')
    .is('special_needs', true)
    .limit(5)

  // Mix them: inject special needs pets at every 3rd position
  const mixedPets: Pet[] = []
  
  const mapWithImage = (p: any): Pet => ({
    ...p,
    primary_image: p.pet_images?.find((img: any) => img.is_primary)?.storage_url 
      || p.pet_images?.[0]?.storage_url 
      || null
  })

  const regular = (regularPets || []).map(mapWithImage)
  const special = (specialPets || []).map(mapWithImage)
  
  let rIdx = 0
  let sIdx = 0
  
  while (rIdx < regular.length || sIdx < special.length) {
    if (mixedPets.length % 3 === 2 && sIdx < special.length) {
      mixedPets.push(special[sIdx++])
    } else if (rIdx < regular.length) {
      mixedPets.push(regular[rIdx++])
    } else if (sIdx < special.length) {
      mixedPets.push(special[sIdx++])
    } else {
      break
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">ค้นหาเพื่อนใหม่ 💖</h1>
        <p className="font-medium text-lg">ปัดขวาเพื่อบอกว่าสนใจ ปัดซ้ายเพื่อดูตัวถัดไป</p>
      </div>
      
      <div className="relative w-full max-w-sm h-[500px] flex items-center justify-center">
        {mixedPets.length > 0 ? (
          <SwipeInterface initialPets={mixedPets} />
        ) : (
          <div className="bg-washi border-2 border-black p-8 rounded-lg shadow-paper text-center">
            <h2 className="text-xl font-bold mb-4">ยังไม่มีสัตว์เลี้ยงเพิ่มเติมในตอนนี้</h2>
            <p>กลับมาตรวจสอบใหม่ภายหลังนะครับ</p>
          </div>
        )}
      </div>
    </div>
  )
}
