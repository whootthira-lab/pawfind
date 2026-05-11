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
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_id: 'search_bar',
          target_type: 'search_query',
          metadata: { keyword: trimmedQuery }
        })
      }).catch(() => {}) 
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative flex items-center w-full">
      <input 
        type="text" 
        placeholder="ค้นหาชื่อน้อง, พิกัด, หรือบริการชุมชน..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border-2 border-black rounded-full py-2.5 pl-5 pr-12 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-ori-orange shadow-paper-sm transition-all"
      />
      <button type="submit" className="absolute right-3 text-gray-400 hover:text-ori-orange bg-white p-1.5 rounded-full transition-colors">
        <Search size={20} strokeWidth={3} />
      </button>
    </form>
  )
}