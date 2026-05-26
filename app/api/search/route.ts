// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { analyzePetImages, validatePetImage } from '@/lib/ai/gemini'
import { hybridSearch } from '@/lib/search/hybridSearch'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, province, marking, type, lat, lng } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'กรุณาอัปโหลดรูปภาพเพื่อค้นหา' }, { status: 400 })
    }

    // 1. ตรวจสอบว่ามีสัตว์ในรูปหรือไม่
    const valid = await validatePetImage(imageBase64)
    if (!valid) {
      return NextResponse.json({ error: 'ไม่พบสัตว์ในรูปภาพ กรุณาลองใหม่อีกครั้ง' }, { status: 422 })
    }

    // 2. ให้ AI วิเคราะห์รูปภาพ
    const analysis = await analyzePetImages([imageBase64])

    // 3. ค้นหาข้อมูล (Hybrid Search + Species Boost)
    // ── 🟢 [แก้ไขสำเร็จ] ครอบประเภทโมเดลด้วย (analysis as any) เพื่อเปิดทางดึงฟิลด์ข้อมูลสับคิวน้ำหนักสัตว์หลัก ──
    const { results, radiusUsed, expanded } = await hybridSearch({
      queryText: analysis?.full_description || 'สัตว์เลี้ยง หมา แมว',
      lat:       lat ?? 14.8799,
      lng:       lng ?? 102.0167,
      type:      type || analysis?.breed || 'ไม่ระบุ',
      marking:   marking || false,
      // ส่งค่าชนิดสัตว์หลักจากผลวิเคราะห์เข้าไปจัดคิวค่าน้ำหนักอาเรย์เด้งประเภทเดียวกันขึ้นก่อนแถวแรกสุด
      species:   (analysis as any)?.species || '',
    })

    // 4. ส่งข้อมูลกลับ
    return NextResponse.json({
      data: {
        results:    results || [],
        radiusUsed,
        expanded,
        totalFound: results?.length || 0,
        analysis:   analysis || {
          full_description: 'ไม่สามารถวิเคราะห์รายละเอียดได้',
          breed:     'ไม่ระบุ',
          main_color: 'ไม่ระบุ',
          species:   'other',
        },
      }
    })

  } catch (e: any) {
    console.error('❌ Search API Error:', e)
    return NextResponse.json(
      { error: e.message || 'เกิดข้อผิดพลาดในการค้นหา' },
      { status: 500 }
    )
  }
}