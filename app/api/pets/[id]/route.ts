import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 1. GET: สำหรับดึงข้อมูลสัตว์เลี้ยงรายตัวมาแสดงในหน้าแก้ไข (Edit Form)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  const { data: pet, error } = await supabase
    .from('pets')
    .select('*, pet_images(*)')
    .eq('id', params.id)
    .single()

  if (error || !pet) {
    return NextResponse.json({ error: 'ไม่พบข้อมูลสัตว์เลี้ยง' }, { status: 404 })
  }

  return NextResponse.json({ data: pet })
}

// 2. PATCH: สำหรับอัปเดตข้อมูลสัตว์เลี้ยง (Edit Function)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'กรุณาล็อกอินก่อนดำเนินการ' }, { status: 401 })
  }

  try {
    const body = await req.json()
    
    // ตรวจสอบว่าเป็นเจ้าของประกาศจริงหรือไม่ก่อนอัปเดต
    const { data: pet, error: checkError } = await supabase
      .from('pets')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (checkError || pet.user_id !== user.id) {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์แก้ไขประกาศนี้' }, { status: 403 })
    }

    // ทำการอัปเดตข้อมูล
    const { data, error: updateError } = await supabase
      .from('pets')
      .update({
        name: body.name,
        status: body.status,
        species: body.species,
        breed: body.breed,
        color: body.color,
        reward_amount: body.reward_amount,
        distinctive_features: body.distinctive_features,
        sub_district: body.sub_district,
        district: body.district,
        province: body.province,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()

    if (updateError) throw updateError

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// 3. DELETE: สำหรับลบประกาศ (Delete Function)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ลบประกาศ (เฉพาะที่เป็นของตัวเอง)
  const { error } = await supabase
    .from('pets')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'ลบประกาศเรียบร้อยแล้ว' })
}