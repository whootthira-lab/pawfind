import { GoogleGenerativeAI } from '@google/generative-ai'
import { ANALYZE_PET_PROMPT, VALIDATE_PET_IMAGE_PROMPT, COMPARE_PETS_PROMPT } from './prompts' // สมมติว่ามีไฟล์นี้อยู่ตามโค้ดเดิม
import type { AnalyzeResponse } from '@/types/api'

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 💡 Helper Function: แปลง URL กลับเป็น Format ที่ Gemini เข้าใจ (Buffer -> Base64)
async function fetchImageAsPart(urlOrBase64: string) {
  // ตรวจสอบว่าเป็น Base64 String หรือเปล่า (กรณีเรียกจากที่อื่นที่ยังใช้ Base64 อยู่)
  if (urlOrBase64.startsWith('data:image') || !urlOrBase64.startsWith('http')) {
      // ถ้าเป็น Base64 แบบเพียวๆ หรือมี prefix 
      const base64Data = urlOrBase64.replace(/^data:image\/\w+;base64,/, "");
      return {
          inlineData: { data: base64Data, mimeType: 'image/jpeg' }
      };
  }

  // กรณีเป็น URL (Supabase Public URL)
  const response = await fetch(urlOrBase64);
  if (!response.ok) throw new Error(`Failed to fetch image from URL: ${urlOrBase64}`);
  
  const arrayBuffer = await response.arrayBuffer();
  return {
    inlineData: { 
      data: Buffer.from(arrayBuffer).toString("base64"), 
      mimeType: response.headers.get("content-type") || "image/jpeg" 
    }
  };
}


// วิเคราะห์รูปสัตว์ — รองรับทั้ง Base64 และ Public URL พร้อมระบบสลับโมเดล (Fallback)
export async function analyzePetImages(imageUrlsOrBase64: string[]): Promise<AnalyzeResponse | null> {
  // ลำดับโมเดลที่จะใช้ (ตัวหลัก -> ตัวสำรอง 1 -> ตัวสำรอง 2)
  const modelsToTry = [
    "gemini-2.5-flash", 
    "gemini-1.5-flash", 
    "gemini-1.5-pro"    
  ];

  try {
    // 1. เตรียมรูปภาพให้พร้อม
    const imageParts = await Promise.all(
      imageUrlsOrBase64.map(async (src) => await fetchImageAsPart(src))
    );

    // 2. ระบบวนลูปสลับ AI อัตโนมัติ (Multi-Model Fallback)
    for (let i = 0; i < modelsToTry.length; i++) {
      const modelName = modelsToTry[i];
      
      try {
        console.log(`🤖 [AI System] กำลังเรียกใช้โมเดล: ${modelName}...`);
        
        const model = genAI.getGenerativeModel({ model: modelName });
        // ดึง Prompt จากไฟล์เดิมที่คุณมี
        const result = await model.generateContent([ANALYZE_PET_PROMPT, ...imageParts]);
        const text = result.response.text();
        
        // ทำความสะอาดข้อความเผื่อ AI แอบใส่ ```json มาให้
        const cleanText = text.replace(/
```json/g, '').replace(/```/g, '').trim();
        
        console.log(`✅ [AI System] วิเคราะห์สำเร็จด้วย ${modelName}`);
        return JSON.parse(cleanText) as AnalyzeResponse;

      } catch (error: any) {
        console.warn(`⚠️ [AI System] โมเดล ${modelName} ขัดข้อง:`, error.message);
        
        // ถ้าเป็นโมเดลตัวสุดท้ายในลิสต์ ให้คืนค่า null ออกไป เพื่อให้ API หลักจัดการต่อ
        if (i === modelsToTry.length - 1) {
          console.error("❌ [AI System] AI ล่มทุกโมเดล!");
          return null; 
        }
      }
    }
    return null;

  } catch (err) {
    console.error("❌ [AI System] Error processing images:", err);
    return null;
  }
}

// ตรวจว่ามีสัตว์ในรูปไหม — ปรับให้รองรับ URL ด้วย
export async function validatePetImage(imageUrlOrBase64: string): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const imagePart = await fetchImageAsPart(imageUrlOrBase64);
    
    // ดึง Prompt จากไฟล์เดิม
    const result = await model.generateContent([VALIDATE_PET_IMAGE_PROMPT, imagePart]);
    return result.response.text().trim().toUpperCase() === 'YES';
  } catch (error) {
    console.error("❌ [AI Validate Error]:", error);
    return false; // ถ้าตรวจสอบไม่ได้ ให้มองว่าไม่ผ่านไว้ก่อน
  }
}