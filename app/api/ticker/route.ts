// app/api/ticker/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 💡 บังคับให้ Cache ข้อมูลไว้ 300 วินาที (5 นาที) เพื่อประสิทธิภาพ
export const revalidate = 300 

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const tickerItems = []

    // 1. ดึงสัตว์หายล่าสุด (ดึง district เพิ่มเข้ามาด้วย)
    const { data: lostPets } = await supabase
      .from('pets')
      .select('id, name, province, district, reward_amount') // 👈 เพิ่ม district
      .eq('status', 'lost')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(5)

    if (lostPets) {
      lostPets.forEach(pet => {
        const reward = pet.reward_amount > 0 ? ` (💰 รางวัล ${pet.reward_amount.toLocaleString()}บ.)` : ''
        tickerItems.push({
          id: `pet-${pet.id}`,
          text: `ตามหาน้อง: ${pet.name || 'ไม่ทราบชื่อ'}${reward}`, // แยกส่วนข้อความหลัก
          district: pet.district, // ส่งอำเภอแยกไปให้ Component จัดการ
          province: pet.province, // ส่งจังหวัดแยก
          link: `/pet/${pet.id}`,
          color: 'text-ori-orange border-ori-orange',
          badge: '🚨 ด่วน'
        })
      })
    }

    // 2. ดึงกิจกรรมที่ผ่านการอนุมัติ (ดึง district เพิ่มเข้ามาด้วย)
    const { data: events } = await supabase
      .from('events')
      .select('id, title, province, district') // 👈 เพิ่ม district
      .eq('status', 'approved')
      .order('start_date', { ascending: true })
      .limit(3)

    if (events) {
      events.forEach(ev => {
        tickerItems.push({
          id: `event-${ev.id}`,
          text: ev.title, // ส่งเฉพาะหัวข้อ
          district: ev.district,
          province: ev.province,
          link: `/events/${ev.id}`, 
          color: 'text-ori-blue-d border-ori-blue-d',
          badge: '🏆 กิจกรรม'
        })
      })
    }

    // 3. ข้อความเริ่มต้นกรณีไม่มีข้อมูล
    if (tickerItems.length === 0) {
      tickerItems.push({
        id: 'default-1',
        text: 'ยินดีต้อนรับสู่ PobPet · แพลตฟอร์มเพื่อชุมชนคนรักสัตว์',
        district: '',
        province: '',
        link: '/',
        color: 'text-ori-ink border-ori-ink',
        badge: '🐾 PobPet'
      })
    }

    return NextResponse.json(tickerItems)
  } catch (error) {
    console.error('Ticker API Error:', error)
    return NextResponse.json([{ 
      text: 'ยินดีต้อนรับสู่ PobPet 🐾', 
      link: '/', 
      badge: 'PobPet', 
      color: 'text-black',
      district: '',
      province: ''
    }])
  }
}