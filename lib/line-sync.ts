// lib/line-sync.ts
// ── เชื่อม line_user_id กับ Supabase profile ─────────────────
// เรียกใน auth/callback/route.ts หลัง LINE login สำเร็จ

import { createClient } from '@/lib/supabase/server'

export async function syncLineProfile(userId: string): Promise<void> {
  const supabase = createClient()

  // ดึง user metadata ที่ LINE ส่งมา
  const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    .catch(() => ({ data: { user: null } }))

  if (!user) return

  const meta         = user.user_metadata || {}
  const lineUserId   = meta.provider_id || meta.sub || null
  const providerType = user.app_metadata?.provider

  // บันทึก line_user_id เฉพาะถ้า login ด้วย LINE
  if (providerType === 'line' && lineUserId) {
    await supabase.from('profiles').upsert({
      id:           userId,
      line_user_id: lineUserId,
      display_name: meta.full_name || meta.name || null,
      avatar_url:   meta.avatar_url || null,
    }, { onConflict: 'id' })
  }
}

// ── เพิ่ม SQL column ถ้ายังไม่มี ─────────────────────────────
// รันใน Supabase SQL Editor:
//
// ALTER TABLE profiles
// ADD COLUMN IF NOT EXISTS line_user_id TEXT UNIQUE;
//
// CREATE INDEX IF NOT EXISTS profiles_line_user_id_idx
// ON profiles (line_user_id);
