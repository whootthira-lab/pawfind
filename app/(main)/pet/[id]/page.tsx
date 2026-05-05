import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PetGallery } from '@/components/pet/PetGallery'
import { Phone, MessageCircle, ExternalLink, UserCircle2 } from 'lucide-react'
import type { Metadata, ResolvingMetadata } from 'next'
import ShareButton from '@/components/pet/ShareButton'
import { CommentSection } from '@/components/pet/CommentSection'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawfind-eta.vercel.app'

type Props = { params: { id: string } }

function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('data:')) return ''
  if (url.startsWith('http')) return url
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pet-images/${url}`
}

function buildOgImageUrl(params: {
  name: string
  status: string
  breed?: string
  province?: string
  imageUrl?: string
  reward?: number
}): string {
  const url = new URL(`${BASE_URL}/api/og`)
  url.searchParams.set('name',     params.name)
  url.searchParams.set('status',   params.status)
  if (params.breed)    url.searchParams.set('breed',    params.breed)
  if (params.province) url.searchParams.set('province', params.province)
  if (params.imageUrl) url.searchParams.set('image',    params.imageUrl)
  if (params.reward && params.reward > 0)
    url.searchParams.set('reward', String(params.reward))
  return url.toString()
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

  if (!pet) return { title: 'ไม่พบข้อมูล - Pobpet' }

  const images     = pet.pet_images || []
  const primaryRaw = images.find((i: any) => i.is_primary)?.storage_url || pet.image_url || ''
  const imageUrl   = resolveImageUrl(primaryRaw)

  const statusLabel: Record<string, string> = {
    lost:     '🚨 ตามหาเจ้าของ',
    found:    '👀 พบน้องหลงทาง',
    adoption: '💖 หาบ้านใหม่',
  }

  const locationText = [
    pet.sub_district ? `ต.${pet.sub_district}` : null,
    pet.district ? `อ.${pet.district}` : null,
    `จ.${pet.province || ''}`
  ].filter(Boolean).join(' ')

  const title       = `${statusLabel[pet.status] || ''}: ${pet.name || 'ไม่ทราบชื่อ'} | Pobpet`
  const description = [
    `ประเภท: ${pet.species === 'dog' ? 'สุนัข' : pet.species === 'cat' ? 'แมว' : pet.species || 'สัตว์เลี้ยง'}`,
    pet.breed ? `สายพันธุ์: ${pet.breed}` : null,
    `พื้นที่: ${locationText}`,
    pet.distinctive_features ? `ลักษณะ: ${pet.distinctive_features.slice(0, 80)}` : null,
    'ช่วยแชร์เพื่อส่งน้องกลับบ้าน 🐾',
  ].filter(Boolean).join(' | ')

  // 💡 จุดที่แก้ไข: ลำดับการเลือกใช้รูป OG
  // 1. ใช้รูปที่ AI สร้างเก็บไว้ (Pre-generated) ถ้ามี
  // 2. ถ้าไม่มี ให้ใช้ระบบสร้างรูปสด (Dynamic) เป็นแผนสำรอง
  const dynamicOgUrl = buildOgImageUrl({
    name:     pet.name || 'ไม่ทราบชื่อ',
    status:   pet.status,
    breed:    pet.breed,
    province: pet.province,
    imageUrl,
    reward:   pet.reward_amount,
  })

  const ogImageUrl = pet.og_image_url || dynamicOgUrl
  const pageUrl = `${BASE_URL}/pet/${params.id}`

  return {
    title,
    description,
    openGraph: {
      type:        'website',
      url:         pageUrl,
      title,
      description,
      siteName:    'Pobpet · ตามหาน้อง',
      locale:      'th_TH',
      images: [
        { 
          url: ogImageUrl, 
          width: 1200, 
          height: 630, 
          alt: `${statusLabel[pet.status] || ''}: ${pet.name}`, 
          type: 'image/png' 
        },
        ...(imageUrl ? [{ url: imageUrl, width: 800, height: 800, alt: pet.name || 'สัตว์เลี้ยง' }] : []),
      ],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl] },
    alternates: { canonical: pageUrl },
    robots: { index: true, follow: true },
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

  if (!pet) notFound()

  const images       = pet.pet_images || []
  const primaryImage = images.find((i: any) => i.is_primary)?.storage_url || pet.image_url
  const reporter     = pet.profiles

  const createdAt     = new Date(pet.created_at)
  const formattedDate = createdAt.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
  const formattedTime = createdAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${pet.status === 'lost' ? 'ตามหา' : 'พบ'}: ${pet.name || 'สัตว์เลี้ยง'}`,
    description: pet.distinctive_features || pet.ai_description || '',
    image: resolveImageUrl(primaryImage),
    datePublished: pet.created_at,
    dateModified:  pet.updated_at || pet.created_at,
    url: `${BASE_URL}/pet/${params.id}`,
    publisher: { '@type': 'Organization', name: 'Pobpet', url: BASE_URL },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-3xl mx-auto mb-12 px-4">
        <div className="bg-white border-2 border-black rounded-lg shadow-paper overflow-hidden">

          <PetGallery primaryImage={primaryImage} images={images} petName={pet.name} />

          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{pet.name || 'ไม่ทราบชื่อ'}</h1>
                <p className="text-xl font-bold text-gray-700">
                  {pet.breed || 'ไม่ระบุสายพันธุ์'} • {pet.sub_district ? `ต.${pet.sub_district} ` : ''}{pet.district ? `อ.${pet.district} ` : ''}จ.{pet.province}
                </p>
                <p className="text-sm font-bold text-gray-500 mt-2 bg-gray-100 border border-gray-300 inline-block px-3 py-1 rounded-full">
                  🕒 แจ้งเมื่อ: {formattedDate} เวลา {formattedTime} น.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="bg-wagashi-matcha border-2 border-black px-4 py-2 rounded-lg font-bold shadow-paper-sm text-lg text-center min-w-[140px]">
                  {pet.status === 'lost' ? '🚨 ตามหาเจ้าของ' : pet.status === 'found' ? '👀 พบน้องหลงทาง' : '💖 หาบ้านใหม่'}
                </span>
                <ShareButton petName={pet.name || 'น้องสัตว์เลี้ยง'} status={pet.status === 'lost' ? 'ตามหาเจ้าของ' : 'พบน้องหลงทาง'} petId={params.id} />
                {pet.reward_amount > 0 && (
                  <span className="bg-red-500 text-white border-2 border-black px-3 py-1 rounded font-bold shadow-paper-sm">
                    💰 รางวัล {pet.reward_amount.toLocaleString()} บาท
                  </span>
                )}
              </div>
            </div>

            <hr className="border-black border-1 mb-6" />

            {pet.latitude && pet.longitude && (
              <div className="bg-white border-2 border-black p-5 rounded-lg mb-8 shadow-paper-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-wagashi-sora p-3 rounded-full border-2 border-black text-2xl shadow-paper-sm">📍</div>
                  <div>
                    <h3 className="font-bold text-lg">พิกัดที่พบสัตว์เลี้ยง</h3>
                    <p className="text-sm font-medium text-gray-600 font-mono mt-1">
                      Lat: {pet.latitude.toFixed(5)}, Lng: {pet.longitude.toFixed(5)}
                    </p>
                  </div>
                </div>
                <a href={`https://www.google.com/maps/search/?api=1&query=${pet.latitude},${pet.longitude}`} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto">
                  <Button className="w-full bg-wagashi-kinako text-black hover:bg-yellow-400 border-2 border-black px-6 py-5 text-md font-bold shadow-paper-sm hover:-translate-y-1 transition-transform">
                    🗺️ เปิดดูใน Google Maps
                  </Button>
                </a>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="border-2 border-black p-5 rounded-lg bg-wagashi-kinako shadow-paper-sm md:col-span-2">
                <h3 className="font-bold text-lg mb-2">✨ ตำหนิหรือลักษณะพิเศษ</h3>
                <p className="text-black font-medium leading-relaxed">
                  {pet.distinctive_features || 'ผู้แจ้งไม่ได้ระบุลักษณะพิเศษไว้'}
                </p>
              </div>
              <div className="border-2 border-black p-5 rounded-lg bg-wagashi-sakura shadow-paper-sm">
                <div className="text-sm font-bold text-gray-600 mb-1 uppercase">สีของสัตว์เลี้ยง</div>
                <div className="text-xl font-bold">{pet.color || 'ไม่ระบุ'}</div>
              </div>
              <div className="border-2 border-black p-5 rounded-lg bg-wagashi-sora shadow-paper-sm">
                <div className="text-sm font-bold text-gray-600 mb-1 uppercase">ประเภทสัตว์</div>
                <div className="text-xl font-bold capitalize">
                  {pet.species === 'dog' ? 'สุนัข' : pet.species === 'cat' ? 'แมว' : pet.species || 'ไม่ระบุ'}
                </div>
              </div>
            </div>

            <div className="bg-washi border-2 border-black p-6 rounded-lg mb-8 shadow-paper-sm">
              <h3 className="font-bold text-lg mb-3">🤖 บทวิเคราะห์จาก Gemini AI</h3>
              <p className="text-gray-800 leading-relaxed italic">
                &quot;{pet.ai_description}&quot;
              </p>
            </div>

            {reporter && (
              <div className="border-2 border-black rounded-xl p-6 bg-gray-50 mt-10">
                <div className="flex items-center gap-4 mb-5 border-b-2 border-black pb-4">
                  {reporter.avatar_url ? (
                    <img src={reporter.avatar_url} alt={reporter.display_name || 'Profile'} className="w-14 h-14 rounded-full border-2 border-black object-cover" />
                  ) : (
                    <UserCircle2 size={56} className="text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">ข้อมูลผู้แจ้ง</p>
                    <p className="text-xl font-black">
                      {reporter.display_name || `${reporter.first_name} ${reporter.last_name}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {reporter.phone_number && (
                    <a href={`tel:${reporter.phone_number}`} className="flex-1 flex items-center justify-center gap-2 bg-wagashi-kinako border-2 border-black px-4 py-4 rounded-xl font-black shadow-paper-sm hover:shadow-paper transition-all text-black">
                      <Phone size={20} /><span>โทรติดต่อ</span>
                    </a>
                  )}
                  {reporter.line_id && (
                    <a href={`https://line.me/ti/p/~${reporter.line_id}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-[#00B900] text-white border-2 border-black px-4 py-4 rounded-xl font-black shadow-paper-sm hover:shadow-paper transition-all">
                      <MessageCircle size={20} /><span>แอดไลน์</span>
                    </a>
                  )}
                  {reporter.contact_link && (
                    <a href={reporter.contact_link.startsWith('http') ? reporter.contact_link : `https://${reporter.contact_link}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-black text-white border-2 border-black px-4 py-4 rounded-xl font-black shadow-paper-sm hover:shadow-paper transition-all">
                      <ExternalLink size={20} /><span>ช่องทางอื่น</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            <CommentSection petId={params.id} />

          </div>
        </div>
      </div>
    </>
  )
}