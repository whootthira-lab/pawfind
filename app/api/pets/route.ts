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
    // 💡 รับ distinctive_features เพิ่มเติมจาก body
    const { 
      images, 
      markingImageIndexes = [], 
      type, 
      distinctive_features, 
      ...petData 
    } = body

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป' }, { status: 400 })
    }

    // 1. Analyze images ด้วย Gemini AI
    const analysis = await analyzePetImages(images)

    // 2. Create weighted embeddings สำหรับการทำ Vector Search
    const embeddingInputs = await Promise.all(
      images.map(async (_: string, i: number) => ({
        vector: await createEmbedding(analysis.full_description || ""),
        weight: markingImageIndexes.includes(i) ? 3.0 : 1.0
      }))
    )
    const finalEmbedding = weightedAverageEmbedding(embeddingInputs)

    // 3. Save pet data (ใช้ admin client เพื่อบายพาส RLS กรณี anonymous)
    const adminSupabase = createAdminClient()
    const { data: pet, error: petError } = await adminSupabase
      .from('pets')
      .insert({
        ...petData,
        species: type,
        user_id: ownerId,
        distinctive_features: distinctive_features || "", // 💡 บันทึกตำหนิพิเศษที่ผู้ใช้กรอก
        ai_description: analysis.full_description || "",
        breed: analysis.breed || "ไม่ระบุ",
        color: analysis.main_color || "ไม่ระบุ",
        embedding: `[${finalEmbedding.join(',')}]`,
        image_url: images[0] // ใช้รูปแรกเป็นรูปหลักในตาราง pets
      })
      .select()
      .single()

    if (petError) throw petError

    // 4. Save ข้อมูลลงตาราง pet_images เพื่อเก็บรูปภาพทั้งหมดที่แนบมา
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