'use client'
import { useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { MatchResultCard } from '@/components/pet/MatchResult'
import { RadiusExpander } from '@/components/search/RadiusExpander'
import { Search, Loader2, ChevronDown, MapPin } from 'lucide-react'

function SearchContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const radiusStr = searchParams.get('radius')
  const radius = radiusStr ? parseInt(radiusStr) : 10
  const currentTab = searchParams.get('tab') || 'all'

  // ── States สำหรับการดึงข้อมูล ──
  const [pets, setPets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0) 
  const [totalCount, setTotalCount] = useState(0) 
  
  // ── States สำหรับพิกัด ──
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [gpsStatus, setGpsStatus] = useState('กำลังค้นหาพิกัดของคุณ...')

  const ITEMS_PER_PAGE = 12 // 💡 เปลี่ยนเป็น 12 เพื่อให้หาร 3 ลงตัว (โชว์ 4 แถวพอดี)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // 1. ขอพิกัด GPS ผู้ใช้เมื่อเปิดหน้านี้
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setGpsStatus('📍 เรียงลำดับจากใกล้ตัวคุณที่สุด')
        },
        (err) => {
          console.warn("GPS Disabled:", err)
          setGpsStatus('เรียงตามประกาศล่าสุด (ไม่ได้เปิด GPS)')
        }
      )
    } else {
      setGpsStatus('เรียงตามประกาศล่าสุด')
    }
  }, [])

  // 2. ฟังก์ชันดึงข้อมูล (รองรับทั้งโหลดครั้งแรก และ โหลดเพิ่มเติม)
  const fetchPets = useCallback(async (pageNumber: number, isAppend: boolean = false) => {
    if (isAppend) setLoadingMore(true)
    else setLoading(true)

    // --- ส่วนนับจำนวน (Count) ---
    let countQuery;
    if (userLocation) {
      countQuery = supabase.rpc('get_pets_by_distance', { user_lat: userLocation.lat, user_lng: userLocation.lng }, { count: 'exact', head: true })
    } else {
      countQuery = supabase.from('pets').select('*', { count: 'exact', head: true })
    }
    
    if (currentTab !== 'all') countQuery = countQuery.eq('status', currentTab)
    const { count } = await countQuery
    if (count !== null) setTotalCount(count)

    // --- ส่วนดึงข้อมูล (Data Fetching) ---
    let query;
    if (userLocation) {
      // 💡 ใช้ RPC เพื่อเรียงตามระยะทาง + ดึงรูปภาพมาด้วย
      query = supabase.rpc('get_pets_by_distance', { user_lat: userLocation.lat, user_lng: userLocation.lng })
        .select('*, pet_images(storage_url, is_primary)')
    } else {
      // 💡 ถ้าไม่มี GPS ให้เรียงตามเวลาที่สร้าง
      query = supabase.from('pets')
        .select('*, pet_images(storage_url, is_primary)')
        .order('created_at', { ascending: false })
    }

    if (currentTab !== 'all') query = query.eq('status', currentTab)

    // กำหนดช่วงการดึง (Pagination offset)
    query = query.range(pageNumber * ITEMS_PER_PAGE, (pageNumber + 1) * ITEMS_PER_PAGE - 1)

    const { data, error } = await query

    if (data) {
      const formattedPets = data.map((p: any) => {
        const addressParts = []
        if (p.tambon) addressParts.push(`ต.${p.tambon}`)
        if (p.district) addressParts.push(`อ.${p.district}`)
        if (p.province) addressParts.push(`จ.${p.province}`)
        
        let fullAddress = addressParts.length > 0 ? addressParts.join(' ') : 'ไม่ระบุที่อยู่'

        if (p.status === 'found' && p.latitude && p.longitude) {
          const roughLat = Number(p.latitude).toFixed(3) 
          const roughLng = Number(p.longitude).toFixed(3)
          fullAddress += ` (พิกัด: ${roughLat}, ${roughLng})`
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

      // 💡 ถ่าเป็นการกดปุ่ม "โหลดเพิ่มเติม" ให้เอาข้อมูลใหม่มาต่อท้ายของเดิม
      if (isAppend) {
        setPets(prev => [...prev, ...formattedPets])
      } else {
        setPets(formattedPets)
      }
    }
    
    setLoading(false)
    setLoadingMore(false)
  }, [currentTab, supabase, userLocation])

  // 3. เรียกใช้เมื่อมีการเปลี่ยน Tab หรือเมื่อได้พิกัด GPS
  useEffect(() => {
    setPage(0)
    setPets([]) // ล้างข้อมูลเดิมก่อนโหลดใหม่
    fetchPets(0, false)
  }, [currentTab, userLocation, fetchPets]) 

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPets(nextPage, true)
  }

  const handleTabChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTab = e.target.value
    router.push(`${pathname}?tab=${newTab}&radius=${radius}`)
  }

  return (
    <div className="flex flex-col gap-6 mb-20 max-w-6xl mx-auto px-4">
      <div className="bg-wagashi-sora border-4 border-black rounded-2xl shadow-paper p-8 text-center mt-6">
        <h1 className="text-4xl font-black mb-2">ค้นหาน้อง 🐾🔍</h1>
        <p className="font-bold text-lg text-gray-700">ค้นหาสัตว์เลี้ยงที่หายไป หรืออุปการะเพื่อนใหม่</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center z-10 w-full">
        <div className="relative w-full md:w-80 shrink-0">
          <select
            value={currentTab}
            onChange={handleTabChange}
            className="w-full bg-white border-4 border-black rounded-2xl px-5 py-4 font-black shadow-paper-sm appearance-none cursor-pointer hover:-translate-y-1 transition-transform focus:outline-none focus:ring-4 focus:ring-ori-orange/30 text-lg text-black"
          >
            <option value="all">🔍 ดูทั้งหมด</option>
            <option value="lost">🚨 ประกาศตามหาน้อง</option>
            <option value="found">👀 ดูประกาศพบสัตว์หลง</option>
            <option value="adoption">💖 หาบ้านให้น้อง</option>
          </select>
          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-black" size={24} />
        </div>
        
        {/* แสดงสถานะ GPS */}
        <div className="text-sm font-bold bg-white px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 w-full md:w-auto text-center md:text-left">
          {gpsStatus}
        </div>
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

          {/* 💡 ปุ่มโหลดเพิ่มเติม (Infinite Scroll Style) */}
          {pets.length > 0 && pets.length < totalCount && (
            <div className="flex justify-center mt-8">
              <button 
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-ori-orange text-white border-4 border-black px-8 py-4 rounded-2xl font-black text-xl shadow-paper hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
              >
                {loadingMore ? <Loader2 className="animate-spin" size={24} /> : null}
                {loadingMore ? 'กำลังดึงข้อมูล...' : 'โหลดประกาศเพิ่มเติม 👀'}
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