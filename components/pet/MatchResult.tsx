import { SearchResult } from '@/types/pet'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function MatchResultCard({ result }: { result: SearchResult }) {
  const getTierColors = (tier: string) => {
    switch(tier) {
      case 'high': return 'bg-wagashi-matcha border-black'
      case 'possible': return 'bg-wagashi-kinako border-black'
      case 'low': return 'bg-wagashi-sakura border-black'
      default: return 'bg-white border-black'
    }
  }

  const imgUrl = result.images?.[0]?.storage_url || result.primary_image || result.image_url;

  // ฟังก์ชันสำหรับการแจ้งเจ้าของ
  const handleContactOwner = () => {
    if (!result.contact_info) {
      alert("ขออภัย เจ้าของไม่ได้ลงข้อมูลติดต่อไว้ในระบบ");
      return;
    }

    // ล้างอักขระพิเศษออกให้เหลือแค่ตัวเลขเพื่อเช็คว่าเป็นเบอร์โทรไหม
    const cleanContact = result.contact_info.replace(/[- ]/g, '');
    const isPhoneNumber = /^\d+$/.test(cleanContact);

    if (isPhoneNumber) {
      // ถ้าเป็นเบอร์โทร ให้สั่งโทรออกทันที
      window.location.href = `tel:${cleanContact}`;
    } else {
      // ถ้าเป็นไอดีไลน์หรือข้อความอื่นๆ ให้แสดง Alert แจ้งข้อมูล
      alert(`ข้อมูลการติดต่อเจ้าของ: ${result.contact_info}`);
    }
  };

  return (
    <div className={`border-2 p-4 rounded-lg shadow-paper flex flex-col gap-3 transition-all hover:-translate-y-1 hover:shadow-paper-lg ${getTierColors(result.tier)}`}>
      <div className="flex justify-between items-start">
        <div className="bg-white border-2 border-black px-2 py-1 rounded text-sm font-bold shadow-paper-sm">
          {Math.round(result.similarity * 100)}% Match
        </div>
        <div className="text-sm font-bold bg-white border-2 border-black px-2 py-1 rounded shadow-paper-sm">
          {result.distance_km ? `${result.distance_km.toFixed(1)} กม.` : 'ไม่ระบุระยะทาง'}
        </div>
      </div>
      
      {imgUrl ? (
        <img 
          src={imgUrl.startsWith('data:') || imgUrl.startsWith('http') ? imgUrl : `data:image/jpeg;base64,${imgUrl}`} 
          alt={result.name || 'pet'} 
          className="w-full h-48 object-cover border-2 border-black rounded bg-white" 
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 border-2 border-black rounded flex items-center justify-center font-bold bg-white">
          No Image
        </div>
      )}
      
      <div className="flex-1">
        <h3 className="font-bold text-lg">{result.name || 'ไม่ทราบชื่อ'}</h3>
        <p className="text-sm">{result.breed || 'ไม่ระบุสายพันธุ์'} • {result.province || 'ไม่ระบุจังหวัด'}</p>
      </div>

      {result.tier === 'possible' && (
        <div className="bg-white border-2 border-black p-2 text-xs font-bold rounded shadow-paper-sm text-red-600 flex items-center justify-center">
          ⚠️ สัตว์อาจเปลี่ยนไปหลังจากหลง
        </div>
      )}

      <div className="flex gap-2 mt-auto pt-2">
        <Link href={`/pet/${result.id}`} className="flex-1">
          <Button className="w-full bg-white hover:bg-gray-100 text-black border-2 border-black shadow-paper-sm font-bold">
            ข้อมูล / เปรียบเทียบ
          </Button>
        </Link>
        
        {/* 💡 อัปเกรดปุ่มแจ้งเจ้าของให้ทำงานได้จริง */}
        <Button 
          onClick={handleContactOwner}
          className="flex-1 bg-black text-white border-2 border-black shadow-paper-sm hover:shadow-paper transition-shadow font-bold"
        >
          แจ้งเจ้าของ
        </Button>
      </div>
    </div>
  )
}