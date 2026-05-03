"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { AnimatePresence } from 'framer-motion'
import { MapPin, MapPinCheckInside } from 'lucide-react' // เพิ่ม Icon เพื่อความสวยงาม

export default function ReportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form State
  const [name, setName] = useState('')
  const [type, setType] = useState('dog')
  const [status, setStatus] = useState('lost')
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

  // 📍 ฟังก์ชันดึงพิกัด GPS
  const handleGetLocation = () => {
    setIsGettingLocation(true)
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
        alert("ไม่สามารถเข้าถึงพิกัดได้: " + err.message)
        setIsGettingLocation(false)
      },
      { enableHighAccuracy: true }
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
          latitude: location?.lat || null, // 📍 ส่งพิกัดไปยัง API
          longitude: location?.lng || null, // 📍 ส่งพิกัดไปยัง API
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
    <div className="max-w-2xl mx-auto flex flex-col gap-6 mb-12 relative">
      <AnimatePresence>
        {loading && <LoadingOverlay message="AI กำลังวิเคราะห์และบันทึกพิกัดตำแหน่ง..." />}
      </AnimatePresence>

      <div className="bg-wagashi-sakura border-2 border-black rounded-lg shadow-paper p-8 text-center">
        <h1 className="text-3xl font-bold mb-2">แจ้งสัตว์หาย 🚨</h1>
        <p className="font-medium text-lg">อัปโหลดรูปภาพและกรอกข้อมูลเพื่อให้ชุมชนและ AI ช่วยตามหา</p>
      </div>

      <form 
        onSubmit={handleSubmit} 
        className={`bg-washi border-2 border-black rounded-lg shadow-paper p-8 flex flex-col gap-6 transition-opacity ${loading ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}
      >
        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-lg font-bold shadow-paper-sm">
            {error}
          </div>
        )}

        {/* รูปภาพ */}
        <div className="flex flex-col gap-2">
          <label className="font-bold text-lg">รูปภาพสัตว์เลี้ยง (บังคับ 1-5 รูป)</label>
          <div className="border-4 border-dashed border-gray-300 rounded-lg p-8 text-center bg-white hover:bg-gray-50 transition-colors cursor-pointer relative">
            <div className="font-bold text-gray-500 text-xl">📸 คลิกเพื่ออัปโหลดรูปภาพ (สูงสุด 5 รูป)</div>
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={images.length >= 5} />
          </div>
          {images.length > 0 && (
            <div className="flex gap-4 mt-2 overflow-x-auto pb-2">
              {images.map((b64, idx) => (
                <div key={idx} className="relative w-24 h-24 flex-shrink-0">
                  <img src={`data:image/jpeg;base64,${b64}`} className="w-full h-full object-cover border-2 border-black rounded shadow-paper-sm" />
                  <button type="button" onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full font-bold border-2 border-black flex items-center justify-center text-xs">X</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">ชื่อสัตว์เลี้ยง</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder="ไม่ทราบชื่อเว้นว่างไว้" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">จังหวัด</label>
            <input type="text" value={province} onChange={(e) => setProvince(e.target.value)} required className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">อำเภอ/เขต</label>
            <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">ประเภท</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black">
              <option value="dog">🐶 สุนัข</option>
              <option value="cat">🐱 แมว</option>
              <option value="bird">🐦 นก</option>
              <option value="rabbit">🐰 กระต่าย</option>
              <option value="other">🐾 อื่นๆ</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">สีของสัตว์เลี้ยง</label>
            <input type="text" value={color} onChange={(e) => setColor(e.target.value)} required className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder="เช่น สีน้ำตาลขาว, ลายสลิด" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">สถานะ</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black">
              <option value="lost">🚨 สัตว์หาย</option>
              <option value="found">👀 พบสัตว์หลงทาง</option>
              <option value="adoption">💖 หาบ้าน</option>
            </select>
          </div>

          {/* 📍 ส่วนแชร์พิกัด (แสดงเฉพาะเมื่อพบสัตว์หลงทาง) */}
          {status === 'found' && (
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="font-bold text-lg">ตำแหน่งที่พบสัตว์</label>
              <Button 
                type="button"
                onClick={handleGetLocation}
                disabled={isGettingLocation}
                className={`w-full py-6 border-2 border-black shadow-paper-sm font-bold text-lg transition-all ${location ? 'bg-wagashi-matcha hover:bg-green-400' : 'bg-wagashi-kinako hover:bg-yellow-400'}`}
              >
                {isGettingLocation ? 'กำลังดึงพิกัด...' : location ? (
                  <span className="flex items-center gap-2"><MapPinCheckInside /> บันทึกพิกัดจุดที่พบแล้ว ✅</span>
                ) : (
                  <span className="flex items-center gap-2"><MapPin /> กดเพื่อแชร์พิกัดปัจจุบันที่พบสัตว์</span>
                )}
              </Button>
              <p className="text-sm font-bold text-center text-gray-600 italic">
                * พิกัดจะแสดงเป็นรัศมี 50 เมตรเพื่อความเป็นส่วนตัวของคุณ
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">เงินรางวัล (บาท)</label>
            <input type="number" value={reward} onChange={(e) => setReward(e.target.value)} className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder="0" min="0" />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">ตำหนิหรือลักษณะพิเศษ</label>
            <textarea value={distinctiveFeatures} onChange={(e) => setDistinctiveFeatures(e.target.value)} rows={3} className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder="หางกุด, ปลอกคอสีแดง..." />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">ช่องทางติดต่อ</label>
            <input type="text" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} required className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black" placeholder="08X-XXX-XXXX หรือ LINE ID" />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full mt-4 bg-black text-white border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-1 transition-all text-xl font-bold py-6">
          {loading ? 'กำลังประมวลผล...' : 'แจ้งข้อมูลสัตว์เลี้ยง'}
        </Button>
      </form>
    </div>
  )
}