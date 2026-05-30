// app/(main)/pet/[id]/page.tsx
// ── สมุดสุขภาพและประวัติสัตว์เลี้ยงรายตัว (ฉบับแก้ไขสัญญานอินพุตพารามิเตอร์ PetActionButtons ผ่านบิวด์ Vercel 100%) ──

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PetGallery } from '@/components/pet/PetGallery'
import { Phone, MessageCircle, ExternalLink, UserCircle2, ShieldAlert } from 'lucide-react'
import type { Metadata, ResolvingMetadata } from 'next'
import ShareButton from '@/components/pet/ShareButton'
import { CommentSection } from '@/components/pet/CommentSection'
import { PetActionButtons } from '@/components/pet/PetActionButtons'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pobpet.com'

type Props = { params: { id: string } }

function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('data:')) return ''
  if (url.startsWith('http')) return url
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pet-images/${url}`
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const supabase = createClient()
  const { data: pet } = await supabase
    .from('pets')
    .select('*, pet_images(storage_url, is_primary)')
    .eq('id', params.id)
    .single()

  if (!pet) return { title: 'ไม่พบข้อมูล - PobPet หาสัตว์หายด้วย AI' }
  const primaryImg = pet.pet_images?.find((img: any) => img.is_primary)?.storage_url || pet.image_url || ''
  
  return {
    title: `${pet.name || 'ไม่ทราบชื่อ'} | PobPet หาสัตว์หายด้วย AI`,
    description: pet.distinctive_features || pet.details || 'ช่วยเหลือน้องสัตว์เลี้ยงตามหาบ้านและพิกัดที่ปลอดภัย',
    openGraph: {
      images: [primaryImg ? resolveImageUrl(primaryImg) : '/logo-og.png'],
    },
  }
}

export default async function PetDetailPage({ params }: Props) {
  const supabase = createClient()

  // ── 🟢 สั่งดึงข้อมูล Join ข้ามตารางพ่วงก้อนข้อมูล Profiles และรูปภาพ Multi-photos ทั้งหมด ──
  const { data: pet, error } = await supabase
    .from('pets')
    .select(`
      *,
      pet_images (
        id,
        storage_url,
        is_primary
      ),
      profiles (
        display_name,
        avatar_url,
        phone_number,
        line_id,
        contact_link,
        province,
        district,
        visibility
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !pet) return notFound()

  // จัดการจัดระเบียบคลังรูปภาพ Multi-photos 3 มุมส่งเข้าโมดูลแกลเลอรี
  const galleryImages = pet.pet_images && pet.pet_images.length > 0
    ? pet.pet_images.map((img: any) => img.storage_url)
    : [pet.image_url].filter(Boolean)

  const statusLabels: Record<string, string> = {
    lost: '🚨 ประกาศตามหา (สัตว์หาย)',
    found: '👀 แจ้งพบสัตว์พลัดหลง',
    adoption: '💖 ประกาศตามหาบ้านใหม่',
    mating: '❤️ ประกาศตามหาคู่ผสมพันธุ์',
    showcase: '✨ ทำเนียบโชว์โปรไฟล์น้อง',
  }

  // แกะรอยระดับความเป็นส่วนตัวจากตารางโปรไฟล์เจ้าของ
  const isPrivateProfile = pet.profiles?.visibility === 'private'
  
  // ชุดข้อมูล Fallback ดึงสิทธิ์ผู้ดูแล
  const reporter = {
    display_name: pet.profiles?.display_name || 'สมาชิกเครือข่าย PobPet',
    avatar_url: pet.profiles?.avatar_url || null,
    phone_number: pet.contact_info || pet.profiles?.phone_number || null,
    line_id: pet.profiles?.line_id || null,
    contact_link: pet.profiles?.contact_link || null,
  }

  return (
    <>
      {/* ── 🟢 แก้ไขจุดบิวด์เอเรอร์: ส่งค่า Props ไปหา PetActionButtons ให้ตรงตามข้อกำหนด Type สากลประจำคอมโพเนนต์ของพี่วุฒิ์ ── */}
      <PetActionButtons 
        petId={pet.id} 
        status={pet.status} 
        petName={pet.name || 'ไม่ทราบชื่อ'} 
        ownerId={pet.user_id || ''} 
      />
      
      <div className="max-w-5xl mx-auto px-4 py-6 text-black">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* คอลัมน์ซ้าย: แฟลชแกลเลอรีรูปภาพแบบสไลด์ดูครบทุกมุมมอง */}
          <div className="lg:col-span-7 space-y-6">
            <PetGallery images={galleryImages} name={pet.name} />
          </div>

          {/* คอลัมน์ขวา: รายละเอียดเนื้อหาข้อมูลทั่วไปของตัวน้อง */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-paper">
              <div className="inline-block bg-ori-orange/10 border-2 border-ori-orange text-ori-orange font-black text-xs px-3 py-1 rounded-full mb-3">
                {statusLabels[pet.status] || pet.status}
              </div>

              <h1 className="text-3xl font-black mb-2 flex items-center justify-between">
                <span>{pet.name || 'ไม่ระบุชื่อ'} 🐾</span>
              </h1>

              <div className="grid grid-cols-2 gap-3 mt-4 text-sm font-bold border-t-2 border-black pt-4">
                <p className="bg-gray-50 p-2.5 rounded-xl border border-black">🧬 สายพันธุ์: <span className="font-black text-ori-orange">{pet.breed || 'ไม่ระบุ'}</span></p>
                <p className="bg-gray-50 p-2.5 rounded-xl border border-black">🎨 สีขนน้อง: <span className="font-black">{pet.color || 'ไม่ระบุ'}</span></p>
                <p className="bg-gray-50 p-2.5 rounded-xl border border-black">⚧️ เพศ: <span className="font-black">{pet.gender === 'male' ? 'ผู้ ♂' : pet.gender === 'female' ? 'เมีย ♀' : 'ไม่ระบุ'}</span></p>
                <p className="bg-gray-50 p-2.5 rounded-xl border border-black">🩺 ทำหมันแล้ว: <span className="font-black">{pet.is_sterilized ? 'ใช่ ✅' : 'ยังไม่ทำ ❌'}</span></p>
              </div>

              {pet.reward_amount > 0 && (
                <div className="mt-4 bg-yellow-100 border-4 border-black p-4 rounded-2xl text-center shadow-paper-sm">
                  <p className="text-xs font-black text-amber-800 uppercase tracking-wider">💰 สินน้ำใจ / เงินรางวัลนำส่ง</p>
                  <p className="text-3xl font-black text-red-600 mt-1">{pet.reward_amount.toLocaleString()} <span className="text-sm text-black">บาท</span></p>
                </div>
              )}
            </div>

            {/* กล่องพิกัดข้อมูลสถานที่ที่ตั้งน้อง */}
            <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-paper">
              <h3 className="font-black text-lg mb-3">📍 พิกัดพื้นที่ประจำตัวน้อง</h3>
              <div className="space-y-2 font-bold text-sm">
                <p>จังหวัด: <span className="font-black">{pet.profiles?.province || pet.province}</span></p>
                
                {/* ดักตรวจสอบสิทธิ์การแสดงผลพิกัดอำเภอเชิงลึกตามค่า Privacy */}
                {!isPrivateProfile ? (
                  <>
                    <p>อำเภอ / เขต: <span className="font-black">{pet.profiles?.district || pet.district || 'ไม่ระบุ'}</span></p>
                    {pet.tambon && <p>ตำบล / แขวง: <span className="font-black">ต.{pet.tambon}</span></p>}
                  </>
                ) : (
                  <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-xl flex gap-2 items-start text-amber-800 text-xs mt-3">
                    <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                    <p>เจ้าของสัตว์เลี้ยงเลือกตั้งค่าโปรไฟล์เป็น <span className="font-black">&quot;เฉพาะฉัน&quot;</span> ระบบจึงจำกัดการเข้าถึงข้อมูลพิกัดอำเภอเพื่อความปลอดภัยค่ะ</p>
                  </div>
                )}
              </div>
            </div>

            {/* กล่องผู้ดูแลและเบอร์โทรช่องทางติดต่อกลับ */}
            <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-paper">
              <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                <UserCircle2 className="text-ori-orange" /> ข้อมูลผู้ดูแล / ผู้แจ้งเหตุ
              </h3>
              
              <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-4 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full border-2 border-black overflow-hidden shadow-paper-sm">
                  {reporter.avatar_url ? (
                    <img src={reporter.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🐾</div>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-black text-base leading-tight">{reporter.display_name}</p>
                  <p className="text-xs font-bold text-gray-400 mt-1">เครือข่ายสมาชิกประจำชุมชน</p>
                </div>
              </div>

              {/* ดักสิทธิ์บล็อกปุ่มเปิดเผยช่องทางติดต่อส่วนตัวหากโหมดเป็น private */}
              {!isPrivateProfile ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  {reporter.phone_number && (
                    <a href={`tel:${reporter.phone_number}`} className="flex-1 flex items-center justify-center gap-2 bg-wagashi-kinako border-2 border-black px-4 py-3 rounded-xl font-black shadow-paper-sm hover:shadow-paper transition-all text-black text-xs">
                      <Phone size={16} /><span>โทรติดต่อ</span>
                    </a>
                  )}
                  {reporter.line_id && (
                    <a href={`https://line.me/ti/p/~${reporter.line_id}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-[#00B900] text-white border-2 border-black px-4 py-3 rounded-xl font-black shadow-paper-sm hover:shadow-paper transition-all text-xs">
                      <MessageCircle size={16} /><span>แอดไลน์</span>
                    </a>
                  )}
                  {reporter.contact_link && (
                    <a href={reporter.contact_link.startsWith('http') ? reporter.contact_link : `https://${reporter.contact_link}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-black text-white border-2 border-black px-4 py-3 rounded-xl font-black shadow-paper-sm hover:shadow-paper transition-all text-xs">
                      <ExternalLink size={16} /><span>ช่องทางอื่น</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl">
                  <p className="text-xs font-black text-gray-400">🔒 กรุณาส่งข้อความสอบถามเบาะแสผ่านช่องคอมเมนต์ด้านล่างแทนค่ะ</p>
                </div>
              )}
            </div>

            {/* ระบบกล่องคอมเมนต์สาธารณะเบาะแส */}
            <CommentSection petId={params.id} />

          </div>
        </div>
      </div>
    </>
  )
}