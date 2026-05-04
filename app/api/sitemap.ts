// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawfind-eta.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()

  // ดึง pet ที่ active (lost + found + adoption) ไม่เกิน 1000 รายการ
  const { data: pets } = await supabase
    .from('pets')
    .select('id, updated_at, status')
    .in('status', ['lost', 'found', 'adoption'])
    .order('updated_at', { ascending: false })
    .limit(1000)

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/report`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/adopt`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  // Dynamic pet pages
  const petPages: MetadataRoute.Sitemap = (pets ?? []).map((pet) => ({
    url: `${BASE_URL}/pet/${pet.id}`,
    lastModified: new Date(pet.updated_at || new Date()),
    // Lost pets เปลี่ยนบ่อย → crawl บ่อยขึ้น
    changeFrequency: pet.status === 'lost' ? 'hourly' : 'daily',
    priority: pet.status === 'lost' ? 0.9 : 0.7,
  }))

  return [...staticPages, ...petPages]
}
