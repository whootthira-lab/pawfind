'use client'
// app/profile/complete/page.tsx
// ── โผล่ครั้งเดียวหลัง LINE Login เพื่อเก็บข้อมูลที่ขาด ──

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Loader2, CheckCircle2, MapPin, Phone, Briefcase,
  Heart, ChevronRight, SkipForward, AlertCircle
} from 'lucide-react'

// ── Shared constants ─────────────────────────────────────────
const thailandProvinces = [
  "กรุงเทพมหานคร","กระบี่","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร",
  "ขอนแก่น","จันทบุรี","ฉะเชิงเทรา","ชลบุรี","ชัยนาท","ชัยภูมิ",
  "ชุมพร","เชียงราย","เชียงใหม่","ตรัง","ตราด","ตาก","นครนายก",
  "นครปฐม","นครพนม","นครราชสีมา","นครศรีธรรมราช","นครสวรรค์",
  "นนทบุรี","นราธิวาส","น่าน","บึงกาฬ","บุรีรัมย์","ปทุมธานี",
  "ประจวบคีรีขันธ์","ปราจีนบุรี","ปัตตานี","พระนครศรีอยุธยา",
  "พะเยา","พังงา","พัทลุง","พิจิตร","พิษณุโลก","เพชรบุรี","เพชรบูรณ์",
  "แพร่","ภูเก็ต","มหาสารคาม","มุกดาหาร","แม่ฮ่องสอน","ยโสธร",
  "ยะลา","ร้อยเอ็ด","ระนอง","ระยอง","ราชบุรี","ลพบุรี","ลำปาง",
  "ลำพูน","เลย","ศรีสะเกษ","สกลนคร","สงขลา","สตูล","สมุทรปราการ",
  "สมุทรสงคราม","สมุทรสาคร","สระแก้ว","สระบุรี","สิงห์บุรี",
  "สุโขทัย","สุพรรณบุรี","สุราษฎร์ธานี","สุรินทร์","หนองคาย",
  "หนองบัวลำภู","อ่างทอง","อำนาจเจริญ","อุดรธานี","อุตรดิตถ์",
  "อุทัยธานี","อุบลราชธานี",
].sort()

const occupationOptions = [
  { value: '',               label: '-- เลือกอาชีพ --' },
  { value: 'student',        label: '🎓 นักเรียน / นักศึกษา' },
  { value: 'employee',       label: '💼 พนักงานบริษัท / ลูกจ้าง' },
  { value: 'government',     label: '🏛 ข้าราชการ / รัฐวิสาหกิจ' },
  { value: 'business_owner', label: '🏪 เจ้าของกิจการ / ธุรกิจส่วนตัว' },
  { value: 'freelance',      label: '🖥 Freelance / อาชีพอิสระ' },
  { value: 'agriculturist',  label: '🌾 เกษตรกร' },
  { value: 'healthcare',     label: '🏥 บุคลากรทางการแพทย์' },
  { value: 'educator',       label: '📚 ครู / อาจารย์' },
  { value: 'retired',        label: '🏖 เกษียณอายุ' },
  { value: 'unemployed',     label: '🔍 ว่างงาน / กำลังหางาน' },
  { value: 'other',          label: '✏️ อื่นๆ' },
]

const interestOptions = [
  { value: 'dog',         label: '🐕 สุนัข' },
  { value: 'cat',         label: '🐈 แมว' },
  { value: 'bird',        label: '🦜 นกสวยงาม' },
  { value: 'fish',        label: '🐟 ปลาสวยงาม' },
  { value: 'exotic',      label: '🦎 สัตว์ Exotic' },
  { value: 'rabbit',      label: '🐰 กระต่าย / สัตว์เล็ก' },
  { value: 'health',      label: '🏥 สุขภาพสัตว์' },
  { value: 'prosthetics', label: '🦿 ขาเทียมสัตว์' },
  { value: 'adoption',    label: '💖 รับเลี้ยง / หาบ้าน' },
  { value: 'contest',     label: '🏆 ประกวดสัตว์' },
  { value: 'community',   label: '🤝 อาสาสมัคร' },
  { value: 'memorial',    label: '🕯 ของที่ระลึก' },
]

// ── Step config ──────────────────────────────────────────────
const STEPS = [
  { id: 'contact',    label: 'ช่องทางติดต่อ', icon: '📱' },
  { id: 'location',   label: 'พื้นที่',         icon: '📍' },
  { id: 'interests',  label: 'ความสนใจ',        icon: '❤️' },
]

// ════════════════════════════════════════════════════════════
export default function ProfileCompletePage() {
  const router  = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [step,    setStep]    = useState(0)   // 0,1,2 = 3 steps
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // ── User info from LINE ─────────────────────────────────
  const [user, setUser] = useState<{
    id: string
    name: string
    avatar: string
    email: string
  } | null>(null)

  // ── Form state ──────────────────────────────────────────
  const [form, setForm] = useState({
    phone_number: '',
    line_id:      '',
    province:     'นครราชสีมา',
    district:     '',
    occupation:   '',
    interests:    [] as string[],
  })

  // ── Load session on mount ───────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const u = session.user
      setUser({
        id:     u.id,
        name:   u.user_metadata?.full_name || u.user_metadata?.name || 'ผู้ใช้',
        avatar: u.user_metadata?.avatar_url || '',
        email:  u.email || '',
      })

      // ถ้ากรอกครบแล้ว ไม่ต้องโผล่หน้านี้
      const { data: profile } = await supabase
        .from('profiles')
        .select('occupation, interests, phone_number')
        .eq('id', u.id)
        .single()

      if (profile?.occupation && profile?.interests?.length && profile?.phone_number) {
        // 💡 เพิ่ม welcome=true ให้กรณีหลุดมาหน้านี้แล้วพบว่าข้อมูลครบแล้วด้วย
        router.push('/?welcome=true')
        return
      }

      // Pre-fill ถ้ามีข้อมูลบางส่วนแล้ว
      if (profile?.phone_number) setForm(f => ({ ...f, phone_number: profile.phone_number }))
      if (profile?.occupation)   setForm(f => ({ ...f, occupation: profile.occupation }))
      if (profile?.interests)    setForm(f => ({ ...f, interests: profile.interests }))

      setLoading(false)
    }
    load()
  }, [router, supabase])

  // ── Toggle interest chip ────────────────────────────────
  const toggleInterest = (val: string) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(val)
        ? f.interests.filter(i => i !== val)
        : [...f.interests, val],
    }))
  }

  // ── Save & finish ───────────────────────────────────────
  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)

    const { error: err } = await supabase
      .from('profiles')
      .update({
        phone_number: form.phone_number || null,
        line_id:      form.line_id      || null,
        province:     form.province     || null,
        district:     form.district     || null,
        occupation:   form.occupation   || null,
        interests:    form.interests.length ? form.interests : null,
        updated_at:   new Date().toISOString(),
      })
      .eq('id', user.id)

    if (err) {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่')
      setSaving(false)
      return
    }

    setDone(true)
    // 💡 เติม ?welcome=true ตอนเซฟสำเร็จและส่งกลับไปหน้าแรก
    setTimeout(() => router.push('/?welcome=true'), 1800)
  }

  // ── Skip ────────────────────────────────────────────────
  // 💡 เติม ?welcome=true ตอนกดข้าม
  const handleSkip = () => router.push('/?welcome=true')

  // ── Validation per step ─────────────────────────────────
  const canNext = () => {
    if (step === 0) return form.phone_number.length >= 9
    if (step === 1) return form.province !== ''
    if (step === 2) return true   // interests optional
    return true
  }

  // ── Loading screen ──────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-gray-400" size={40} />
    </div>
  )

  // ── Done screen ─────────────────────────────────────────
  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-sm"
      >
        <div className="text-8xl mb-6">🐾</div>
        <h2 className="text-3xl font-black mb-3">พร้อมแล้ว!</h2>
        <p className="text-gray-500 font-bold">กำลังพาไปหน้าแรก...</p>
        <Loader2 className="animate-spin mx-auto mt-4 text-gray-400" size={24} />
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-16 bg-gray-50/40">
      <div className="w-full max-w-lg">

        {/* ── Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-4 border-black rounded-3xl shadow-paper overflow-hidden"
        >
          {/* ── Header ── */}
          <div className="bg-wagashi-kinako border-b-4 border-black px-8 py-6">
            <div className="flex items-center gap-4">
              {/* Avatar from LINE */}
              <div className="w-16 h-16 rounded-full border-4 border-black overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center shadow-paper-sm">
                {user?.avatar ? (
                  <Image src={user.avatar} alt={user?.name || ''} width={64} height={64}
                    className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🐾</span>
                )}
              </div>
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider">
                  สวัสดี!
                </p>
                <h1 className="text-xl font-black text-ori-ink leading-tight">
                  {user?.name}
                </h1>
                <p className="text-xs font-bold text-gray-400 mt-0.5">
                  กรอกข้อมูลสั้นๆ เพื่อใช้งาน PobPet ได้เต็มที่
                </p>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-5">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-1.5 flex-1 ${i < step ? 'opacity-100' : i === step ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`w-7 h-7 rounded-full border-2 border-black flex items-center justify-center text-xs font-black flex-shrink-0 transition-all ${
                      i < step  ? 'bg-black text-white' :
                      i === step ? 'bg-white text-black' : 'bg-white text-gray-400'
                    }`}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span className="text-xs font-bold text-ori-ink hidden sm:block">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 w-4 flex-shrink-0 transition-all ${i < step ? 'bg-black' : 'bg-black/20'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Step Content ── */}
          <div className="px-8 py-7 min-h-[320px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >

                {/* ── Step 0: Contact ── */}
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-black mb-1">📱 ช่องทางติดต่อ</h2>
                      <p className="text-sm text-gray-400 font-bold">
                        ใช้แจ้งเตือนเมื่อ AI พบสัตว์ที่ตรงกัน
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-black text-gray-600 flex items-center gap-1">
                        <Phone size={13} /> เบอร์โทรศัพท์ *
                      </label>
                      <input
                        type="tel"
                        placeholder="08x-xxx-xxxx"
                        value={form.phone_number}
                        onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                        className="w-full border-2 border-black rounded-xl p-3.5 font-bold text-lg outline-none focus:ring-4 ring-black/10 transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-black text-gray-600">
                        LINE ID (ไม่บังคับ)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น @kruth"
                        value={form.line_id}
                        onChange={e => setForm(f => ({ ...f, line_id: e.target.value }))}
                        className="w-full border-2 border-black rounded-xl p-3.5 font-bold outline-none focus:ring-4 ring-black/10 bg-green-50/30 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* ── Step 1: Location ── */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-black mb-1">📍 พื้นที่ของคุณ</h2>
                      <p className="text-sm text-gray-400 font-bold">
                        ช่วยให้แสดงสัตว์หายและบริการใกล้บ้านคุณได้
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-black text-gray-600 flex items-center gap-1">
                        <MapPin size={13} /> จังหวัด *
                      </label>
                      <select
                        value={form.province}
                        onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                        className="w-full border-2 border-black rounded-xl p-3.5 font-bold bg-white outline-none focus:ring-4 ring-black/10 cursor-pointer"
                      >
                        {thailandProvinces.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-black text-gray-600">
                        อำเภอ / เขต (ไม่บังคับ)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น ด่านขุนทด"
                        value={form.district}
                        onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                        className="w-full border-2 border-black rounded-xl p-3.5 font-bold outline-none focus:ring-4 ring-black/10 transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-black text-gray-600 flex items-center gap-1">
                        <Briefcase size={13} /> อาชีพ (ไม่บังคับ)
                      </label>
                      <select
                        value={form.occupation}
                        onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))}
                        className="w-full border-2 border-black rounded-xl p-3.5 font-bold bg-white outline-none focus:ring-4 ring-black/10 cursor-pointer"
                      >
                        {occupationOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Interests ── */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-black mb-1">❤️ ความสนใจ</h2>
                      <p className="text-sm text-gray-400 font-bold">
                        เลือกได้หลายข้อ — ช่วยให้เราแนะนำได้ตรงขึ้น
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {interestOptions.map(opt => {
                        const selected = form.interests.includes(opt.value)
                        return (
                          <motion.button
                            key={opt.value}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleInterest(opt.value)}
                            className={`px-3 py-2.5 rounded-xl border-2 font-bold text-sm text-left transition-all flex items-center justify-between gap-1 ${
                              selected
                                ? 'border-black bg-wagashi-kinako shadow-paper-sm'
                                : 'border-black/25 bg-white hover:border-black hover:bg-gray-50'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {selected && (
                              <motion.span
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="text-green-600 font-black flex-shrink-0"
                              >✓</motion.span>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>

                    {form.interests.length === 0 && (
                      <p className="text-xs text-gray-400 font-bold text-center italic">
                        ข้ามได้ถ้ายังไม่แน่ใจ เพิ่มทีหลังในโปรไฟล์ได้เลย
                      </p>
                    )}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>

            {/* ── Error ── */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border-2 border-red-300 rounded-xl flex items-center gap-2 text-red-700 text-sm font-bold">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* ── Actions ── */}
            <div className="flex items-center gap-3 mt-6 pt-4 border-t-2 border-black/10">
              {/* Back */}
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="px-4 py-3 border-2 border-black rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                >
                  ← กลับ
                </button>
              )}

              {/* Skip (step 0 only) */}
              {step === 0 && (
                <button
                  onClick={handleSkip}
                  className="flex items-center gap-1 px-4 py-3 text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors"
                >
                  <SkipForward size={14} /> ข้ามไปก่อน
                </button>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Next / Save */}
              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canNext()}
                  className="flex items-center gap-2 px-6 py-3 bg-black text-white font-black rounded-xl border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ถัดไป <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-black text-white font-black rounded-xl border-2 border-black shadow-paper-sm hover:shadow-paper hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60"
                >
                  {saving
                    ? <><Loader2 size={16} className="animate-spin" /> กำลังบันทึก...</>
                    : <><CheckCircle2 size={16} /> บันทึกและเริ่มใช้งาน</>
                  }
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Skip note ── */}
        <p className="text-center text-xs text-gray-400 font-bold mt-4">
          สามารถแก้ไขข้อมูลได้ตลอดในหน้า{' '}
          <button onClick={handleSkip} className="underline hover:text-gray-600">
            โปรไฟล์ของฉัน
          </button>
        </p>

      </div>
    </div>
  )
}