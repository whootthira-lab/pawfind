// app/api/ticker/route.ts

// 💡 เปลี่ยนมาใช้คำสั่งนี้เพื่อเคลียร์ปัญหา Error ตอน Build บน Vercel ให้ผ่านฉลุย 100%
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const tickerItems = []

    // 1. ดึงสัตว์หายล่าสุด พร้อมอำเภอและจังหวัด
    const { data: lostPets } = await supabase
      .from('pets')
      .select('id, name, province, district, reward_amount')
      .eq('status', 'lost')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(5)

    if (lostPets) {
      lostPets.forEach(pet => {
        const reward = pet.reward_amount > 0 ? ` (💰 รางวัล ${pet.reward_amount.toLocaleString()}บ.)` : ''
        tickerItems.push({
          id: `pet-${pet.id}`,
          text: `ตามหาน้อง: ${pet.name || 'ไม่ทราบชื่อ'}${reward}`,
          district: pet.district,
          province: pet.province,
          link: `/pet/${pet.id}`,
          color: 'text-ori-orange border-ori-orange',
          badge: '🚨 ด่วน'
        })
      })
    }

    // 2. ดึงกิจกรรมที่ผ่านการอนุมัติ พร้อมอำเภอและจังหวัด
    const { data: events } = await supabase
      .from('events')
      .select('id, title, province, district')
      .eq('status', 'approved')
      .order('start_date', { ascending: true })
      .limit(3)

    if (events) {
      events.forEach(ev => {
        tickerItems.push({
          id: `event-${ev.id}`,
          text: ev.title,
          district: ev.district,
          province: ev.province,
          link: `/events/${ev.id}`, 
          color: 'text-ori-blue-d border-ori-blue-d',
          badge: '🏆 กิจกรรม'
        })
      })
    }

    // 3. ข้อความเริ่มต้นกรณีหลังบ้านไม่มีข้อมูล
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
      id: 'error-1',
      text: 'ยินดีต้อนรับสู่ PobPet 🐾', 
      link: '/', 
      badge: 'PobPet', 
      color: 'text-black',
      district: '',
      province: ''
    }])
  }
}