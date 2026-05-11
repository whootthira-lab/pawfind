'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedQuery = query.trim()
    
    if (trimmedQuery) {
      // 💡 แอบเก็บสถิติคำค้นหาแบบเงียบๆ (Fire and Forget)
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_id: 'search_bar',
          target_type: 'search_query',
          metadata: { keyword: trimmedQuery }
        })
      }).catch(() => {}) // ถ้าเน็ตหลุดหรือยิงไม่เข้า ก็ปล่อยผ่าน ไม่ให้เว็บค้าง

      // 💡 ส่งผู้ใช้ไปหน้า Search พร้อมคำที่ค้นหา
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative flex items-center w-full max-w-sm hidden md:flex">
      <input 
        type="text" 
        placeholder="ค้นหาสัตว์หาย, ร้านค้า, กิจกรรม..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border-2 border-black rounded-full py-2 pl-4 pr-10 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-ori-orange shadow-paper-sm transition-all"
      />
      <button type="submit" className="absolute right-2 text-gray-500 hover:text-ori-orange bg-white p-1 rounded-full transition-colors">
        <Search size={18} strokeWidth={3} />
      </button>
    </form>
  )
}