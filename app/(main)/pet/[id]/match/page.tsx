// app/(main)/pet/[id]/match/page.tsx
import { createClient } from '@/lib/supabase/server'
import { MatchResultCard } from '@/components/pet/MatchResult'
import Link from 'next/link'
import { PawPrint, Sparkles, MapPin, Heart, ShieldAlert, ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

interface MatchPageProps {
  params: {
    id: string
  }
}

// ── Geolocation distance formula (Haversine) ──
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ── Embedding Cosine Similarity ──
function parseEmbedding(embStr: any): number[] | null {
  if (!embStr) return null
  if (Array.isArray(embStr)) return embStr
  try {
    if (typeof embStr === 'string' && embStr.startsWith('[')) {
      return JSON.parse(embStr)
    }
    return String(embStr).replace(/[\[\]]/g, '').split(',').map(Number)
  } catch (e) {
    return null
  }
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0.0
  let normA = 0.0
  let normB = 0.0
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export default async function MatchPage({ params }: MatchPageProps) {
  const supabase = createClient()
  const { id } = params

  // 1. ดึงข้อมูลตัวสัตว์เลี้ยงหลักประจำโปรไฟล์
  const { data: pet, error: petErr } = await supabase
    .from('pets')
    .select('*, pet_images(storage_url, is_primary)')
    .eq('id', id)
    .single()

  if (petErr || !pet) {
    return notFound()
  }

  const petStatus = pet.status || 'showcase'
  const isMatingMode = petStatus === 'mating'
  const isLostMode = petStatus === 'lost'
  const isFoundMode = petStatus === 'found'
  const isAdoptionMode = petStatus === 'adoption'

  // ดึงภาพหลักเพื่อใช้แสดงแบรนดิ้งการ์ด
  const petPrimaryImage = pet.pet_images?.find((i: any) => i.is_primary)?.storage_url 
    || pet.pet_images?.[0]?.storage_url 
    || pet.image_url 
    || ''

  let finalMatches: any[] = []
  let modeTitle = ''
  let modeDesc = ''
  let bgClass = 'bg-wagashi-sora border-blue-400 text-blue-800'

  // 2. คำนวณตรรกะแมตช์ตามโหมดการใช้งาน
  if (isLostMode) {
    modeTitle = 'ตามหาเบาะแสน้องหาย 🚨'
    modeDesc = 'ระบบ AI ดำเนินการวิเคราะห์ภาพถ่ายและจุดสังเกตเพื่อเปรียบเทียบกับประกาศ "พบสัตว์หลง" และ "หาบ้านให้น้อง"'
    bgClass = 'bg-wagashi-sakura border-ori-orange-d text-ori-orange-d'

    // ค้นหา Found และ Adoption ที่ยังไม่เคลียร์คิว
    const { data: candidates } = await supabase
      .from('pets')
      .select('*, pet_images(storage_url, is_primary)')
      .in('status', ['found', 'adoption'])
      .eq('is_resolved', false)
      .eq('visibility', 'public')

    const petVector = parseEmbedding(pet.embedding)

    finalMatches = (candidates || [])
      .map((c: any) => {
        const cVector = parseEmbedding(c.embedding)
        const similarity = (petVector && cVector) ? cosineSimilarity(petVector, cVector) : 0
        return {
          ...c,
          similarity,
          match_percentage: Math.round(similarity * 100)
        }
      })
      // เรียงลำดับตามเปอร์เซ็นต์ความเป็นไปได้สูงสุดก่อน
      .sort((a, b) => b.similarity - a.similarity)

  } else if (isFoundMode) {
    modeTitle = 'ตามหาเจ้าของของสัตว์หลง 👀'
    modeDesc = 'ระบบ AI ดำเนินการวิเคราะห์ภาพถ่ายและจุดสังเกตเพื่อเปรียบเทียบกับประกาศ "🔔ประกาศหาสัตว์เลี้ยง" ที่ผู้ใช้ลงทะเบียนไว้'
    bgClass = 'bg-wagashi-matcha border-ori-green-d text-ori-green-d'

    // ค้นหา Lost ที่ยังไม่เคลียร์คิว
    const { data: candidates } = await supabase
      .from('pets')
      .select('*, pet_images(storage_url, is_primary)')
      .in('status', ['lost'])
      .eq('is_resolved', false)
      .eq('visibility', 'public')

    const petVector = parseEmbedding(pet.embedding)

    finalMatches = (candidates || [])
      .map((c: any) => {
        const cVector = parseEmbedding(c.embedding)
        const similarity = (petVector && cVector) ? cosineSimilarity(petVector, cVector) : 0
        return {
          ...c,
          similarity,
          match_percentage: Math.round(similarity * 100)
        }
      })
      // เรียงลำดับตามเปอร์เซ็นต์ความเป็นไปได้สูงสุดก่อน
      .sort((a, b) => b.similarity - a.similarity)

  } else if (isAdoptionMode) {
    modeTitle = 'หาบ้านอบอุ่นให้น้องใหม่ 💖'
    modeDesc = 'ระบบ AI ค้นหาประกาศ "พบสัตว์หลง" และ "ประกาศสัตว์หาย" ที่มีลักษณะสอดคล้องใกล้เคียง'
    bgClass = 'bg-wagashi-matcha border-ori-green-d text-ori-green-d'

    // ค้นหา Found และ Lost
    const { data: candidates } = await supabase
      .from('pets')
      .select('*, pet_images(storage_url, is_primary)')
      .in('status', ['found', 'lost'])
      .eq('is_resolved', false)
      .eq('visibility', 'public')

    const petVector = parseEmbedding(pet.embedding)

    finalMatches = (candidates || [])
      .map((c: any) => {
        const cVector = parseEmbedding(c.embedding)
        const similarity = (petVector && cVector) ? cosineSimilarity(petVector, cVector) : 0
        return {
          ...c,
          similarity,
          match_percentage: Math.round(similarity * 100)
        }
      })
      // เรียงลำดับตามเปอร์เซ็นต์ความเป็นไปได้สูงสุดก่อน
      .sort((a, b) => b.similarity - a.similarity)

  } else if (isMatingMode) {
    modeTitle = 'หาคู่สายพันธุ์ผสมพันธุ์ให้เจ้านาย ❤️'
    modeDesc = 'ระบบค้นหาประกาศ "หาคู่ให้น้อง" ที่มีประเภทสัตว์และสายพันธุ์เดียวกัน แต่มีเพศตรงข้ามกัน'
    bgClass = 'bg-[#FFF0F5] border-pink-400 text-pink-700'

    // ค้นหา Mating เท่านั้น
    const { data: candidates } = await supabase
      .from('pets')
      .select('*, pet_images(storage_url, is_primary)')
      .in('status', ['mating'])
      .eq('is_resolved', false)
      .eq('visibility', 'public')

    // กรองประเภทสัตว์ (species) และสายพันธุ์ (breed) เดียวกัน
    const petSpecies = String(pet.species || '').trim().toLowerCase()
    const petBreed = String(pet.breed || '').trim().toLowerCase()

    let filtered = (candidates || []).filter((c: any) => {
      const cSpecies = String(c.species || '').trim().toLowerCase()
      const cBreed = String(c.breed || '').trim().toLowerCase()
      
      const speciesMatch = cSpecies === petSpecies
      // หากสัตว์หลักมีระบุสายพันธุ์ ให้เช็คสายพันธุ์ตรงกัน หากไม่มีระบุให้ปล่อยผ่าน
      const breedMatch = !petBreed || cBreed === petBreed
      return speciesMatch && breedMatch
    })

    // กรองเพศตรงข้ามกัน
    if (pet.gender === 'male') {
      filtered = filtered.filter((c: any) => c.gender === 'female')
    } else if (pet.gender === 'female') {
      filtered = filtered.filter((c: any) => c.gender === 'male')
    }

    // คำนวณระยะทางและเรียงตามระยะทางใกล้ที่สุดก่อน
    const hasBaseCoords = pet.latitude !== null && pet.longitude !== null

    finalMatches = filtered
      .map((c: any) => {
        let dist = 99999
        if (hasBaseCoords && c.latitude !== null && c.longitude !== null) {
          dist = getDistance(pet.latitude, pet.longitude, c.latitude, c.longitude)
        }
        return {
          ...c,
          distance_km: dist
        }
      })
      // เรียงจากระยะทางใกล้ที่สุดไปหาไกลที่สุด
      .sort((a, b) => a.distance_km - b.distance_km)
  }

  // ปลอมค่า Fallback สำหรับรูปภาพ MatchResultCard ป้องกันรูปภาพแตก
  const formattedMatches = finalMatches.map((m: any) => {
    const addressParts = []
    if (m.tambon) addressParts.push(`ต.${m.tambon}`)
    if (m.district) addressParts.push(`อ.${m.district}`)
    if (m.province) addressParts.push(`จ.${m.province}`)
    const fullAddress = addressParts.length > 0 ? addressParts.join(' ') : m.province || 'ไม่ระบุที่อยู่'

    const safeUrl = m.pet_images?.find((img: any) => img.is_primary)?.storage_url 
      || m.pet_images?.[0]?.storage_url 
      || m.image_url 
      || ''

    return {
      ...m,
      image_url: safeUrl,
      province: m.distance_km !== undefined && m.distance_km < 9999
        ? `${fullAddress} (📍 ห่างออกไป ${m.distance_km.toFixed(1)} กม.)`
        : fullAddress
    }
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 mb-20 text-black">
      
      {/* ส่วนหัว Neubrutalism */}
      <div className={`border-4 border-black rounded-3xl p-6 md:p-8 shadow-paper mb-8 ${bgClass}`}>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          {petPrimaryImage && (
            <div className="w-24 h-24 rounded-2xl border-4 border-black overflow-hidden bg-white shrink-0 shadow-paper-sm">
              <img src={petPrimaryImage} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="text-center md:text-left flex-grow">
            <h1 className="text-3xl font-black flex items-center justify-center md:justify-start gap-2 mb-2">
              <Sparkles className="animate-pulse" /> ผลลัพธ์การจับคู่ AI อัจฉริยะ 🤖
            </h1>
            <h2 className="text-xl font-bold mb-1">{modeTitle} น้อง {pet.name}</h2>
            <p className="text-sm font-bold opacity-80 leading-relaxed">{modeDesc}</p>
          </div>
          
          <Link href={`/pet/${id}`} className="px-5 py-3 bg-black hover:bg-gray-800 text-white font-black text-sm rounded-xl border-2 border-black shadow-paper-sm hover:translate-y-[-2px] transition-transform flex items-center gap-1.5 self-center">
            <ArrowLeft size={16} /> กลับสู่หน้าโปรไฟล์
          </Link>
        </div>
      </div>

      {/* บอร์ดแสดงผลลัพธ์ */}
      <div className="text-left mb-6">
        <h3 className="text-2xl font-black flex items-center gap-2">
          <PawPrint size={24} /> รายการน้องสี่ขาที่แมตช์สำเร็จ ({formattedMatches.length} เคส)
        </h3>
        <p className="text-xs font-bold text-gray-500 mt-1">
          {isMatingMode 
            ? '💡 แสดงประกาศประเภทและสายพันธุ์เดียวกัน แต่เพศตรงข้าม โดยเรียงลำดับจากพิกัดใกล้ตัวคุณที่สุดก่อน' 
            : '💡 แสดงคะแนนความคล้ายคลึงวิเคราะห์เชิงลึกด้วย AI (Similarity Vector) โดยเรียงจากระดับเปอร์เซ็นต์สูงที่สุดก่อน'}
        </p>
      </div>

      {formattedMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {formattedMatches.map((match: any) => (
            <MatchResultCard key={match.id} result={match} />
          ))}
        </div>
      ) : (
        <div className="bg-white border-4 border-black border-dashed rounded-3xl p-16 text-center shadow-paper-sm">
          <ShieldAlert className="mx-auto w-16 h-16 text-gray-400 mb-4 animate-bounce" />
          <h4 className="font-black text-xl text-gray-600 mb-2">ยังไม่พบคู่แมตช์ที่ตรงตามเงื่อนไขในขณะนี้ 🐾</h4>
          <p className="text-sm font-bold text-gray-400 max-w-md mx-auto">
            ไม่ต้องเป็นกังวลไปนะคะ ระบบคลังข้อมูลและ AI พ่อบ้านประจำ PobPet จะดำเนินสืบค้นและส่งข้อความแจ้งเตือนหาคุณทันทีหากมีประกาศแจ้งเหตุรอบข้างที่ตรงกันค่ะ
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/search" className="px-6 py-3 bg-ori-orange text-white font-black text-sm rounded-xl border-2 border-black shadow-paper-sm hover:bg-ori-orange-d transition-colors">
              🔍 ไปหน้าค้นหาหลัก
            </Link>
            <Link href={`/pet/${id}`} className="px-6 py-3 bg-white text-black font-black text-sm rounded-xl border-2 border-black shadow-paper-sm hover:bg-gray-50 transition-colors">
              กลับจัดการโปรไฟล์
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
