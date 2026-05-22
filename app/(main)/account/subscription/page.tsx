'use client'
// app/(main)/account/subscription/page.tsx

import { useState, useEffect, useMemo, Suspense } from 'react'
import { createBrowserClient }                    from '@supabase/ssr'
import Link                                       from 'next/link'
import { useSearchParams }                        from 'next/navigation'
import {
  Crown, PawPrint, Plus, AlertCircle,
  CheckCircle2, ChevronRight, Receipt,
  Bell, Shield, Loader2, User, Phone, MapPin, Briefcase, Users
} from 'lucide-react'

interface SubInfo {
  plan:            string
  expires_at:      string | null
  grace_until:     string | null
  is_active: boolean
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

interface ProfileInfo {
  display_name:   string
  tel:            string
  province:       string
  community_role: string
  gender:         string
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  approved: { label: '✅ สำเร็จ',     color: 'text-green-600' },
  pending:  { label: '⏳ รอตรวจ',     color: 'text-amber-500' },
  rejected: { label: '❌ ปฏิเสธ',     color: 'text-red-600' },
}

const SLIP_TYPE_LABEL: Record<string, string> = {
  member:  '⭐ Member 1 ปี',
  addon_1: '➕ เพิ่มช่องสัตว์เลี้ยง +1',
  addon_3: '➕ เพิ่มช่องสัตว์เลี้ยง +3',
}

const EXPERTISE_OPTIONS = [
  { value: 'general', label: 'ผู้ใช้งานทั่วไป (พร้อมช่วยเป็นหูเป็นตา)' },
  { value: 'volunteer', label: 'อาสาสมัคร / ศูนย์พักพิงสัตว์' },
  { value: 'petscout', label: 'PetScout (รับจ้างตามหาสัตว์หาย)' },
  { value: 'vet', label: 'สัตวแพทย์ / คลินิกรักษาสัตว์' },
  { value: 'groomer', label: 'บริการอาบน้ำตัดขน / โรงแรมสัตว์' },
  { value: 'petsitter', label: 'รับฝากหรือดูแลสัตว์ที่บ้าน' },
  { value: 'retailer', label: 'ร้านจำหน่ายอาหารและอุปกรณ์สัตว์เลี้ยง' },
  { value: 'other', label: 'อื่นๆ' },
]

const THAILAND_PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำปูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
]

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
        <Loader2 size={48} className="animate-spin text-ori-ink" />
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  )
}

function SubscriptionContent() {
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const searchParams = useSearchParams()
  const statusParam  = searchParams.get('status') // 'success' จากการตรวจสลิปหน้าก่อน

  // ── States ──────────────────────────────────────────────────
  const [sub, setSub]             = useState<SubInfo | null>(null)
  const [payments, setPayments]   = useState<PaymentRecord[]>([])
  const [loading, setLoading]     = useState(true)

  // Profile States
  const [profile, setProfile]     = useState<ProfileInfo>({
    display_name: '',
    tel: '',
    province: '',
    community_role: 'general',
    gender: ''
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError]   = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // ── Fetch Data ──────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. ดึงข้อมูล Subscription
        const { data: sData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (sData) {
          setSub({
            plan:            sData.plan || 'free',
            expires_at:      sData.expires_at,
            grace_until:     sData.grace_until,
            is_active: sData.is_active ?? false,
            pet_slots_addon: sData.pet_slots_addon || 0,
            pet_limit:       sData.pet_limit || 2,
            days_left:       sData.days_left || 0,
            in_grace:        sData.in_grace || false,
            is_expired:      sData.is_expired || false,
          })
        }

        // 2. ดึงข้อมูลการชำระเงิน (Payments)
        const { data: pData } = await supabase
          .from('payments')
          .select('id, amount, status, slip_type, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (pData) setPayments(pData)

        // 3. ดึงข้อมูลโปรไฟล์ผู้ใช้ (Profiles)
        const { data: profData } = await supabase
          .from('profiles')
          .select('display_name, tel, province, community_role, gender')
          .eq('id', user.id)
          .maybeSingle()

        if (profData) {
          setProfile({
            display_name:   profData.display_name || '',
            tel:            profData.tel || '',
            province:       profData.province || '',
            community_role: profData.community_role || 'general',
            gender:         profData.gender || ''
          })
        }

      } catch (err) {
        console.error('Error loading account data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [supabase])

  // ── Handle Save Profile ─────────────────────────────────────
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileError(null)
    setProfileSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่อีกครั้ง')

      if (!profile.display_name.trim()) throw new Error('กรุณากรอกชื่อที่ใช้แสดงผล')
      if (!profile.tel.trim()) throw new Error('กรุณากรอกเบอร์โทรศัพท์สำหรับติดต่อ')

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name:   profile.display_name.trim(),
          tel:            profile.tel.trim(),
          province:       profile.province,
          community_role: profile.community_role,
          gender:         profile.gender
        })
        .eq('id', user.id)

      if (error) throw error

      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 4000)
    } catch (err: any) {
      console.error(err)
      setProfileError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-ori-ink" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* ── แจ้งเตือนสลิปผ่านการตรวจสอบสำเร็จ ── */}
      {statusParam === 'success' && (
        <div className="p-4 bg-green-50 border-4 border-black rounded-2xl shadow-paper-sm flex items-center gap-3 text-green-900">
          <CheckCircle2 size={24} className="text-green-600 shrink-0" />
          <div>
            <p className="font-black">ส่งหลักฐานเรียบร้อยแล้ว!</p>
            <p className="text-sm font-bold text-green-700">ระบบ AI กำลังตรวจสอบสลิปของท่าน สถานะจะอัปเดตอัตโนมัติภายใน 30 วินาทีค่ะ</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* ════════════════════════════════════════════════════════
            ฝั่งซ้าย & กลาง: ข้อมูลโปรไฟล์ผู้ใช้งาน (Profiles) 
           ════════════════════════════════════════════════════════ */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-paper">
            <div className="flex items-center gap-3 mb-6 border-b-4 border-black pb-4">
              <div className="p-2 bg-wagashi-matcha border-2 border-black rounded-xl">
                <User size={24} className="text-black" />
              </div>
              <h2 className="font-display font-black text-2xl text-ori-ink">ข้อมูลโปรไฟล์ส่วนตัว</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* ชื่อผู้ใช้งาน */}
                <div className="space-y-1">
                  <label className="font-black text-sm text-ori-ink flex items-center gap-1">ชื่อ-นามสกุล / ชื่อแสดงผล</label>
                  <input 
                    type="text"
                    value={profile.display_name}
                    onChange={e => setProfile({ ...profile, display_name: e.target.value })}
                    placeholder="ป้อนชื่อของคุณ"
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-gray-50 focus:bg-white outline-none transition-colors"
                  />
                </div>

                {/* เบอร์โทรศัพท์ */}
                <div className="space-y-1">
                  <label className="font-black text-sm text-ori-ink flex items-center gap-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input 
                    type="text"
                    value={profile.tel}
                    onChange={e => setProfile({ ...profile, tel: e.target.value })}
                    placeholder="08x-xxx-xxxx"
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-gray-50 focus:bg-white outline-none transition-colors"
                  />
                </div>

                {/* เพศ (Gender) - เพิ่มเติมตามที่ลืมไปในเวอร์ชันแรก */}
                <div className="space-y-1">
                  <label className="font-black text-sm text-ori-ink">เพศ</label>
                  <select
                    value={profile.gender}
                    onChange={e => setProfile({ ...profile, gender: e.target.value })}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-gray-50 focus:bg-white outline-none transition-colors cursor-pointer"
                  >
                    <option value="">-- เลือกเพศ --</option>
                    <option value="male">♂ ชาย / เพศผู้</option>
                    <option value="female">♀ หญิง / เพศเมีย</option>
                    <option value="other">🌈 LGBTQ+ / ไม่ระบุ</option>
                  </select>
                </div>

                {/* จังหวัด */}
                <div className="space-y-1">
                  <label className="font-black text-sm text-ori-ink">จังหวัดที่พำนัก</label>
                  <select
                    value={profile.province}
                    onChange={e => setProfile({ ...profile, province: e.target.value })}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-gray-50 focus:bg-white outline-none transition-colors cursor-pointer"
                  >
                    <option value="">-- เลือกจังหวัด --</option>
                    {THAILAND_PROVINCES.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                {/* บทบาทในชุมชน */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-black text-sm text-ori-ink">บทบาทของคุณในเครือข่ายชุมชน</label>
                  <select
                    value={profile.community_role}
                    onChange={e => setProfile({ ...profile, community_role: e.target.value })}
                    className="w-full border-2 border-black rounded-xl p-3 font-bold bg-gray-50 focus:bg-white outline-none transition-colors cursor-pointer"
                  >
                    {EXPERTISE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* ข้อความแจ้งเตือนสถานะการบันทึก */}
              {profileError && (
                <div className="p-3 bg-red-50 border-2 border-red-500 rounded-xl flex items-center gap-2 text-red-900 font-bold text-sm">
                  <AlertCircle size={16} className="text-red-500 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              {profileSuccess && (
                <div className="p-3 bg-green-50 border-2 border-green-500 rounded-xl flex items-center gap-2 text-green-900 font-bold text-sm">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  <span>บันทึกข้อมูลโปรไฟล์สำเร็จเรียบร้อยแล้วล่ะ! 🎉</span>
                </div>
              )}

              {/* ปุ่มบันทึกแก้ไขข้อมูล */}
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-4 bg-black text-white font-black rounded-xl border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {savingProfile ? (
                  <><Loader2 size={18} className="animate-spin" /> กำลังบันทึกข้อมูล...</>
                ) : (
                  "💾 บันทึกการแก้ไขโปรไฟล์"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            ฝั่งขวา: แสดงสถานะแพ็กเกจ (Subscriptions)
           ════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-paper relative overflow-hidden">
            {sub?.is_active && (
              <div className="absolute top-0 right-0 bg-ori-yellow border-b-4 border-l-4 border-black px-4 py-1 text-xs font-black">
                ACTIVE
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              <Crown size={20} className={sub?.is_active ? 'text-ori-yellow' : 'text-gray-400'} />
              <h3 className="font-display font-black text-xl text-ori-ink">สถานะแพ็คเกจ</h3>
            </div>

            {/* รายละเอียดการเป็นสมาชิก */}
            <div className="space-y-3 border-b-2 border-dashed border-gray-200 pb-4">
              <div>
                <p className="text-xs font-bold text-gray-400">ระดับสมาชิก</p>
                <p className="font-black text-lg">
                  {sub?.plan === 'member' ? '⭐ Premium Member' : '🐾 ผู้ใช้ทั่วไป (Free)'}
                </p>
              </div>

              {sub?.plan === 'member' && (
                <div>
                  <p className="text-xs font-bold text-gray-400">วันหมดอายุ</p>
                  <p className="font-bold text-sm text-ori-ink-m">
                    {thDate(sub.expires_at)}
                    {sub.days_left > 0 && (
                      <span className="ml-2 text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        เหลือ {sub.days_left} วัน
                      </span>
                    )}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 bg-gray-50 border-2 border-black rounded-xl text-center">
                  <p className="text-[10px] font-black text-gray-400">โควตาปกติ</p>
                  <p className="font-black text-lg text-ori-ink">{sub?.pet_limit || 2} ตัว</p>
                </div>
                <div className="p-2 bg-blue-50 border-2 border-black rounded-xl text-center">
                  <p className="text-[10px] font-black text-blue-400">สล็อต Add-on</p>
                  <p className="font-black text-lg text-blue-600">+{sub?.pet_slots_addon || 0}</p>
                </div>
              </div>
            </div>

            {/* CTA ต่ออายุ/ซื้อสล็อตเพิ่ม */}
            <div className="pt-4 space-y-2">
              <Link href="/pricing"
                className="w-full py-3 bg-ori-yellow text-black font-black text-sm rounded-xl border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1">
                <Crown size={16} />
                {sub?.plan === 'member' ? 'ต่ออายุสมาชิกล่วงหน้า' : 'สมัครเป็น Premium Member'}
              </Link>
              <Link href="/pricing?tab=addon"
                className="w-full py-3 bg-white text-black font-black text-sm rounded-xl border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1">
                <Plus size={16} />
                ซื้อสล็อตสัตว์เลี้ยงเพิ่ม
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════
          ส่วนประวัติการโอนเงินและบิลชำระเงิน (Payments)
         ════════════════════════════════════════════════════════ */}
      {payments.length > 0 && (
        <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-paper">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
            <Receipt size={18} className="text-gray-500" />
            <h3 className="font-display font-black text-lg text-ori-ink">ประวัติการสั่งซื้อและแจ้งโอน</h3>
          </div>

          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto pr-2">
            {payments.map(p => {
              const s = STATUS_LABEL[p.status] || { label: p.status, color: 'text-gray-600' }
              return (
                <div key={p.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-black text-sm text-ori-ink">{SLIP_TYPE_LABEL[p.slip_type] || p.slip_type}</p>
                    <p className="text-xs font-bold text-gray-400">
                      แจ้งโอนเมื่อ: {new Date(p.created_at).toLocaleDateString('th-TH')} {new Date(p.created_at).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} น.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-black">฿{p.amount}</p>
                    <p className={`text-xs font-black ${s.color}`}>{s.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ข้อมูลช่วยเหลือ/ความปลอดภัยเพิ่มเติม ── */}
      <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl flex items-start gap-3">
        <Shield size={16} className="text-gray-400 shrink-0 mt-0.5" />
        <div className="text-xs font-bold text-gray-500 space-y-1">
          <p>ชำระผ่าน PromptPay โอนแล้วส่งสลิป AI ตรวจสอบความถูกต้องและอนุมัติระดับสมาชิกทันทีภายใน 30 วินาที</p>
          <p>หากพบปัญหาในการกรอกโปรไฟล์หรือยอดเงินสมาชิกไม่ปรับเปลี่ยน สามารถติดต่อทีมงาน PobPet ได้ตลอด 24 ชม.</p>
        </div>
      </div>

    </div>
  )
}