import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzePetImages } from '@/lib/ai/gemini'
import { createEmbedding, weightedAverageEmbedding } from '@/lib/ai/embed'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  
  // 1. ตรวจสอบสิทธิ์ผู้ใช้[cite: 5]
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

    const adminSupabase = createAdminClient()

    // 💡 2. อัปโหลดรูปภาพขึ้น Supabase Storage (Bucket: 'pets')[cite: 5]
    const uploadedUrls = await Promise.all(
      images.map(async (base64Str: string) => {
        const buffer = Buffer.from(base64Str, 'base64');
        const fileName = `${ownerId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

        const { error: uploadError } = await adminSupabase
          .storage
          .from('pets')
          .upload(fileName, buffer, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = adminSupabase
          .storage
          .from('pets')
          .getPublicUrl(fileName);

        return publicUrl;
      })
    );

    // --- 3. ส่วนประมวลผล AI ---[cite: 5]
    let analysis = { 
      full_description: "ข้อมูลอยู่ระหว่างการประมวลผลโดย AI", 
      breed: "ไม่ระบุ", 
      main_color: "ไม่ระบุ" 
    };
    let finalEmbedding = new Array(768).fill(0); 

    try {
      const aiResult = await analyzePetImages(uploadedUrls) 
      
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
      console.warn('⚠️ AI Analysis skipped.')
    }

    // 4. บันทึกข้อมูลลงตาราง pets[cite: 5]
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
        image_url: uploadedUrls[0], 
        is_resolved: false 
      })
      .select()
      .single()

    if (petError) throw petError

    // 5. บันทึกรูปภาพลงตาราง pet_images[cite: 5]
    const { error: imgError } = await adminSupabase
      .from('pet_images')
      .insert(
        uploadedUrls.map((url: string, i: number) => ({
          pet_id: pet.id,
          storage_url: url,
          weight: markingImageIndexes.includes(i) ? 3.0 : 1.0,
          is_primary: i === 0
        }))
      )

    if (imgError) throw imgError

    // 💡 6. สั่งสร้างรูป OG (The Trigger)
    // แก้ไข: เพิ่ม await ตรงนี้เพื่อให้ Vercel รอประมวลผลให้เสร็จก่อนตัดการทำงาน[cite: 5]
    if (pet?.id) {
      const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawfind-eta.vercel.app';
      await fetch(`${BASE_URL}/api/generate-og`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId: pet.id }),
      }).catch(err => console.error("⚠️ [OG Trigger Error]:", err));
    }

    return NextResponse.json({ data: pet }, { status: 201 })

  } catch (err: any) {
    console.error('❌ API Error:', err)
    return NextResponse.json(
      { error: err.message || 'เกิดข้อผิดพลาดในการประมวลผล' },
      { status: 500 }
    )
  }
}