import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// 💡 1. ตั้งค่า Gemini Flash และ System Instruction
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: `คุณเป็นผู้เชี่ยวชาญด้านการตรวจสอบเนื้อหาสำหรับ PobPet แพลตฟอร์มชุมชนสัตว์เลี้ยงในไทย
    หน้าที่: ตรวจสอบความปลอดภัยและคุณภาพของประกาศ
    กฎสำคัญ:
    - ห้ามเนื้อหาเกี่ยวกับการพนัน, ยาเสพติด, อาวุธ, หรือสิ่งผิดกฎหมายไทย
    - 'ฟรี' ในบริบทสุขภาพสัตว์ (ทำหมัน/วัคซีน/หาบ้าน) = ปลอดภัย
    - 'ฟรี' ในบริบทแจกเงินหรือของรางวัลที่ต้องโอนมัดจำ = Reject
    
    ต้องตอบกลับเป็น JSON เท่านั้น ห้ามมีข้อความอื่นปน ในรูปแบบนี้:
    { "score": number(0-100), "decision": "approve"|"flag"|"reject"|"revise", "reason": "เหตุผลสั้นๆภาษาไทย" }`
})

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  )

  try {
    const { eventId, title, description, category, trustLevel = 'bronze' } = await req.json()

    // 💡 2. ส่งข้อมูลให้ AI ตรวจสอบ
    const prompt = `หัวข้อ: ${title}\nรายละเอียด: ${description}\nหมวดหมู่: ${category}`
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    // ทำความสะอาดข้อความเผื่อ AI ส่ง markdown ครอบ JSON มาให้
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
    const aiResponse = JSON.parse(cleanJson)

    // 💡 3. ตรรกะ Score Threshold (ตัดสินใจตามคะแนน AI และ Trust Level)
    let finalStatus = 'pending_admin'
    const score = aiResponse.score || 0

    if (score >= 90) {
      finalStatus = 'approved'
    } else if (score >= 70) {
      finalStatus = trustLevel !== 'bronze' ? 'approved' : 'pending_admin'
    } else if (score >= 50) {
      finalStatus = 'pending_admin'
    } else if (score >= 30) {
      finalStatus = 'draft_returned'
    } else {
      finalStatus = 'rejected'
    }

    // 💡 4. บันทึกผลลง Database
    // 4.1 อัปเดตสถานะประกาศในตาราง events
    await supabase.from('events').update({ status: finalStatus }).eq('id', eventId)

    // 4.2 บันทึก Log การตัดสินใจของ AI ลงตาราง moderation_logs
    await supabase.from('moderation_logs').insert({
      event_id: eventId,
      ai_score: score,
      ai_decision: aiResponse.decision || 'unknown',
      ai_reason: aiResponse.reason || 'ไม่มีเหตุผลระบุ',
      ai_raw_response: aiResponse,
      check_type: 'text_only'
    })

    return NextResponse.json({ success: true, status: finalStatus, reason: aiResponse.reason })

  } catch (error: any) {
    console.error('Moderation Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}