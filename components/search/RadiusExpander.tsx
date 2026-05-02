"use client"

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'

export function RadiusExpander({ resultCount }: { resultCount: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentRadius = searchParams.get('radius') ? parseInt(searchParams.get('radius') as string) : 10
  const [optimisticRadius, setOptimisticRadius] = useState(currentRadius)

  const handleRadiusChange = useCallback(
    (radius: number) => {
      setOptimisticRadius(radius)
      
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('radius', radius.toString())
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [pathname, router, searchParams]
  )

  return (
    <div className="bg-wagashi-kinako border-2 border-black p-4 rounded-lg shadow-paper my-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <span className="font-bold">📍 พบ {resultCount} รายการ</span>
        <span className="ml-2">ในรัศมี {optimisticRadius} กม.</span>
      </div>
      
      <div className="flex items-center gap-2">
        <label htmlFor="radius-select" className="font-bold text-sm">ปรับระยะ (กม.):</label>
        <select 
          id="radius-select"
          className="bg-white border-2 border-black px-3 py-1 font-bold rounded shadow-paper-sm focus:outline-none"
          value={optimisticRadius}
          onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
          disabled={isPending}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  )
}
