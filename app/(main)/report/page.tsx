"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { AnimatePresence } from 'framer-motion'
import { MapPin, MapPinCheckInside, Loader2 } from 'lucide-react'

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════
interface Province { id: number; name_th: string; name_en: string }
interface Amphure  { id: number; name_th: string; name_en: string; province_id: number }
interface Tambon   { id: number; name_th: string; name_en: string; amphure_id: number; zip_code: number }

// ══════════════════════════════════════════════════════════════
// CDN URLs — jsDelivr cache (เร็ว, ไม่มี CORS)
// ══════════════════════════════════════════════════════════════
const CDN = {
  provinces: 'https://cdn.jsdelivr.net/gh/kongvut/thai-province-data@master/api_province.json',
  amphures:  'https://cdn.jsdelivr.net/gh/kongvut/thai-province-data@master/api_amphure.json',
  tambons:   'https://cdn.jsdelivr.net/gh/kongvut/thai-province-data@master/api_tambon.json',
}

// ── In-memory cache (โหลดครั้งเดียวต่อ session) ──────────────
const CACHE: {
  provinces?: Province[]
  amphures?:  Amphure[]
  tambons?:   Tambon[]
} = {}

async function fetchWithCache<T>(key: keyof typeof CACHE, url: string): Promise<T[]> {
  if (CACHE[key]) return CACHE[key] as T[]
  const res  = await fetch(url)
  const data = await res.json() as T[]
  CACHE[key] = data as any
  return data
}

// ══════════════════════════════════════════════════════════════
// GOOGLE MAPS GEOCODING
// ══════════════════════════════════════════════════════════════
interface GeoResult {
  province: string
  amphure:  string
  tambon:   string
  postcode: string
}

async function reverseGeocode(lat: number, lng: number): Promise<GeoResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.warn('[Geocoding] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ไม่ได้ตั้งค่า')
    return null
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=th`

  try {
    const res  = await fetch(url)
    const data = await res.json()

    if (data.status !== 'OK' || !data.results?.length) return null

    // ── รวม components จากหลาย results เพื่อเพิ่มโอกาสเจอข้อมูลครบ ──
    // Google บางครั้งแตก result ออกเป็นหลายชุด เช่น ระดับ locality vs admin
    const allComponents: any[] = data.results.flatMap(
      (r: any) => r.address_components ?? []
    )

    // ── Helper: หาค่าแรกที่ match type ใด type หนึ่งใน priority list ──
    const getFirst = (...types: string[]): string => {
      for (const type of types) {
        const found = allComponents.find(c => c.types.includes(type))
        if (found?.long_name) return found.long_name
      }
      return ''
    }

    // ── จังหวัด: administrative_area_level_1 เท่านั้น ──────────────
    const rawProvince = getFirst('administrative_area_level_1')

    // ── อำเภอ/เขต: level_2 ──────────────────────────────────────────
    const rawAmphure  = getFirst('administrative_area_level_2')

    // ── ตำบล/แขวง: ต้องลอง fallback หลายชั้น ─────────────────────────
    // ลำดับความน่าเชื่อถือในไทย:
    //   1. administrative_area_level_3  → ตำบล ชนบท (ส่วนใหญ่)
    //   2. sublocality_level_1          → แขวง กรุงเทพฯ/เมืองใหญ่
    //   3. sublocality_level_2          → แขวงย่อย บางพื้นที่
    //   4. sublocality                  → generic fallback
    //   5. neighborhood                 → บางครั้ง Google ใส่ชื่อตำบลไว้ที่นี่
    //   6. locality                     → last resort ระดับเมือง/ตำบล
    const rawTambon = getFirst(
      'administrative_area_level_3',
      'sublocality_level_1',
      'sublocality_level_2',
      'sublocality',
      'neighborhood',
      'locality',
    )

    const rawPostcode = getFirst('postal_code')

    // ── ตัด prefix ภาษาไทยที่ Google บางครั้งใส่มาด้วย ──────────────
    const clean = (s: string, prefixes: string[]) => {
      let out = s.trim()
      for (const p of prefixes) {
        if (out.startsWith(p)) { out = out.slice(p.length).trim(); break }
      }
      return out
    }

    const result: GeoResult = {
      province: clean(rawProvince, ['จังหวัด']),
      amphure:  clean(rawAmphure,  ['อำเภอ', 'เขต']),
      tambon:   clean(rawTambon,   ['ตำบล', 'แขวง']),
      postcode: rawPostcode,
    }

    console.log('[Geocoding] Result:', result)
    return result

  } catch (err) {
    console.error('[Geocoding] Error:', err)
    return null
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN FORM COMPONENT
// ══════════════════════════════════════════════════════════════
function ReportForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get('status') || 'lost'

  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // ── Form fields ──────────────────────────────────────────────
  const [name,               setName]               = useState('')
  const [type,               setType]               = useState('dog')
  const [status,             setStatus]             = useState(initialStatus)
  const [color,              setColor]              = useState('')
  const [distinctiveFeatures,setDistinctiveFeatures] = useState('')
  const [contactInfo,        setContactInfo]        = useState('')
  const [reward,             setReward]             = useState('')
  const [images,             setImages]             = useState<string[]>([])

  // ── Address (3 levels) ───────────────────────────────────────
  const [province,     setProvince]     = useState('')
  const [amphure,      setAmphure]      = useState('')  // อำเภอ/เขต
  const [tambon,       setTambon]       = useState('')  // ตำบล/แขวง

  // ── Dropdown data ────────────────────────────────────────────
  const [provinces,    setProvinces]    = useState<Province[]>([])
  const [amphures,     setAmphures]     = useState<Amphure[]>([])
  const [tambons,      setTambons]      = useState<Tambon[]>([])
  const [filteredAmphures, setFilteredAmphures] = useState<Amphure[]>([])
  const [filteredTambons,  setFilteredTambons]  = useState<Tambon[]>([])
  const [dataLoading,  setDataLoading]  = useState(true)

  // ── Location ─────────────────────────────────────────────────
  const [location,       setLocation]       = useState<{ lat: number; lng: number } | null>(null)
  const [isGettingLoc,   setIsGettingLoc]   = useState(false)
  const [isGeocoding,    setIsGeocoding]    = useState(false)

  // ══════════════════════════════════════════════════════════════
  // Load dropdown data from CDN on mount
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    const load = async () => {
      try {
        setDataLoading(true)
        // โหลด province + amphure พร้อมกัน (tambon โหลดทีหลังตาม amphure)
        const [p, a] = await Promise.all([
          fetchWithCache<Province>('provinces', CDN.provinces),
          fetchWithCache<Amphure>('amphures',   CDN.amphures),
        ])
        setProvinces(p)
        setAmphures(a)
      } catch (e) {
        console.error('[CDN] Failed to load address data:', e)
      } finally {
        setDataLoading(false)
      }
    }
    load()
  }, [])

  // ── Filter amphures เมื่อ province เปลี่ยน ───────────────────
  useEffect(() => {
    if (!province || !provinces.length) { setFilteredAmphures([]); return }
    const matched = provinces.find(p =>
      p.name_th === province || p.name_en === province
    )
    if (!matched) { setFilteredAmphures([]); return }
    setFilteredAmphures(amphures.filter(a => a.province_id === matched.id))
    setAmphure('')
    setTambon('')
    setFilteredTambons([])
  }, [province, provinces, amphures])

  // ── Filter tambons เมื่อ amphure เปลี่ยน ─────────────────────
  useEffect(() => {
    if (!amphure || !filteredAmphures.length) { setFilteredTambons([]); return }

    const loadTambons = async () => {
      const matched = filteredAmphures.find(a => a.name_th === amphure)
      if (!matched) { setFilteredTambons([]); return }

      const allTambons = await fetchWithCache<Tambon>('tambons', CDN.tambons)
      setTambons(allTambons)
      setFilteredTambons(allTambons.filter(t => t.amphure_id === matched.id))
      setTambon('')
    }
    loadTambons()
  }, [amphure, filteredAmphures])

  // sync status จาก URL
  useEffect(() => {
    const s = searchParams.get('status')
    if (s) setStatus(s)
  }, [searchParams])

  // ══════════════════════════════════════════════════════════════
  // TEXT CLEANER — ตัด prefix ไทยทั้งหมดที่ Google อาจแนบมา
  // ══════════════════════════════════════════════════════════════
  const PROVINCE_PREFIXES = ['จังหวัด', 'จ.', 'จ ']
  const AMPHURE_PREFIXES  = ['อำเภอ', 'อ.', 'อ ', 'เขต', 'ข.']
  const TAMBON_PREFIXES   = ['ตำบล', 'ต.', 'ต ', 'แขวง', 'ทบ.']

  function cleanAdminName(raw: string, prefixes: string[]): string {
    let s = raw.trim()
    let changed = true
    while (changed) {
      changed = false
      for (const p of prefixes) {
        if (s.startsWith(p)) { s = s.slice(p.length).trim(); changed = true }
      }
    }
    return s
  }

  // ══════════════════════════════════════════════════════════════
  // FUZZY MATCH — Levenshtein distance (zero dependency)
  // ══════════════════════════════════════════════════════════════
  function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    )
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i-1] === b[j-1]
          ? dp[i-1][j-1]
          : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    return dp[m][n]
  }

  function fuzzyFind<T extends { name_th: string }>(
    query: string,
    list: T[],
    threshold = 3
  ): T | null {
    if (!query || !list.length) return null
    const q = query.trim()

    // 1. Exact
    const exact = list.find(item => item.name_th === q)
    if (exact) return exact

    // 2. Includes
    const inc = list.find(item =>
      item.name_th.includes(q) || q.includes(item.name_th)
    )
    if (inc) return inc

    // 3. Levenshtein
    let best: T | null = null
    let bestDist = Infinity
    for (const item of list) {
      const dist = levenshtein(q, item.name_th)
      if (dist < bestDist) { bestDist = dist; best = item }
    }
    if (best && bestDist <= threshold) {
      console.log(`[Fuzzy] "${q}" → "${best.name_th}" (dist=${bestDist})`)
      return best
    }
    console.warn(`[Fuzzy] ไม่เจอ "${q}" (best dist=${bestDist})`)
    return null
  }

  // ══════════════════════════════════════════════════════════════
  // Get GPS → Geocode → Clean → Fuzzy Match → Auto-fill
  // ══════════════════════════════════════════════════════════════
  const handleGetLocation = useCallback(() => {
    setIsGettingLoc(true)
    setError(null)

    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง')
      setIsGettingLoc(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setLocation({ lat, lng })
        setIsGettingLoc(false)

        setIsGeocoding(true)
        try {
          const geo = await reverseGeocode(lat, lng)
          if (!geo) return

          // ── Step 1: Clean raw text จาก Google ──────────────────
          const cleanProv = cleanAdminName(geo.province, PROVINCE_PREFIXES)
          const cleanAmp  = cleanAdminName(geo.amphure,  AMPHURE_PREFIXES)
          const cleanTamb = cleanAdminName(geo.tambon,   TAMBON_PREFIXES)
          console.log('[Geocode] cleaned →', { cleanProv, cleanAmp, cleanTamb })

          // ── Step 2: Fuzzy match จังหวัด ────────────────────────
          const pMatch = fuzzyFind(cleanProv, provinces)
          if (!pMatch) {
            setProvince(cleanProv); setAmphure(cleanAmp); setTambon(cleanTamb)
            return
          }
          setProvince(pMatch.name_th)

          // ── Step 3: Fuzzy match อำเภอ ───────────────────────────
          const filtA  = amphures.filter(a => a.province_id === pMatch.id)
          const aMatch = fuzzyFind(cleanAmp, filtA)
          if (!aMatch) {
            setAmphure(cleanAmp); setTambon(cleanTamb)
            return
          }
          setAmphure(aMatch.name_th)

          // ── Step 4: Fuzzy match ตำบล ────────────────────────────
          const allT   = await fetchWithCache<Tambon>('tambons', CDN.tambons)
          const filtT  = allT.filter(t => t.amphure_id === aMatch.id)
          const tMatch = fuzzyFind(cleanTamb, filtT, 4)
          if (tMatch) setTambon(tMatch.name_th)
          else        setTambon(cleanTamb)

        } finally {
          setIsGeocoding(false)
        }
      },
      (err) => {
        setIsGettingLoc(false)
        const msgs: Record<number, string> = {
          1: 'คุณปฏิเสธการเข้าถึงพิกัด กรุณาอนุญาตในเบราว์เซอร์',
          2: 'ไม่สามารถระบุตำแหน่งได้',
          3: 'ดึงพิกัดนานเกินไป กรุณาลองใหม่',
        }
        alert(msgs[err.code] || 'เกิดข้อผิดพลาด: ' + err.message)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [provinces, amphures])

  // ══════════════════════════════════════════════════════════════
  // Image upload
  // ══════════════════════════════════════════════════════════════
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const remaining = 5 - images.length
    const toUpload  = files.slice(0, remaining)
    if (files.length > remaining)
      alert(`อัปโหลดได้สูงสุด 5 รูป (เพิ่มได้อีก ${remaining} รูป)`)

    const b64s = await Promise.all(toUpload.map(file =>
      new Promise<string>(resolve => {
        const reader = new FileReader()
        reader.onloadend = () => resolve((reader.result as string).split(',')[1])
        reader.readAsDataURL(file)
      })
    ))
    setImages(prev => [...prev, ...b64s])
  }

  // ══════════════════════════════════════════════════════════════
  // Submit
  // ══════════════════════════════════════════════════════════════
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!images.length) { setError('กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป'); return }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          status,
          province,
          district:  amphure,     // API ใช้ district = อำเภอ
          tambon,                  // เพิ่ม tambon field
          color,
          contact_info:         contactInfo,
          reward_amount:        reward ? parseInt(reward) : 0,
          distinctive_features: distinctiveFeatures,
          images,
          latitude:  location?.lat ?? null,
          longitude: location?.lng ?? null,
          markingImageIndexes: [],
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึก')
      router.push('/search')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  // ══════════════════════════════════════════════════════════════
  // Config per status
  // ══════════════════════════════════════════════════════════════
  const pageConfig: Record<string, { title: string; desc: string; bgClass: string }> = {
    lost:     { title:'ลงประกาศหาน้อง 🚨',      desc:'อัปโหลดรูปและกรอกข้อมูลเพื่อให้ชุมชนและ AI ช่วยตามหา', bgClass:'bg-wagashi-sakura border-ori-orange-d' },
    found:    { title:'แจ้งพบสัตว์หลง 👀',      desc:'พบเห็นสัตว์พลัดหลง แจ้งเบาะแสเพื่อช่วยน้องกลับบ้าน', bgClass:'bg-wagashi-sora border-ori-blue-d' },
    adoption: { title:'ประกาศหาบ้านให้น้อง 💖', desc:'ลงประกาศหาบ้านใหม่ที่อบอุ่นให้กับน้องๆ',               bgClass:'bg-wagashi-matcha border-ori-green-d' },
  }
  const config = pageConfig[status] || pageConfig.lost

  // ── Dropdown shared className ─────────────────────────────────
  const selectCls = 'ori-input cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 mb-12 relative p-4 mt-4">
      <AnimatePresence>
        {loading && <LoadingOverlay message="AI กำลังวิเคราะห์และบันทึกข้อมูล..." />}
      </AnimatePresence>

      {/* Header */}
      <div className={`${config.bgClass} border-[3px] rounded-2xl shadow-paper p-8 text-center transition-colors duration-300`}>
        <h1 className="text-3xl font-black mb-3">{config.title}</h1>
        <p className="font-bold text-gray-800">{config.desc}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`bg-white border-[3px] border-ori-ink rounded-2xl shadow-paper p-6 md:p-8 flex flex-col gap-6 transition-opacity ${loading ? 'opacity-20 pointer-events-none' : ''}`}
      >
        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-xl font-bold shadow-paper-sm">
            {error}
          </div>
        )}

        {/* ── Images ── */}
        <div className="flex flex-col gap-2">
          <label className="font-bold text-lg">รูปภาพสัตว์เลี้ยง <span className="text-red-500">*</span> (1-5 รูป)</label>
          <div className="border-[3px] border-dashed border-ori-ink-l rounded-xl p-8 text-center bg-ori-cream hover:bg-yellow-50 transition-colors cursor-pointer relative">
            <div className="font-bold text-ori-ink-m text-lg">📸 คลิกเพื่ออัปโหลดรูปภาพ</div>
            <input type="file" accept="image/*" multiple onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={images.length >= 5} />
          </div>
          {images.length > 0 && (
            <div className="flex gap-4 mt-3 overflow-x-auto pb-2">
              {images.map((b64, idx) => (
                <div key={idx} className="relative w-28 h-28 flex-shrink-0">
                  <img src={`data:image/jpeg;base64,${b64}`} alt=""
                    className="w-full h-full object-cover border-[3px] border-ori-ink rounded-xl shadow-paper-sm" />
                  <button type="button"
                    onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full font-black border-[3px] border-ori-ink flex items-center justify-center text-sm shadow-paper-sm hover:-translate-y-1 transition-transform">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ── Name ── */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">ชื่อสัตว์เลี้ยง</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="ori-input" placeholder="ไม่ทราบชื่อเว้นว่างไว้" />
          </div>

          {/* ── Type ── */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">ประเภทสัตว์</label>
            <select value={type} onChange={e => setType(e.target.value)} className={selectCls}>
              <option value="dog">🐶 สุนัข</option>
              <option value="cat">🐱 แมว</option>
              <option value="bird">🐦 นก</option>
              <option value="rabbit">🐰 กระต่าย</option>
              <option value="other">🐾 อื่นๆ</option>
            </select>
          </div>

          {/* ── Status ── */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">สถานะ</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className={selectCls}>
              <option value="lost">🚨 ลงประกาศหาน้อง</option>
              <option value="found">👀 แจ้งพบสัตว์หลง</option>
              <option value="adoption">💖 ประกาศหาบ้านให้น้อง</option>
            </select>
          </div>

          {/* ── Color ── */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">สีของสัตว์เลี้ยง <span className="text-red-500">*</span></label>
            <input type="text" value={color} onChange={e => setColor(e.target.value)}
              required className="ori-input" placeholder="เช่น สีน้ำตาลขาว, ลายสลิด" />
          </div>

          {/* ────────────────────────────────────────────────────────
              GPS Button + Address Dropdowns (3 ระดับ)
          ──────────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">
              ตำแหน่งที่{status === 'found' ? 'พบสัตว์' : 'อยู่ปัจจุบัน'}
            </label>

            {/* GPS Button */}
            <Button type="button" onClick={handleGetLocation}
              disabled={isGettingLoc || isGeocoding}
              className={`w-full py-5 border-[3px] border-ori-ink rounded-xl shadow-paper font-bold text-base transition-all flex items-center justify-center gap-2
                ${location
                  ? 'bg-ori-green-bg hover:bg-green-200 text-ori-green-d'
                  : 'bg-ori-yellow-bg hover:bg-yellow-200 text-ori-ink'}`}>
              {isGettingLoc ? (
                <><Loader2 size={20} className="animate-spin" /> กำลังดึงพิกัด...</>
              ) : isGeocoding ? (
                <><Loader2 size={20} className="animate-spin" /> กำลังแปลงพิกัดเป็นที่อยู่...</>
              ) : location ? (
                <><MapPinCheckInside size={22} /> บันทึกพิกัดแล้ว — กดอีกครั้งเพื่ออัปเดต ✅</>
              ) : (
                <><MapPin size={22} /> แชร์พิกัดปัจจุบัน (ระบบจะกรอกที่อยู่ให้อัตโนมัติ)</>
              )}
            </Button>

            {location && (
              <p className="text-xs font-mono text-center text-ori-ink-l">
                📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            )}

            {/* ── Province Dropdown ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-sm text-ori-ink-m">จังหวัด <span className="text-red-500">*</span></label>
                {dataLoading ? (
                  <div className="ori-input flex items-center gap-2 text-ori-ink-l">
                    <Loader2 size={16} className="animate-spin" /> กำลังโหลด...
                  </div>
                ) : (
                  <select value={province} onChange={e => setProvince(e.target.value)}
                    required className={selectCls}>
                    <option value="">-- เลือกจังหวัด --</option>
                    {provinces.map(p => (
                      <option key={p.id} value={p.name_th}>{p.name_th}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* ── Amphure Dropdown ── */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-sm text-ori-ink-m">อำเภอ / เขต</label>
                <select value={amphure} onChange={e => setAmphure(e.target.value)}
                  disabled={!province || !filteredAmphures.length}
                  className={selectCls}>
                  <option value="">-- เลือกอำเภอ --</option>
                  {filteredAmphures.map(a => (
                    <option key={a.id} value={a.name_th}>{a.name_th}</option>
                  ))}
                </select>
              </div>

              {/* ── Tambon Dropdown ── */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-sm text-ori-ink-m">ตำบล / แขวง</label>
                <select value={tambon} onChange={e => setTambon(e.target.value)}
                  disabled={!amphure || !filteredTambons.length}
                  className={selectCls}>
                  <option value="">-- เลือกตำบล --</option>
                  {filteredTambons.map(t => (
                    <option key={t.id} value={t.name_th}>{t.name_th}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-xs text-ori-ink-l italic">
              * กดปุ่ม GPS แล้วระบบจะเลือก จังหวัด / อำเภอ / ตำบล ให้อัตโนมัติ
              หรือเลือกเองจาก Dropdown ได้
            </p>
          </div>

          {/* ── Reward ── */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">เงินรางวัล (บาท)</label>
            <input type="number" value={reward} onChange={e => setReward(e.target.value)}
              className="ori-input" placeholder="0 (เว้นว่างได้)" min="0" />
          </div>

          {/* ── Distinctive Features ── */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">ตำหนิหรือลักษณะพิเศษ</label>
            <textarea value={distinctiveFeatures} onChange={e => setDistinctiveFeatures(e.target.value)}
              rows={3} className="ori-input"
              placeholder="เช่น มีถุงเท้าขาว, หางกุด, ปลอกคอสีแดง, ขี้กลัว..." />
          </div>

          {/* ── Contact ── */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">ช่องทางติดต่อ <span className="text-red-500">*</span></label>
            <input type="text" value={contactInfo} onChange={e => setContactInfo(e.target.value)}
              required className="ori-input" placeholder="เบอร์โทรศัพท์ หรือ LINE ID" />
          </div>

        </div>

        <Button type="submit" disabled={loading}
          className="w-full mt-4 ori-btn-orange text-xl py-6 rounded-xl">
          {loading ? 'กำลังประมวลผล...' : 'บันทึกข้อมูล 🐾'}
        </Button>
      </form>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// EXPORT — ครอบด้วย Suspense
// ══════════════════════════════════════════════════════════════
export default function ReportPage() {
  return (
    <Suspense fallback={<LoadingOverlay message="กำลังโหลดแบบฟอร์ม..." />}>
      <ReportForm />
    </Suspense>
  )
}
