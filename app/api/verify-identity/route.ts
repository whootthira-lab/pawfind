// app/api/verify-identity/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
    }

    const userId = session.user.id
    const { imageBase64 } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'กรุณาแนบรูปภาพเอกสารยืนยันตัวตนค่ะ', success: false }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `จงตรวจสอบภาพถ่ายใบนี้อย่างละเอียดและตอบกลับเฉพาะรูปแบบ JSON เท่านั้น โดยวิเคราะห์ว่า: 1. ภาพนี้คือบัตรประชาชนไทยหรือใบขับขี่ไทยใช่หรือไม่ (is_identity_document), 2. ภาพชัดเจนพอที่จะเห็นใบหน้าและตัวหนังสือหลักหรือไม่ (is_clear), 3. มีร่องรอยการตัดต่ออย่างเห็นได้ชัดหรือไม่ (is_forged) จงพ่น JSON ออกมาในสเปกนี้ { "isValid": true/false, "documentType": "id_card"/"driving_license"/"unknown", "reason": "ข้อความเหตุผลภาษาไทยกรณีไม่ผ่าน" }`

    // Extract base64 clean data
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "")

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
    ])

    const rawText = result.response.text()
    const cleaned = rawText.replace(/```json|```/g, '').trim()

    let parsed: { isValid: boolean; documentType: string; reason?: string }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({
        success: false,
        reason: 'ไม่สามารถอ่านประมวลผลข้อมูลรูปภาพได้ กรุณาถ่ายรูปให้ชัดเจนมากขึ้นค่ะ',
      })
    }

    if (parsed.isValid) {
      // 1. Upload the image to Supabase Storage inside 'pet-images' bucket under 'identities/'
      const fileName = `identities/${userId}/${Date.now()}.jpg`
      const buffer = Buffer.from(base64Data, 'base64')
      
      const { error: uploadError } = await supabase.storage
        .from('pet-images')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (uploadError) {
        console.error('Error uploading identity doc to Supabase:', uploadError)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('pet-images')
        .getPublicUrl(fileName)

      // 2. Update the user profile with verification status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          identity_doc_url: publicUrl || null
        })
        .eq('id', userId)

      if (profileError) {
        return NextResponse.json({
          success: false,
          reason: `ไม่สามารถปรับเปลี่ยนสถานะโปรไฟล์ได้: ${profileError.message}`,
        })
      }

      return NextResponse.json({
        success: true,
        documentType: parsed.documentType,
        message: 'ยินดีด้วยค่ะ! คุณผ่านการยืนยันตัวตนเรียบร้อยแล้ว'
      })
    } else {
      return NextResponse.json({
        success: false,
        reason: parsed.reason || 'ภาพเอกสารดังกล่าวไม่ผ่านเกณฑ์ความถูกต้อง กรุณาอัปโหลดรูปใหม่อีกครั้งค่ะ',
      })
    }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown'
    return NextResponse.json({ success: false, reason: `ระบบตรวจจับสิทธิ์ขัดข้อง: ${msg}` }, { status: 500 })
  }
}
