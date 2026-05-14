export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 💡 1. ตรวจสอบกุญแจ OpenAI API Key จากระบบ Vercel
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY environment variable in Vercel");
    }

    const { message, characterId, pageContext } = await req.json();

    // 💡 2. กำหนดบุคลิก (System Instructions) ให้เข้ากับน้องๆ แต่ละตัวละคร
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
    else {
      systemInstruction = `คุณคือ 'ลุงฮูก' นกฮูกพับกระดาษ เป็นผู้ช่วยผู้รอบรู้บนเว็บ PobPet (แพลตฟอร์มตามหาสัตว์หาย)
      บุคลิก: สุขุม รอบรู้ เป็นทางการแต่น่าเคารพ ใช้คำลงท้ายด้วย 'ครับ' เสมอ 
      หน้าที่หลัก: อธิบายวิธีการใช้งานเว็บอย่างละเอียด, ให้คำแนะนำเบื้องต้นเมื่อพบสัตว์บาดเจ็บหรือป่วย (และย้ำให้พาไปหาหมอ), ตอบข้อสงสัยเชิงระบบ
      ห้าม: ตอบเรื่องอื่นที่ไม่เกี่ยวกับสัตว์เลี้ยงหรือเว็บ PobPet`;
    }

    // 💡 3. เรียกใช้ GPT-4o-mini ผ่านคู่สายตรงของ OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // โมเดลจิ๋วแต่แจ๋ว เร็วและถูกมาก
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `[ข้อมูลบริบท: ผู้ใช้กำลังอยู่ที่หน้าเว็บ "${pageContext}"]\nข้อความจากผู้ใช้: ${message}` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "OpenAI API ตอบกลับด้วยข้อผิดพลาด");
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content;

    return NextResponse.json({ reply: responseText });

  } catch (error: any) {
    console.error("OpenAI Chat API Error:", error);
    return NextResponse.json(
      { error: `⚠️ ระบบแชทติดขัดชั่วคราว: ${error.message}` }, 
      { status: 500 }
    );
  }
}