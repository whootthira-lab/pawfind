import { NextRequest, NextResponse } from 'next/server'
import { analyzePetImages, validatePetImage } from '@/lib/ai/gemini'
import { hybridSearch } from '@/lib/search/hybridSearch'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, province, marking, type, lat, lng }
      = await req.json()

    const valid = await validatePetImage(imageBase64)
    if (!valid) return NextResponse.json(
      { error: 'ไม่พบสัตว์ในรูป' }, { status: 422 })

    const analysis = await analyzePetImages([imageBase64])
    const { results, radiusUsed, expanded } = await hybridSearch({
      queryText: analysis.full_description,
      lat: lat ?? 14.8799, // default โคราช
      lng: lng ?? 102.0167,
      type: type ?? analysis.species,
      marking,
    })
    return NextResponse.json({
      data: { results, radiusUsed, expanded,
              totalFound: results.length, analysis }
    })
  } catch (e) {
    return NextResponse.json({ error: 'ค้นหาไม่สำเร็จ' },
      { status: 500 })
  }
}
