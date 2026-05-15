// app/api/ticker/route.ts

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const tickerItems = []

    // 1. ดึงเฉพาะกิจกรรมที่ผ่านการอนุมัติ พร้อมอำเภอและจังหวัด
    // (เพิ่ม limit เป็น 5 เพื่อให้อักษรวิ่งมีเนื้อหาแสดงผลพอดี หลังจากเอาประกาศสัตว์หายออก)
    const { data: events } = await supabase
      .from('events')
      .select('id, title, province, district')
      .eq('status', 'approved')
      .order('start_date', { ascending: true })
      .limit(5)

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

    // 2. ข้อความเริ่มต้นกรณีหลังบ้านไม่มีข่าวกิจกรรมเลย
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