export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
// 💡 ดึงสมองจากระบบค้นหามาใช้ (อย่าลืมใส่ export ในไฟล์ gemini.ts ด้วยนะครับ)
import { genAI } from '@/lib/ai/gemini';

export async function POST(req: Request) {
  try {
    const { message, characterId, pageContext } = await req.json();

    // กำหนดบุคลิก (System Instructions) ให้เข้ากับตัวละคร
    let systemInstruction = "";
    if (characterId === 'cat') {
      systemInstruction = "คุณคือ 'ลักกี้' แมวอ้วนสามสีพับกระดาษบนเว็บ PobPet อบอุ่น ใจดี ปลอบโยนเก่ง ลงท้ายด้วย 'ค่ะ/นะคะ' มีอิโมจิน่ารักๆ";
    } else if (characterId === 'dog') {
      systemInstruction = "คุณคือ 'น้องโกลดี้' หมาโกลเด้นพับกระดาษบนเว็บ PobPet ร่าเริง ให้กำลังใจเก่ง ลงท้ายด้วย 'ฮะ/ครับ' มีอิโมจิไฟลุก";
    } else {
      systemInstruction = "คุณคือ 'ลุงฮูก' นกฮูกพับกระดาษบนเว็บ PobPet สุขุม รอบรู้ ให้คำแนะนำอย่างละเอียด ลงท้ายด้วย 'ครับ'";
    }

    // 💡 อัปเกรดสมองเป็นรุ่นล่าสุด gemini-2.5-flash ตามที่คุณวุฒิ์แนะนำ!
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
      systemInstruction: systemInstruction,
    });

    const prompt = `[หน้าเว็บปัจจุบันของผู้ใช้: ${pageContext}]\nผู้ใช้ถามว่า: ${message}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: `⚠️ ขออภัยครับ ระบบแชทติดขัด (${error.message})` }, 
      { status: 500 }
    );
  }
}