'use client'

import { useState, useEffect } from 'react'
import { SearchResult } from '@/types/pet'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchUploadProps {
  onResults: (results: SearchResult[], radius: number) => void
  onLoading: (loading: boolean) => void
}

// ── 🤖 Component สำหรับ Animation หน้าโหลด AI ──
function AILoadingAnimation() {
  const [loadingStep, setLoadingStep] = useState(0)

  useEffect(() => {
    // เปลี่ยนข้อความหลังจากผ่านไป 2 วินาที
    const timer = setTimeout(() => {
      setLoadingStep(1)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center min-h-[350px]">
      
      {/* วงแหวนหุ่นยนต์กับแมวหมุนๆ */}
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

      {/* ข้อความสลับสถานะอัตโนมัติ */}
      <div className="h-20 flex items-center justify-center px-2">
        <AnimatePresence mode="wait">
          {loadingStep === 0 ? (
            <motion.p
              key="step0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-lg md:text-xl font-black text-ori-ink"
            >
              🧠 AI กำลังวิเคราะห์ลักษณะจากรูป<br className="hidden md:block"/>เพื่อเปรียบเทียบกับฐานข้อมูล.....
            </motion.p>
          ) : (
            <motion.p
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg md:text-xl font-black text-ori-orange"
            >
              📊 AI กำลังจัดเรียงชุดข้อมูลตาม % ความเป็นไปได้<br className="hidden md:block"/>โดยจะแสดง % สูงที่สุดให้คุณเห็นก่อน.....
            </motion.p>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}

// ── 📝 Component หลักสำหรับฟอร์มอัปโหลด ──
export function SearchUpload({ onResults, onLoading }: SearchUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [province, setProvince] = useState('')
  const [marking, setMarking] = useState('')
  const [isSearching, setIsSearching] = useState(false) // 💡 State สำหรับโชว์หน้า Loading

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSearch = async () => {
    if (!preview) return
    setIsSearching(true) // เปิดหน้า Loading Animation
    onLoading(true)      // แจ้ง Component แม่ว่ากำลังโหลด
    
    try {
      const b64 = preview.split(',')[1]
      const res = await fetch('/api/search', {
        method: 'POST',
        body: JSON.stringify({
          imageBase64: b64,
          province,
          marking,
        })
      })
      const { data, error } = await res.json()
      if (error) alert(error)
      if (data) {
        onResults(data.results, data.radiusUsed)
      }
    } catch (err) {
      console.error(err)
      alert("เกิดข้อผิดพลาดในการวิเคราะห์ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsSearching(false) // ปิดหน้า Loading
      onLoading(false)
    }
  }

  return (
    <div className="bg-washi border-4 border-black p-6 rounded-2xl shadow-paper relative overflow-hidden transition-all duration-500">
      
      {isSearching ? (
        <AILoadingAnimation />
      ) : (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="flex flex-col h-full"
        >
          <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
            🔍 ค้นหาน้องด้วยรูปภาพ
          </h2>
          
          <div className="border-4 border-dashed border-black p-8 text-center rounded-xl bg-white mb-6 cursor-pointer hover:bg-wagashi-sakura/30 transition-colors relative group">
            <input type="file" onChange={handleFile} accept="image/*" className="hidden" id="upload" />
            <label htmlFor="upload" className="cursor-pointer flex flex-col items-center gap-3">
              {preview ? (
                <img src={preview} alt="preview" className="max-h-56 mx-auto rounded-lg border-2 border-black shadow-paper-sm object-contain" />
              ) : (
                <>
                  <div className="bg-ori-cream p-4 rounded-full border-2 border-black shadow-paper-sm group-hover:-translate-y-1 transition-transform">
                    📸
                  </div>
                  <div className="font-bold text-gray-600">
                    คลิกเพื่ออัปโหลด หรือลากรูปมาวางที่นี่
                  </div>
                </>
              )}
            </label>
          </div>

          <div className="flex flex-col gap-4 mb-6">
            <input 
              type="text" 
              placeholder="📍 จังหวัด (ไม่บังคับ)" 
              value={province} 
              onChange={e => setProvince(e.target.value)}
              className="ori-input"
            />
            <input 
              type="text" 
              placeholder="✨ ตำหนิพิเศษ (ไม่บังคับ)" 
              value={marking} 
              onChange={e => setMarking(e.target.value)}
              className="ori-input"
            />
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={!preview}
            className="w-full ori-btn-orange py-6 text-lg rounded-xl flex items-center justify-center gap-2"
          >
            เริ่มค้นหาด้วย AI 🚀
          </Button>
        </motion.div>
      )}

    </div>
  )
}