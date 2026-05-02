import { RadiusExpander } from '@/components/search/RadiusExpander'
import { PetCard } from '@/components/pet/PetCard'
import { createClient } from '@/lib/supabase/server'
import { Pet } from '@/types/pet'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const radiusStr = searchParams.radius as string
  const radius = radiusStr ? parseInt(radiusStr) : 10
  const supabase = createClient()
  
  // Fetch pets - for now we'll fetch all and let the DB handle spatial queries later if configured
  // As a fallback MVP we just fetch the latest lost pets
  const { data: pets, error } = await supabase
    .from('pets')
    .select('*, pet_images(storage_url, is_primary)')
    .order('created_at', { ascending: false })
    .limit(20)

  const rawPets = pets || []
  const petList: Pet[] = rawPets.map((p: any) => ({
    ...p,
    primary_image: p.pet_images?.find((img: any) => img.is_primary)?.storage_url 
      || p.pet_images?.[0]?.storage_url 
      || null
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-wagashi-sora border-2 border-black rounded-lg shadow-paper p-8">
        <h1 className="text-3xl font-bold mb-2">ค้นหาสัตว์เลี้ยง 🔍</h1>
        <p className="font-medium text-lg">ค้นหาสัตว์เลี้ยงที่หายไปหรือถูกพบในบริเวณใกล้เคียง</p>
      </div>

      <RadiusExpander resultCount={petList.length} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {petList.map(pet => (
          <PetCard key={pet.id} pet={pet} />
        ))}
      </div>
      
      {petList.length === 0 && (
        <div className="bg-white border-2 border-black rounded-lg shadow-paper p-12 text-center">
          <p className="font-bold text-xl text-gray-500">ไม่พบข้อมูลสัตว์เลี้ยงในรัศมีที่กำหนด</p>
        </div>
      )}
    </div>
  )
}
