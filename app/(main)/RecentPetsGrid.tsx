'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { MatchResultCard } from '@/components/pet/MatchResult'
import Link from 'next/link'
import { Megaphone, Loader2 } from 'lucide-react'

export default function RecentPetsGrid() {
  const [pets, setPets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  useEffect(() => {
    const fetchPets = async () => {
      const { data } = await supabase
        .from('pets')
        .select('*, pet_images(storage_url, is_primary), comments(count)')
        .order('created_at', { ascending: false })
        .limit(6) // ดึงมาแค่ 6 รายการ เพื่อจัดเป็น Grid 3x2
      
      if (data) {
        const formatted = data.map(p => ({
          ...p,
          image_url: p.pet_images?.find((img: any) => img.is_primary)?.storage_url || p.pet_images?.[0]?.storage_url
        }))
        setPets(formatted)
      }
      setLoading(false)
    }
    fetchPets()
  }, [supabase])

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <Loader2 className="animate-spin text-ori-orange w-10 h-10" />
    </div>
  )

  if (pets.length === 0) return null

  return (
    <section className="w-full max-w-6xl mx-auto px-4 z-10 relative">
      <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
        <Megaphone className="text-ori-orange" size={28} /> ประกาศล่าสุด
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets.map(pet => (
          <MatchResultCard key={pet.id} result={pet} />
        ))}
      </div>
      <div className="text-center mt-8">
        <Link href="/search" className="inline-block bg-white border-4 border-black px-8 py-3 rounded-2xl font-black shadow-paper-sm hover:-translate-y-1 hover:shadow-paper transition-all text-lg">
          ดูประกาศทั้งหมด 👀
        </Link>
      </div>
    </section>
  )
}