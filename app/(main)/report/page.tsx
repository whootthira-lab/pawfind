"use client"

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { AnimatePresence } from 'framer-motion'
import { MapPin, MapPinCheckInside, Loader2 } from 'lucide-react'

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

  // ── Address (3 levels - Text Input) ──────────────────────────
  const [province,     setProvince]     = useState('')
  const [amphure,      setAmphure]      = useState('')  // อำเภอ/เขต
  const [tambon,       setTambon]       = useState('')  // ตำบล/แขวง

  // ── Location ─────────────────────────────────────────────────
  const [location,       setLocation]       = useState<{ lat: number; lng: number } | null>(null)
  const [isGettingLoc,   setIsGettingLoc]   = useState(false)

  useEffect(() => {
    const s = searchParams.get('status')
    if (s) setStatus(s)
  }, [searchParams])

  // ══════════════════════════════════════════════════════════════
  // Get GPS Only (No Geocoding)
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
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setIsGettingLoc(false)
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
  }, [])

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
          district:  amphure,     
          tambon,                  
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
  const selectCls = 'ori-input cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 mb-12 relative p-4 mt-4">
      <AnimatePresence>
        {loading && <LoadingOverlay message="AI กำลังวิเคราะห์และบันทึกข้อมูล..." />}
      </AnimatePresence>

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

          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">ชื่อสัตว์เลี้ยง</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="ori-input" placeholder="ไม่ทราบชื่อเว้นว่างไว้" />
          </div>

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

          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">สถานะ</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className={selectCls}>
              <option value="lost">🚨 ลงประกาศหาน้อง</option>
              <option value="found">👀 แจ้งพบสัตว์หลง</option>
              <option value="adoption">💖 ประกาศหาบ้านให้น้อง</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">สีของสัตว์เลี้ยง <span className="text-red-500">*</span></label>
            <input type="text" value={color} onChange={e => setColor(e.target.value)}
              required className="ori-input" placeholder="เช่น สีน้ำตาลขาว, ลายสลิด" />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">
              ตำแหน่งที่{status === 'found' ? 'พบสัตว์' : 'อยู่ปัจจุบัน'}
            </label>

            <Button type="button" onClick={handleGetLocation}
              disabled={isGettingLoc}
              className={`w-full py-5 border-[3px] border-ori-ink rounded-xl shadow-paper font-bold text-base transition-all flex items-center justify-center gap-2
                ${location
                  ? 'bg-ori-green-bg hover:bg-green-200 text-ori-green-d'
                  : 'bg-ori-yellow-bg hover:bg-yellow-200 text-ori-ink'}`}>
              {isGettingLoc ? (
                <><Loader2 size={20} className="animate-spin" /> กำลังดึงพิกัด...</>
              ) : location ? (
                <><MapPinCheckInside size={22} /> บันทึกพิกัดแล้ว — กดอีกครั้งเพื่ออัปเดต ✅</>
              ) : (
                <><MapPin size={22} /> บันทึกพิกัดแผนที่ (สำหรับระบบ AI)</>
              )}
            </Button>

            {location && (
              <p className="text-xs font-mono text-center text-ori-ink-l mt-1">
                📍 พิกัดที่ถูกบันทึก: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            )}

            {/* 💡 เปลี่ยนเป็นช่องให้พิมพ์ข้อความ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-sm text-ori-ink-m">จังหวัด <span className="text-red-500">*</span></label>
                <input type="text" value={province} onChange={e => setProvince(e.target.value)}
                  required className="ori-input" placeholder="เช่น นครราชสีมา" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-sm text-ori-ink-m">อำเภอ / เขต <span className="text-red-500">*</span></label>
                <input type="text" value={amphure} onChange={e => setAmphure(e.target.value)}
                  required className="ori-input" placeholder="เช่น ด่านขุนทด" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-sm text-ori-ink-m">ตำบล / แขวง <span className="text-red-500">*</span></label>
                <input type="text" value={tambon} onChange={e => setTambon(e.target.value)}
                  required className="ori-input" placeholder="เช่น ด่านขุนทด" />
              </div>
            </div>

            <p className="text-xs text-ori-ink-l italic text-center mt-2">
              * กรุณากดปุ่มพิกัด และพิมพ์ที่อยู่ให้ครบถ้วนเพื่อความแม่นยำในการค้นหา
            </p>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">เงินรางวัล (บาท)</label>
            <input type="number" value={reward} onChange={e => setReward(e.target.value)}
              className="ori-input" placeholder="0 (เว้นว่างได้)" min="0" />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">ตำหนิหรือลักษณะพิเศษ</label>
            <textarea value={distinctiveFeatures} onChange={e => setDistinctiveFeatures(e.target.value)}
              rows={3} className="ori-input"
              placeholder="เช่น มีถุงเท้าขาว, หางกุด, ปลอกคอสีแดง, ขี้กลัว..." />
          </div>

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

export default function ReportPage() {
  return (
    <Suspense fallback={<LoadingOverlay message="กำลังโหลดแบบฟอร์ม..." />}>
      <ReportForm />
    </Suspense>
  )
}