// app/api/pets/caption/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse }            from 'next/server'
import { createClient }            from '@/lib/supabase/server'
import { GoogleGenerativeAI }      from '@google/generative-ai'

export async function POST(req: Request) {
  try {
    const { data: { session } } = await createClient().auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

    const { imageBase64, petName = '', species = '' } = await req.json()
    if (!imageBase64) return NextResponse.json({ error: 'No image' }, { status: 400 })

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ]

    let caption = ''
    let lastError = null

    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 [AI Caption] Trying model: ${modelName}...`)
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: modelName })

        const prompt = `
วิเคราะห์รูปสัตว์เลี้ยงนี้แล้วสร้างคำบรรยายภาษาไทยสั้นๆ 1-2 ประโยค
สำหรับใช้ระบุตัวตนสัตว์ เพื่อช่วย AI จับคู่เมื่อสัตว์หาย

สัตว์ชื่อ: ${petName || 'ไม่ระบุ'}
ประเภท: ${species || 'ไม่ระบุ'}

ให้ระบุ: สี ลาย ขนาด ลักษณะเด่น ตำหนิพิเศษ (ถ้ามี)
ตอบเป็นประโยคภาษาไทยสั้นกระชับ ไม่มี bullet point
ตัวอย่าง: "สุนัขพันธุ์ผสม ขนสีน้ำตาลทอง มีจุดขาวที่อกและปลายหาง หูตั้งข้างซ้าย หูพับข้างขวา"
        `.trim()

        const result = await model.generateContent([
          prompt,
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
        ])

        caption = result.response.text().trim()
        console.log(`✅ [AI Caption] Succeeded with model: ${modelName}`)
        break
      } catch (err: any) {
        console.warn(`⚠️ [AI Caption] Model ${modelName} failed:`, err.message)
        lastError = err
      }
    }

    if (!caption) {
      throw lastError || new Error('All Gemini models failed to generate a caption.')
    }

    return NextResponse.json({ caption })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[caption]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
