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

    // 2. ตั้งค่า AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const systemInstruction = `คุณเป็นผู้เชี่ยวชาญด้านการตรวจสอบเนื้อหาสำหรับ PobPet แพลตฟอร์มชุมชนสัตว์เลี้ยงในไทย
        หน้าที่: ตรวจสอบความปลอดภัยและคุณภาพของประกาศ
        ห้ามเนื้อหาเกี่ยวกับการพนัน, ยาเสพติด, อาวุธ, หรือสิ่งผิดกฎหมาย
        ต้องตอบกลับเป็น JSON เท่านั้น ในรูปแบบนี้:
        { "score": number(0-100), "decision": "approve"|"flag"|"reject"|"revise", "reason": "เหตุผลสั้นๆภาษาไทย" }`

    const prompt = `หัวข้อ: ${title}\nรายละเอียด: ${description}\nหมวดหมู่: ${category}`

    // 💡 ระบบ Fallback: รายชื่อโมเดลที่จะใช้เรียงตามลำดับความสำคัญ (ถ้าอันแรกพัง จะสลับไปอันถัดไปอัตโนมัติ)
    const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
    let responseText = ""
    let modelUsed = ""

    // วนลูปเพื่อลองเรียกใช้ทีละโมเดล
    for (const modelName of modelsToTry) {
      try {
        console.log(`กำลังพยายามเรียกใช้โมเดล: ${modelName}...`)
        const model = genAI.getGenerativeModel({ model: modelName, systemInstruction })
        const result = await model.generateContent(prompt)
        responseText = result.response.text()
        modelUsed = modelName // บันทึกไว้ว่าใช้โมเดลไหนสำเร็จ
        break; // ถ้าสำเร็จให้ออกจากลูปทันที
      } catch (modelError: any) {
        console.warn(`โมเดล ${modelName} ขัดข้อง: ${modelError.message}`)
        // ถ้าวนจนถึงโมเดลสุดท้ายแล้วยังพังอีก ให้โยน Error ออกไปฟ้องหน้าเว็บ
        if (modelName === modelsToTry[modelsToTry.length - 1]) {
          throw new Error(`AI ขัดข้องทุกโมเดล: ${modelError.message}`)
        }
      }
    }
    
    // ทำความสะอาด JSON เผื่อ AI ติด Markdown
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
    let aiResponse;
    try {
      aiResponse = JSON.parse(cleanJson)
    } catch (e) {
      throw new Error(`AI (${modelUsed}) ตอบกลับข้อมูลผิดรูปแบบ: ${responseText}`)
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

    // 💡 แอบเซฟ Log (เพิ่มชื่อโมเดลที่ใช้ลงไปในเหตุผลด้วย จะได้รู้ว่าตัวไหนทำงานสำเร็จ)
    await supabaseAdmin.from('moderation_logs').insert({
      event_id: eventId, 
      ai_score: score, 
      ai_decision: aiResponse.decision || 'unknown', 
      ai_reason: `${aiResponse.reason || '-'} (via ${modelUsed})`, 
      ai_raw_response: aiResponse, 
      check_type: 'text_only'
    })

    return NextResponse.json({ success: true, status: finalStatus, reason: aiResponse.reason, model: modelUsed })

  } catch (error: any) {
    console.error('Moderation Error:', error)
    // ส่ง Error กลับไปที่หน้าจอตรงๆ
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}