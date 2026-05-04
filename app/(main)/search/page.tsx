import { RadiusExpander } from '@/components/search/RadiusExpander'
// 💡 เปลี่ยนมาเรียกใช้ MatchResultCard ที่เราทำปุ่ม Pin ไว้แทน PetCard
import { MatchResultCard } from '@/components/pet/MatchResult' 
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Search } from 'lucide-react' // ลบ AlertCircle, Eye, Heart ออกเพราะเปลี่ยนไปใช้อิโมจิแทน

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const radiusStr = searchParams.radius as string
  const radius = radiusStr ? parseInt(radiusStr) : 10
  
  // 💡 ดึงค่า Tab ปัจจุบันจาก URL (เช่น /search?tab=lost) ค่าเริ่มต้นคือ 'all'
  const currentTab = (searchParams.tab as string) || 'all'

  const supabase = createClient()
  
  // 1. สร้าง Query ดึงข้อมูล
  let query = supabase
    .from('pets')
    .select('*, pet_images(storage_url, is_primary)')
    .order('created_at', { ascending: false })
    .limit(20)

  // 2. ถ้ามีการเลือก Tab (ที่ไม่ใช่ทั้งหมด) ให้เพิ่มเงื่อนไข Filter
  if (currentTab !== 'all') {
    query = query.eq('status', currentTab)
  }

  const { data: pets, error } = await query

  const rawPets = pets || []
  
  // 3. แปลงโครงสร้างข้อมูลให้เข้ากับ MatchResultCard
  const petList = rawPets.map((p: any) => ({
    id: p.id,
    name: p.name,
    breed: p.breed,
    province: p.province || p.district || 'ไม่ระบุพิกัด',
    status: p.status,
    // รองรับทั้งรูปจาก Storage แบบเก่า และ Base64 Array จากหน้า Report ล่าสุด
    image_url: p.pet_images?.find((img: any) => img.is_primary)?.storage_url 
      || p.pet_images?.[0]?.storage_url 
      || (p.images && p.images.length > 0 ? p.images[0] : null) 
      || ''
  }))

  // ฟังก์ชันช่วยจัดสไตล์ปุ่ม Tabs สีสันแบบ Neubrutalism
  const getTabStyle = (tabName: string, colorClass: string) => {
    const isActive = currentTab === tabName
    return `flex-1 py-3 px-4 font-bold text-center border-2 border-black rounded-lg shadow-paper-sm transition-all flex items-center justify-center gap-2 ${
      isActive ? colorClass + ' translate-y-1 shadow-none' : 'bg-white hover:bg-gray-50 hover:-translate-y-1 hover:shadow-paper'
    }`
  }

  return (
    <div className="flex flex-col gap-6 mb-20 max-w-6xl mx-auto px-4">
      <div className="bg-wagashi-sora border-4 border-black rounded-2xl shadow-paper p-8 text-center">
        {/* เปลี่ยนหัวข้อและเพิ่มอิโมจิ 🐾🔍 */}
        <h1 className="text-4xl font-bold mb-2">ค้นหาน้อง 🐾🔍</h1>
        <p className="font-medium text-lg">ค้นหาสัตว์เลี้ยงที่หายไป หรืออุปการะเพื่อนใหม่</p>
      </div>

      {/* 💡 ระบบ Tabs แยกหมวดหมู่ (ใช้ Link เพื่อเปลี่ยน URL Params) */}
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <Link href={`/search?tab=all&radius=${radius}`} className={getTabStyle('all', 'bg-black text-white')}>
          <Search size={20} /> ทั้งหมด
        </Link>
        {/* เปลี่ยนข้อความปุ่มและใส่อิโมจินำหน้า */}
        <Link href={`/search?tab=lost&radius=${radius}`} className={getTabStyle('lost', 'bg-wagashi-sakura')}>
          🚨 ดูการแจ้งหาย
        </Link>
        <Link href={`/search?tab=found&radius=${radius}`} className={getTabStyle('found', 'bg-wagashi-sora')}>
          👀 ดูประกาศพบสัตว์หลง
        </Link>
        <Link href={`/search?tab=adoption&radius=${radius}`} className={getTabStyle('adoption', 'bg-wagashi-matcha')}>
          💖 หาบ้านให้น้อง
        </Link>
      </div>

      <RadiusExpander resultCount={petList.length} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {petList.map(pet => (
          // 💡 เรียกใช้ MatchResultCard ที่มีปุ่ม Pin 📌
          <MatchResultCard key={pet.id} result={pet} />
        ))}
      </div>
      
      {petList.length === 0 && (
        <div className="bg-washi border-4 border-dashed border-black rounded-2xl shadow-paper-sm p-20 text-center mt-4">
          <p className="font-bold text-2xl text-gray-500">ไม่พบข้อมูลในหมวดหมู่นี้ หรือในรัศมีที่กำหนด</p>
        </div>
      )}
    </div>
  )
}