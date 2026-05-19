// app/api/pets/qr/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse }  from 'next/server'
import { createClient }  from '@/lib/supabase/server'
import QRCode            from 'qrcode'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { petId } = await req.json()
    if (!petId) return NextResponse.json({ error: 'Missing petId' }, { status: 400 })

    // ตรวจสอบว่าเป็นเจ้าของ
    const { data: pet } = await supabase
      .from('pets')
      .select('id, name, user_id')
      .eq('id', petId)
      .eq('user_id', session.user.id)
      .single()

    if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })

    const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL || 'https://pobpet.com'
    const petUrl   = `${baseUrl}/pets/${petId}`

    // สร้าง QR Code เป็น Data URL
    const qrDataUrl = await QRCode.toDataURL(petUrl, {
      width:           400,
      margin:          2,
      color: {
        dark:  '#1A1208',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',   // High — ทนต่อความเสียหายได้ดี
    })

    // บันทึก qr_code_url ลง pets
    await supabase
      .from('pets')
      .update({ qr_code_url: qrDataUrl })
      .eq('id', petId)

    return NextResponse.json({ qrDataUrl, petUrl })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[qr]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
