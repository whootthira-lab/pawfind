import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzePetImages } from '@/lib/ai/gemini'
import { createEmbedding, weightedAverageEmbedding } from '@/lib/ai/embed'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  
  // 1. ตรวจสอบสิทธิ์ผู้ใช้
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
    const { 
      images, // ตอนนี้เป็น Array ของ Base64 string[cite: 8]
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

    const adminSupabase = createAdminClient()

    // 💡 2. อัปโหลดรูปภาพขึ้น Supabase Storage (Bucket: 'pets')
    const uploadedUrls = await Promise.all(
      images.map(async (base64Str: string) => {
        // แปลง Base64 กลับเป็น Buffer เพื่อเตรียมอัปโหลด
        const buffer = Buffer.from(base64Str, 'base64');
        
        // ตั้งชื่อไฟล์ให้ไม่ซ้ำกัน: [user_id]/[timestamp]-[random].jpg
        const fileName = `${ownerId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

        // อัปโหลดเข้า Storage
        const { error: uploadError } = await adminSupabase
          .storage
          .from('pets') // ต้องตรงกับชื่อ Bucket ที่สร้างไว้
          .upload(fileName, buffer, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // ดึง Public URL ของรูปภาพกลับมา
        const { data: { publicUrl } } = adminSupabase
          .storage
          .from('pets')
          .getPublicUrl(fileName);

        return publicUrl; // คืนค่าเป็น URL สั้นๆ เช่น https://.../pets/...jpg
      })
    );

    // --- 3. ส่วนประมวลผล AI (ส่ง URL ให้ AI วิเคราะห์แทน Base64) ---
    let analysis = { 
      full_description: "ข้อมูลอยู่ระหว่างการประมวลผลโดย AI", 
      breed: "ไม่ระบุ", 
      main_color: "ไม่ระบุ" 
    };
    let finalEmbedding = new Array(768).fill(0); 

    try {
      const aiResult = await analyzePetImages(uploadedUrls) // 💡 ใช้ URLs แทน 
      
      if (aiResult) {
        analysis = {
          full_description: aiResult.full_description || analysis.full_description,
          breed: aiResult.breed || analysis.breed,
          main_color: aiResult.main_color || analysis.main_color
        }
      }
      
      const embeddingInputs = await Promise.all(
        uploadedUrls.map(async (_: string, i: number) => ({
          vector: await createEmbedding(analysis.full_description),
          weight: markingImageIndexes.includes(i) ? 3.0 : 1.0
        }))
      )
      finalEmbedding = weightedAverageEmbedding(embeddingInputs)
    } catch (aiErr) {
      console.warn('⚠️ AI Analysis skipped. Saving basic data instead.')
    }
    // -----------------------------------------------------

    // 4. บันทึกข้อมูลลงตาราง pets
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
        image_url: uploadedUrls[0], // 💡 ใช้ URL แรกเป็นภาพหน้าปก
        is_resolved: false 
      })
      .select()
      .single()

    if (petError) throw petError

    // 5. บันทึกรูปภาพลงตาราง pet_images
    const { error: imgError } = await adminSupabase
      .from('pet_images')
      .insert(
        uploadedUrls.map((url: string, i: number) => ({
          pet_id: pet.id,
          storage_url: url, // 💡 บันทึก URL สั้นๆ ลงตารางแทนตัวอักษรยาวเหยียด
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