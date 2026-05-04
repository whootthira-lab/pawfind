'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { MatchResultCard } from '@/components/pet/MatchResult'
import { RadiusExpander } from '@/components/search/RadiusExpander'
import Link from 'next/link'
import { Search, Loader2, ChevronDown } from 'lucide-react'

// 💡 สร้าง Component ย่อยเพื่อรองรับ Suspense (กฎของ Next.js เวลามีการดึง URL Params)
function SearchContent() {
  const searchParams = useSearchParams()
  const radiusStr = searchParams.get('radius')
  const radius = radiusStr ? parseInt(radiusStr) : 10
  
  // ดึงค่า Tab ปัจจุบัน (ค่าเริ่มต้นคือ 'all')
  const currentTab = searchParams.get('tab') || 'all'

  const [pets, setPets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const ITEMS_PER_PAGE = 12 // 💡 โหลดทีละ 12 การ์ด

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ฟังก์ชันดึงข้อมูลจากฐานข้อมูล
  const fetchPets = async (pageNumber: number, isLoadMore = false) => {
    if (!isLoadMore) setLoading(true)
    else setLoadingMore(true)

    // ใช้คำสั่ง .range() เพื่อจำกัดจำนวนการโหลด
    let query = supabase
      .from('pets')
      .select('*, pet_images(storage_url, is_primary)')
      .order('created_at', { ascending: false })
      .range(pageNumber * ITEMS_PER_PAGE, (pageNumber + 1) * ITEMS_PER_PAGE - 1)

    // กรองตามหมวดหมู่
    if (currentTab !== 'all') {
      query = query.eq('status', currentTab)
    }

    const { data, error } = await query

    if (data) {
      const formattedPets = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        breed: p.breed,
        province: p.province || p.district || 'ไม่ระบุพิกัด',
        status: p.status,
        image_url: p.pet_images?.find((img: any) => img.is_primary)?.storage_url 
          || p.pet_images?.[0]?.storage_url 
          || (p.images && p.images.length > 0 ? p.images[0] : '')
      }))

      if (isLoadMore) {
        setPets(prev => [...prev, ...formattedPets]) // นำของใหม่ไปต่อท้ายของเดิม
      } else {
        setPets(formattedPets) // โหลดครั้งแรกให้แทนที่เลย
      }

      // เช็คว่ามีข้อมูลชุดต่อไปให้โหลดอีกไหม
      setHasMore(data.length === ITEMS_PER_PAGE)
    }
    
    setLoading(false)
    setLoadingMore(false)
  }

  // โหลดข้อมูลใหม่ทุกครั้งที่เปลี่ยน Tab หรือ รัศมี
  useEffect(() => {
    setPage(0)
    setHasMore(true)
    fetchPets(0, false)
  }, [currentTab, radius])

  // ฟังก์ชันเมื่อกดปุ่ม "โหลดเพิ่มเติม"
  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPets(nextPage, true)
  }

  // ฟังก์ชันตกแต่งปุ่ม Tab
  const getTabStyle = (tabName: string, colorClass: string) => {
    const isActive = currentTab === tabName
    return `flex-1 py-3 px-4 font-bold text-center border-2 border-black rounded-lg shadow-paper-sm transition-all flex items-center justify-center gap-2 ${
      isActive ? colorClass + ' translate-y-1 shadow-none' : 'bg-white hover:bg-gray-50 hover:-translate-y-1 hover:shadow-paper'
    }`
  }

  return (
    <div className="flex flex-col gap-6 mb-20 max-w-6xl mx-auto px-4">
      <div className="bg-wagashi-sora border-4 border-black rounded-2xl shadow-paper p-8 text-center mt-6">
        <h1 className="text-4xl font-bold mb-2">ค้นหาน้อง 🐾🔍</h1>
        <p className="font-medium text-lg">ค้นหาสัตว์เลี้ยงที่หายไป หรืออุปการะเพื่อนใหม่</p>
      </div>

      {/* 💡 ระบบ Tabs 4 หมวดหมู่ครบถ้วน */}
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <Link href={`/search?tab=all&radius=${radius}`} className={getTabStyle('all', 'bg-black text-white')}>
          <Search size={20} /> ทั้งหมด
        </Link>
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

      <RadiusExpander resultCount={pets.length} />

      {/* พื้นที่แสดงการ์ด หรือ สถานะโหลด */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-ori-orange" size={48} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pets.map(pet => (
              <MatchResultCard key={pet.id} result={pet} />
            ))}
          </div>
          
          {pets.length === 0 && (
            <div className="bg-washi border-4 border-dashed border-black rounded-2xl shadow-paper-sm p-20 text-center mt-4">
              <p className="font-bold text-2xl text-gray-500">ไม่พบข้อมูลในหมวดหมู่นี้</p>
            </div>
          )}

          {/* 💡 ปุ่มโหลดเพิ่มเติม (จะแสดงก็ต่อเมื่อยังมีข้อมูลในฐานข้อมูลเหลืออยู่) */}
          {hasMore && pets.length > 0 && (
            <div className="flex justify-center mt-8">
              <button 
                onClick={handleLoadMore} 
                disabled={loadingMore}
                className="bg-white border-2 border-black px-8 py-3 rounded-full font-bold shadow-paper hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loadingMore ? <Loader2 className="animate-spin" size={20} /> : <ChevronDown size={20} />}
                {loadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// 💡 Export ตัวหลักที่ห่อด้วย Suspense (ป้องกัน Error จาก Vercel ตอน Build)
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-ori-orange" size={48} /></div>}>
      <SearchContent />
    </Suspense>
  )
}