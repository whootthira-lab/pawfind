export const dynamic = 'force-dynamic';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 💡 1. ดึงคีย์ "ข้างใน" ฟังก์ชันเพื่อป้องกันค่าว่างตอน Cold Start
    // และลองดึงจากทุกชื่อที่ระบบจับคู่สัตว์อาจจะใช้
    const apiKey = (
      process.env.GEMINI_API_KEY || 
      process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
      ""
    ).trim().replace(/['"]/g, '');

    // 💡 2. ถ้าหาไม่เจอจริงๆ ให้ฟ้องชื่อตัวแปรที่มีในระบบออกมา (เพื่อการ Debug)
    if (!apiKey) {
      const availableKeys = Object.keys(process.env).filter(k => k.includes('KEY'));
      throw new Error(`ไม่พบ API Key ในระบบ (ตัวแปรที่มี: ${availableKeys.join(', ')})`);
    }

    // 💡 3. สร้าง Instance ใหม่ทุกครั้งที่เรียกใช้งาน (ชัวร์ที่สุดบน Vercel)
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const { message, characterId, pageContext } = await req.json();

    // กำหนดบุคลิก (System Instructions)
    let systemInstruction = "";
    if (characterId === 'cat') {
      systemInstruction = "คุณคือ 'ลักกี้' แมวอ้วนสามสีพับกระดาษบนเว็บ PobPet อบอุ่น ใจดี ปลอบโยนเก่ง ลงท้ายด้วย 'ค่ะ/นะคะ'";
    } else if (characterId === 'dog') {
      systemInstruction = "คุณคือ 'น้องโกลดี้' หมาโกลเด้นพับกระดาษบนเว็บ PobPet ร่าเริง ให้กำลังใจเก่ง ลงท้ายด้วย 'ฮะ/ครับ'";
    } else {
      systemInstruction = "คุณคือ 'ลุงฮูก' นกฮูกพับกระดาษบนเว็บ PobPet สุขุม รอบรู้ ให้คำแนะนำอย่างละเอียด ลงท้ายด้วย 'ครับ'";
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // ใช้รุ่น Flash เพื่อความเร็ว
      systemInstruction: systemInstruction,
    });

    const prompt = `[หน้าเว็บ: ${pageContext}]\nผู้ใช้ถามว่า: ${message}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText });

  } catch (error: any) {
    console.error("Critical Chat Error:", error);
    return NextResponse.json(
      { error: `⚠️ [แจ้งเตือน]: ${error.message}` }, 
      { status: 500 }
    );
  }
}