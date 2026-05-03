import { NextRequest, NextResponse } from 'next/server'
import { analyzePetImages, validatePetImage } from '@/lib/ai/gemini'
import { hybridSearch } from '@/lib/search/hybridSearch'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, province, marking, type, lat, lng } = await req.json()

    // 1. ตรวจสอบว่ามีสัตว์ในรูปหรือไม่
    const valid = await validatePetImage(imageBase64)
    if (!valid) {
      return NextResponse.json({ error: 'ไม่พบสัตว์ในรูป' }, { status: 422 })
    }

    // 2. ให้ AI วิเคราะห์รูปภาพ
    const analysis = await analyzePetImages([imageBase64])
    
    // 3. ค้นหาข้อมูล (Hybrid Search)
    const { results, radiusUsed, expanded } = await hybridSearch({
      // 💡 แก้ไข: ป้องกันค่า undefined โดยการใส่ || ""
      queryText: analysis.full_description || "", 
      
      // ตั้งค่าพิกัดเริ่มต้นเป็นโคราช (ตั้งไว้แม่นยำมากครับ!)
      lat: lat ?? 14.8799, 
      lng: lng ?? 102.0167,
      
      // 💡 แก้ไข: เอา analysis.species ออก เพราะไม่มีใน type ป้องกันการ Error
      type: type || "ไม่ระบุ", 
      
      marking,
    })

    // 4. ส่งข้อมูลกลับไปแสดงผล
    return NextResponse.json({
      data: { 
        results, 
        radiusUsed, 
        expanded,
        totalFound: results?.length || 0, 
        analysis 
      }
    })

  } catch (e: any) {
    console.error('Search API Error:', e)
    return NextResponse.json(
      { error: e.message || 'ค้นหาไม่สำเร็จ' },
      { status: 500 }
    )
  }
}