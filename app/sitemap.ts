// app/sitemap.ts
import { createClient } from '@/lib/supabase/server'
import { ALL_PROVINCES } from '@/lib/utils/provinces'

export default async function sitemap() {
  const supabase = createClient()
  
  // ดึงข้อมูลสัตว์ทุกตัว
  const { data: pets } = await supabase
    .from('pets')
    .select('id, updated_at')
    .limit(1000)

  // ดึงข้อมูลบทความ
  const { data: posts } = await supabase
    .from('cms_posts')
    .select('slug, updated_at')
    .eq('status', 'published')

  const baseUrl = 'https://pobpet.com'

  return [
    { url: baseUrl, priority: 1.0, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/search`, priority: 0.9 },
    { url: `${baseUrl}/donate`, priority: 0.8 },
    { url: `${baseUrl}/how-it-works`, priority: 0.7 }, // ✅ แก้ไขเครื่องหมายตรงนี้แล้วครับ
    
    // หน้าจังหวัดต่างๆ
    ...ALL_PROVINCES.map(p => ({
      url: `${baseUrl}/provinces/${p.slug}`,
      priority: 0.9, 
      changeFrequency: 'hourly' as const
    })),
    
    // หน้าประกาศสัตว์แต่ละตัว
    ...(pets ?? []).map((pet: any) => ({
      url: `${baseUrl}/pet/${pet.id}`,
      lastModified: new Date(pet.updated_at),
      priority: 0.8, 
      changeFrequency: 'daily' as const
    })),
    
    // หน้าบทความ/บล็อก
    ...(posts ?? []).map((post: any) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      priority: 0.6
    })),
  ]
}
