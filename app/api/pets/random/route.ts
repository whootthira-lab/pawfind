import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit') ?? 6)
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pets')
    .select('id, name, species, breed, province, reported_at, pet_images!inner(storage_url)')
    .eq('status', 'lost')
    .eq('pet_images.is_primary', true)
    .gte('reported_at',
         new Date(Date.now()-30*24*60*60*1000).toISOString())
    .limit(limit * 3)  // ดึงเยอะแล้วสุ่ม
  
  if (error) throw error
  
  // สุ่ม
  const shuffled = (data ?? [])
    .sort(() => Math.random() - 0.5)
    .slice(0, limit)
    .map((p: any) => ({
      ...p,
      primary_image: p.pet_images?.[0]?.storage_url,
      days_missing: Math.floor(
        (Date.now()-new Date(p.reported_at).getTime())
        /86400000)
    }))
    
  return NextResponse.json({ data: shuffled })
}
