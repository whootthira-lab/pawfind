import { createClient } from '@/lib/supabase/server'
import { MatchResultCard } from '@/components/pet/MatchResult'
import { Bookmark, Lock, User } from 'lucide-react'
import Link from 'next/link'

export default async function SavedPetsPage() {
  const supabase = createClient()
  
  // 1. ตรวจสอบสถานะผู้ใช้[cite: 27]
  const { data: { user } } = await supabase.auth.getUser()
  
  // กรณีที่ยังไม่ได้เข้าสู่ระบบ[cite: 27]
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

  // 2. ดึงข้อมูลโปรไฟล์จาก Metadata (Google/Facebook)[cite: 27]
  const userMetadata = user.user_metadata
  const userName = userMetadata?.full_name || user.email?.split('@')[0] || 'นักช่วยเหลือ'
  const userAvatar = userMetadata?.avatar_url

  // 3. ดึงข้อมูลสัตว์ที่ผู้ใช้ Pin ไว้ (🟢 ปรับแก้คำสั่งดึงข้อมูลดึง pet_images และตารางฟิลด์ลูกแบบเต็มพิกัดเพื่อแก้ข้อ 9)[cite: 27]
  const { data: savedItems, error } = await supabase
    .from('saved_pets')
    .select(`
      id,
      pets (
        *,
        pet_images (
          storage_url,
          is_primary
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) console.error('Error fetching saved pets:', error)

  // ── 🟢 ฟังก์ชันจัดเรียงโครงสร้างข้อมูลรูปภาพ Fallback แบบเดียวกับหน้าสืบค้นหลัก ดึงรูปภาพติดคมชัดชัวร์ 100% (ข้อ 9) ──[cite: 27]
  const savedPets = savedItems?.map(item => {
    const p: any = item.pets
    if (!p) return null

    const safeImageUrl = p.pet_images?.find((img: any) => img.is_primary)?.storage_url 
      || p.pet_images?.[0]?.storage_url 
      || (p.images && Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '')
      || p.primary_image 
      || p.image_url 
      || ''

    return {
      ...p,
      image_url: safeImageUrl
    }
  }).filter(Boolean) || []

  return (
    <div className="max-w-6xl mx-auto px-4 mb-20 text-black">
      
      {/* 🌟 ส่วนแบนเนอร์ผู้ใช้สไตล์ Neubrutalism[cite: 27] */}
      <div className="bg-wagashi-kinako border-4 border-black p-8 rounded-2xl shadow-paper mb-10 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        
        {/* รูปโปรไฟล์จาก Metadata[cite: 27] */}
        <div className="relative shrink-0">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt={userName}
              className="w-24 h-24 rounded-full border-4 border-black shadow-paper-sm object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-black bg-white flex items-center justify-center shadow-paper-sm">
              <User size={48} className="text-black" />
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 bg-white border-2 border-black p-1.5 rounded-lg shadow-paper-sm">
            <Bookmark size={16} className="fill-black" />
          </div>
        </div>

        <div className="text-center md:text-left z-10">
          <p className="text-lg font-bold opacity-70 mb-1">ยินดีต้อนรับกลับมา,</p>
          <h1 className="text-4xl font-bold mb-2">{userName} ✨</h1>
          <p className="font-medium opacity-80">
            คุณได้ช่วยบันทึกข้อมูลสัตว์เลี้ยงไว้ทั้งหมด {savedPets.length} รายการ
          </p>
        </div>
        
        {/* ลายตกแต่งพื้นหลังเพื่อความสวยงาม[cite: 27] */}
        <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl font-bold select-none pointer-events-none">
          🐾
        </div>
      </div>

      {/* รายการสัตว์เลี้ยงที่บันทึก[cite: 27] */}
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