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
    checkUser()

    // เปิดระบบ Realtime: เมื่อมีคนคอมเมนต์ใหม่ ให้ Update รายการทันที
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `pet_id=eq.${petId}`,
        },
        (payload) => {
          setComments((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [petId])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
  }

  const handleSend = async () => {
    if (!newComment.trim() || !user || loading) return

    setLoading(true)
    const { error } = await supabase.from('comments').insert({
      pet_id: petId,
      user_id: user.id,
      content: newComment.trim(),
      user_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'ผู้ใช้งาน',
      user_avatar: user.user_metadata?.avatar_url || null
    })

    if (error) {
      console.error('Error sending comment:', error.message)
      alert('ไม่สามารถส่งคอมเมนต์ได้: ' + error.message)
    } else {
      setNewComment('')
    }
    setLoading(false)
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-2 text-ori-ink font-bold border-b-2 border-ori-ink pb-2">
        <MessageCircle size={20} />
        <span>ความคิดเห็น ({comments.length})</span>
      </div>

      {/* รายการคอมเมนต์ */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white border-2 border-ori-ink p-4 rounded-2xl shadow-paper-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-ori-cream border-2 border-ori-ink overflow-hidden flex items-center justify-center">
                {comment.user_avatar ? (
                  <img src={comment.user_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-ori-ink" />
                )}
              </div>
              <span className="font-bold text-sm text-ori-ink">{comment.user_name}</span>
              <span className="text-[10px] text-gray-400">
                • {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: th })}
              </span>
            </div>
            <p className="text-ori-ink-m text-sm ml-10">{comment.content}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center text-gray-400 py-4 text-sm">ยังไม่มีความคิดเห็น มาเป็นคนแรกกัน!</p>
        )}
      </div>

      {/* ช่องกรอกข้อมูล */}
      {user ? (
        <div className="flex gap-2 bg-white p-2 rounded-2xl border-2 border-ori-ink shadow-paper-sm focus-within:shadow-none transition-all">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="เขียนข้อความแสดงความยินดีหรือสอบถาม..."
            className="flex-1 bg-transparent px-3 py-2 outline-none text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !newComment.trim()}
            className={`p-3 rounded-xl transition-all ${
              loading || !newComment.trim() 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-orange-500 text-white hover:bg-orange-600 active:translate-y-1'
            }`}
          >
            <Send size={20} className={loading ? 'animate-pulse' : ''} />
          </button>
        </div>
      ) : (
        <div className="text-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-500">กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น 🐾</p>
        </div>
      )}
    </div>
  )
}