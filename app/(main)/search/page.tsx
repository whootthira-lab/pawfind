'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { MatchResultCard } from '@/components/pet/MatchResult'
import { RadiusExpander } from '@/components/search/RadiusExpander'
import Link from 'next/link'
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

function SearchContent() {
  const searchParams = useSearchParams()
  const radiusStr = searchParams.get('radius')
  const radius = radiusStr ? parseInt(radiusStr) : 10
  
  const currentTab = searchParams.get('tab') || 'all'

  const [pets, setPets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0) 
  const [totalCount, setTotalCount] = useState(0) 

  const ITEMS_PER_PAGE = 6 // แสดงทีละ 6 การ์ด

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchPets = async (pageNumber: number) => {
    setLoading(true)

    let countQuery = supabase.from('pets').select('*', { count: 'exact', head: true })
    if (currentTab !== 'all') {
      countQuery = countQuery.eq('status', currentTab)
    }
    const { count } = await countQuery
    if (count !== null) setTotalCount(count)

    let query = supabase
      .from('pets')
      .select('*, pet_images(storage_url, is_primary)')
      .order('created_at', { ascending: false })
      .range(pageNumber * ITEMS_PER_PAGE, (pageNumber + 1) * ITEMS_PER_PAGE - 1)

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
      setPets(formattedPets)
    }
    setLoading(false)
  }

  useEffect(() => {
    setPage(0)
    fetchPets(0)
  }, [currentTab, radius])

  const handlePrevPage = () => {
    if (page > 0) {
      setPage(page - 1)
      fetchPets(page - 1)
    }
  }

  const handleNextPage = () => {
    if ((page + 1) * ITEMS_PER_PAGE < totalCount) {
      setPage(page + 1)
      fetchPets(page + 1)
    }
  }

  const getTabStyle = (tabName: string, colorClass: string) => {
    const isActive = currentTab === tabName
    return `flex-1 py-3 px-4 font-bold text-center border-2 border-black rounded-lg shadow-paper-sm transition-all flex items-center justify-center gap-2 ${
      isActive ? colorClass + ' translate-y-1 shadow-none' : 'bg-white hover:bg-gray-50 hover:-translate-y-1 hover:shadow-paper'
    }`
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="flex flex-col gap-6 mb-20 max-w-6xl mx-auto px-4">
      <div className="bg-wagashi-sora border-4 border-black rounded-2xl shadow-paper p-8 text-center mt-6">
        <h1 className="text-4xl font-bold mb-2">ค้นหาน้อง 🐾🔍</h1>
        <p className="font-medium text-lg">ค้นหาสัตว์เลี้ยงที่หายไป หรืออุปการะเพื่อนใหม่</p>
      </div>

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

      <RadiusExpander resultCount={totalCount} />

      {loading ? (
        <div className="flex justify-center items-center py-20 min-h-[400px]">
          <Loader2 className="animate-spin text-ori-orange" size={48} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[600px] content-start mt-4">
            {pets.map(pet => (
              <MatchResultCard key={pet.id} result={pet} />
            ))}
          </div>
          
          {pets.length === 0 && (
            <div className="bg-washi border-4 border-dashed border-black rounded-2xl shadow-paper-sm p-20 text-center">
              <p className="font-bold text-2xl text-gray-500">ไม่พบข้อมูลในหมวดหมู่นี้</p>
            </div>
          )}

          {totalCount > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-center gap-6 mt-8">
              <button 
                onClick={handlePrevPage}
                disabled={page === 0}
                className="p-4 bg-white border-4 border-black rounded-full shadow-paper hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 transition-all"
              >
                <ChevronLeft size={32} />
              </button>
              
              <div className="font-bold text-xl font-mono px-6 py-2 bg-white border-2 border-black rounded-xl">
                {page + 1} / {totalPages}
              </div>

              <button 
                onClick={handleNextPage}
                disabled={(page + 1) * ITEMS_PER_PAGE >= totalCount}
                className="p-4 bg-white border-4 border-black rounded-full shadow-paper hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 transition-all"
              >
                <ChevronRight size={32} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-ori-orange" size={48} /></div>}>
      <SearchContent />
    </Suspense>
  )
}