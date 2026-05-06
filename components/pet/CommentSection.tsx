'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
// 💡 เพิ่ม ImagePlus และ Loader2 สำหรับระบบอัปโหลดรูป
import { MessageCircle, Send, User, Trash2, Edit2, X, Check, ImagePlus, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'

export function CommentSection({ petId }: { petId: string }) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  // 💡 State และ Ref สำหรับจัดการรูปภาพ
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }, [supabase])

  useEffect(() => {
    fetchComments()
    checkUser()

    const channel = supabase
      .channel(`comments-${petId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `pet_id=eq.${petId}` },
        () => { fetchComments() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [petId, fetchComments, checkUser, supabase])

  // 💡 ฟังก์ชันจัดการเมื่อเลือกรูปภาพ
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('รูปภาพต้องมีขนาดไม่เกิน 5MB')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // 💡 ฟังก์ชันลบรูปที่เลือกก่อนส่ง
  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSend = async () => {
    // เช็คว่าต้องมีข้อความ หรือ รูปภาพ อย่างใดอย่างหนึ่งถึงจะส่งได้
    if ((!newComment.trim() && !imageFile) || !user || loading) return
    setLoading(true)
    
    try {
      let imageUrl = null

      // 💡 1. อัปโหลดรูปขึ้น Storage Bucket ก่อน (ถ้ามี)
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('comment-images')
          .upload(fileName, imageFile)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('comment-images').getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      }

      const displayName = user.user_metadata?.display_name || 
                          user.user_metadata?.first_name || 
                          user.email?.split('@')[0] || 
                          'ผู้ใช้งาน'

      // 💡 2. บันทึกข้อมูลลง Database พร้อมลิงก์รูป (ถ้ามี)
      const { error } = await supabase.from('comments').insert({
        pet_id: petId,
        user_id: user.id,
        content: newComment.trim(),
        user_name: displayName,
        user_avatar: user.user_metadata?.avatar_url || null,
        image_url: imageUrl // เพิ่มฟิลด์นี้
      })

      if (error) throw error

      // 💡 3. ส่งเสร็จแล้ว เคลียร์ค่าทั้งหมด
      setNewComment('')
      removeImage()

    } catch (error: any) {
      console.error('Error sending:', error.message)
      alert('ไม่สามารถส่งได้: ' + error.message)
    } finally {
      setLoading(false)
    }
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
              <div className="ml-10">
                {/* 💡 แสดงข้อความ */}
                {comment.content && <p className="text-ori-ink-m text-sm break-words leading-relaxed">{comment.content}</p>}
                
                {/* 💡 แสดงรูปภาพแนบ (ถ้ามี) */}
                {comment.image_url && (
                  <div className="mt-3">
                    <img 
                      src={comment.image_url} 
                      alt="รูปภาพแนบในคอมเมนต์" 
                      className="max-w-full sm:max-w-xs rounded-xl border-2 border-ori-ink shadow-paper-sm object-cover" 
                    />
                  </div>
                )}
              </div>
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
        <div className="flex flex-col gap-2 bg-white p-3 rounded-2xl border-2 border-ori-ink shadow-paper-sm focus-within:ring-2 ring-orange-500/20 transition-all">
          
          {/* 💡 พรีวิวรูปภาพก่อนส่ง */}
          {imagePreview && (
            <div className="relative inline-block w-fit mb-2">
              <img src={imagePreview} alt="Preview" className="h-24 rounded-xl border-2 border-ori-ink object-cover" />
              <button 
                onClick={removeImage} 
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full border-2 border-ori-ink hover:scale-110 transition-transform shadow-paper-sm"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="เขียนข้อความหรือแจ้งเบาะแส..."
              className="flex-1 bg-transparent px-2 py-2 outline-none text-sm font-bold"
            />
            
            {/* 💡 Input ซ่อนสำหรับเลือกรูปภาพ */}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageSelect} 
              className="hidden" 
            />
            
            {/* 💡 ปุ่มกดเรียก Input เลือกรูปภาพ */}
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()} 
              className="p-2 text-ori-ink-m hover:text-ori-orange transition-colors rounded-xl"
              title="แนบรูปภาพ"
            >
              <ImagePlus size={24} />
            </button>

            <button 
              onClick={handleSend} 
              disabled={loading || (!newComment.trim() && !imageFile)} 
              className={`p-3 rounded-xl transition-all ${loading || (!newComment.trim() && !imageFile) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 active:translate-y-1 shadow-paper-sm'}`}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center p-6 bg-gray-50 rounded-2xl border-4 border-dashed border-gray-300">
          <p className="font-bold text-gray-500">กรุณาเข้าสู่ระบบเพื่อช่วยน้องสัตว์เลี้ยง 🐾</p>
        </div>
      )}
    </div>
  )
}