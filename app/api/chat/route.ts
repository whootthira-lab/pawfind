export const dynamic = 'force-dynamic';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, characterId, pageContext } = await req.json();

    // กำหนดบุคลิก (System Instructions)
    let systemInstruction = "";
    if (characterId === 'cat') {
      systemInstruction = "คุณคือ 'ลักกี้' แมวอ้วนสามสีพับกระดาษบนเว็บ PobPet อบอุ่น ใจดี ปลอบโยนเก่ง ลงท้ายด้วย 'ค่ะ/นะคะ' มีอิโมจิน่ารักๆ";
    } else if (characterId === 'dog') {
      systemInstruction = "คุณคือ 'น้องโกลดี้' หมาโกลเด้นพับกระดาษบนเว็บ PobPet ร่าเริง ให้กำลังใจเก่ง ลงท้ายด้วย 'ฮะ/ครับ' มีอิโมจิไฟลุก";
    } else {
      systemInstruction = "คุณคือ 'ลุงฮูก' นกฮูกพับกระดาษบนเว็บ PobPet สุขุม รอบรู้ ให้คำแนะนำอย่างละเอียด ลงท้ายด้วย 'ครับ'";
    }

    const prompt = `[หน้าเว็บปัจจุบันของผู้ใช้: ${pageContext}]\nผู้ใช้ถามว่า: ${message}`;

    // 💡 1. รวบรวมกุญแจทุกดอกที่มีในระบบ Vercel ของคุณวุฒิ์
    const possibleKeys = [
      process.env.GEMINI_API_KEY,
      process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      process.env.GOOGLE_API_KEY,
      process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
    ];

    let responseText = "";
    let success = false;
    let lastError = "";

    // 💡 2. ลองเอากุญแจมาไขทีละดอก ดอกไหนใช้ได้ เอาดอกนั้น!
    for (const rawKey of possibleKeys) {
      if (!rawKey || rawKey === 'undefined' || rawKey.trim() === '') continue;

      try {
        // ล้างเครื่องหมายคำพูดที่อาจจะติดมา
        const cleanKey = rawKey.replace(/['"]/g, '').trim();
        const genAI = new GoogleGenerativeAI(cleanKey);
        
        // ใช้ Gemini 2.5 Flash ตัวล่าสุดตามที่คุณวุฒิ์ต้องการ
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          systemInstruction: systemInstruction,
        });

        // ลองยิงคำถาม
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        success = true;
        
        console.log(`✅ พบกุญแจที่ไขผ่านแล้ว!`);
        break; // ถ้าไขผ่านแล้ว ให้หยุดหากุญแจทันที
        
      } catch (e: any) {
        lastError = e.message;
        // ถ้าดอกนี้พัง ให้เงียบไว้ แล้วไปลองดอกถัดไป
      }
    }

    // 💡 3. ถ้าลองครบทุกดอกแล้วยังพัง แสดงว่าไม่มีกุญแจ Gemini ในระบบเลย
    if (!success) {
      throw new Error(`ลองกุญแจทุกดอกใน Vercel แล้ว แต่ Google ปฏิเสธทั้งหมดเลยครับ (Error ล่าสุด: ${lastError})`);
    }

    return NextResponse.json({ reply: responseText });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: `⚠️ ขออภัยครับ ระบบแชทติดขัด: ${error.message}` }, 
      { status: 500 }
    );
  }
}