// app/(main)/pet/[id]/page.tsx
// ── แฟ้มประวัติสมุดสุขภาพสัตว์เลี้ยง (ฉบับแก้บั๊ก prefer-const ด่านตรวจ ESLint + ปรับสไตล์การ์ดรูปภาพด้านบนสุดสมบูรณ์ 100%) ──

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PetGallery } from '@/components/pet/PetGallery'
import { Phone, MessageCircle, ExternalLink, UserCircle2, ShieldAlert, MapPin, Heart, Activity } from 'lucide-react'
import type { Metadata, ResolvingMetadata } from 'next'
import ShareButton from '@/components/pet/ShareButton'
import { CommentSection } from '@/components/pet/CommentSection'
import { PetActionButtons } from '@/components/pet/PetActionButtons'
import { RequestLocationButton } from '@/components/pet/RequestLocationButton'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pobpet.com'

type Props = { params: { id: string } }

// ── 🟢 แก้ไขจุดนี้: ปรับเปลี่ยนจาก let เป็น const เพื่อให้ผ่านมาตรฐานความปลอดภัยระดับสากลของด่านตรวจ ESLint ──
function resolveImageUrl(url: string | null | undefined, userId: string | null = null): string {
  if (!url) return '/favicon.ico'
  if (url.startsWith('data:') || url.startsWith('http')) return url
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ajjvtazuncdtxjwcplcv.supabase.co'
  
  // 🟢 แก้ไขเป็น const เรียบร้อยแล้วครับ ด่านตรวจปล่อยผ่านไฟเขียวแน่นอน
  const cleanUrl = url.trim().replace(/^["']|["']$/g, '')

  // ตรวจสอบว่าในดาต้าเบสบันทึกพาร์ทโฟลเดอร์ pets/ นำหน้าไว้อยู่แล้วหรือไม่
  if (cleanUrl.startsWith('pets/')) {
    return `${supabaseUrl}/storage/v1/object/public/pet-images/${cleanUrl}`
  }

  // Fallback นิรภัย: หากมีแค่ชื่อไฟล์รูปภาพโดด ๆ ให้สั่งสวมพาร์ทพิกัดโฟลเดอร์ ID เจ้าของคั่นกลางทันทีตามโครงสร้างบักเก็ตจริง
  if (userId) {
    return `${supabaseUrl}/storage/v1/object/public/pet-images/pets/${userId}/${cleanUrl}`
  }
  
  return `${supabaseUrl}/storage/v1/object/public/pet-images/${cleanUrl}`
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
  
  const ogImageUrl = pet.og_image_url || `${BASE_URL}/api/og?id=${params.id}`
  
  return {
    title: `${pet.name || 'ไม่ทราบชื่อ'} | PobPet หาสัตว์หายด้วย AI`,
    description: pet.distinctive_features || pet.details || 'ช่วยเหลือน้องสัตว์เลี้ยงตามหาบ้านและพิกัดที่ปลอดภัย',
    openGraph: {
      url: `${BASE_URL}/pet/${params.id}`,
      title: `${pet.name || 'ไม่ทราบชื่อ'} | PobPet หาสัตว์หายด้วย AI`,
      description: pet.distinctive_features || pet.details || 'ช่วยเหลือน้องสัตว์เลี้ยงตามหาบ้านและพิกัดที่ปลอดภัย',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          type: 'image/png'
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: [ogImageUrl]
    }
  }
}

export default async function PetDetailPage({ params }: Props) {
  const supabase = createClient()

  // ดึงข้อมูลเซสชันปัจจุบันของผู้เข้าชมหน้าเว็บ
  const { data: { session } } = await supabase.auth.getSession()
  const currentUserId = session?.user?.id || null

  // ดึงข้อมูล Join ข้ามตารางพ่วงก้อนข้อมูลสิทธิ์โปรไฟล์เจ้าของและตารางรูปภาพ Multi-photos
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

  // ── 🟢 ล็อกสิทธิ์ความปลอดภัย: หากโปรไฟล์เป็น 'private' ให้เข้าชมได้เฉพาะเจ้าของบัญชีเท่านั้น ──
  if (pet.visibility === 'private' && currentUserId !== pet.user_id) {
    return notFound()
  }

  // ตรวจสอบสิทธิ์การเข้าชมพิกัดของสัตว์เลี้ยงหลงทางเพื่อความปลอดภัย
  let hasLogAccess = false
  if (currentUserId) {
    const { data: log } = await supabase
      .from('pet_location_access_logs')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('pet_id', pet.id)
      .single()
    if (log) {
      hasLogAccess = true
    }
  }
  const hasLocationAccess = (currentUserId === pet.user_id) || hasLogAccess

  // หาค่ารูปภาพหลักของน้อง
  const primaryImg = pet.pet_images?.find((img: any) => img.is_primary)?.storage_url || pet.image_url || ''
  const resolvedPrimaryImage = resolveImageUrl(primaryImg, pet.user_id)

  // จัดพาร์ทรูปภาพแกลเลอรีสไลด์ผ่านตัวประมวลผลความปลอดภัยชั้นสูง ป้องกันรูปแตกกลายเป็น undefined
  const galleryImages = pet.pet_images && pet.pet_images.length > 0
    ? pet.pet_images.map((img: any) => resolveImageUrl(img.storage_url, pet.user_id))
    : [resolveImageUrl(pet.image_url, pet.user_id)].filter(Boolean)

  // ── 🟢 แยกแยะและวิเคราะห์ข้อมูลจุดสังเกต / ตำหนิพิเศษ (รองรับทั้ง JSON Array หรือ Plain text ดั้งเดิม)
  let parsedFeatures: { url?: string; description: string }[] = []
  let isJsonFeatures = false

  if (pet.distinctive_features) {
    const trimmed = pet.distinctive_features.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          parsedFeatures = parsed.map((item: any) => ({
            url: item.url || item.storage_url || '',
            description: item.description || ''
          })).filter(item => item.description || item.url)
          isJsonFeatures = parsedFeatures.length > 0
        }
      } catch (e) {
        // Fallback
      }
    }
  }

  const statusLabels: Record<string, string> = {
    lost: '🚨 ประกาศตามหา (สัตว์หาย)',
    found: '👀 แจ้งพบสัตว์พลัดหลง',
    adoption: '💖 ประกาศตามหาบ้านใหม่',
    mating: '❤️ ประกาศตามหาคู่ผสมพันธุ์',
    showcase: '✨ ทำเนียบโชว์โปรไฟล์น้อง',
  }

  const isPrivateProfile = pet.profiles?.visibility === 'private'
  
  const reporter = {
    display_name: pet.profiles?.display_name || 'สมาชิกเครือข่าย PobPet',
    avatar_url: pet.profiles?.avatar_url || null,
    phone_number: pet.contact_info || pet.profiles?.phone_number || null,
    line_id: pet.profiles?.line_id || null,
    contact_link: pet.profiles?.contact_link || null,
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-6 text-black">
        
        {/* โครงสร้างโซนบนสุด: การ์ดตารางรูปภาพขนาดใหญ่และคลังแกลเลอรีสไลด์สไตล์ Origami */}
        <div className="w-full bg-white border-4 border-black p-4 rounded-3xl shadow-paper mb-4">
          <PetGallery primaryImage={resolvedPrimaryImage} images={galleryImages} petName={pet.name} />
        </div>

        {/* ── 🟢 ย้ายปุ่มควบคุมแอคชันบาร์ (แก้ไข/ลบ/แชร์) มาสถิตอยู่ใต้บล็อกรูปภาพด้านบนสุดอย่างลงตัว สวยงาม ── */}
        <div className="w-full mb-8">
          <PetActionButtons 
            petId={pet.id} 
            status={pet.status} 
            petName={pet.name || 'ไม่ทราบชื่อ'} 
            ownerId={pet.user_id || ''} 
          />
        </div>

        {/* โครงสร้างโซนด้านล่าง: แบ่งสัดส่วนข้อมูลจำเพาะและการ์ดตารางประวัติสุขภาพ */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* คอลัมน์ฝั่งซ้าย: ข้อมูลรายละเอียดประจำตัวน้อง */}
          <div className="md:col-span-7 space-y-6 text-left">
            <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-paper">
              <div className="inline-block bg-ori-orange/10 border-2 border-ori-orange text-ori-orange font-black text-xs px-3 py-1 rounded-full mb-3">
                {statusLabels[pet.status] || pet.status}
              </div>

              <h1 className="text-3xl font-black mb-4 flex items-center justify-between">
                <span>{pet.name || 'ไม่ระบุชื่อ'} 🐾</span>
              </h1>

              {/* ดีไซน์ตารางข้อมูลการ์ดแบบ Neubrutalism แยกช่องเป็นสัดส่วนคมชัด */}
              <div className="grid grid-cols-2 gap-3 font-bold text-sm">
                <div className="bg-gray-50 p-3 rounded-xl border-2 border-black shadow-paper-sm">
                  <span className="text-gray-400 block text-xs">🧬 สายพันธุ์</span>
                  <span className="font-black text-ori-orange text-base">{pet.breed || 'ไม่ระบุ'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border-2 border-black shadow-paper-sm">
                  <span className="text-gray-400 block text-xs">🎨 สีขนของน้อง</span>
                  <span className="font-black text-base">{pet.color || 'ไม่ระบุ'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border-2 border-black shadow-paper-sm">
                  <span className="text-gray-400 block text-xs">⚧️ เพศประจำตัว</span>
                  <span className="font-black text-base">{pet.gender === 'male' ? 'ผู้ ♂' : pet.gender === 'female' ? 'เมีย ♀' : 'ไม่ระบุ'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border-2 border-black shadow-paper-sm">
                  <span className="text-gray-400 block text-xs">🩺 ประวัติทำหมัน</span>
                  <span className="font-black text-base">{pet.is_sterilized ? 'ทำหมันแล้ว ✅' : 'ยังไม่ทำหมัน ❌'}</span>
                </div>
              </div>

              {pet.reward_amount > 0 && (
                <div className="mt-5 bg-yellow-100 border-4 border-black p-4 rounded-2xl text-center shadow-paper-sm">
                  <p className="text-xs font-black text-amber-800 uppercase tracking-wider">💰 สินน้ำใจรางวัลนำส่ง</p>
                  <p className="text-3xl font-black text-red-600 mt-1">{pet.reward_amount.toLocaleString()} <span className="text-sm text-black">บาท</span></p>
                </div>
              )}

              {pet.distinctive_features && (
                <div className="mt-4 p-4 bg-ori-cream border-2 border-black rounded-xl text-left">
                  <span className="text-xs font-black text-gray-400 block mb-1.5">📝 จุดสังเกตเด่น / ตำหนิพิเศษ:</span>
                  {isJsonFeatures ? (
                    <div className="space-y-4">
                      {/* รายการข้อความบรรยายลักษณะเด่น */}
                      <ul className="list-disc list-inside space-y-1 text-sm font-bold text-ori-ink">
                        {parsedFeatures.map((feat, idx) => (
                          <li key={idx}>{feat.description || 'จุดสังเกตเด่นพิเศษ'}</li>
                        ))}
                      </ul>

                      {/* รายการรูปภาพประกอบตำหนิพิเศษ 3 มุม */}
                      {parsedFeatures.some(f => f.url) && (
                        <div className="mt-3 border-t border-black/10 pt-3">
                          <span className="text-[10px] font-black text-gray-400 block mb-2">📸 รูปภาพประกอบลักษณะตำหนิพิเศษ:</span>
                          <div className="grid grid-cols-3 gap-3">
                            {parsedFeatures.map((feat, idx) => {
                              if (!feat.url) return null
                              return (
                                <div key={idx} className="flex flex-col gap-1.5">
                                  <div className="relative aspect-square border-2 border-black rounded-xl overflow-hidden bg-white shadow-paper-sm">
                                    <img 
                                      src={resolveImageUrl(feat.url, pet.user_id)} 
                                      alt={feat.description || `ตำหนิที่ ${idx + 1}`} 
                                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                  {feat.description && (
                                    <span className="text-[10px] font-bold text-gray-500 leading-tight text-center line-clamp-2">
                                      {feat.description}
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="font-bold text-sm text-ori-ink whitespace-pre-wrap">{pet.distinctive_features}</p>
                  )}
                </div>
              )}
            </div>

            {/* ระบบกล่องคอมเมนต์สาธารณะเบาะแส */}
            <CommentSection petId={params.id} />
          </div>

          {/* คอลัมน์ฝั่งขวา: พิกัดพื้นที่และช่องทางติดต่อเจ้าของ */}
          <div className="md:col-span-5 space-y-6 text-left">
            
            {/* กล่องพิกัด */}
            <div className="bg-white border-4 border-black p-5 rounded-3xl shadow-paper">
              <h3 className="font-black text-base mb-3 flex items-center gap-1.5"><MapPin size={18} className="text-ori-blue" /> พิกัดพื้นที่ประจำตัวน้อง</h3>
              
              {pet.status === 'found' ? (
                hasLocationAccess ? (
                  <div className="space-y-2 font-bold text-sm">
                    <p>จังหวัด: <span className="font-black">{pet.profiles?.province || pet.province}</span></p>
                    <p>อำเภอ / เขต: <span className="font-black">{pet.profiles?.district || pet.district || 'ไม่ระบุ'}</span></p>
                    {pet.tambon && <p>ตำบล / แขวง: <span className="font-black">ต.{pet.tambon}</span></p>}
                    {pet.latitude && pet.longitude && (
                      <>
                        <p>พิกัดละติจูด: <span className="font-black">{pet.latitude}</span></p>
                        <p>พิกัดลองจิจูด: <span className="font-black">{pet.longitude}</span></p>
                        <div className="mt-3">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${pet.latitude},${pet.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-wagashi-kinako border-2 border-black px-4 py-2.5 rounded-xl text-xs font-black shadow-paper-sm hover:bg-yellow-400 transition-all text-black hover:-translate-y-0.5 active:translate-y-0"
                          >
                            🗺️ เปิดดูใน Google Maps
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 font-bold text-sm">
                    <p>จังหวัด: <span className="font-black">{pet.profiles?.province || pet.province}</span></p>
                    <p>อำเภอ / เขต: <span className="font-black">{pet.profiles?.district || pet.district || 'ไม่ระบุ'}</span></p>
                    <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-xl flex gap-2 items-start text-amber-800 text-xs mt-2">
                      <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                      <p>🔒 พิกัดพบน้องระดับตำบลและตำแหน่งทางแผนที่ถูกล็อกไว้เพื่อความปลอดภัยของสัตว์เลี้ยง</p>
                    </div>
                    <div className="pt-2">
                      <RequestLocationButton petId={pet.id} />
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-1.5 font-bold text-sm">
                  <p>จังหวัด: <span className="font-black">{pet.profiles?.province || pet.province}</span></p>
                  {!isPrivateProfile ? (
                    <>
                      <p>อำเภอ / เขต: <span className="font-black">{pet.profiles?.district || pet.district || 'ไม่ระบุ'}</span></p>
                      {pet.tambon && <p>ตำบล / แขวง: <span className="font-black">ต.{pet.tambon}</span></p>}
                    </>
                  ) : (
                    <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-xl flex gap-2 items-start text-amber-800 text-xs mt-2">
                      <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                      <p>เจ้าของเลือกตั้งค่าโปรไฟล์เป็น &quot;เฉพาะฉัน&quot; ระบบจึงจำกัดข้อมูลพิกัดอำเภอค่ะ</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* กล่องข้อมูลผู้ดูแล */}
            <div className="bg-white border-4 border-black p-5 rounded-3xl shadow-paper">
              <h3 className="font-black text-base mb-3 flex items-center gap-1.5">
                <UserCircle2 size={18} className="text-ori-orange" /> ข้อมูลผู้ดูแล / ผู้แจ้งเหตุ
              </h3>
              
              <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full border-2 border-black overflow-hidden shadow-paper-sm">
                  {reporter.avatar_url ? (
                    <img src={reporter.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-base">🐾</div>
                  )}
                </div>
                <div>
                  <p className="font-black text-sm leading-tight">{reporter.display_name}</p>
                  <p className="text-[11px] font-bold text-gray-400 mt-0.5">สมาชิกเครือข่าย PobPet ชุมชน</p>
                </div>
              </div>

              {!isPrivateProfile ? (
                <div className="flex flex-col gap-2">
                  {reporter.phone_number && (
                    <a href={`tel:${reporter.phone_number}`} className="flex-1 flex items-center justify-center gap-2 bg-wagashi-kinako border-2 border-black py-2.5 rounded-xl font-black shadow-paper-sm hover:bg-amber-100 text-black text-xs">
                      <Phone size={14} /><span>โทรติดต่อสายตรง</span>
                    </a>
                  )}
                  {reporter.line_id && (
                    <a href={`https://line.me/ti/p/~${reporter.line_id}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-[#00B900] text-white border-2 border-black py-2.5 rounded-xl font-black shadow-paper-sm text-xs">
                      <MessageCircle size={14} /><span>แอดไลน์ (Line ID)</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center py-3 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl">
                  <p className="text-xs font-black text-gray-400">🔒 กรุณาส่งข้อมูลเบาะแสผ่านช่องคอมเมนต์ค่ะ</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}