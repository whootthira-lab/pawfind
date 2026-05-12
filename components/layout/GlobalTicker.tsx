'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export function GlobalTicker() {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    // 💡 ดึงข้อมูลประกาศกิจกรรมล่าสุดจาก API
    fetch('/api/ticker')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(console.error)
  }, [])

  const handleTrackClick = (item: any) => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_id: item.id,
        target_type: 'ticker_click',
        metadata: { 
          text: item.text, 
          link: item.link,
          badge: item.badge 
        }
      })
    }).catch(() => {}) 
  }

  if (items.length === 0) return null

  return (
    <div className="bg-ori-cream border-b-2 border-black h-[40px] flex items-center overflow-hidden relative z-40 shadow-sm">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ticker-scroll {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .animate-ticker {
          display: inline-flex;
          white-space: nowrap;
          animation: ticker-scroll 35s linear infinite; /* ปรับความเร็วให้พอดีกับการอ่านข้อมูลที่ยาวขึ้น */
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}} />
      
      <div className="animate-ticker flex gap-12 px-4 w-full items-center">
        {items.map((item, i) => (
          <Link 
            key={i} 
            href={item.link} 
            onClick={() => handleTrackClick(item)}
            className="flex items-center gap-2 hover:underline group"
          >
            {/* Badge แสดงหมวดหมู่ */}
            <span className={`font-black text-[11px] px-2 py-0.5 rounded-full border-2 bg-white shadow-paper-sm ${item.color}`}>
              {item.badge}
            </span>

            {/* 💡 แสดงผล: หัวข้อข่าว + อำเภอ (ถ้ามี) + จังหวัด */}
            <span className="font-bold text-sm text-ori-ink group-hover:text-ori-orange transition-colors">
              {item.text} 
              {item.district && <span className="ml-2 opacity-80">อ.{item.district}</span>}
              {item.province && <span className="ml-1 opacity-80 text-xs">จ.{item.province}</span>}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}