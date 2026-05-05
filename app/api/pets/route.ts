import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzePetImages } from '@/lib/ai/gemini'
import { createEmbedding, weightedAverageEmbedding } from '@/lib/ai/embed'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  
  // 1. ตรวจสอบสิทธิ์ผู้ใช้: บังคับล็อกอินเพื่อผูก user_id กับประกาศ
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Session หมดอายุหรือยังไม่ได้เข้าสู่ระบบ กรุณาล็อกอินใหม่อีกครั้ง' }, 
      { status: 401 }
    )
  }

  const ownerId = user.id

  try {
    const body = await req.json()
    
    // 2. แยกข้อมูลจาก Body[cite: 3, 11]
    const { 
      images, 
      markingImageIndexes = [], 
      type, 
      distinctive_features,
      latitude,
      longitude,
      color: userColor,
      sub_district,
      ...petData 
    } = body

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป' }, { status: 400 })
    }

    // --- ส่วนประมวลผล AI (Resilient Logic) ---
    let analysis = { 
      full_description: "ข้อมูลอยู่ระหว่างการประมวลผลโดย AI", 
      breed: "ไม่ระบุ", 
      main_color: "ไม่ระบุ" 
    };
    let finalEmbedding = new Array(1536).fill(0); 

    try {
      // 💡 แก้ไข Type Error: รับค่าใส่ตัวแปรชั่วคราวก่อนตรวจสอบ undefined
      const aiResult = await analyzePetImages(images)
      
      // มั่นใจว่าเป็น string แน่นอนด้วยการใช้ || fallback[cite: 11]
      analysis = {
        full_description: aiResult.full_description || analysis.full_description,
        breed: aiResult.breed || analysis.breed,
        main_color: aiResult.main_color || analysis.main_color
      }
      
      const embeddingInputs = await Promise.all(
        images.map(async (_: string, i: number) => ({
          vector: await createEmbedding(analysis.full_description),
          weight: markingImageIndexes.includes(i) ? 3.0 : 1.0
        }))
      )
      finalEmbedding = weightedAverageEmbedding(embeddingInputs)
    } catch (aiErr) {
      // หาก Gemini ล่ม (503) ระบบจะข้ามไปบันทึกข้อมูลพื้นฐานทันที[cite: 1, 11]
      console.warn('⚠️ AI Analysis skipped (503). Saving basic data instead.')
    }
    // -----------------------------------------------------

    // 4. บันทึกข้อมูลสัตว์เลี้ยงลงตาราง pets[cite: 11]
    const adminSupabase = createAdminClient()
    const { data: pet, error: petError } = await adminSupabase
      .from('pets')
      .insert({
        ...petData,
        species: type, 
        user_id: ownerId, 
        sub_district: sub_district || null, 
        distinctive_features: distinctive_features || "",
        latitude: latitude || null,
        longitude: longitude || null,
        ai_description: analysis.full_description,
        breed: analysis.breed,
        color: userColor || analysis.main_color,
        embedding: `[${finalEmbedding.join(',')}]`,
        image_url: images[0],
        is_resolved: false 
      })
      .select()
      .single()

    if (petError) throw petError

    // 5. บันทึกรูปภาพลงตาราง pet_images[cite: 11]
    const { error: imgError } = await adminSupabase
      .from('pet_images')
      .insert(
        images.map((url: string, i: number) => ({
          pet_id: pet.id,
          storage_url: url,
          weight: markingImageIndexes.includes(i) ? 3.0 : 1.0,
          is_primary: i === 0
        }))
      )

    if (imgError) throw imgError

    return NextResponse.json({ data: pet }, { status: 201 })

  } catch (err: any) {
    console.error('❌ API Error:', err)
    return NextResponse.json(
      { error: err.message || 'เกิดข้อผิดพลาดในการประมวลผล' },
      { status: 500 }
    )
  }
}