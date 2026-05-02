import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function SuccessStoriesPage() {
  const supabase = createClient()
  const { data: stories } = await supabase
    .from('cms_success_stories')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">💖 เรื่องราวความสำเร็จ</h1>
      <p className="text-center mb-12 font-medium">ทุกการพบเจอคือความสุขของครอบครัว นี่คือส่วนหนึ่งของเพื่อนตัวน้อยที่ได้กลับบ้าน</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {(stories || []).map((story) => (
          <Link href={`/success-stories/${story.id}`} key={story.id} className="block group">
            <div className="bg-white border-2 border-black rounded-lg shadow-paper hover:shadow-paper-hover transition-all overflow-hidden h-full flex flex-col">
              <div className="h-64 overflow-hidden border-b-2 border-black">
                {story.after_image ? (
                  <img src={story.after_image} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-wagashi-sakura flex items-center justify-center font-bold text-2xl">🎉</div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h2 className="text-2xl font-bold mb-2">{story.title}</h2>
                <p className="text-gray-700 mb-4 flex-1 line-clamp-3">{story.story_text}</p>
                <div className="text-sm font-bold text-white bg-black px-3 py-1 rounded inline-block self-start border-2 border-black">
                  พบใน {story.days_to_find} วัน
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
