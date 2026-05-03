import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzePetImages } from '@/lib/ai/gemini'
import { createEmbedding, weightedAverageEmbedding } from '@/lib/ai/embed'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Allow anonymous submissions for testing
  const ownerId = user?.id || null

  try {
    const body = await req.json()
    
    // 💡 ดึงข้อมูลพิกัด (latitude, longitude) และสี (color) ออกมาจาก body
    const { 
      images, 
      markingImageIndexes = [], 
      type, 
      distinctive_features,
      latitude,
      longitude,
      color: userColor,
      ...petData 
    } = body

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป' }, { status: 400 })
    }

    // 1. Analyze images ด้วย Gemini AI
    const analysis = await analyzePetImages(images)

    // 2. Create weighted embeddings สำหรับการทำ Vector Search (ใช้คำบรรยายจาก AI)
    const embeddingInputs = await Promise.all(
      images.map(async (_: string, i: number) => ({
        vector: await createEmbedding(analysis.full_description || ""),
        weight: markingImageIndexes.includes(i) ? 3.0 : 1.0
      }))
    )
    const finalEmbedding = weightedAverageEmbedding(embeddingInputs)

    // 3. Save pet data (ใช้ admin client เพื่อบายพาส RLS)
    const adminSupabase = createAdminClient()
    const { data: pet, error: petError } = await adminSupabase
      .from('pets')
      .insert({
        ...petData,
        species: type,
        user_id: ownerId,
        distinctive_features: distinctive_features || "",
        latitude: latitude || null,   // 💡 บันทึกพิกัดรุ้ง
        longitude: longitude || null, // 💡 บันทึกพิกัดแวง
        ai_description: analysis.full_description || "",
        breed: analysis.breed || "ไม่ระบุ",
        // 💡 ใช้สีที่ผู้ใช้กรอกมา (userColor) ถ้าไม่มีค่อยใช้ที่ AI วิเคราะห์ (main_color)
        color: userColor || analysis.main_color || "ไม่ระบุ",
        embedding: `[${finalEmbedding.join(',')}]`,
        image_url: images[0]
      })
      .select()
      .single()

    if (petError) throw petError

    // 4. Save ข้อมูลลงตาราง pet_images เพื่อเก็บรูปภาพทั้งหมด
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
    console.error('API Error:', err)
    return NextResponse.json(
      { error: err.message || 'เกิดข้อผิดพลาดในการประมวลผล' },
      { status: 500 }
    )
  }
}