import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PetGallery } from '@/components/pet/PetGallery'
import { Phone, MessageCircle, ExternalLink, UserCircle2 } from 'lucide-react'
import { Metadata, ResolvingMetadata } from 'next' 
import ShareButton from '@/components/pet/ShareButton'

type Props = {
  params: { id: string }
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawfind-eta.vercel.app'

// ── Helper: แปลง URL รูปภาพเพื่อส่งไปให้ตัวสร้าง OG Image ──
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

  if (!pet) return { title: 'ไม่พบข้อมูล - PobPet' }

  const images = pet.pet_images || []
  const primaryImage = images.find((i: any) => i.is_primary)?.storage_url || pet.image_url || ''
  
  // ✨ สร้าง URL สำหรับรูป OG สไตล์โอริกามิ
  const ogUrl = new URL(`${BASE_URL}/api/og`)
  ogUrl.searchParams.set('name', pet.name || 'ไม่ทราบชื่อ')
  ogUrl.searchParams.set('status', pet.status || 'lost')
  if (pet.breed) ogUrl.searchParams.set('breed', pet.breed)
  if (pet.province) ogUrl.searchParams.set('province', pet.province)
  if (pet.reward_amount) ogUrl.searchParams.set('reward', pet.reward_amount.toString())
  
  const resolvedImage = resolveImageUrl(primaryImage)
  if (resolvedImage) ogUrl.searchParams.set('image', resolvedImage)

  const finalOgImageUrl = ogUrl.toString()
  
  const statusLabel = pet.status === 'lost' ? '🚨 ตามหาเจ้าของ' : pet.status === 'found' ? '👀 พบน้องหลงทาง' : '💖 หาบ้านใหม่'
  const title = `${statusLabel}: ${pet.name || 'ไม่ทราบชื่อ'} - PobPet`
  const description = `พิกัด: ${pet.province} ${pet.district ? `อ.${pet.district}` : ''} | ลักษณะ: ${pet.distinctive_features || 'ช่วยเหลือน้องเพื่อกลับบ้านที่อบอุ่น'}`

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [{ url: finalOgImageUrl, width: 1200, height: 630 }], // ดึงรูปที่เจนมาใหม่ไปใช้
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [finalOgImageUrl],
    },
  }
}

export default async function PetProfilePage({ params }: Props) {
  const supabase = createClient()
  
  const { data: pet } = await supabase
    .from('pets')
    .select(`
      *, 
      pet_images(storage_url, is_primary),
      profiles(first_name, last_name, display_name, avatar_url, phone_number, line_id, contact_link)
    `)
    .eq('id', params.id)
    .single()

  if (!pet) {
    notFound()
  }

  const images = pet.pet_images || []
  const primaryImage = images.find((i: any) => i.is_primary)?.storage_url || pet.image_url
  const reporter = pet.profiles

  const createdAt = new Date(pet.created_at)
  const formattedDate = createdAt.toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const formattedTime = createdAt.toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="max-w-3xl mx-auto mb-12">
      <div className="bg-white border-2 border-black rounded-lg shadow-paper overflow-hidden">
        
        <PetGallery 
          primaryImage={primaryImage} 
          images={images} 
          petName={pet.name} 
        />

        <div className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{pet.name || 'ไม่ทราบชื่อ'}</h1>
              <p className="text-xl font-bold text-gray-700">
                {pet.breed || 'ไม่ระบุสายพันธุ์'} • {pet.province} {pet.district ? `(${pet.district})` : ''}
              </p>
              <p className="text-sm font-bold text-gray-500 mt-2 bg-gray-100 border border-gray-300 inline-block px-3 py-1 rounded-full">
                🕒 แจ้งเมื่อ: {formattedDate} เวลา {formattedTime} น.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="bg-wagashi-matcha border-2 border-black px-4 py-2 rounded-lg font-bold shadow-paper-sm text-lg text-center min-w-[140px]">
                {pet.status === 'lost' ? '🚨 ตามหาเจ้าของ' : pet.status === 'found' ? '👀 พบน้องหลงทาง' : '💖 หาบ้านใหม่'}
              </span>

              <ShareButton 
                petName={pet.name || 'น้องสัตว์เลี้ยง'}
                status={pet.status === 'lost' ? 'ตามหาเจ้าของ' : 'พบน้องหลงทาง'}
                petId={params.id} 
              />

              {pet.reward_amount > 0 && (
                <span className="bg-red-500 text-white border-2 border-black px-3 py-1 rounded font-bold shadow-paper-sm">
                  💰 รางวัล {pet.reward_amount.toLocaleString()} บาท
                </span>
              )}
            </div>
          </div>

          <hr className="border-black border-1 mb-6" />

          {pet.latitude && pet.longitude && (
            <div className="bg-white border-2 border-black p-5 rounded-lg mb-8 shadow-paper-sm flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-wagashi-sora p-3 rounded-full border-2 border-black text-2xl shadow-paper-sm">
                  📍
                </div>
                <div>
                  <h3 className="font-bold text-lg">พิกัดที่พบสัตว์เลี้ยง</h3>
                  <p className="text-sm font-medium text-gray-600 font-mono mt-1">
                    Lat: {pet.latitude.toFixed(5)}, Lng: {pet.longitude.toFixed(5)}
                  </p>
                </div>
              </div>
              {/* ✅ แก้ไข URL แผนที่ให้ถูกต้อง */}
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${pet.latitude},${pet.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto relative z-10"
              >
                <Button className="w-full bg-wagashi-kinako text-black hover:bg-yellow-400 border-2 border-black px-6 py-5 text-md font-bold shadow-paper-sm hover:-translate-y-1 transition-transform">
                  🗺️ เปิดดูใน Google Maps
                </Button>
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="border-2 border-black p-5 rounded-lg bg-wagashi-kinako shadow-paper-sm md:col-span-2">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                ✨ ตำหนิหรือลักษณะพิเศษ
              </h3>
              <p className="text-black font-medium leading-relaxed">
                {pet.distinctive_features || "ผู้แจ้งไม่ได้ระบุลักษณะพิเศษไว้"}
              </p>
            </div>

            <div className="border-2 border-black p-5 rounded-lg bg-wagashi-sakura shadow-paper-sm">
              <div className="text-sm font-bold text-gray-600 mb-1 uppercase">สีของสัตว์เลี้ยง</div>
              <div className="text-xl font-bold">{pet.color || "ไม่ระบุ"}</div>
            </div>

            <div className="border-2 border-black p-5 rounded-lg bg-wagashi-sora shadow-paper-sm">
              <div className="text-sm font-bold text-gray-600 mb-1 uppercase">ประเภทสัตว์</div>
              <div className="text-xl font-bold capitalize">
                {pet.species === 'dog' ? 'สุนัข' : pet.species === 'cat' ? 'แมว' : pet.species || 'ไม่ระบุ'}
              </div>
            </div>
          </div>

          <div className="bg-washi border-2 border-black p-6 rounded-lg mb-8 shadow-paper-sm">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              🤖 บทวิเคราะห์จาก Gemini AI
            </h3>
            {/* ✅ แก้ไขให้เป็น HTML Entity */}
            <p className="text-gray-800 leading-relaxed italic">
              &quot;{pet.ai_description}&quot;
            </p>
          </div>

          {reporter && (
            <div className="border-2 border-black rounded-xl p-6 bg-gray-50 mt-10">
              <div className="flex items-center gap-4 mb-5 border-b-2 border-black pb-4">
                {reporter.avatar_url ? (
                  <img 
                    src={reporter.avatar_url} 
                    alt={reporter.display_name || "Profile"} 
                    className="w-14 h-14 rounded-full border-2 border-black object-cover" 
                  />
                ) : (
                  <UserCircle2 size={56} className="text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">ข้อมูลผู้แจ้ง</p>
                  <p className="text-xl font-black">{reporter.display_name || `${reporter.first_name} ${reporter.last_name}`}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {reporter.phone_number && (
                  <a 
                    href={`tel:${reporter.phone_number}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-wagashi-kinako border-2 border-black px-4 py-4 rounded-xl font-black shadow-paper-sm hover:shadow-paper active:translate-y-1 transition-all text-black"
                  >
                    <Phone size={20} />
                    <span>โทรติดต่อ</span>
                  </a>
                )}

                {reporter.line_id && (
                  <a 
                    href={`https://line.me/ti/p/~${reporter.line_id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#00B900] text-white border-2 border-black px-4 py-4 rounded-xl font-black shadow-paper-sm hover:shadow-paper active:translate-y-1 transition-all"
                  >
                    <MessageCircle size={20} />
                    <span>แอดไลน์</span>
                  </a>
                )}

                {reporter.contact_link && (
                  <a 
                    href={reporter.contact_link.startsWith('http') ? reporter.contact_link : `https://${reporter.contact_link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-black text-white border-2 border-black px-4 py-4 rounded-xl font-black shadow-paper-sm hover:shadow-paper active:translate-y-1 transition-all"
                  >
                    <ExternalLink size={20} />
                    <span>ช่องทางอื่น</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}