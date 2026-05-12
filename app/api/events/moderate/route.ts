import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    // 1. เช็กความพร้อมของกุญแจ
    if (!process.env.GEMINI_API_KEY) throw new Error("ไม่พบ GEMINI_API_KEY ในระบบ")
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("ไม่พบ SUPABASE_SERVICE_ROLE_KEY ในระบบ")

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! 
    )

    const body = await req.json()
    const { eventId, title, description, category, trustLevel = 'bronze' } = body

    if (!eventId) throw new Error("ไม่ได้ส่ง eventId มาให้ AI")

    // 2. เรียก AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: `คุณเป็นผู้เชี่ยวชาญด้านการตรวจสอบเนื้อหาสำหรับ PobPet แพลตฟอร์มชุมชนสัตว์เลี้ยงในไทย
        หน้าที่: ตรวจสอบความปลอดภัยและคุณภาพของประกาศ
        ห้ามเนื้อหาเกี่ยวกับการพนัน, ยาเสพติด, อาวุธ, หรือสิ่งผิดกฎหมาย
        ต้องตอบกลับเป็น JSON เท่านั้น ในรูปแบบนี้:
        { "score": number(0-100), "decision": "approve"|"flag"|"reject"|"revise", "reason": "เหตุผลสั้นๆภาษาไทย" }`
    })

    const prompt = `หัวข้อ: ${title}\nรายละเอียด: ${description}\nหมวดหมู่: ${category}`
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    // ทำความสะอาด JSON เผื่อ AI ติด Markdown
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
    let aiResponse;
    try {
      aiResponse = JSON.parse(cleanJson)
    } catch (e) {
      throw new Error(`AI ตอบกลับข้อมูลผิดรูปแบบ: ${responseText}`)
    }

    // 3. ตรรกะสถานะ
    let finalStatus = 'pending_admin'
    const score = aiResponse.score || 0
    if (score >= 90) finalStatus = 'approved'
    else if (score >= 70) finalStatus = trustLevel !== 'bronze' ? 'approved' : 'pending_admin'
    else if (score >= 50) finalStatus = 'pending_admin'
    else if (score >= 30) finalStatus = 'draft_returned'
    else finalStatus = 'rejected'

    // 4. เซฟลง Database
    const { error: updateErr } = await supabaseAdmin.from('events').update({ status: finalStatus }).eq('id', eventId)
    if (updateErr) throw new Error(`อัปเดตสถานะ events ไม่สำเร็จ: ${updateErr.message}`)

    // แอบเซฟ Log (ถ้าตาราง log พัง จะได้ไม่ทำให้ระบบหลักหยุดทำงาน)
    await supabaseAdmin.from('moderation_logs').insert({
      event_id: eventId, ai_score: score, ai_decision: aiResponse.decision || 'unknown', ai_reason: aiResponse.reason || '-', ai_raw_response: aiResponse, check_type: 'text_only'
    })

    return NextResponse.json({ success: true, status: finalStatus, reason: aiResponse.reason })

  } catch (error: any) {
    console.error('Moderation Error:', error)
    // ส่ง Error กลับไปที่หน้าจอตรงๆ
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}