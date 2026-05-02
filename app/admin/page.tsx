import { createClient } from '@/lib/supabase/server'

export default async function AdminOverview() {
  const supabase = createClient()
  
  // Example metric fetching
  const { count: petCount } = await supabase.from('pets').select('*', { count: 'exact', head: true })
  const { count: postCount } = await supabase.from('cms_posts').select('*', { count: 'exact', head: true })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 border-2 border-black rounded shadow-paper-sm">
          <h3 className="font-bold mb-2">Total Pets</h3>
          <div className="text-3xl">{petCount || 0}</div>
        </div>
        
        <div className="bg-white p-6 border-2 border-black rounded shadow-paper-sm">
          <h3 className="font-bold mb-2">Published Posts</h3>
          <div className="text-3xl">{postCount || 0}</div>
        </div>
      </div>
    </div>
  )
}
