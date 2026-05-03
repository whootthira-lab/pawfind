import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server' // 💡 มั่นใจว่าไฟล์นี้อัปเดตเป็น @supabase/ssr แล้ว

// 📌 ฟังก์ชันสำหรับ "บันทึก" (Pin)
export async function POST(req: NextRequest) {
  const supabase = createClient()
  
  // 1. ตรวจสอบสิทธิ์ผู้ใช้จาก Cookie (SSR Way)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' }, { status: 401 })
  }

  try {
    const { petId } = await req.json()
    if (!petId) {
      return NextResponse.json({ error: 'ไม่พบรหัสสัตว์เลี้ยง' }, { status: 400 })
    }

    // 2. บันทึกข้อมูลลงตาราง saved_pets
    const { error } = await supabase
      .from('saved_pets')
      .insert({
        user_id: user.id, // 💡 ใช้ user_id ตามโครงสร้างที่ถูกต้อง
        pet_id: petId
      })

    if (error) {
      // โค้ด 23505 คือ Unique Violation (บันทึกซ้ำ)
      if (error.code === '23505') { 
        return NextResponse.json({ message: 'บันทึกข้อมูลไว้แล้ว' }, { status: 200 })
      }
      throw error
    }

    return NextResponse.json({ message: 'บันทึกสำเร็จ' }, { status: 201 })
    
  } catch (err: any) {
    console.error('Save pet error:', err)
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาดในการบันทึก' }, { status: 500 })
  }
}

// 🗑️ ฟังก์ชันสำหรับ "ยกเลิกการบันทึก" (Unpin)
export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  
  // 1. ตรวจสอบสิทธิ์ผู้ใช้
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const petId = searchParams.get('petId')

  if (!petId) {
    return NextResponse.json({ error: 'ไม่พบรหัสสัตว์เลี้ยง' }, { status: 400 })
  }

  try {
    // 2. ลบข้อมูลที่ผู้ใช้ระบุ
    const { error } = await supabase
      .from('saved_pets')
      .delete()
      .eq('user_id', user.id)
      .eq('pet_id', petId)

    if (error) throw error

    return NextResponse.json({ message: 'ยกเลิกการบันทึกสำเร็จ' }, { status: 200 })
    
  } catch (err: any) {
    console.error('Unpin pet error:', err)
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาดในการยกเลิก' }, { status: 500 })
  }
}