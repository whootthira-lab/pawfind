import { Pet } from '@/types/pet'
import { Button } from '@/components/ui/button'

export function PetCard({ pet }: { pet: Pet }) {
  return (
    <div className="bg-washi border-2 border-black p-4 rounded-lg shadow-paper hover:-translate-y-1 hover:shadow-paper-lg transition-all flex flex-col gap-3">
      {(pet.primary_image || pet.image_url) ? (
        <img 
          src={(pet.primary_image || pet.image_url).startsWith('data:') || (pet.primary_image || pet.image_url).startsWith('http') ? (pet.primary_image || pet.image_url) : `data:image/jpeg;base64,${(pet.primary_image || pet.image_url)}`} 
          alt={pet.name || 'pet'} 
          className="w-full h-48 object-cover border-2 border-black rounded" 
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 border-2 border-black rounded flex items-center justify-center font-bold">No Image</div>
      )}
      
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg">{pet.name || 'ไม่ทราบชื่อ'}</h3>
          <span className="text-sm font-bold bg-wagashi-sora px-2 py-1 border-2 border-black rounded shadow-paper-sm">
            {(pet.species || pet.type) === 'dog' ? '🐶 หมา' : (pet.species || pet.type) === 'cat' ? '🐱 แมว' : (pet.species || pet.type) === 'bird' ? '🐦 นก' : (pet.species || pet.type) === 'rabbit' ? '🐰 กระต่าย' : '🐾 อื่นๆ'}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-2">{pet.breed}</p>
        <div className="flex items-center gap-1 text-sm font-bold">
          <span>📍 {pet.province}</span>
        </div>
        {pet.contact_info && (
          <div className="mt-2 text-sm bg-wagashi-matcha border border-black p-2 rounded">
            <span className="font-bold">📞 ติดต่อ:</span> {pet.contact_info}
          </div>
        )}
        {pet.days_missing !== undefined && (
          <p className="text-sm text-red-600 font-bold mt-1">
            {pet.days_missing < 1 ? 'เพิ่งหายวันนี้' : `หายมา ${pet.days_missing} วันแล้ว`}
          </p>
        )}
      </div>

      <Button className="w-full mt-auto bg-white hover:bg-wagashi-sakura text-black border-2 border-black shadow-paper-sm hover:shadow-paper transition-all font-bold">
        ดูข้อมูลเพิ่มเติม
      </Button>
    </div>
  )
}
