import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzePetImages } from '@/lib/ai/gemini'
import { createEmbedding, weightedAverageEmbedding } from '@/lib/ai/embed'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  
  // 1. ตรวจสอบสิทธิ์ผู้ใช้: บังคับล็อกอินเพื่อผูก user_id กับประกาศ[cite: 11]
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
    
    // 2. แยกข้อมูลจาก Body รวมถึง ตำบล/แขวง (sub_district)[cite: 3, 11]
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

    // --- ส่วนประมวลผล AI (ปรับปรุงให้ยืดหยุ่นต่อ Error 503) ---
    let analysis = { 
      full_description: "ข้อมูลอยู่ระหว่างการประมวลผลโดย AI", 
      breed: "ไม่ระบุ", 
      main_color: "ไม่ระบุ" 
    };
    let finalEmbedding = new Array(1536).fill(0); // ค่าเริ่มต้นสำหรับ Vector Search[cite: 11]

    try {
      // พยายามวิเคราะห์รูปภาพด้วย Gemini[cite: 11]
      analysis = await analyzePetImages(images)
      
      const embeddingInputs = await Promise.all(
        images.map(async (_: string, i: number) => ({
          vector: await createEmbedding(analysis.full_description || ""),
          weight: markingImageIndexes.includes(i) ? 3.0 : 1.0
        }))
      )
      finalEmbedding = weightedAverageEmbedding(embeddingInputs)
    } catch (aiErr) {
      // หาก AI ล่ม (503) จะบันทึกข้อมูลที่ User กรอกมาลงไปก่อน เพื่อไม่ให้หน้า Profile ว่างเปล่า
      console.warn('⚠️ AI Analysis skipped due to high demand (503). Saving basic data instead.')
    }
    // -----------------------------------------------------

    // 4. บันทึกข้อมูลสัตว์เลี้ยงลงตาราง pets[cite: 11]
    const adminSupabase = createAdminClient()
    const { data: pet, error: petError } = await adminSupabase
      .from('pets')
      .insert({
        ...petData,
        species: type, 
        user_id: ownerId, // ผูกกับ ID ของผู้ใช้งานเพื่อให้แสดงในหน้า Profile[cite: 11]
        sub_district: sub_district || null, // บันทึกข้อมูลตำบล/แขวง[cite: 11]
        distinctive_features: distinctive_features || "",
        latitude: latitude || null,
        longitude: longitude || null,
        ai_description: analysis.full_description || "",
        breed: analysis.breed || "ไม่ระบุ",
        color: userColor || analysis.main_color || "ไม่ระบุ",
        embedding: `[${finalEmbedding.join(',')}]`,
        image_url: images[0],
        is_resolved: false // ตั้งค่าเริ่มต้นให้ประกาศยังดำเนินการอยู่[cite: 8, 10]
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