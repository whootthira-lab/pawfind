import { createClient } from '@/lib/supabase/server'
import { MatchResultCard } from '@/components/pet/MatchResult'
import { Bookmark, Lock } from 'lucide-react'
import Link from 'next/link'

export default async function SavedPetsPage() {
  const supabase = createClient()
  
  // 1. ตรวจสอบสถานะผู้ใช้
  const { data: { user } } = await supabase.auth.getUser()
  
  // 💡 ถ้ายังไม่ Login ให้โชว์หน้านี้แทนการ Redirect ไปหน้า 404
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 mb-20 flex justify-center items-center min-h-[60vh]">
        <div className="bg-wagashi-sakura border-4 border-black p-12 rounded-2xl text-center shadow-paper max-w-xl">
          <div className="flex justify-center mb-6">
            <div className="bg-white border-2 border-black p-4 rounded-full shadow-paper-sm">
              <Lock size={48} className="text-black" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">กรุณาเข้าสู่ระบบ 🔒</h1>
          <p className="text-xl font-medium mb-8 text-gray-800">
            คุณต้องเข้าสู่ระบบก่อน จึงจะสามารถดูและจัดการรายการสัตว์เลี้ยงที่บันทึกไว้ได้ครับ
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/" className="inline-block bg-white text-black px-8 py-4 rounded-xl font-bold border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-1 transition-all">
              กลับหน้าแรก
            </Link>
            <Link href="/login" className="inline-block bg-black text-white px-8 py-4 rounded-xl font-bold border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-1 transition-all">
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 2. ดึงข้อมูลสัตว์ที่ผู้ใช้ Pin ไว้ (ทำเมื่อ Login แล้วเท่านั้น)
  const { data: savedItems, error } = await supabase
    .from('saved_pets')
    .select(`
      id,
      pets (
        id,
        name,
        breed,
        province,
        image_url,
        status
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) console.error('Error fetching saved pets:', error)

  const savedPets = savedItems?.map(item => item.pets).filter(Boolean) || []

  return (
    <div className="max-w-6xl mx-auto px-4 mb-20">
      <div className="bg-wagashi-kinako border-4 border-black p-8 rounded-2xl shadow-paper mb-10 flex flex-col md:flex-row items-center gap-6">
        <div className="bg-white border-2 border-black p-4 rounded-full shadow-paper-sm">
          <Bookmark size={48} className="text-black" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold mb-2">รายการที่คุณบันทึกไว้</h1>
          <p className="text-lg font-medium opacity-80">รวมสัตว์เลี้ยงที่คุณกด Pin ไว้เพื่อติดตามสถานะหรือนัดเจอ</p>
        </div>
      </div>

      {savedPets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {savedPets.map((pet: any) => (
            <MatchResultCard key={pet.id} result={pet} />
          ))}
        </div>
      ) : (
        <div className="bg-washi border-4 border-black border-dashed p-20 rounded-2xl text-center shadow-paper-sm">
          <p className="text-2xl font-bold text-gray-500 mb-4">ยังไม่มีรายการที่บันทึกไว้</p>
          <p className="text-lg text-gray-400">คุณสามารถกดไอคอน 📌 ที่มุมการ์ดสัตว์เลี้ยงเพื่อเก็บไว้ดูที่นี่ได้</p>
          <Link href="/search" className="inline-block mt-8 bg-black text-white px-8 py-4 rounded-xl font-bold border-2 border-black shadow-paper-sm hover:shadow-paper transition-all">
            ไปดูสัตว์เลี้ยงทั้งหมด
          </Link>
        </div>
      )}
    </div>
  )
}