'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export function GlobalTicker() {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/ticker')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(console.error)
  }, [])

  // 💡 ฟังก์ชันแอบส่งข้อมูลการคลิกเพื่อเก็บสถิติแบบเงียบๆ
  const handleTrackClick = (item: any) => {
    // ยิง API แบบ Fire-and-Forget (ไม่ต้องรอผลลัพธ์ เบราว์เซอร์จะได้เปลี่ยนหน้าทันที)
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
    }).catch(() => {}) // ถ้าเน็ตหลุดหรือมี error ก็ปล่อยผ่านไป ไม่ให้กระทบการใช้งาน
  }

  if (items.length === 0) return null

  return (
    <div className="bg-ori-cream border-b-2 border-black h-[40px] flex items-center overflow-hidden relative z-40 shadow-sm">
      {/* 💡 CSS พิเศษสำหรับอักษรวิ่ง */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ticker-scroll {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .animate-ticker {
          display: inline-flex;
          white-space: nowrap;
          animation: ticker-scroll 25s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused; /* ชี้เมาส์แล้วหยุดวิ่ง */
        }
      `}} />
      
      <div className="animate-ticker flex gap-12 px-4 w-full items-center">
        {items.map((item, i) => (
          <Link 
            key={i} 
            href={item.link} 
            onClick={() => handleTrackClick(item)} /* 💡 แปะระบบ Tracking ตรงนี้! */
            className="flex items-center gap-2 hover:underline group"
          >
            <span className={`font-black text-[11px] px-2 py-0.5 rounded-full border-2 bg-white shadow-paper-sm ${item.color}`}>
              {item.badge}
            </span>
            <span className="font-bold text-sm text-ori-ink group-hover:text-ori-orange transition-colors">
              {item.text}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}