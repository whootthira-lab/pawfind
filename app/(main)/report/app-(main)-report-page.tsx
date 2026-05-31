"use client"

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, MapPinCheckInside, Loader2 } from 'lucide-react'

const GENDER_OPTIONS = [
  { value: 'unknown', label: '❓ ไม่ทราบ / ไม่ระบุ' },
  { value: 'male',    label: '♂ เพศผู้ (Male)'   },
  { value: 'female',  label: '♀ เพศเมีย (Female)'  },
]

// ── 🤖 Component สำหรับหน้าโหลด AI แบบ Full Screen ──[cite: 11]
function ReportLoadingOverlay() {
  const [loadingStep, setLoadingStep] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingStep(1)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
    >
      <div className="relative w-32 h-32 mb-8 flex items-center justify-center mx-auto">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="absolute inset-0 border-8 border-dashed border-ori-orange rounded-full opacity-60"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="absolute inset-2 border-8 border-dotted border-wagashi-matcha rounded-full opacity-60"
        />
        <div className="absolute inset-0 m-4 flex items-center justify-center text-4xl gap-1 bg-white border-4 border-black rounded-full shadow-paper-sm z-10">
          🤖🐾
        </div>
      </div>

      <div className="h-20 flex items-center justify-center px-4 text-center">
        <AnimatePresence mode="wait">
          {loadingStep === 0 ? (
            <motion.p
              key="step0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-xl md:text-2xl font-black text-ori-ink"
            >
              🧠 AI กำลังวิเคราะห์ลักษณะจากรูป<br className="hidden md:block"/>เพื่อเปรียบเทียบกับฐานข้อมูล.....
            </motion.p>
          ) : (
            <motion.p
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl md:text-2xl font-black text-ori-orange"
            >
              📊 AI กำลังเตรียมรูปภาพเพื่อใช้แชร์ลงโซเชียล<br className="hidden md:block"/>และจัดเรียงชุดข้อมูลความน่าจะเป็น.....
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// 💡 Helper Function: บีบอัดรูปภาพฝั่งหน้าบ้านเพื่อไม่ให้ขนาด Payload เกิน 4.5 MB ของ Vercel
const compressImage = (file: File, maxWidth: number = 1024, maxHeight: number = 1024, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve((event.target?.result as string).split(',')[1])
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl.split(',')[1])
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

function ReportForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get('status') || 'lost'

  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // ── Form fields ──────────────────────────────────────────────[cite: 11]
  const [name,               setName]               = useState('')
  const [type,               setType]               = useState('dog')
  const [otherType,          setOtherType]          = useState('') 
  const [status,             setStatus]             = useState(initialStatus)
  const [color,              setColor]              = useState('')
  const [distinctiveFeatures,setDistinctiveFeatures] = useState('')
  
  // ── 🟢 [เพิ่มกลุ่มฟิลด์ State สุขภาพระดับพรีเมียม] เพศ, การทำหมัน, และวันเกิดของน้อง ──
  const [gender,             setGender]             = useState('unknown')
  const [isSterilized,       setIsSterilized]       = useState(false)
  const [birthday,           setBirthday]           = useState('')
  
  const [phoneNumber,        setPhoneNumber]        = useState('')
  const [lineId,             setLineId]             = useState('')
  
  const [reward,             setReward]             = useState('')
  const [images,             setImages]             = useState<string[]>([])

  const [province,     setProvince]     = useState('')
  const [amphure,      setAmphure]      = useState('') 
  const [tambon,       setTambon]       = useState('') 

  const [location,       setLocation]       = useState<{ lat: number; lng: number } | null>(null)
  const [isGettingLoc,   setIsGettingLoc]   = useState(false)

  useEffect(() => {
    const s = searchParams.get('status')
    if (s) setStatus(s)
  }, [searchParams])

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const remaining = 5 - images.length
    const toUpload  = files.slice(0, remaining)
    if (files.length > remaining)
      alert(`อัปโหลดได้สูงสุด 5 รูป (เพิ่มได้อีก ${remaining} รูป)`)

    try {
      const b64s = await Promise.all(toUpload.map(file => compressImage(file)))
      setImages(prev => [...prev, ...b64s])
    } catch (err) {
      console.error("Image compression error:", err)
      alert("เกิดข้อผิดพลาดในการบีบอัดรูปภาพ กรุณาลองใหม่อีกครั้งค่ะ")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!images.length) { setError('กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป'); return }
    
    if (type === 'other' && !otherType.trim()) {
      setError('กรุณาระบุประเภทสัตว์'); 
      return;
    }

    setLoading(true)
    setError(null)

    try {
      const combinedContactInfo = `โทร: ${phoneNumber} ${lineId ? ` | LINE: ${lineId}` : ''}`
      const finalType = type === 'other' ? otherType : type

      // ── 🟢 ผูกเชื่อมโยงตัวแปรข้อมูลชุดค่าสุขภาพและเพศสัตว์ส่งตรงเข้าสู่ฐานคลาวด์หลังบ้าน ──[cite: 11]
      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type: finalType,
          status,
          gender,               // 🟢 ส่งค่าข้อมูลตัวเลือกเพศน้องเข้าสู่ระบบ
          is_sterilized: isSterilized, // 🟢 ส่งค่าสถานะข้อมูลระบุการทำหมัน
          birthday: birthday || null,   // 🟢 ส่งค่านัดหมายวันเกิดสำหรับการคำนวณเลขอายุอัตโนมัติ
          birthdate: birthday || null,
          province,
          district:  amphure,     
          tambon,                  
          color,
          contact_info:         combinedContactInfo, 
          phone_number:         phoneNumber,         
          line_id:              lineId,              
          reward_amount:        reward ? parseInt(reward) : 0,
          distinctive_features: distinctiveFeatures,
          images,
          latitude:  location?.lat ?? null,
          longitude: location?.lng ?? null,
          markingImageIndexes: [],
        }),
      })

      let data: any = {}
      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await res.json()
      } else {
        const text = await res.text()
        throw new Error(text || `เกิดข้อผิดพลาดในการบันทึกจากระบบ (HTTP ${res.status})`)
      }

      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึก')

      const newPetId = data.pet?.id || data.id 
      if (newPetId) {
        await fetch('/api/generate-og', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ petId: newPetId })
        }).catch(console.error)
      }

      router.push('/search')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const pageConfig: Record<string, { title: string; desc: string; bgClass: string }> = {
    lost:     { title:'ลงประกาศหาน้อง 🚨',      desc:'อัปโหลดรูปและกรอกข้อมูลเพื่อให้ชุมชนและ AI ช่วยตามหา', bgClass:'bg-wagashi-sakura border-ori-orange-d' },
    found:    { title:'แจ้งพบสัตว์หลง 👀',      desc:'พบเห็นสัตว์พลัดหลง แจ้งเบาะแสเพื่อช่วยน้องกลับบ้าน', bgClass:'bg-wagashi-sora border-ori-blue-d' },
    adoption: { title:'ประกาศหาบ้านให้น้อง 💖', desc:'ลงประกาศหาบ้านใหม่ที่อบอุ่นให้กับน้องๆ',               bgClass:'bg-wagashi-matcha border-ori-green-d' },
  }
  const config = pageConfig[status] || pageConfig.lost
  const selectCls = 'ori-input cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-bold bg-white'

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 mb-12 relative p-4 mt-4 text-black">
      <AnimatePresence>
        {loading && <ReportLoadingOverlay />}
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
          <label className="font-bold text-lg text-left">รูปภาพสัตว์เลี้ยง <span className="text-red-500">*</span> (1-5 รูป)</label>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
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
            {type === 'other' && (
              <input 
                type="text" 
                value={otherType} 
                onChange={e => setOtherType(e.target.value)} 
                className="ori-input mt-2" 
                placeholder="โปรดระบุประเภทสัตว์..." 
                required 
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">หมวดหมู่ประกาศ</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className={selectCls}>
              <option value="lost">🚨 ลงประกาศหาน้อง (หาย)</option>
              <option value="found">👀 แจ้งพบสัตว์หลงทาง</option>
              <option value="mating">❤️ ประกาศหาคู่ให้น้อง</option>
              <option value="adoption">💖 ประกาศหาบ้านให้น้อง</option>
              <option value="showcase">✨ ทำเนียบโชว์โปรไฟล์</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">สีของสัตว์เลี้ยง <span className="text-red-500">*</span></label>
            <input type="text" value={color} onChange={e => setColor(e.target.value)}
              required className="ori-input" placeholder="เช่น สีน้ำตาลขาว, ลายสลิด" />
          </div>

          {/* ── 🟢 [แผงกล่องอินพุตแทรกเสริมเพื่อความสอดคล้อง] ป้อนสถิติ เพศ และสถานะการทำหมันของตัวสัตว์เลี้ยงดั้งเดิม ── */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">เพศของน้อง 🐾</label>
            <select value={gender} onChange={e => setGender(e.target.value)} className={selectCls}>
              {GENDER_OPTIONS.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">การทำหมันของน้อง 🩺</label>
            <select value={isSterilized ? "true" : "false"} onChange={e => setIsSterilized(e.target.value === "true")} className={selectCls}>
              <option value="false">❌ ยังไม่ได้ทำหมัน</option>
              <option value="true">✨ ทำหมันเรียบร้อยแล้ว</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">วันเกิดของน้อง (ระบุเพื่อประมวลอายุอัตโนมัติ) 🎂</label>
            <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} className="ori-input cursor-pointer font-bold" />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">
              ตำแหน่งที่{status === 'found' ? 'พบสัตว์' : 'อยู่ปัจจุบัน'}
            </label>

            <div className="flex flex-col gap-2 mb-2">
              <Button type="button" onClick={handleGetLocation}
                disabled={isGettingLoc}
                className={`w-full py-5 border-[3px] border-ori-ink rounded-xl shadow-paper font-bold text-base transition-all flex items-center justify-center gap-2
                  ${location
                    ? 'bg-ori-green-bg hover:bg-green-200 text-ori-green-d'
                    : 'bg-ori-yellow-bg hover:bg-yellow-200 text-ori-ink'}`}>
                {isGettingLoc ? (
                  <><Loader2 size={20} className="animate-spin" /> กำลังดึงพิกัด...</>
                ) : location ? (
                  <><MapPinCheckInside size={22} /> บันทึกพิกัดแผนที่แล้ว — กดอีกครั้งเพื่ออัปเดต ✅</>
                ) : (
                  <><MapPin size={22} /> {status === 'found' ? '📍 บันทึกพิกัดแผนที่จุดที่พบ' : '📍 แชร์พิกัดสำหรับระบบ AI (ข้อมูลลับ)'}</>
                )}
              </Button>
              {location && (
                <p className="text-xs font-mono text-center text-ori-ink-l">
                  พิกัด: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              )}
            </div>

            {status === 'found' ? (
              <div className="bg-blue-50 border-2 border-blue-200 p-3 rounded-xl mb-2">
                <p className="text-sm font-bold text-blue-700 text-center">
                  📢 ระบบจะแสดงข้อมูลพิกัดนี้คร่าวๆ บนหน้าประกาศ เพื่อให้เจ้าของใช้เป็นเบาะแสในการตามหา
                </p>
              </div>
            ) : (
              <div className="bg-orange-50 border-2 border-orange-200 p-3 rounded-xl mb-2">
                <p className="text-sm font-bold text-orange-700 text-center">
                  🔒 พิกัดนี้ใช้เพื่อให้ AI ตรวจจับระยะกับสัตว์ที่มีการแจ้งพบเห็นเท่านั้น <br/>ข้อมูลจะเป็นความลับและจะไม่แสดงพิกัดนี้ในหน้าประกาศ
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-sm text-ori-ink-m">จังหวัด *</label>
                <input type="text" value={province} onChange={e => setProvince(e.target.value)}
                  required className="ori-input" placeholder="เช่น นครราชสีมา" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-sm text-ori-ink-m">อำเภอ / เขต *</label>
                <input type="text" value={amphure} onChange={e => setAmphure(e.target.value)}
                  required className="ori-input" placeholder="เช่น ด่านขุนทด" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-sm text-ori-ink-m">ตำบล / แขวง *</label>
                <input type="text" value={tambon} onChange={e => setTambon(e.target.value)}
                  required className="ori-input" placeholder="เช่น ด่านขุนทด" />
              </div>
            </div>
            <p className="text-xs text-ori-ink-l italic text-center mt-2">
              * กรุณาพิมพ์ที่อยู่ (จังหวัด/อำเภอ/ตำบล) ให้ครบถ้วนเพื่อแสดงเป็นข้อมูลสาธารณะในหน้าประกาศ
            </p>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">เงินรางวัล / สินน้ำใจ (บาท)</label>
            <input type="number" value={reward} onChange={e => setReward(e.target.value)}
              className="ori-input" placeholder="0 (เว้นว่างได้หากไม่มีสินน้ำใจ)" min="0" />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">ตำหนิหรือลักษณะพิเศษ</label>
            <textarea value={distinctiveFeatures} onChange={e => setDistinctiveFeatures(e.target.value)}
              rows={3} className="ori-input resize-none"
              placeholder="เช่น มีถุงเท้าขาว, หางกุด, ปลอกคอสีแดง, ขี้กลัว..." />
          </div>

          <div className="flex flex-col gap-2 md:col-span-1">
            <label className="font-bold text-lg">เบอร์โทรติดต่อ *</label>
            <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
              required className="ori-input" placeholder="เช่น 0812345678" />
          </div>
          <div className="flex flex-col gap-2 md:col-span-1">
            <label className="font-bold text-lg">LINE ID</label>
            <input type="text" value={lineId} onChange={e => setLineId(e.target.value)}
              className="ori-input" placeholder="ถ้ามี (ไม่บังคับ)" />
          </div>

        </div>

        <Button type="submit" disabled={loading}
          className="w-full mt-4 bg-black hover:bg-gray-800 text-white font-black text-xl py-6 rounded-xl border-2 border-black shadow-paper-sm hover:shadow-paper transition-all">
          {loading ? 'กำลังประมวลผลบันทึกข้อมูล...' : 'ลงประกาศเหตุสัตว์เลี้ยง 🐾'}
        </Button>
      </form>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">กำลังโหลดแบบฟอร์ม...</div>}>
      <ReportForm />
    </Suspense>
  )
}