import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function StoryDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: story } = await supabase
    .from('cms_success_stories')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!story) notFound()

  return (
    <div className="max-w-3xl mx-auto bg-white border-2 border-black p-8 rounded-lg shadow-paper">
      <h1 className="text-3xl font-bold mb-4">{story.title}</h1>
      <div className="flex gap-4 mb-8">
        <span className="font-bold bg-wagashi-matcha px-2 py-1 border-2 border-black rounded text-sm shadow-paper-sm">
          📍 {story.province}
        </span>
        <span className="font-bold bg-wagashi-kinako px-2 py-1 border-2 border-black rounded text-sm shadow-paper-sm">
          ⏳ ใช้เวลา {story.days_to_find} วัน
        </span>
      </div>

      {story.after_image && (
        <img src={story.after_image} alt={story.title} className="w-full rounded border-2 border-black mb-8 shadow-paper-sm" />
      )}

      <div className="prose max-w-none">
        <p className="whitespace-pre-wrap">{story.story_text}</p>
      </div>

      {story.scout_name && (
        <div className="mt-12 p-4 bg-washi border-2 border-black rounded shadow-paper-sm text-center">
          <p className="font-bold">🙏 ขอบคุณ PawScout: {story.scout_name} ที่ช่วยพาน้องกลับบ้าน</p>
        </div>
      )}
    </div>
  )
}
