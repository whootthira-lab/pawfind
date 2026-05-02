import { NextRequest, NextResponse } from 'next/server'
import { analyzePetImages, validatePetImage } from '@/lib/ai/gemini'

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json()  // string[] base64
    if (!images?.length) return NextResponse.json(
      { error: 'ต้องการรูปภาพอย่างน้อย 1 รูป' }, { status: 400 })

    // Validate รูปแรก
    const isValid = await validatePetImage(images[0])
    if (!isValid) return NextResponse.json(
      { error: 'ไม่พบสัตว์ในรูป กรุณาถ่ายรูปใหม่' }, { status: 422 })

    const analysis = await analyzePetImages(images)
    return NextResponse.json({ data: analysis })
  } catch (e) {
    return NextResponse.json({ error: 'วิเคราะห์รูปไม่สำเร็จ' },
      { status: 500 })
  }
}
