import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MatchResultCard } from '@/components/pet/MatchResult'
import { Bookmark } from 'lucide-react'

export default async function SavedPetsPage() {
  const supabase = createClient()
  
  // 1. ตรวจสอบว่าผู้ใช้ Login หรือยัง
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login') // ถ้าไม่ Login ให้ส่งไปหน้า Login
  }

  // 2. ดึงข้อมูลสัตว์ที่ผู้ใช้ Pin ไว้ (Join กับตาราง pets)
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

  if (error) {
    console.error('Error fetching saved pets:', error)
  }

  // แปลงโครงสร้างข้อมูลเพื่อให้ส่งเข้า MatchResultCard ได้ง่าย
  const savedPets = savedItems?.map(item => item.pets).filter(Boolean) || []

  return (
    <div className="max-w-6xl mx-auto px-4 mb-20">
      {/* Header สไตล์ Neubrutalism */}
      <div className="bg-wagashi-kinako border-4 border-black p-8 rounded-2xl shadow-paper mb-10 flex flex-col md:flex-row items-center gap-6">
        <div className="bg-white border-2 border-black p-4 rounded-full shadow-paper-sm">
          <Bookmark size={48} className="text-black" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold mb-2">รายการที่คุณบันทึกไว้</h1>
          <p className="text-lg font-medium opacity-80">รวมสัตว์เลี้ยงที่คุณกด Pin ไว้เพื่อติดตามสถานะหรือนัดเจอ</p>
        </div>
      </div>

      {/* รายการสัตว์เลี้ยง */}
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
          <a href="/search" className="inline-block mt-8 bg-black text-white px-8 py-4 rounded-xl font-bold border-2 border-black shadow-paper-sm hover:shadow-paper transition-all">
            ไปดูสัตว์เลี้ยงทั้งหมด
          </a>
        </div>
      )}
    </div>
  )
}