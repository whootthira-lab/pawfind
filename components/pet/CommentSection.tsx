'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { MessageCircle, Send, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'

export function CommentSection({ petId }: { petId: string }) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchComments()
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
  }, [petId])

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
  }

  const handleSend = async () => {
    if (!newComment.trim() || !user) return
    setLoading(true)

    const { error } = await supabase.from('comments').insert({
      pet_id: petId,
      user_id: user.id,
      content: newComment,
      user_name: user.user_metadata?.first_name || 'ผู้ใช้งาน',
      user_avatar: user.user_metadata?.avatar_url
    })

    if (!error) {
      setNewComment('')
      fetchComments()
    }
    setLoading(false)
  }

  return (
    <div className="mt-6 border-t-2 border-ori-ink pt-6">
      <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
        <MessageCircle size={20} /> ความคิดเห็น ({comments.length})
      </h3>

      <div className="flex flex-col gap-4 mb-6">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white border-2 border-ori-ink rounded-xl p-4 shadow-paper-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-ori-cream border-2 border-ori-ink overflow-hidden">
                {comment.user_avatar ? (
                  <img src={comment.user_avatar} alt="" className="w-full h-full object-cover" />
                ) : <User size={16} className="m-auto mt-1" />}
              </div>
              <span className="font-bold text-sm">{comment.user_name}</span>
              <span className="text-xs text-ori-ink-l">
                • {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: th })}
              </span>
            </div>
            <p className="text-ori-ink-m">{comment.content}</p>
          </div>
        ))}
      </div>

      {user ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="เขียนข้อความ..."
            className="ori-input flex-1"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="ori-btn-orange p-3 rounded-xl shadow-paper-sm hover:shadow-none translate-y-0 active:translate-y-1"
          >
            <Send size={20} />
          </button>
        </div>
      ) : (
        <div className="text-center p-4 bg-ori-cream-d rounded-xl font-bold border-2 border-dashed border-ori-ink-l">
          กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น
        </div>
      )}
    </div>
  )
}