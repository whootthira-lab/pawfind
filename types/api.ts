// ไฟล์: types/api.ts

export interface AnalyzeResponse {
  breed?: string;
  main_color?: string;
  features?: string[];
  full_description?: string; // เพิ่มตัวนี้เข้ามาเพื่อแก้ Error บรรทัดที่ 23
  error?: string;
  message?: string;
}

export interface PetComparisonResponse {
  same_animal_likelihood?: number;
  evidence?: {
    coat_pattern?: { match: boolean; score: number; note: string };
    face_ear_shape?: { match: boolean; score: number; note: string };
    distinguishing_marks?: { match: boolean; score: number; note: string };
  };
  key_evidence?: string;
  uncertainty?: string;
}