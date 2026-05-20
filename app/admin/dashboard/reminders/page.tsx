'use client'
// app/(main)/dashboard/reminders/page.tsx

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient }          from '@supabase/ssr'
import { useRouter }                    from 'next/navigation'
import Link                             from 'next/link'
import {
  Bell, CheckCircle2, Trash2, PawPrint,
  Calendar, Repeat, Loader2, Plus,
  ChevronRight, Clock
} from 'lucide-react'

interface Reminder {
  id:            string
  title:         string
  body:          string | null
  remind_at:     string
  next_remind_at: string | null
  repeat_type:   string
  is_done:       boolean
  source:        string
  pet_id:        string | null
  pet_name?:     string
  created_at:    string
}

// ── Repeat label ──────────────────────────────────────────────
const REPEAT_LABEL: Record<string, string> = {
  none:    '',
  daily:   '🔁 ทุกวัน',
  weekly:  '🔁 ทุกสัปดาห์',
  monthly: '🔁 ทุกเดือน',
  yearly:  '🔁 ทุกปี',
}

// ── Format date ───────────────────────────────────────────────
function thDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function daysFromNow(d: string | null): number {
  if (!d) return 0
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

// ── Status badge ──────────────────────────────────────────────
function StatusBadge({ reminder }: { reminder: Reminder }) {
  if (reminder.is_done) return (
    <span className="text-xs font-black text-gray-400 bg-gray-100
      px-2 py-0.5 rounded-full">เสร็จแล้ว</span>
  )
  const days = daysFromNow(reminder.next_remind_at || reminder.remind_at)
  if (days < 0)  return <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full">เลยกำหนด {Math.abs(days)} วัน</span>
  if (days === 0) return <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">วันนี้!</span>
  if (days <= 7)  return <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">อีก {days} วัน</span>
  return <span className="text-xs font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">อีก {days} วัน</span>
}

// ══════════════════════════════════════════════════════════════
export default function RemindersPage() {
  const router   = useRouter()
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [reminders,  setReminders]  = useState<Reminder[]>([])
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState<'upcoming' | 'done'>('upcoming')
  const [deleting,   setDeleting]   = useState<string | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    // ดึง reminders พร้อม pet name
    const { data } = await supabase
      .from('reminders')
      .select(`
        id, title, body, remind_at, next_remind_at,
        repeat_type, is_done, source, pet_id, created_at,
        pets (name)
      `)
      .eq('user_id', session.user.id)
      .order('next_remind_at', { ascending: true, nullsFirst: false })
      .order('remind_at', { ascending: true })

    const mapped: Reminder[] = (data || []).map((r: any) => ({
      ...r,
      pet_name: r.pets?.name || null,
    }))
    setReminders(mapped)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ── Mark done ─────────────────────────────────────────────
  const markDone = async (id: string) => {
    setCompleting(id)
    await supabase.from('reminders').update({ is_done: true }).eq('id', id)
    setReminders(prev => prev.map(r => r.id === id ? { ...r, is_done: true } : r))
    setCompleting(null)
  }

  // ── Delete ────────────────────────────────────────────────
  const deleteReminder = async (id: string) => {
    setDeleting(id)
    await supabase.from('reminders').delete().eq('id', id)
    setReminders(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  const upcoming = reminders.filter(r => !r.is_done)
  const done     = reminders.filter(r => r.is_done)
  const shown    = activeTab === 'upcoming' ? upcoming : done

  // ── Group upcoming by urgency ─────────────────────────────
  const overdue  = upcoming.filter(r => daysFromNow(r.next_remind_at || r.remind_at) < 0)
  const today    = upcoming.filter(r => daysFromNow(r.next_remind_at || r.remind_at) === 0)
  const soon     = upcoming.filter(r => {
    const d = daysFromNow(r.next_remind_at || r.remind_at)
    return d > 0 && d <= 7
  })
  const later    = upcoming.filter(r => daysFromNow(r.next_remind_at || r.remind_at) > 7)

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 size={48} className="animate-spin text-ori-orange" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 mb-20">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2">
            <Bell size={28} /> แจ้งเตือน
          </h1>
          <p className="text-sm font-bold text-ori-ink-l mt-0.5">
            รอดำเนินการ {upcoming.length} · เสร็จแล้ว {done.length}
          </p>
        </div>
        {/* ปุ่มชวนให้ใช้ Chatbot เพิ่ม reminder */}
        <Link href="/"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-black
            border-2 border-ori-ink rounded-xl bg-white
            hover:bg-gray-50 transition-all shadow-paper-sm">
          <Plus size={14} /> เพิ่มผ่าน Chatbot
        </Link>
      </div>

      {/* Chatbot hint */}
      <div className="p-3 bg-purple-50 border-2 border-purple-200 rounded-2xl
        flex items-center gap-3 mb-6">
        <span className="text-lg">🤖</span>
        <p className="text-xs font-bold text-purple-700">
          พิมพ์ใน Chatbot ว่า &quot;เตือนฉีดวัคซีนน้องบัตเตอร์เดือนหน้า&quot;
          ระบบจะเพิ่มแจ้งเตือนให้อัตโนมัติค่ะ
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b-4 border-ori-ink pb-2 mb-6">
        {[
          { key: 'upcoming', label: `รอดำเนินการ (${upcoming.length})` },
          { key: 'done',     label: `เสร็จแล้ว (${done.length})`       },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-1 px-3 font-black text-sm transition-all ${
              activeTab === tab.key
                ? 'text-ori-orange border-b-4 border-ori-orange -mb-[20px]'
                : 'text-ori-ink-l'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {shown.length === 0 && (
        <div className="text-center py-20 bg-white border-4 border-dashed
          border-gray-300 rounded-3xl">
          <Bell size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="font-black text-xl text-ori-ink-l mb-2">
            {activeTab === 'upcoming' ? 'ยังไม่มีแจ้งเตือน' : 'ยังไม่มีที่เสร็จแล้ว'}
          </p>
          <p className="text-sm font-bold text-gray-400">
            พิมพ์ขอให้ Chatbot ตั้งแจ้งเตือนได้เลยค่ะ
          </p>
        </div>
      )}

      {/* Upcoming — grouped */}
      {activeTab === 'upcoming' && upcoming.length > 0 && (
        <div className="space-y-6">
          {/* Overdue */}
          {overdue.length > 0 && (
            <div>
              <p className="text-xs font-black text-red-600 uppercase tracking-wide mb-2">
                🚨 เลยกำหนดแล้ว
              </p>
              <div className="space-y-3">
                {overdue.map(r => <ReminderCard key={r.id} reminder={r}
                  onDone={markDone} onDelete={deleteReminder}
                  completing={completing} deleting={deleting} />)}
              </div>
            </div>
          )}
          {/* Today */}
          {today.length > 0 && (
            <div>
              <p className="text-xs font-black text-orange-600 uppercase tracking-wide mb-2">
                🔔 วันนี้
              </p>
              <div className="space-y-3">
                {today.map(r => <ReminderCard key={r.id} reminder={r}
                  onDone={markDone} onDelete={deleteReminder}
                  completing={completing} deleting={deleting} />)}
              </div>
            </div>
          )}
          {/* Soon (7 วัน) */}
          {soon.length > 0 && (
            <div>
              <p className="text-xs font-black text-amber-600 uppercase tracking-wide mb-2">
                📅 ใน 7 วัน
              </p>
              <div className="space-y-3">
                {soon.map(r => <ReminderCard key={r.id} reminder={r}
                  onDone={markDone} onDelete={deleteReminder}
                  completing={completing} deleting={deleting} />)}
              </div>
            </div>
          )}
          {/* Later */}
          {later.length > 0 && (
            <div>
              <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-2">
                🗓 กำหนดในอนาคต
              </p>
              <div className="space-y-3">
                {later.map(r => <ReminderCard key={r.id} reminder={r}
                  onDone={markDone} onDelete={deleteReminder}
                  completing={completing} deleting={deleting} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Done list */}
      {activeTab === 'done' && done.length > 0 && (
        <div className="space-y-3">
          {done.map(r => <ReminderCard key={r.id} reminder={r}
            onDone={markDone} onDelete={deleteReminder}
            completing={completing} deleting={deleting} />)}
        </div>
      )}
    </div>
  )
}

// ── Reminder Card Component ───────────────────────────────────
function ReminderCard({
  reminder, onDone, onDelete, completing, deleting,
}: {
  reminder:   Reminder
  onDone:     (id: string) => void
  onDelete:   (id: string) => void
  completing: string | null
  deleting:   string | null
}) {
  const isOverdue = daysFromNow(reminder.next_remind_at || reminder.remind_at) < 0

  return (
    <div className={`bg-white border-4 rounded-2xl p-4 shadow-paper transition-all ${
      reminder.is_done
        ? 'border-gray-200 opacity-60'
        : isOverdue
          ? 'border-red-400'
          : 'border-ori-ink'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Pet tag */}
          {reminder.pet_name && (
            <div className="flex items-center gap-1 mb-1">
              <PawPrint size={12} className="text-ori-orange" />
              <span className="text-xs font-black text-ori-orange">{reminder.pet_name}</span>
            </div>
          )}

          {/* Title */}
          <p className={`font-black text-sm ${reminder.is_done ? 'line-through text-gray-400' : ''}`}>
            {reminder.title}
          </p>

          {/* Body */}
          {reminder.body && (
            <p className="text-xs font-bold text-ori-ink-l mt-0.5">{reminder.body}</p>
          )}

          {/* Date & repeat */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs font-bold text-ori-ink-l">
              <Clock size={11} />
              {thDate(reminder.next_remind_at || reminder.remind_at)}
            </div>
            {reminder.repeat_type !== 'none' && (
              <span className="text-xs font-bold text-blue-600">
                {REPEAT_LABEL[reminder.repeat_type]}
              </span>
            )}
            <StatusBadge reminder={reminder} />
          </div>
        </div>

        {/* Actions */}
        {!reminder.is_done && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onDone(reminder.id)}
              disabled={completing === reminder.id}
              title=&quot;ทำเสร็จแล้ว&quot;
              className="w-8 h-8 rounded-lg bg-green-100 text-green-700
                border border-green-300 flex items-center justify-center
                hover:bg-green-200 transition-all disabled:opacity-50">
              {completing === reminder.id
                ? <Loader2 size={14} className="animate-spin" />
                : <CheckCircle2 size={14} />
              }
            </button>
            <button
              onClick={() => onDelete(reminder.id)}
              disabled={deleting === reminder.id}
              title=&quot;ลบ&quot;
              className="w-8 h-8 rounded-lg bg-red-50 text-red-500
                border border-red-200 flex items-center justify-center
                hover:bg-red-100 transition-all disabled:opacity-50">
              {deleting === reminder.id
                ? <Loader2 size={14} className="animate-spin" />
                : <Trash2 size={14} />
              }
            </button>
          </div>
        )}

        {/* Done → delete only */}
        {reminder.is_done && (
          <button
            onClick={() => onDelete(reminder.id)}
            disabled={deleting === reminder.id}
            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-400
              border border-gray-200 flex items-center justify-center
              hover:bg-gray-200 transition-all disabled:opacity-50 shrink-0">
            {deleting === reminder.id
              ? <Loader2 size={14} className="animate-spin" />
              : <Trash2 size={14} />
            }
          </button>
        )}
      </div>
    </div>
  )
}
