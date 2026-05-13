import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.LINE_CLIENT_ID;
  const callbackUrl = process.env.LINE_CALLBACK_URL;
  const state = Math.random().toString(36).substring(7); // สร้างรหัสสุ่มเพื่อความปลอดภัย

  // ลิงก์สำหรับส่งผู้ใช้ไปหน้าล็อกอินของ LINE
  const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl!)}&state=${state}&scope=profile%20openid%20email`;

  return NextResponse.redirect(lineLoginUrl);
}