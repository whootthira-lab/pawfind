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

    // ดึงข้อมูลชื่อ-นามสกุลผู้ใช้จากตาราง profiles เพื่อส่งไปตรวจกับรูปภาพบัตร
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .maybeSingle()

    if (profileErr || !profile) {
      return NextResponse.json({
        success: false,
        reason: 'ไม่พบข้อมูลโปรไฟล์ของคุณในระบบ กรุณาลองใหม่อีกครั้งค่ะ'
      })
    }

    const firstName = (profile.first_name || '').trim()
    const lastName = (profile.last_name || '').trim()

    if (!firstName || !lastName) {
      return NextResponse.json({
        success: false,
        reason: 'กรุณากรอกชื่อและนามสกุลจริงในหน้าตั้งค่าโปรไฟล์ก่อนทำการยืนยันตัวตนค่ะ'
      })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const prompt = `จงตรวจสอบภาพถ่ายใบนี้อย่างละเอียดและตอบกลับเฉพาะรูปแบบ JSON เท่านั้น โดยวิเคราะห์ว่า:
1. ภาพนี้คือบัตรประชาชนไทยหรือใบขับขี่ไทยใช่หรือไม่ (is_identity_document)
2. ภาพชัดเจนพอที่จะเห็นใบหน้าและข้อมูลหลัก เช่น ชื่อ-นามสกุล หรือไม่ (is_clear)
3. มีร่องรอยการตัดต่ออย่างเห็นได้ชัดหรือไม่ (is_forged)
4. ตรวจสอบชื่อ-นามสกุลจริงบนภาพบัตรประชาชน/ใบขับขี่นี้ว่า ตรงกับชื่อเป้าหมายคือ "${firstName} ${lastName}" หรือไม่ โดยประเมินและให้ค่าความเหมือนเป็นเปอร์เซ็นต์ (match_score จาก 0 ถึง 100) เช่น หากชื่อและนามสกุลสะกดตรงกันเกือบทั้งหมด หรือตรงกัน 70% ขึ้นไป (ให้ความถูกต้องขั้นต่ำ 70 เปอร์เซ็นต์)

จงตอบกลับเป็น JSON ในรูปแบบนี้เท่านั้น:
{
  "is_identity_document": true/false,
  "is_clear": true/false,
  "is_forged": true/false,
  "extracted_name": "ชื่อ-นามสกุลที่ปรากฏบนบัตร (ภาษาไทย หรือ อังกฤษ)",
  "match_score": 100, // เปอร์เซ็นต์ความตรงกันกับชื่อเป้าหมาย (0-100)
  "isValid": true/false, // จะเป็น true ก็ต่อเมื่อเป็นบัตรจริง ชัดเจน ไม่ตัดต่อ และ match_score >= 70
  "documentType": "id_card"/"driving_license"/"unknown",
  "reason": "ระบุเหตุผลภาษาไทยอย่างละเอียดกรณีไม่ผ่านเกณฑ์ เช่น ชื่อนามสกุลไม่ตรง หรือรูปไม่ชัดเจน"
}`

    // Extract base64 clean data
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "")

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ]

    let rawText = ''
    let lastError = null

    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 [Verify Identity] Trying model: ${modelName}...`)
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent([
          prompt,
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        ])
        rawText = result.response.text()
        console.log(`✅ [Verify Identity] Succeeded with model: ${modelName}`)
        break
      } catch (err: any) {
        console.warn(`⚠️ [Verify Identity] Model ${modelName} failed:`, err.message)
        lastError = err
      }
    }

    if (!rawText) {
      throw lastError || new Error('All Gemini models failed to analyze the image.')
    }

    const cleaned = rawText.replace(/```json|```/g, '').trim()

    let parsed: { 
      isValid: boolean; 
      documentType: string; 
      reason?: string;
      match_score?: number;
      extracted_name?: string;
    }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({
        success: false,
        reason: 'ไม่สามารถอ่านประมวลผลข้อมูลรูปภาพได้ กรุณาถ่ายรูปให้ชัดเจนมากขึ้นค่ะ',
      })
    }

    if (parsed.isValid && (parsed.match_score ?? 0) >= 70) {
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
      let failReason = parsed.reason || 'ภาพเอกสารดังกล่าวไม่ผ่านเกณฑ์ความถูกต้อง กรุณาอัปโหลดรูปใหม่อีกครั้งค่ะ'
      if (parsed.match_score !== undefined && parsed.match_score < 70) {
        failReason = `ชื่อจริง-นามสกุลบนบัตรที่ตรวจพบ ("${parsed.extracted_name || 'ไม่พบชื่อ'}") ไม่สอดคล้องกับชื่อจริงในโปรไฟล์ของคุณ ("${firstName} ${lastName}") (คะแนนความถูกต้อง: ${parsed.match_score}%)`
      }
      return NextResponse.json({
        success: false,
        reason: failReason,
      })
    }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown'
    return NextResponse.json({ success: false, reason: `ระบบตรวจจับสิทธิ์ขัดข้อง: ${msg}` }, { status: 500 })
  }
}
