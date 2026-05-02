import { SearchResult } from '@/types/pet'
import { Button } from '@/components/ui/button'

export function MatchResultCard({ result }: { result: SearchResult }) {
  const getTierColors = (tier: string) => {
    switch(tier) {
      case 'high': return 'bg-wagashi-matcha border-black'
      case 'possible': return 'bg-wagashi-kinako border-black'
      case 'low': return 'bg-wagashi-sakura border-black'
      default: return 'bg-white border-black'
    }
  }

  return (
    <div className={`border-2 p-4 rounded-lg shadow-paper flex flex-col gap-3 ${getTierColors(result.tier)}`}>
      <div className="flex justify-between items-start">
        <div className="bg-white border-2 border-black px-2 py-1 rounded text-sm font-bold shadow-paper-sm">
          {Math.round(result.similarity * 100)}% Match
        </div>
        <div className="text-sm font-bold">{result.distance_km ? `${result.distance_km.toFixed(1)} กม.` : ''}</div>
      </div>
      
      {result.images?.[0] && (
        <img src={result.images[0].storage_url} alt={result.name || 'pet'} className="w-full h-48 object-cover border-2 border-black rounded" />
      )}
      
      <div>
        <h3 className="font-bold text-lg">{result.name || 'ไม่ทราบชื่อ'}</h3>
        <p className="text-sm">{result.breed} • {result.province}</p>
      </div>

      {result.tier === 'possible' && (
        <div className="bg-white border-2 border-black p-2 text-xs font-bold rounded shadow-paper-sm text-red-600">
          ⚠️ สัตว์อาจเปลี่ยนไปหลังจากหลง
        </div>
      )}

      <div className="flex gap-2 mt-auto pt-2">
        <Button className="flex-1 bg-white hover:bg-gray-100 text-black border-2 border-black shadow-paper-sm">
          ดูเปรียบเทียบ
        </Button>
        <Button className="flex-1 bg-black text-white border-2 border-black shadow-paper-sm hover:shadow-paper transition-shadow">
          แจ้งเจ้าของ
        </Button>
      </div>
    </div>
  )
}
