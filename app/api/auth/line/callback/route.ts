import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js'; // สำหรับคำสั่งระดับ Admin

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    // 1. เอา Code จาก LINE ไปแลกเป็น Access Token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINE_CALLBACK_URL!,
        client_id: process.env.LINE_CLIENT_ID!,
        client_secret: process.env.LINE_CLIENT_SECRET!,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) throw new Error('ไม่สามารถดึงข้อมูล Token จาก LINE ได้');

    // 2. ใช้ Access Token ดึงข้อมูลโปรไฟล์ (ชื่อ, รูป, LINE ID)
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileResponse.json();

    // 3. เตรียมข้อมูลบัญชีเสมือนสำหรับ Supabase
    const dummyEmail = `line_${profile.userId}@pobpet.com`;
    const dummyPassword = `LineAuth@${profile.userId}!`; // รหัสผ่านสุ่มที่ไม่มีใครรู้

    // 4. ใช้ Admin Client เช็คว่ามีผู้ใช้นี้ในระบบหรือยัง (ถ้ายังให้สร้างใหม่และข้ามยืนยันอีเมล)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = userList.users.find(u => u.email === dummyEmail);

    if (!existingUser) {
      await supabaseAdmin.auth.admin.createUser({
        email: dummyEmail,
        password: dummyPassword,
        email_confirm: true, // ข้ามการส่งอีเมลยืนยัน
        user_metadata: {
          full_name: profile.displayName,
          avatar_url: profile.pictureUrl,
          line_id: profile.userId
        }
      });
    }

    // 5. ใช้ Client ปกติทำการล็อกอิน เพื่อสร้าง Cookie ให้ระบบจดจำผู้ใช้
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: dummyEmail,
      password: dummyPassword,
    });

    if (signInError) throw signInError;

    // ล็อกอินสำเร็จ! พากลับไปหน้าแรก
    return NextResponse.redirect(new URL('/', request.url));

  } catch (error) {
    console.error('LINE Auth Error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}