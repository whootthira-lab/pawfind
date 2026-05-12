'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { CheckCircle2, XCircle, AlertCircle, Loader2, Trash2, Filter, Edit2, Calendar, MapPin, Building2, Save, X, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'

const eventCategories = [
  { value: 'contest', label: '🏆 การแข่งขันและประกวด' },
  { value: 'training', label: '📚 อบรมและให้ความรู้' },
  { value: 'market', label: '🛒 แสดงสินค้าและนิทรรศการ' },
  { value: 'community', label: '🤝 กิจกรรมชุมชนและสาธารณะ' },
  { value: 'health', label: '🏥 สุขภาพและการดูแล' },
  { value: 'news', label: '📣 ข่าวสารและประกาศ' },
  { value: 'help', label: '🔍 ขอความช่วยเหลือ' },
]

const thailandProvinces = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
].sort();

export default function AdminModerationPage() {
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending_admin') 

  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editFormData, setEditFormData] = useState({
    title: '', event_type: 'news', description: '', organizer_name: '', 
    venue_name: '', province: '', district: '', subdistrict: '', start_date: '', end_date: '',
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchEvents = async () => {
    setIsLoading(true)
    
    let query = supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (activeTab !== 'all') {
      query = query.eq('status', activeTab)
    } else {
      // 💡 เงื่อนไขสำคัญ: ถ้าดู "ทั้งหมด" จะไม่นำของที่ถูกปฏิเสธ (rejected) มาแสดง
      query = query.neq('status', 'rejected')
    }

    try {
      const { data, error } = await query
      if (error) {
        console.error('Fetch error:', error)
        alert(`ดึงข้อมูลไม่สำเร็จ!\nสาเหตุ: ${error.message}`)
      } else {
        setEvents(data || [])
      }
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาดของระบบ: ${err.message}`)
    }
    
    setIsLoading(false)
  }

  useEffect(() => {
    fetchEvents()
  }, [activeTab])

  const handleUpdateStatus = async (eventId: string, newStatus: string) => {
    if (!window.confirm(`ยืนยันการเปลี่ยนสถานะเป็น ${newStatus} ?`)) return
    const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', eventId)
    if (error) alert(`อัปเดตไม่สำเร็จ: ${error.message}`)
    else { alert('อัปเดตสถานะเรียบร้อย!'); fetchEvents() }
  }

  const handleDelete = async (eventId: string) => {
    if (!window.confirm('⚠️ ยืนยันการลบประกาศนี้อย่างถาวร?')) return
    const { error } = await supabase.from('events').delete().eq('id', eventId)
    if (error) alert(`ลบไม่สำเร็จ: ${error.message}`)
    else { alert('ลบประกาศออกจากระบบเรียบร้อย!'); fetchEvents() }
  }

  const openEditModal = (event: any) => {
    setEditFormData({
      title: event.title || '',
      event_type: event.event_type || 'news',
      description: event.description || '',
      organizer_name: event.organizer_name || '',
      venue_name: event.venue_name || '',
      province: event.province || 'นครราชสีมา',
      district: event.district || '',
      subdistrict: event.subdistrict || '',
      start_date: event.start_date ? event.start_date.substring(0, 16) : '',
      end_date: event.end_date ? event.end_date.substring(0, 16) : '',
    })
    setEditingEvent(event)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    try {
      const { error: updateErr } = await supabase
        .from('events')
        .update({ ...editFormData, status: 'pending_ai' })
        .eq('id', editingEvent.id)

      if (updateErr) throw updateErr

      const aiRes = await fetch('/api/events/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: editingEvent.id,
          title: editFormData.title,
          description: editFormData.description,
          category: editFormData.event_type,
          trustLevel: 'gold'
        })
      })
      const aiData = await aiRes.json()

      if (!aiRes.ok || !aiData.success) {
        alert(`⚠️ บันทึกการแก้ไขแล้ว แต่ AI ขัดข้อง: ${aiData.error}`)
      } else {
        alert(`✅ แอดมินแก้ไขประกาศเรียบร้อย!\nผลการตรวจจาก AI ล่าสุด: ${aiData.status}\nเหตุผล: ${aiData.reason}`)
      }

      setEditingEvent(null)
      fetchEvents()

    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการแก้ไข: ' + err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 mb-20 relative">
      
      {editingEvent && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto pt-20 pb-10">
          <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-ori-ink flex items-center gap-2">
                <Edit2 className="text-ori-blue-d" /> แอดมินแก้ไขประกาศ
              </h2>
              <button onClick={() => setEditingEvent(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-black text-sm">หัวข้อประกาศ</label>
                  <input required value={editFormData.title} onChange={e => setEditFormData({...editFormData, title: e.target.value})} className="ori-input w-full p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-sm">หมวดหมู่</label>
                  <select value={editFormData.event_type} onChange={e => setEditFormData({...editFormData, event_type: e.target.value})} className="ori-input w-full p-2 text-sm bg-white">
                    {eventCategories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-black text-sm text-ori-green font-bold flex items-center gap-1">
                    <Building2 size={14} /> ผู้จัดงาน
                  </label>
                  <input required value={editFormData.organizer_name} onChange={e => setEditFormData({...editFormData, organizer_name: e.target.value})} className="ori-input w-full p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-sm text-ori-orange font-bold flex items-center gap-1">
                    <MapPin size={14} /> สถานที่จัดงาน
                  </label>
                  <input value={editFormData.venue_name} onChange={e => setEditFormData({...editFormData, venue_name: e.target.value})} className="ori-input w-full p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-sm">จังหวัด</label>
                  <select required value={editFormData.province} onChange={e => setEditFormData({...editFormData, province: e.target.value})} className="ori-input w-full p-2 text-sm bg-white">
                    {thailandProvinces.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-black text-xs">อำเภอ</label>
                    <input value={editFormData.district} onChange={e => setEditFormData({...editFormData, district: e.target.value})} className="ori-input w-full p-2 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-black text-xs">ตำบล</label>
                    <input value={editFormData.subdistrict} onChange={e => setEditFormData({...editFormData, subdistrict: e.target.value})} className="ori-input w-full p-2 text-xs" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-black text-sm flex items-center gap-1">
                    <Calendar size={14} /> วันที่เริ่ม
                  </label>
                  <input type="datetime-local" required value={editFormData.start_date} onChange={e => setEditFormData({...editFormData, start_date: e.target.value})} className="ori-input w-full p-2 text-sm font-sans" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="font-black text-sm">รายละเอียด</label>
                  <textarea rows={4} value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} className="ori-input w-full p-2 text-sm" />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 mt-4 border-t-2 border-gray-100">
                <Button type="button" variant="outline" onClick={() => setEditingEvent(null)} className="border-2 border-gray-300 font-black rounded-xl">ยกเลิก</Button>
                <Button type="submit" disabled={isUpdating} className="bg-ori-blue-d text-white font-black rounded-xl flex gap-2 py-5 px-6">
                  {isUpdating ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} บันทึกและส่งตรวจ AI
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 md:p-10 shadow-paper">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 border-b-4 border-ori-ink pb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-ori-orange" size={32} />
            <div>
              <h1 className="text-3xl font-black text-ori-ink">ระบบตรวจสอบประกาศ</h1>
              <p className="font-bold text-gray-500 mt-1">จัดการคำขอ อนุมัติ แก้ไข หรือลบข้อมูลทั้งหมด</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setActiveTab('pending_admin')} className={`px-5 py-2.5 rounded-xl font-black border-2 transition-colors ${activeTab === 'pending_admin' ? 'bg-ori-orange text-white border-ori-ink' : 'bg-white text-gray-600 border-gray-300 hover:border-ori-ink'}`}>⏳ รอแอดมินตรวจ</button>
          
          {/* 💡 เปลี่ยนแท็บ Rejected เป็น Pending AI */}
          <button onClick={() => setActiveTab('pending_ai')} className={`px-5 py-2.5 rounded-xl font-black border-2 transition-colors ${activeTab === 'pending_ai' ? 'bg-purple-600 text-white border-ori-ink' : 'bg-white text-gray-600 border-gray-300 hover:border-ori-ink'}`}>
            🤖 รอ AI ตรวจ (Pending AI)
          </button>
          
          <button onClick={() => setActiveTab('approved')} className={`px-5 py-2.5 rounded-xl font-black border-2 transition-colors ${activeTab === 'approved' ? 'bg-ori-green text-white border-ori-ink' : 'bg-white text-gray-600 border-gray-300 hover:border-ori-ink'}`}>✅ อนุมัติแล้ว (Approved)</button>
          <button onClick={() => setActiveTab('all')} className={`px-5 py-2.5 rounded-xl font-black border-2 transition-colors ${activeTab === 'all' ? 'bg-ori-ink text-white border-ori-ink' : 'bg-white text-gray-600 border-gray-300 hover:border-ori-ink'}`}><Filter size={16} className="inline mr-1" /> ทั้งหมด</button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-ori-blue-d" size={48} /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <CheckCircle2 size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-black text-lg">ไม่มีประกาศในหมวดหมู่นี้</p>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event) => (
              <div key={event.id} className="border-4 border-ori-ink rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                {/* 💡 ปรับสีแถบด้านซ้ายตามสถานะ */}
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                  event.status === 'approved' ? 'bg-ori-green' : 
                  event.status === 'pending_ai' ? 'bg-purple-500' : 
                  'bg-ori-orange'
                }`}></div>

                <div className="flex flex-col md:flex-row justify-between gap-6 pl-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {/* 💡 ปรับสี Badge ตามสถานะ */}
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black border-2 uppercase tracking-wider ${
                        event.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' : 
                        event.status === 'pending_ai' ? 'bg-purple-100 text-purple-800 border-purple-300 flex items-center gap-1' : 
                        'bg-orange-100 text-orange-800 border-orange-300'
                      }`}>
                        {event.status === 'pending_ai' && <Bot size={12} />}
                        {event.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500 font-bold">{new Date(event.created_at).toLocaleString('th-TH')}</span>
                    </div>
                    
                    <h3 className="text-2xl font-black text-ori-ink">{event.title}</h3>
                    <p className="text-sm font-bold text-gray-500">👤 ผู้จัด: {event.organizer_name} | 📍 สถานที่: {event.venue_name || 'ไม่ได้ระบุ'} {event.district ? `(${event.district}, ${event.province})` : `(${event.province})`}</p>
                    <p className="text-sm text-gray-700 mt-2 line-clamp-3">{event.description || 'ไม่มีรายละเอียด'}</p>
                  </div>

                  <div className="flex flex-row md:flex-col gap-2 justify-center flex-wrap md:min-w-[140px]">
                    {event.status !== 'approved' && (
                      <button onClick={() => handleUpdateStatus(event.id, 'approved')} className="flex-1 bg-ori-green text-white font-black py-2 px-3 rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition-colors border-2 border-transparent hover:border-black text-sm">
                        <CheckCircle2 size={16} /> อนุมัติ
                      </button>
                    )}
                    {event.status !== 'rejected' && (
                      <button onClick={() => handleUpdateStatus(event.id, 'rejected')} className="flex-1 bg-orange-500 text-white font-black py-2 px-3 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors border-2 border-transparent hover:border-black text-sm">
                        <XCircle size={16} /> ปฏิเสธ
                      </button>
                    )}
                    <button onClick={() => openEditModal(event)} className="flex-1 bg-white text-ori-blue-d font-black py-2 px-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors border-2 border-ori-blue-d hover:border-black text-sm">
                      <Edit2 size={16} /> แก้ไข
                    </button>
                    <button onClick={() => handleDelete(event.id)} className="flex-1 bg-red-50 text-red-600 font-black py-2 px-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors border-2 border-red-200 hover:border-red-600 text-sm">
                      <Trash2 size={16} /> ลบถาวร
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}