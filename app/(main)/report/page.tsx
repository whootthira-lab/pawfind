"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function ReportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form State
  const [name, setName] = useState('')
  const [type, setType] = useState('dog')
  const [status, setStatus] = useState('lost')
  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [reward, setReward] = useState('')
  const [color, setColor] = useState('') // 💡 1. เพิ่ม state สำหรับสี
  const [distinctiveFeatures, setDistinctiveFeatures] = useState('')
  const [images, setImages] = useState<string[]>([])
  
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
          color, // 💡 2. ส่งค่าสีไปยัง API
          contact_info: contactInfo,
          reward_amount: reward ? parseInt(reward) : 0,
          distinctive_features: distinctiveFeatures,
          images,
          markingImageIndexes: []
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
      }

      alert('บันทึกข้อมูลสำเร็จ AI กำลังวิเคราะห์รูปภาพของคุณ')
      router.push('/search')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 mb-12">
      <div className="bg-wagashi-sakura border-2 border-black rounded-lg shadow-paper p-8 text-center">
        <h1 className="text-3xl font-bold mb-2">แจ้งสัตว์หาย 🚨</h1>
        <p className="font-medium text-lg">อัปโหลดรูปภาพและกรอกข้อมูลเพื่อให้ชุมชนและ AI ช่วยตามหา</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-washi border-2 border-black rounded-lg shadow-paper p-8 flex flex-col gap-6">
        
        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-lg font-bold shadow-paper-sm">
            {error}
          </div>
        )}

        {/* ส่วนอัปโหลดรูปภาพ */}
        <div className="flex flex-col gap-2">
          <label className="font-bold text-lg">รูปภาพสัตว์เลี้ยง (บังคับ 1-5 รูป)</label>
          <div className="border-4 border-dashed border-gray-300 rounded-lg p-8 text-center bg-white hover:bg-gray-50 transition-colors cursor-pointer relative">
            <div className="font-bold text-gray-500 text-xl">📸 คลิกเพื่ออัปโหลดรูปภาพ (สูงสุด 5 รูป)</div>
            <input 
              type="file" 
              accept="image/*" 
              multiple
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={images.length >= 5}
            />
          </div>

          {images.length > 0 && (
            <div className="flex gap-4 mt-2 overflow-x-auto pb-2">
              {images.map((b64, idx) => (
                <div key={idx} className="relative w-24 h-24 flex-shrink-0">
                  <img 
                    src={`data:image/jpeg;base64,${b64}`} 
                    className="w-full h-full object-cover border-2 border-black rounded shadow-paper-sm" 
                  />
                  <button 
                    type="button"
                    onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full font-bold border-2 border-black shadow-paper-sm flex items-center justify-center text-xs"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">ชื่อสัตว์เลี้ยง</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="ไม่ทราบชื่อเว้นว่างไว้"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">จังหวัด</label>
            <input 
              type="text" 
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              required
              className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="เช่น นครราชสีมา"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">อำเภอ/เขต</label>
            <input 
              type="text" 
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="เช่น ด่านขุนทด"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">ประเภท</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="dog">🐶 สุนัข</option>
              <option value="cat">🐱 แมว</option>
              <option value="bird">🐦 นก</option>
              <option value="rabbit">🐰 กระต่าย</option>
              <option value="other">🐾 อื่นๆ</option>
            </select>
          </div>

          {/* 💡 3. เพิ่มช่องกรอกสีสัตว์เลี้ยง */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">สีของสัตว์เลี้ยง</label>
            <input 
              type="text" 
              value={color}
              onChange={(e) => setColor(e.target.value)}
              required
              className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="เช่น สีน้ำตาลขาว, ลายสลิด"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-lg">สถานะ</label>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="lost">🚨 สัตว์หาย</option>
              <option value="found">👀 พบสัตว์หลงทาง</option>
              <option value="adoption">💖 หาบ้าน</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">เงินรางวัล (บาท)</label>
            <input 
              type="number" 
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="0"
              min="0"
            />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">ตำหนิหรือลักษณะพิเศษ (แนะนำให้ระบุ)</label>
            <textarea 
              value={distinctiveFeatures}
              onChange={(e) => setDistinctiveFeatures(e.target.value)}
              rows={3}
              className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="เช่น หางกุด, ปลอกคอสีแดง, มีปานสีดำที่ขาหลังขวา..."
            />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-lg">ช่องทางติดต่อ (เบอร์โทร หรือ LINE ID)</label>
            <input 
              type="text" 
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              required
              className="bg-white border-2 border-black px-4 py-3 font-bold rounded shadow-paper-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="08X-XXX-XXXX หรือ LINE ID"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full mt-4 bg-wagashi-matcha hover:bg-wagashi-sora text-black border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-1 transition-all text-xl font-bold py-6"
        >
          {loading ? 'กำลังวิเคราะห์และบันทึกข้อมูล 🤖...' : 'แจ้งข้อมูลสัตว์เลี้ยง'}
        </Button>
      </form>
    </div>
  )
}