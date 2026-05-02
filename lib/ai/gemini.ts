import { GoogleGenerativeAI } from '@google/generative-ai'
import { ANALYZE_PET_PROMPT, VALIDATE_PET_IMAGE_PROMPT, COMPARE_PETS_PROMPT } from './prompts'
import type { AnalyzeResponse } from '@/types/api'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// วิเคราะห์รูปสัตว์ — ส่งหลายรูปพร้อมกัน
export async function analyzePetImages(imageBase64Array: string[]): Promise<AnalyzeResponse> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const imageParts = imageBase64Array.map(b64 => ({
    inlineData: { data: b64, mimeType: 'image/jpeg' }
  }));

  const result = await model.generateContent([ANALYZE_PET_PROMPT, ...imageParts]);
  const text = result.response.text();
  
  // ลบ markdown formatting ถ้ามี
  const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanText) as AnalyzeResponse;
}

// ตรวจว่ามีสัตว์ในรูปไหม
export async function validatePetImage(imageBase64: string): Promise<boolean> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const imagePart = { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } };
  
  const result = await model.generateContent([VALIDATE_PET_IMAGE_PROMPT, imagePart]);
  return result.response.text().trim().toUpperCase() === 'YES';
}
