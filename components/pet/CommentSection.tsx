'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { MessageCircle, Send, User, Trash2, Edit2, X, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'

export function CommentSection({ petId }: { petId: string }) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  // 💡 ใช้ useMemo เพื่อป้องกันการสร้าง Instance ใหม่ทุกครั้งที่ Render (แก้ Warning)
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
  }, [petId, supabase])

  // 💡 เพิ่ม useCallback เพื่อความเสถียรของ Dependency ใน useEffect (แก้ Warning)
  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }, [supabase])

  useEffect(() => {
    fetchComments()
    checkUser()

    // Realtime: อัปเดตเมื่อมีการ INSERT, UPDATE, หรือ DELETE
    const channel = supabase
      .channel(`comments-${petId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `pet_id=eq.${petId}` },
        () => { fetchComments() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [petId, fetchComments, checkUser, supabase]) // 💡 ใส่ Dependency ครบถ้วนตาม Log[cite: 11, 12]

  const handleSend = async () => {
    if (!newComment.trim() || !user || loading) return
    setLoading(true)
    
    // 💡 ปรับการดึงชื่อให้ลำดับความสำคัญคือ Display Name > First Name > Email
    const displayName = user.user_metadata?.display_name || 
                        user.user_metadata?.first_name || 
                        user.email?.split('@')[0] || 
                        'ผู้ใช้งาน';

    const { error } = await supabase.from('comments').insert({
      pet_id: petId,
      user_id: user.id,
      content: newComment.trim(),
      user_name: displayName,
      user_avatar: user.user_metadata?.avatar_url || null
    })

    if (error) {
      console.error('Error sending:', error.message)
      alert('ไม่สามารถส่งได้: ' + error.message)
    } else {
      setNewComment('')
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('คุณต้องการลบคอมเมนต์นี้ใช่หรือไม่?')) return
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) alert('ลบไม่สำเร็จ: ' + error.message)
  }

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return
    const { error } = await supabase
      .from('comments')
      .update({ content: editContent.trim() })
      .eq('id', id)
    
    if (error) alert('แก้ไขไม่สำเร็จ: ' + error.message)
    else setEditingId(null)
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-2 text-ori-ink font-bold border-b-2 border-ori-ink pb-2">
        <MessageCircle size={20} />
        <span>ความคิดเห็น ({comments.length})</span>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white border-2 border-ori-ink p-4 rounded-2xl shadow-paper-sm relative group">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-ori-cream border-2 border-ori-ink overflow-hidden flex items-center justify-center">
                {comment.user_avatar ? (
                  <img 
                    src={comment.user_avatar} 
                    alt={`โปรไฟล์ของ ${comment.user_name}`} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User size={16} className="text-ori-ink" />
                )}
              </div>
              <span className="font-bold text-sm text-ori-ink">{comment.user_name}</span>
              <span className="text-[10px] text-gray-400 font-bold italic">
                • {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: th })}
              </span>
            </div>

            {editingId === comment.id ? (
              <div className="ml-10 flex gap-2 animate-in fade-in zoom-in duration-200">
                <input 
                  value={editContent} 
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 border-2 border-ori-ink rounded-lg px-2 py-1 text-sm outline-none bg-orange-50"
                  autoFocus
                />
                <button onClick={() => handleUpdate(comment.id)} className="p-1 bg-green-500 text-white rounded-md shadow-paper-sm hover:scale-110 transition-transform"><Check size={16}/></button>
                <button onClick={() => setEditingId(null)} className="p-1 bg-gray-400 text-white rounded-md shadow-paper-sm hover:scale-110 transition-transform"><X size={16}/></button>
              </div>
            ) : (
              <p className="text-ori-ink-m text-sm ml-10 break-words leading-relaxed">{comment.content}</p>
            )}

            {user && user.id === comment.user_id && editingId !== comment.id && (
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                  className="p-1.5 text-ori-blue-d hover:bg-blue-50 rounded-lg transition-colors"
                  title="แก้ไขข้อความ"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(comment.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="ลบข้อความ"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center text-gray-400 py-6 text-sm italic font-bold border-2 border-dashed border-gray-200 rounded-2xl">
            ยังไม่มีความคิดเห็น มาเป็นคนแรกกัน! 🐾
          </p>
        )}
      </div>

      {user ? (
        <div className="flex gap-2 bg-white p-2 rounded-2xl border-2 border-ori-ink shadow-paper-sm focus-within:ring-2 ring-orange-500/20 transition-all">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="เขียนข้อความให้กำลังใจหรือแจ้งเบาะแส..."
            className="flex-1 bg-transparent px-3 py-2 outline-none text-sm font-bold"
          />
          <button 
            onClick={handleSend} 
            disabled={loading || !newComment.trim()} 
            className={`p-3 rounded-xl transition-all ${loading || !newComment.trim() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 active:translate-y-1 shadow-paper-sm'}`}
          >
            <Send size={20} className={loading ? 'animate-pulse' : ''} />
          </button>
        </div>
      ) : (
        <div className="text-center p-6 bg-gray-50 rounded-2xl border-4 border-dashed border-gray-300">
          <p className="font-bold text-gray-500">กรุณาเข้าสู่ระบบเพื่อช่วยน้องสัตว์เลี้ยง 🐾</p>
        </div>
      )}
    </div>
  )
}