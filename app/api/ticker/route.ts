// app/api/ticker/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 💡 พระเอกของเรา: บังคับให้ Cache ข้อมูลไว้ 300 วินาที (5 นาที) ประหยัดโควต้า Database มหาศาล!
export const revalidate = 300 

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const tickerItems = []

    // 1. ดึงสัตว์หายล่าสุด (ที่ยังมีสถานะ lost และยังไม่ปิดจ๊อบ)
    const { data: lostPets } = await supabase
      .from('pets')
      .select('id, name, province, reward_amount')
      .eq('status', 'lost')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(5)

    if (lostPets) {
      lostPets.forEach(pet => {
        const reward = pet.reward_amount > 0 ? ` 💰 รางวัล ${pet.reward_amount.toLocaleString()}บ.` : ''
        tickerItems.push({
          id: `pet-${pet.id}`,
          text: `ตามหา: ${pet.name || 'ไม่ทราบชื่อ'} จ.${pet.province}${reward}`,
          link: `/pet/${pet.id}`,
          color: 'text-ori-orange border-ori-orange',
          badge: '🚨 ด่วน'
        })
      })
    }

    // 2. ดึงกิจกรรมที่กำลังจะเกิดขึ้น (ถ้ามีข้อมูลในตาราง events)
    const { data: events } = await supabase
      .from('events')
      .select('id, title, province')
      .eq('status', 'approved')
      .order('start_date', { ascending: true })
      .limit(3)

    if (events) {
      events.forEach(ev => {
        tickerItems.push({
          id: `event-${ev.id}`,
          text: `${ev.title} จ.${ev.province}`,
          link: `/events/${ev.id}`, 
          color: 'text-ori-blue-d border-ori-blue-d',
          badge: '🏆 กิจกรรม'
        })
      })
    }

    // 3. ข้อความ Default กรณีไม่มีข้อมูลเลย
    if (tickerItems.length === 0) {
      tickerItems.push({
        id: 'default-1',
        text: 'ยินดีต้อนรับสู่ PobPet · แพลตฟอร์มตามหาสัตว์หายและศูนย์รวมคนรักสัตว์',
        link: '/',
        color: 'text-ori-ink border-ori-ink',
        badge: '🐾 PobPet'
      })
    }

    return NextResponse.json(tickerItems)
  } catch (error) {
    return NextResponse.json([{ text: 'ยินดีต้อนรับสู่ PobPet 🐾', link: '/', badge: 'PobPet', color: 'text-black' }])
  }
}