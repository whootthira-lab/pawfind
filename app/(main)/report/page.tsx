"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { AnimatePresence } from 'framer-motion'
import { MapPin, MapPinCheckInside } from 'lucide-react' 

// 1. เปลี่ยนชื่อจาก export default function ReportPage() เป็นฟังก์ชันธรรมดา
function ReportForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get('status') || 'lost'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form State
  const [name, setName] = useState('')
  const [type, setType] = useState('dog')
  const [status, setStatus] = useState(initialStatus) 
  const [province, setProvince] = useState('นครราชสีมา')
  const [district, setDistrict] = useState('ด่านขุนทด')
  const [contactInfo, setContactInfo] = useState('')
  const [reward, setReward] = useState('')
  const [color, setColor] = useState('')
  const [distinctiveFeatures, setDistinctiveFeatures] = useState('')
  const [images, setImages] = useState<string[]>([])
  
  // 📍 State สำหรับพิกัด
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  useEffect(() => {
    const currentStatus = searchParams.get('status')
    if (currentStatus) {
      setStatus(currentStatus)
    }
  }, [searchParams])

  const pageConfig: Record<string, { title: string, desc: string, bgClass: string }> = {
    lost: {
      title: 'ลงประกาศหาน้อง 🚨',
      desc: 'อัปโหลดรูปภาพและกรอกข้อมูลเพื่อให้ชุมชนและ AI ช่วยตามหา',
      bgClass: 'bg-wagashi-sakura border-ori-orange-d', 
    },
    found: {
      title: 'แจ้งพบสัตว์หลง 👀',
      desc: 'พบเห็นสัตว์พลัดหลง แจ้งเบาะแสเพื่อช่วยน้องกลับบ้าน',
      bgClass: 'bg-wagashi-sora border-ori-blue-d', 
    },
    adoption: {
      title: 'ประกาศหาบ้านให้น้อง 💖',
      desc: 'ลงประกาศหาบ้านใหม่ที่อบอุ่นให้กับน้องๆ',
      bgClass: 'bg-wagashi-matcha border-ori-green-d', 
    }
  }

  const config = pageConfig[status] || pageConfig.lost

  const handleGetLocation = () => {
    setIsGettingLocation(true)
    setError(null)

    if (!navigator.geolocation) {
      alert("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง")
      setIsGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setIsGettingLocation(false)
      },
      (err) => {
        setIsGettingLocation(false)
        switch(err.code) {
          case err.PERMISSION_DENIED:
            alert("คุณปฏิเสธการเข้าถึงพิกัด กรุณาตั้งค่าอนุญาตในเบราว์เซอร์ครับ")
            break
          case err.POSITION_UNAVAILABLE:
            alert("ไม่สามารถระบุตำแหน่งได้ในขณะนี้")
            break
          case err.TIMEOUT:
            alert("การดึงพิกัดใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้งครับ")
            break
          default:
            alert("เกิดข้อผิดพลาด: " + err.message)
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const remainingSlots = 5 - images.length
    const filesToUpload = files.slice(0, remainingSlots)
    if (files.length > remainingSlots) {
      alert(`สามารถอัปโหลดได้สูงสุด 5 รูป (เลือกเพิ่มได้อีก ${remainingSlots} รูป)`)
    }
    const newBase64Images = await Promise.all(
      filesToUpload.map(file => new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1]
          resolve(base64String)
        }
        reader.readAsDataURL(file)
      }))
    )
    setImages(prev => [...prev, ...newBase64Images])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (images.length === 0) {
      setError('กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป')
      return
    }

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
          district,
          color,
          contact_info: contactInfo,
          reward_amount: reward ? parseInt(reward) : 0,
          distinctive_features: distinctiveFeatures,
          images,
          latitude: location?.lat || null, 
          longitude: location?.lng || null, 
          markingImageIndexes: []
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
      
      router.push('/search')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 mb-12 relative p-4 mt-4">
      <AnimatePresence>
        {loading && <LoadingOverlay message="AI กำลังวิเคราะห์และบันทึกข้อมูล..." />}
      </AnimatePresence>

      <div className={`${config.bgClass} border-[3px] rounded-2xl shadow-paper p-8 text-center transition-colors duration-300`}>
        <h1 className="text-3xl font-black mb-3">{config.title}</h1>
        <p className="font-bold text-gray-800">{config.desc}</p>
      </div>

      <form onSubmit={handleSubmit} className={`bg-white border-[3px] border-ori-ink rounded-2xl shadow-paper p-6 md:p-8 flex flex-col gap-6 transition-opacity ${loading ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-xl font-bold shadow-paper-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="font-bold text-lg">รูปภาพสัตว์เลี้ยง (บังคับ 1-5 รูป)</label>
          <div className="border-[3px] border-dashed border-ori-ink-l rounded-xl p-8 text-center bg-ori-cream hover:bg-yellow-50 transition-colors cursor-pointer relative">
            <div className="font-bold text-ori-ink-m text-lg md:text-xl">📸 คลิกเพื่ออัปโหลดรูปภาพ (สูงสุด 5 รูป)</div>
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={images.length >= 5} />
          </div>
          {images.length > 0 && (
            <div className="flex gap-4 mt-3 overflow-x-auto pb-2">
              {images.map((b64, idx) => (
                <div key={idx} className="relative w-28 h-28 flex-shrink-0">
                  <img src={`data:image/jpeg;base64,${b64}`} alt="" className="w-full h-full object-cover border-[3px] border-ori-ink rounded-xl shadow-paper-sm" />
                  <button type="button" onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full font-black border-[3px] border-ori-ink flex items-center justify-center text-sm shadow-paper-sm hover:-translate-y-1 transition-transform">X</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">ชื่อสัตว์เลี้ยง</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="ori-input" placeholder="ไม่ทราบชื่อเว้นว่างไว้" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">จังหวัด</label>
            <input type="text" value={province} onChange={(e) => setProvince(e.target.value)} required className="ori-input" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">อำเภอ/เขต</label>
            <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} className="ori-input" />
          </div>
	  <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">ตำบล/แขวง</label>
            <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} className="ori-input" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">ประเภท</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="ori-input">
              <option value="dog">🐶 สุนัข</option>
              <option value="cat">🐱 แมว</option>
              <option value="bird">🐦 นก</option>
              <option value="rabbit">🐰 กระต่าย</option>
              <option value="other">🐾 อื่นๆ</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">สีของสัตว์เลี้ยง</label>
            <input type="text" value={color} onChange={(e) => setColor(e.target.value)} required className="ori-input" placeholder="เช่น สีน้ำตาลขาว, ลายสลิด" />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">สถานะ</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="ori-input cursor-pointer font-bold">
              <option value="lost">🚨 ลงประกาศหาน้อง</option>
              <option value="found">👀 แจ้งพบสัตว์หลง</option>
              <option value="adoption">💖 ประกาศหาบ้านให้น้อง</option>
            </select>
          </div>

          {status === 'found' && (
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="font-bold text-lg">ตำแหน่งที่พบสัตว์</label>
              <Button 
                type="button"
                onClick={handleGetLocation}
                disabled={isGettingLocation}
                className={`w-full py-6 border-[3px] border-ori-ink rounded-xl shadow-paper font-bold text-lg transition-all ${location ? 'bg-ori-green-bg hover:bg-green-200 text-ori-green-d' : 'bg-ori-yellow-bg hover:bg-yellow-200 text-ori-ink'}`}
              >
                {isGettingLocation ? 'กำลังดึงพิกัด...' : location ? (
                  <span className="flex items-center gap-2"><MapPinCheckInside size={24} /> บันทึกพิกัดจุดที่พบแล้ว ✅</span>
                ) : (
                  <span className="flex items-center gap-2"><MapPin size={24} /> กดเพื่อแชร์พิกัดปัจจุบันที่พบสัตว์</span>
                )}
              </Button>
              <p className="text-sm font-bold text-center text-ori-ink-l italic mt-1">
                * พิกัดจะแสดงเป็นรัศมี 50 เมตรเพื่อความเป็นส่วนตัว
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">เงินรางวัล (บาท)</label>
            <input type="number" value={reward} onChange={(e) => setReward(e.target.value)} className="ori-input" placeholder="0 (เว้นว่างได้)" min="0" />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">ตำหนิหรือลักษณะพิเศษ</label>
            <textarea value={distinctiveFeatures} onChange={(e) => setDistinctiveFeatures(e.target.value)} rows={3} className="ori-input" placeholder="เช่น มีถุเท้าขาว,หางกุด, ปลอกคอสีแดง, ขี้กลัว..." />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">ช่องทางติดต่อ</label>
            <input type="text" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} required className="ori-input" placeholder="เบอร์โทรศัพท์ หรือ LINE ID" />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full mt-4 ori-btn-orange text-xl py-6 rounded-xl">
          {loading ? 'กำลังประมวลผล...' : 'บันทึกข้อมูล'}
        </Button>
      </form>
    </div>
  )
}

// 2. สร้าง Component หลักมาครอบ (Wrap) ด้วย Suspense อีกที
export default function ReportPage() {
  return (
    <Suspense fallback={<LoadingOverlay message="กำลังโหลดแบบฟอร์ม..." />}>
      <ReportForm />
    </Suspense>
  )
}