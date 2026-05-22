'use client'
// app/(main)/account/subscription/page.tsx

import { useState, useEffect, useMemo, Suspense } from 'react'
import { createBrowserClient }                    from '@supabase/ssr'
import Link                                       from 'next/link'
import Image                                      from 'next/image' // 🟢 เพิ่มบรรทัดนี้เข้าไปครับ
import { useSearchParams }                        from 'next/navigation'
import {
  Crown, PawPrint, Plus, AlertCircle,
  CheckCircle2, ChevronRight, Receipt,
  Bell, Shield, Loader2
} from 'lucide-react'

interface SubInfo {
  plan:            string
  expires_at:      string | null
  grace_until:     string | null
  is_active:       boolean
  pet_slots_addon: number
  pet_limit:       number
  days_left:       number
  in_grace:        boolean
  is_expired:      boolean
}

interface PaymentRecord {
  id:            string
  amount:        number
  status:        string
  slip_type:     string
  created_at:    string
}

// ── Format date Thai ──────────────────────────────────────────
function thDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

// ══════════════════════════════════════════════════════════════
export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-ori-orange" />
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  )
}

function SubscriptionContent() {
  const supabase     = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const searchParams = useSearchParams()

  const [sub,        setSub]        = useState<SubInfo | null>(null)
  const [payments,   setPayments]   = useState<PaymentRecord[]>([])
  const [petCount,   setPetCount]   = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [addonToast, setAddonToast] = useState(false)

  // แสดง toast เมื่อ redirect มาจากการซื้อ addon สำเร็จ
  useEffect(() => {
    if (searchParams.get('addon') === 'success') {
      setAddonToast(true)
      setTimeout(() => setAddonToast(false), 5000)
    }
  }, [searchParams])

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const userId = session.user.id
      const now    = new Date()

      // ── Subscription ──────────────────────────────────────
      const { data: s } = await supabase
        .from('subscriptions')
        .select('plan, expires_at, grace_until, is_active, pet_slots_addon')
        .eq('user_id', userId)
        .single()

      if (s) {
        const expires   = s.expires_at  ? new Date(s.expires_at)  : null
        const grace     = s.grace_until ? new Date(s.grace_until) : null
        const isExpired = expires ? expires < now : false
        const inGrace   = isExpired && grace ? grace > now : false
        const daysLeft  = inGrace && grace
          ? Math.ceil((grace.getTime() - now.getTime()) / 86400000)
          : !isExpired && expires
            ? Math.ceil((expires.getTime() - now.getTime()) / 86400000)
            : 0
        const addon    = s.pet_slots_addon || 0
        const petLimit = s.plan === 'member' && !isExpired ? 3 + addon : 1

        setSub({
          plan:            s.plan,
          expires_at:      s.expires_at,
          grace_until:     s.grace_until,
          is_active:       s.is_active,
          pet_slots_addon: addon,
          pet_limit:       petLimit,
          days_left:       daysLeft,
          in_grace:        inGrace,
          is_expired:      isExpired,
        })
      }

      // ── Pet count ─────────────────────────────────────────
      const { count } = await supabase
        .from('pets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active')
      setPetCount(count || 0)

      // ── Payment history ───────────────────────────────────
      const { data: pData } = await supabase
        .from('payment_slips')
        .select('id, amount, status, slip_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
      setPayments(pData || [])

      setLoading(false)
    }
    load()
  }, [])

  const isMember   = sub?.plan === 'member' && !sub?.is_expired
  const statusColor = sub?.in_grace
    ? 'bg-red-50 border-red-300'
    : isMember
      ? 'bg-amber-50 border-amber-300'
      : 'bg-gray-50 border-gray-300'

  const SLIP_TYPE_LABEL: Record<string, string> = {
    member:  '⭐ Member ฿399/ปี',
    addon_1: '➕ Add-on +1 ตัว ฿79',
    addon_3: '➕ Add-on +3 ตัว ฿199',
  }
  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    auto_approved: { label: 'ผ่านแล้ว ✅',     color: 'text-green-600' },
    approved:      { label: 'ผ่านแล้ว ✅',     color: 'text-green-600' },
    pending:       { label: 'รอตรวจสอบ ⏳',   color: 'text-amber-600' },
    rejected:      { label: 'ไม่ผ่าน ❌',      color: 'text-red-600'   },
  }

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 size={48} className="animate-spin text-ori-orange" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 mb-20 space-y-6">

      <h1 className="text-3xl font-black flex items-center gap-2">
        <Crown size={28} className="text-amber-500" /> จัดการแพ็คเกจ
      </h1>

      {/* ── Addon success toast ── */}
      {addonToast && (
        <div className="p-4 bg-green-50 border-2 border-green-400
          rounded-2xl flex items-center gap-3 animate-bounce-once">
          <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="font-black text-green-800">เพิ่ม Slot น้องสำเร็จแล้วค่ะ! 🐾</p>
            <p className="text-xs font-bold text-green-600">
              สร้างโปรไฟล์น้องเพิ่มได้เลย
            </p>
          </div>
          <Link href="/pets/new"
            className="ml-auto text-xs font-black text-green-700
              bg-green-200 px-3 py-2 rounded-xl border border-green-400
              hover:bg-green-300 transition-all shrink-0">
            สร้างเลย →
          </Link>
        </div>
      )}

      {/* ── Plan status card ── */}
      <div className={`border-4 rounded-3xl p-6 shadow-paper ${statusColor}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-black uppercase text-gray-500 mb-1">แพ็คเกจปัจจุบัน</p>
            <h2 className="text-2xl font-black">
              {isMember ? '⭐ Member' : '🐾 Free'}
            </h2>
          </div>
          {isMember && (
            <div className="text-right">
              <p className="text-xs font-bold text-gray-500">หมดอายุ</p>
              <p className="font-black text-sm">{thDate(sub?.expires_at || null)}</p>
              {(sub?.days_left || 0) <= 30 && (
                <p className={`text-xs font-black mt-0.5 ${
                  (sub?.days_left || 0) <= 7 ? 'text-red-600' : 'text-amber-600'
                }`}>
                  เหลือ {sub?.days_left} วัน
                </p>
              )}
            </div>
          )}
        </div>

        {/* Grace period warning */}
        {sub?.in_grace && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-xl
            flex items-start gap-2 mb-4">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-sm text-red-800">อยู่ในช่วง Grace Period</p>
              <p className="text-xs font-bold text-red-600">
                ข้อมูลน้องจะถูกซ่อนใน {sub?.days_left} วัน ถ้าไม่ต่ออายุ
              </p>
            </div>
          </div>
        )}

        {/* Pet slots */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/70 rounded-xl p-3 text-center">
            <p className="text-xs font-bold text-gray-500">โปรไฟล์น้อง</p>
            <p className="font-black text-lg">{petCount}/{sub?.pet_limit || 1}</p>
          </div>
          <div className="bg-white/70 rounded-xl p-3 text-center">
            <p className="text-xs font-bold text-gray-500">Base slots</p>
            <p className="font-black text-lg">{isMember ? '3' : '1'}</p>
          </div>
          <div className="bg-white/70 rounded-xl p-3 text-center">
            <p className="text-xs font-bold text-gray-500">Add-on slots</p>
            <p className="font-black text-lg text-amber-600">+{sub?.pet_slots_addon || 0}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {isMember ? (
            <>
              <Link href="/payment/slip?type=member"
                className="flex items-center justify-center gap-2 py-3 px-6
                  bg-ori-ink text-white font-black rounded-xl border-2 border-ori-ink
                  shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5 transition-all">
                <Crown size={16} className="text-amber-400" />
                ต่ออายุ Member ฿399/ปี
              </Link>
              <Link href="/pricing/addon"
                className="flex items-center justify-center gap-2 py-3 px-6
                  bg-white font-black rounded-xl border-2 border-ori-ink
                  shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5 transition-all">
                <Plus size={16} /> ซื้อ slot น้องเพิ่ม
              </Link>
            </>
          ) : (
            <Link href="/pricing"
              className="flex items-center justify-center gap-2 py-3 px-6
                bg-ori-ink text-white font-black rounded-xl border-2 border-ori-ink
                shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5 transition-all">
              <Crown size={16} className="text-amber-400" />
              อัปเกรด Member ฿399/ปี
              <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </div>

      {/* ── Feature list ── */}
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper">
        <h2 className="font-black text-lg mb-4">สิทธิ์ที่มี</h2>
        {[
          { label: 'ประกาศหาย / แจ้งพบ',  free: true,           member: true          },
          { label: 'AI Matching',          free: true,           member: true          },
          { label: 'Chatbot',              free: '5 ครั้ง/วัน', member: 'ไม่จำกัด'    },
          { label: 'Pet Profile',          free: '1 ตัว',        member: `${sub?.pet_limit || 3} ตัว` },
          { label: 'สมุดสุขภาพ',          free: false,          member: true          },
          { label: 'บันทึกผ่าน Chatbot',  free: false,          member: true          },
          { label: 'QR Code ปลอกคอ',      free: false,          member: true          },
          { label: 'LINE OA แจ้งเตือน',   free: false,          member: true          },
          { label: 'ซื้อ slot เพิ่มได้',  free: false,          member: true          },
        ].map((f, i) => (
          <div key={i} className={`flex items-center justify-between py-2.5 ${
            i > 0 ? 'border-t border-gray-100' : ''
          }`}>
            <span className="text-sm font-bold text-ori-ink">{f.label}</span>
            <span className={`text-sm font-black ${
              isMember
                ? 'text-green-600'
                : f.free === true ? 'text-green-600' : 'text-gray-300'
            }`}>
              {isMember
                ? (f.member === true ? '✓' : f.member === false ? '—' : f.member)
                : (f.free === true ? '✓' : f.free === false ? '—' : f.free)
              }
            </span>
          </div>
        ))}
      </div>

      {/* ── Payment history ── */}
      {payments.length > 0 && (
        <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper">
          <h2 className="font-black text-lg mb-4 flex items-center gap-2">
            <Receipt size={18} /> ประวัติการชำระ
          </h2>
          <div className="space-y-3">
            {payments.map(p => {
              const s = STATUS_LABEL[p.status] || { label: p.status, color: 'text-gray-600' }
              return (
                <div key={p.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-bold text-sm">{SLIP_TYPE_LABEL[p.slip_type] || p.slip_type}</p>
                    <p className="text-xs font-bold text-gray-400">
                      {new Date(p.created_at).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm">฿{p.amount}</p>
                    <p className={`text-xs font-bold ${s.color}`}>{s.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Renewal info ── */}
      <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl
        flex items-start gap-3">
        <Shield size={16} className="text-gray-400 shrink-0 mt-0.5" />
        <div className="text-xs font-bold text-gray-500 space-y-1">
          <p>ชำระผ่าน PromptPay โอนแล้วส่งสลิป AI ตรวจอัตโนมัติ</p>
          <p>Add-on slots ผูกกับ Member — ถ้า Member หมดอายุ slots จะหยุดใช้งานชั่วคราวด้วย</p>
          <p>Grace Period 30 วัน — ข้อมูลยังอยู่ครบ ต่ออายุเมื่อไหรก็ได้</p>
        </div>
      </div>
    </div>
  )
}
