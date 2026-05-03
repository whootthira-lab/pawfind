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
    const { images, markingImageIndexes = [], type, ...petData } = body

    // 1. Analyze images
    const analysis = await analyzePetImages(images)

    // 2. Create weighted embeddings
    // 💡 แก้ไข: เพิ่ม || "" เพื่อกัน Error กรณี AI ส่งค่ากลับมาเป็น undefined
    const embeddingInputs = await Promise.all(
      images.map(async (_: string, i: number) => ({
        vector: await createEmbedding(analysis.full_description || ""),
        weight: markingImageIndexes.includes(i) ? 3.0 : 1.0
      }))
    )
    const finalEmbedding = weightedAverageEmbedding(embeddingInputs)

    // 3. Save pet (use admin client to bypass RLS for anonymous submissions)
    const adminSupabase = createAdminClient()
    const { data: pet, error } = await adminSupabase
      .from('pets')
      .insert({
        ...petData,
        species: type,
        user_id: ownerId,
        ai_description: analysis.full_description || "",
        breed: analysis.breed || "ไม่ระบุ",
        color: analysis.main_color || "ไม่ระบุ", // 💡 แก้ไข: ใช้ main_color ให้ตรงกับ types/api.ts
        embedding: `[${finalEmbedding.join(',')}]`,
        image_url: images[0]
      })
      .select()
      .single()

    if (error) throw error

    // 4. Save images without embedding to avoid 1536 vs 768 dimension mismatch
    await adminSupabase.from('pet_images').insert(
      images.map((url: string, i: number) => ({
        pet_id: pet.id,
        storage_url: url,
        weight: markingImageIndexes.includes(i) ? 3.0 : 1.0,
        is_primary: i === 0
      }))
    )

    return NextResponse.json({ data: pet }, { status: 201 })

  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json(
      { error: err.message || 'เกิดข้อผิดพลาดในการประมวลผล' },
      { status: 500 }
    )
  }
}