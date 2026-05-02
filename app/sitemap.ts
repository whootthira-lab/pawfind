import { createClient } from '@/lib/supabase/server'
import { ALL_PROVINCES } from '@/lib/utils/provinces'

export default async function sitemap() {
  const supabase = createClient()
  const { data: pets } = await supabase
    .from('pets').select('id, updated_at')
    .eq('status', 'lost').limit(1000)
  const { data: posts } = await supabase
    .from('cms_posts').select('slug, updated_at')
    .eq('status', 'published')

  return [
    { url:'https://pawfind.th', priority:1.0,
      changeFrequency:'daily' as const },
    { url:'https://pawfind.th/search', priority:0.9 },
    { url:'https://pawfind.th/donate', priority:0.8 },
    { url:'https://pawfind.th/how-it-works', priority:0.7 },
    ...ALL_PROVINCES.map(p => ({
      url: `https://pawfind.th/provinces/${p.slug}`,
      priority: 0.9, changeFrequency: 'hourly' as const
    })),
    ...(pets ?? []).map((pet: any) => ({
      url: `https://pawfind.th/pet/${pet.id}`,
      lastModified: new Date(pet.updated_at),
      priority: 0.8, changeFrequency: 'daily' as const
    })),
    ...(posts ?? []).map((post: any) => ({
      url: `https://pawfind.th/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      priority: 0.6
    })),
  ]
}
