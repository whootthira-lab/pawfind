// ไฟล์: types/api.ts

export interface AnalyzeResponse {
  breed?: string;
  main_color?: string;
  features?: string[];
  error?: string;
  message?: string;
}