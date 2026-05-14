export const dynamic = 'force-dynamic';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, characterId, pageContext } = await req.json();

    const rawKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    const cleanKey = rawKey.replace(/['"]/g, '').trim();

    const genAI = new GoogleGenerativeAI(cleanKey);

    let systemInstruction = "";
    if (characterId === 'cat') {
      systemInstruction = "คุณคือ 'ลักกี้' แมวอ้วนสามสีพับกระดาษบนเว็บ PobPet อบอุ่น ใจดี ปลอบโยนเก่ง ลงท้ายด้วย 'ค่ะ/นะคะ'";
    } else if (characterId === 'dog') {
      systemInstruction = "คุณคือ 'น้องโกลดี้' หมาโกลเด้นพับกระดาษบนเว็บ PobPet ร่าเริง ให้กำลังใจเก่ง ลงท้ายด้วย 'ฮะ/ครับ'";
    } else {
      systemInstruction = "คุณคือ 'ลุงฮูก' นกฮูกพับกระดาษบนเว็บ PobPet สุขุม รอบรู้ ให้คำแนะนำอย่างละเอียด ลงท้ายด้วย 'ครับ'";
    }

    // กลับมาใช้ 1.5-flash ตัวมาตรฐานที่ชัวร์และเสถียรที่สุดก่อนครับ
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", 
      systemInstruction: systemInstruction,
    });

    const prompt = `[หน้าเว็บปัจจุบันของผู้ใช้: ${pageContext}]\nผู้ใช้ถามว่า: ${message}`;
    const result = await model.generateContent(prompt);
    
    return NextResponse.json({ reply: result.response.text() });

  } catch (error: any) {
    console.error("Diagnostic Error:", error);
    
    // 💡 โหมดนักสืบ: ตรวจสอบค่าจริงๆ ที่ Vercel มองเห็นและส่งกลับไปแสดงบนหน้าแชท
    const k1 = process.env.GEMINI_API_KEY || "ไม่มีค่า";
    const k2 = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "ไม่มีค่า";
    
    // เซนเซอร์คีย์เพื่อความปลอดภัย โชว์แค่ 6 ตัวแรก
    const mask = (val: string) => val === "ไม่มีค่า" ? val : `${val.substring(0, 6)}... (ความยาว ${val.length} ตัวอักษร)`;

    return NextResponse.json(
      { 
        error: `⚠️ [โหมดนักสืบ]: Google ปฏิเสธคีย์ครับ!\n\nข้อมูลคีย์ที่ Vercel มองเห็นในขณะนี้:\n- GEMINI_API_KEY: ${mask(k1)}\n- NEXT_PUBLIC...: ${mask(k2)}\n\n💡 ถ้าค่าที่ขึ้นด้านบน "ไม่มีค่า" หรือตัวอักษรไม่ตรงกับคีย์จริงของคุณวุฒิ์ แสดงว่าต้องเข้าไปอัปเดตที่ Vercel Dashboard > Settings > Environment Variables ครับ!` 
      }, 
      { status: 500 }
    );
  }
}