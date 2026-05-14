import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 💡 1. ย้ายการดึง API Key เข้ามาไว้ "ข้างใน" ฟังก์ชัน 
    // และเขียนดักเผื่อว่าคีย์ในระบบถูกตั้งชื่อเป็น NEXT_PUBLIC_GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("หา API Key ไม่พบ ลองเช็กชื่อตัวแปรใน Vercel อีกครั้ง");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { message, characterId, pageContext } = await req.json();

    // 2. กำหนดบุคลิก (System Instructions) ตามตัวละคร
    let systemInstruction = "";
    
    if (characterId === 'cat') {
      systemInstruction = `คุณคือ 'ลักกี้' แมวอ้วนสามสีพับกระดาษ เป็นผู้ช่วยบนเว็บ PobPet (แพลตฟอร์มตามหาสัตว์หาย) 
      บุคลิก: อบอุ่น ใจดี ขี้อ้อน ปลอบโยนเก่ง ใช้คำลงท้ายด้วย 'ค่ะ/นะคะ' เสมอ มีอิโมจิแมวหรือหัวใจปนบ้าง
      หน้าที่หลัก: ปลอบโยนจิตใจคนที่สัตว์หาย, แนะนำวิธีลงประกาศหาสัตว์, ตอบคำถามแบบสั้นกระชับและเห็นอกเห็นใจ
      ห้าม: ตอบเรื่องอื่นที่ไม่เกี่ยวกับสัตว์เลี้ยงหรือเว็บ PobPet`;
    } 
    else if (characterId === 'dog') {
      systemInstruction = `คุณคือ 'น้องโกลดี้' หมาโกลเด้นพับกระดาษ เป็นผู้ช่วยบนเว็บ PobPet (แพลตฟอร์มตามหาสัตว์หาย)
      บุคลิก: ร่าเริง กระตือรือร้น พลังงานล้นเหลือ ให้กำลังใจเก่ง ใช้คำลงท้ายด้วย 'ฮะ/ครับ' หรือ 'จ๊ะ' เสมอ มีอิโมจิหมาหรือไฟลุกปนบ้าง
      หน้าที่หลัก: กระตุ้นให้คนมีความหวัง, แนะนำให้รีบลงประกาศหรือแชร์ข้อมูล, ตอบแบบรวดเร็วและมีพลัง
      ห้าม: ตอบเรื่องอื่นที่ไม่เกี่ยวกับสัตว์เลี้ยงหรือเว็บ PobPet`;
    } 
    else if (characterId === 'owl') {
      systemInstruction = `คุณคือ 'ลุงฮูก' นกฮูกพับกระดาษ เป็นผู้ช่วยผู้รอบรู้บนเว็บ PobPet (แพลตฟอร์มตามหาสัตว์หาย)
      บุคลิก: สุขุม รอบรู้ เป็นทางการแต่น่าเคารพ ใช้คำลงท้ายด้วย 'ครับ' เสมอ 
      หน้าที่หลัก: อธิบายวิธีการใช้งานเว็บอย่างละเอียด, ให้คำแนะนำเบื้องต้นเมื่อพบสัตว์บาดเจ็บหรือป่วย (และย้ำให้พาไปหาหมอ), ตอบข้อสงสัยเชิงระบบ
      ห้าม: ตอบเรื่องอื่นที่ไม่เกี่ยวกับสัตว์เลี้ยงหรือเว็บ PobPet`;
    }

    const prompt = `[ข้อมูลบริบท: ผู้ใช้กำลังอยู่ที่หน้าเว็บ "${pageContext}"]\nข้อความจากผู้ใช้: ${message}`;

    // 3. ระบบสลับโมเดลอัตโนมัติ (Fallback Mechanism)
    const fallbackModels = ["gemini-1.5-flash", "gemini-1.5-pro"];
    let responseText = "";
    let success = false;
    let lastErrorMsg = "";

    for (const modelName of fallbackModels) {
      try {
        console.log(`🤖 กำลังพยายามใช้สมอง AI รุ่น: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction,
        });

        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        success = true;
        break; // สำเร็จแล้ว ให้ออกจากลูป

      } catch (error: any) {
        console.warn(`⚠️ เกิดข้อผิดพลาดกับโมเดล ${modelName}:`, error.message);
        lastErrorMsg = error.message; 
      }
    }

    // ถ้าลองครบทุกโมเดลแล้วยังพังอยู่
    if (!success) {
      throw new Error(lastErrorMsg);
    }

    return NextResponse.json({ reply: responseText });

  } catch (error: any) {
    console.error("Critical API Error:", error);
    return NextResponse.json(
      { error: `⚠️ [แจ้งเตือนนักพัฒนา]: ${error.message || 'Unknown Error'}` }, 
      { status: 500 }
    );
  }
}