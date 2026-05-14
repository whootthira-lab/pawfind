import { GoogleGenerativeAI } from '@google/generative-ai'
import { ANALYZE_PET_PROMPT, VALIDATE_PET_IMAGE_PROMPT, COMPARE_PETS_PROMPT } from './prompts'
import type { AnalyzeResponse } from '@/types/api'

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

// 💡 อัปเดตจุดสำคัญ: เติมคำว่า export เพื่อให้แชทบอทยืมสมองตัวนี้ไปใช้ได้
export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 💡 Helper Function: แปลง URL กลับเป็น Format ที่ Gemini เข้าใจ
async function fetchImageAsPart(urlOrBase64: string) {
  if (urlOrBase64.startsWith('data:image') || !urlOrBase64.startsWith('http')) {
      const base64Data = urlOrBase64.replace(/^data:image\/\w+;base64,/, "");
      return {
          inlineData: { data: base64Data, mimeType: 'image/jpeg' }
      };
  }

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

export async function analyzePetImages(imageUrlsOrBase64: string[]): Promise<AnalyzeResponse | null> {
  const modelsToTry = [
    "gemini-2.5-flash", 
    "gemini-1.5-flash", 
    "gemini-1.5-pro"    
  ];

  try {
    const imageParts = await Promise.all(
      imageUrlsOrBase64.map(async (src) => await fetchImageAsPart(src))
    );

    for (let i = 0; i < modelsToTry.length; i++) {
      const modelName = modelsToTry[i];
      
      try {
        console.log(`🤖 [AI System] กำลังเรียกใช้โมเดล: ${modelName}...`);
        
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([ANALYZE_PET_PROMPT, ...imageParts]);
        const text = result.response.text();
        
        // 💡 แก้ไขระดับไม้ตาย: ใช้รหัส \x60 แทนการพิมพ์สัญลักษณ์ backtick
        // รับรองว่า VS Code จะไม่มาหั่นบรรทัดตรงนี้อีกต่อไปครับ!
        const cleanText = text.replace(/\x60\x60\x60json/gi, '').replace(/\x60\x60\x60/g, '').trim();
        
        console.log(`✅ [AI System] วิเคราะห์สำเร็จด้วย ${modelName}`);
        return JSON.parse(cleanText) as AnalyzeResponse;

      } catch (error: any) {
        console.warn(`⚠️ [AI System] โมเดล ${modelName} ขัดข้อง:`, error.message);
        
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

export async function validatePetImage(imageUrlOrBase64: string): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const imagePart = await fetchImageAsPart(imageUrlOrBase64);
    
    const result = await model.generateContent([VALIDATE_PET_IMAGE_PROMPT, imagePart]);
    return result.response.text().trim().toUpperCase() === 'YES';
  } catch (error) {
    console.error("❌ [AI Validate Error]:", error);
    return false;
  }
}