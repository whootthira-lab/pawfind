'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MatchResultCard } from './MatchResult'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Search, ChevronDown } from 'lucide-react'

export function InstantMatchModal({ petId, isOpen, onClose }: any) {
  const [matches, setMatches] = useState<any[]>([])
  const [visibleCount, setVisibleCount] = useState(3) // 💡 เริ่มต้นโชว์แค่ 3 ตัวแรก
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && petId) {
      fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId })
      })
      .then(res => res.json())
      .then(data => {
        // กรองตัวมันเองออก และเก็บผลลัพธ์ทั้งหมดที่เรียงตามความคล้ายไว้
        const allMatches = data.data.filter((m: any) => m.id !== petId)
        setMatches(allMatches)
        setLoading(false)
      })
      .catch(err => {
        console.error("Search error:", err)
        setLoading(false)
      })
    }
  }, [isOpen, petId])

  if (!isOpen) return null

  // 💡 ตัดแบ่งข้อมูลที่จะแสดงตาม visibleCount
  const visibleMatches = matches.slice(0, visibleCount)
  const hasMore = visibleCount < matches.length

  const loadMore = () => {
    setVisibleCount(prev => prev + 3) // กด 1 ครั้ง โชว์เพิ่มอีก 3 ตัว
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white border-4 border-black shadow-paper-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-2xl"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="text-wagashi-matcha w-16 h-16" />
          </div>
          <h2 className="text-3xl font-bold mb-2">บันทึกข้อมูลสำเร็จ!</h2>
          <p className="text-lg font-medium text-gray-600">AI ตรวจพบสัตว์ที่มีลักษณะใกล้เคียงในระบบดังนี้:</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-12">
            <Search className="animate-bounce w-12 h-12 mb-4" />
            <p className="font-bold text-xl">กำลังค้นหาคู่ที่แมตช์กัน...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AnimatePresence>
                {visibleMatches.map((match: any, index: number) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (index % 3) * 0.1 }}
                  >
                    {/* 💡 แสดงการ์ดผลลัพธ์ (จะมีการเพิ่มปุ่ม Pin ในส่วนนี้ทีหลัง) */}
                    <MatchResultCard result={match} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* 💡 ปุ่ม Load More เมื่อยังมีข้อมูลเหลือ */}
            {hasMore && (
              <div className="flex justify-center mt-4">
                <Button 
                  onClick={loadMore}
                  variant="outline"
                  className="bg-wagashi-kinako border-2 border-black font-bold shadow-paper-sm hover:-translate-y-1 transition-transform flex items-center gap-2"
                >
                  ดูเพิ่มเติม (ความเป็นไปได้รองลงมา) <ChevronDown size={20} />
                </Button>
              </div>
            )}

            {!loading && matches.length === 0 && (
              <div className="bg-gray-100 border-2 border-dashed border-black p-8 text-center rounded-lg">
                <p className="font-bold text-gray-500 text-lg">ยังไม่พบสัตว์ที่ลักษณะตรงกันในขณะนี้</p>
                <p className="text-sm mt-2">ไม่ต้องกังวล ระบบจะแจ้งเตือนคุณทันทีหากมีผู้แจ้งข้อมูลใหม่ที่ตรงกัน</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center mt-8 pt-6 border-t-2 border-black/10">
          <Button 
            onClick={onClose}
            className="bg-black text-white px-12 py-6 text-xl font-bold border-2 border-black shadow-paper-sm hover:shadow-paper transition-all"
          >
            ไปที่หน้าจัดการข้อมูล
          </Button>
        </div>
      </motion.div>
    </div>
  )
}