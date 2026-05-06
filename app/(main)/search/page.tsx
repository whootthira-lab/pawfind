'use client'
import { useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { MatchResultCard } from '@/components/pet/MatchResult'
import { RadiusExpander } from '@/components/search/RadiusExpander'
import { Search, Loader2, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

function SearchContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const radiusStr = searchParams.get('radius')
  const radius = radiusStr ? parseInt(radiusStr) : 10
  const currentTab = searchParams.get('tab') || 'all'

  const [pets, setPets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0) 
  const [totalCount, setTotalCount] = useState(0) 

  const ITEMS_PER_PAGE = 6 

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const fetchPets = useCallback(async (pageNumber: number) => {
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
      const formattedPets = data.map((p: any) => {
        // 1. นำ ตำบล อำเภอ จังหวัด มาเรียงต่อกันให้สวยงาม
        const addressParts = []
        if (p.tambon) addressParts.push(`ต.${p.tambon}`)
        if (p.district) addressParts.push(`อ.${p.district}`)
        if (p.province) addressParts.push(`จ.${p.province}`)
        
        let fullAddress = addressParts.length > 0 ? addressParts.join(' ') : 'ไม่ระบุที่อยู่'

        // 2. ซ่อนพิกัดโหมดอื่น และโชว์เฉพาะ 'found' เท่านั้น
        // 💡 เพิ่ม Number() ป้องกัน Error กรณีฐานข้อมูลส่งมาเป็น String
        if (p.status === 'found' && p.latitude && p.longitude) {
          const roughLat = Number(p.latitude).toFixed(3) 
          const roughLng = Number(p.longitude).toFixed(3)
          fullAddress += ` (📍 พิกัดใกล้เคียง: ${roughLat}, ${roughLng})`
        }

        return {
          id: p.id,
          name: p.name,
          breed: p.breed,
          province: fullAddress, 
          status: p.status,
          image_url: p.pet_images?.find((img: any) => img.is_primary)?.storage_url 
            || p.pet_images?.[0]?.storage_url 
            || (p.images && p.images.length > 0 ? p.images[0] : '')
        }
      })
      setPets(formattedPets)
    }
    setLoading(false)
  }, [currentTab, supabase])

  useEffect(() => {
    setPage(0)
    fetchPets(0)
  }, [currentTab, radius, fetchPets])

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

  const handleTabChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTab = e.target.value
    router.push(`${pathname}?tab=${newTab}&radius=${radius}`)
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="flex flex-col gap-6 mb-20 max-w-6xl mx-auto px-4">
      <div className="bg-wagashi-sora border-4 border-black rounded-2xl shadow-paper p-8 text-center mt-6">
        <h1 className="text-4xl font-black mb-2">ค้นหาน้อง 🐾🔍</h1>
        <p className="font-bold text-lg text-gray-700">ค้นหาสัตว์เลี้ยงที่หายไป หรืออุปการะเพื่อนใหม่</p>
      </div>

      <div className="relative w-full sm:w-80 mb-2 z-10">
        <select
          value={currentTab}
          onChange={handleTabChange}
          className="w-full bg-white border-4 border-black rounded-2xl px-5 py-4 font-black shadow-paper-sm appearance-none cursor-pointer hover:-translate-y-1 transition-transform focus:outline-none focus:ring-4 focus:ring-ori-orange/30 text-lg text-black"
        >
          <option value="all">🔍 ดูทั้งหมด</option>
          {/* 💡 เปลี่ยนข้อความเป็น "ประกาศตามหาน้อง" ให้ตรงกับหน้าอื่น */}
          <option value="lost">🚨 ประกาศตามหาน้อง</option>
          <option value="found">👀 ดูประกาศพบสัตว์หลง</option>
          <option value="adoption">💖 หาบ้านให้น้อง</option>
        </select>
        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-black" size={24} />
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
            <div className="bg-white border-4 border-dashed border-gray-300 rounded-3xl shadow-paper-sm p-20 text-center">
              <p className="font-black text-2xl text-gray-400">ไม่พบข้อมูลในหมวดหมู่นี้ 🐾</p>
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
              
              <div className="font-black text-xl px-6 py-2 bg-white border-4 border-black rounded-2xl shadow-paper-sm">
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