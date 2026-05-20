'use client'
// app/(main)/payment/slip/page.tsx

import { Suspense, useState, useRef, useMemo } from 'react'
import { createBrowserClient }        from '@supabase/ssr'
import { useRouter, useSearchParams } from 'next/navigation'
import Image                          from 'next/image'
import {
  Upload, CheckCircle2, AlertCircle, Loader2,
  Copy, QrCode, ChevronRight, Shield, Clock
} from 'lucide-react'

const PROMPTPAY_ID = process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER || '0000000000'
const BANK_NAME    = 'กสิกรไทย'
const BANK_ACC     = '000-0-00000-0'
const BANK_NAME_TH = 'บริษัท พบเพ็ต จำกัด'

// ── Slip type config ─────────────────────────────────────────
const SLIP_CONFIG: Record<string, { label: string; amount: number }> = {
  member:  { label: '⭐ Member 1 ปี',   amount: 399 },
  addon_1: { label: '➕ Add-on +1 ตัว', amount: 79  },
  addon_3: { label: '➕ Add-on +3 ตัว', amount: 199 },
}

type VerifyStatus = 'idle' | 'uploading' | 'verifying' | 'approved' | 'pending' | 'rejected'

// 1. แยกเนื้อหาเดิมออกมาเป็น Component ย่อย
function PaymentSlipContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // ── อ่าน type และ amount จาก URL ───────────────────────────
  // /payment/slip?type=addon_1&amount=79
  const slipType = searchParams.get('type') || 'member'
  const slipInfo = SLIP_CONFIG[slipType] || SLIP_CONFIG.member
  const AMOUNT   = Number(searchParams.get('amount')) || slipInfo.amount

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [status,    setStatus]    = useState<VerifyStatus>('idle')
  const [preview,   setPreview]   = useState<string | null>(null)
  const [message,   setMessage]   = useState('')
  const [copied,    setCopied]    = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Copy to clipboard ────────────────────────────────────
  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Handle file select + auto verify ────────────────────
  const handleFile = async (file: File) => {
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setStatus('uploading')
    setMessage('')

    try {
      // ── Get session ──────────────────────────────────────
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login?next=/payment/slip'); return }

      // ── Convert to base64 ────────────────────────────────
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload  = () => res((r.result as string).split(',')[1])
        r.onerror = () => rej(new Error('Read failed'))
        r.readAsDataURL(file)
      })

      setStatus('verifying')

      // ── Call verify API ──────────────────────────────────
      const resp = await fetch('/api/payments/verify-slip', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          userId:      session.user.id,
          slip_type:   slipType,   // ← ส่ง type ไปด้วย (member/addon_1/addon_3)
          // expectedAmount ไม่ต้องส่ง API คำนวณจาก slip_type เองได้
        }),
      })

      const data = await resp.json()

      if (data.success) {
        setStatus('approved')
        setMessage('สลิปผ่านการตรวจสอบแล้วค่ะ 🎉')
        // addon → กลับหน้า subscription, member → หน้า success
        const redirectUrl = slipType.startsWith('addon_')
          ? '/account/subscription?addon=success'
          : '/payment/success'
        setTimeout(() => router.push(redirectUrl), 1800)
        return
      }

      if (data.pending) {
        setStatus('pending')
        setMessage(data.message || 'กำลังตรวจสอบ ภายใน 1-2 ชั่วโมง')
        return
      }

      // Rejected
      setStatus('rejected')
      setMessage(data.reason || 'ไม่สามารถยืนยันสลิปได้ กรุณาลองใหม่')

    } catch {
      setStatus('rejected')
      setMessage('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const isProcessing = status === 'uploading' || status === 'verifying'

  return (
    <div className="max-w-xl mx-auto px-4 py-10 mb-20">

      {/* ── Header ── */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black mb-2">ชำระเงิน 🐾</h1>
        <p className="font-bold text-ori-ink-l">{slipInfo.label}</p>
        <p className="text-ori-ink-l font-bold">โอน <strong>฿{AMOUNT}</strong> แล้วส่งสลิปได้เลยค่ะ</p>
      </div>

      {/* ── Payment info ── */}
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper mb-6">
        <h2 className="font-black text-lg mb-4 flex items-center gap-2">
          <QrCode size={20} /> ช่องทางชำระเงิน
        </h2>

        {/* PromptPay */}
        <div className="p-4 bg-green-50 rounded-2xl border-2 border-green-300 mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-black text-sm text-green-800">PromptPay</span>
            <span className="text-xs font-bold text-green-600 bg-green-100
              px-2 py-0.5 rounded-full">แนะนำ</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-black text-xl text-green-900 tracking-widest">
              {PROMPTPAY_ID}
            </span>
            <button onClick={() => copyText(PROMPTPAY_ID)}
              className="flex items-center gap-1 text-xs font-black
                text-green-700 bg-green-200 px-3 py-1.5 rounded-xl
                border border-green-400 hover:bg-green-300 transition-all">
              <Copy size={12} />
              {copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
            </button>
          </div>
          <p className="text-xs font-bold text-green-600 mt-1">
            ชื่อบัญชี: {BANK_NAME_TH}
          </p>
        </div>

        {/* Bank transfer */}
        <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-200">
          <p className="font-black text-sm mb-1">โอนธนาคาร — {BANK_NAME}</p>
          <div className="flex items-center justify-between">
            <span className="font-black text-lg tracking-widest">{BANK_ACC}</span>
            <button onClick={() => copyText(BANK_ACC.replace(/-/g, ''))}
              className="flex items-center gap-1 text-xs font-black
                text-gray-600 bg-gray-200 px-3 py-1.5 rounded-xl
                border border-gray-300 hover:bg-gray-300 transition-all">
              <Copy size={12} /> คัดลอก
            </button>
          </div>
          <p className="text-xs font-bold text-gray-500 mt-1">
            ชื่อบัญชี: {BANK_NAME_TH}
          </p>
        </div>

        {/* Amount */}
        <div className="mt-3 p-3 bg-amber-50 rounded-2xl border-2 border-amber-300
          flex items-center justify-between">
          <span className="font-black text-amber-800">ยอดที่ต้องโอน</span>
          <span className="font-black text-2xl text-amber-700">฿{AMOUNT}</span>
        </div>
      </div>

      {/* ── Upload slip ── */}
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper mb-6">
        <h2 className="font-black text-lg mb-4 flex items-center gap-2">
          <Upload size={20} /> อัปโหลดสลิป
        </h2>

        {/* Drop zone */}
        <div
          onClick={() => !isProcessing && inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={!isProcessing ? onDrop : undefined}
          className={`relative border-4 border-dashed rounded-2xl min-h-[200px]
            flex flex-col items-center justify-center gap-3 transition-all
            ${isProcessing
              ? 'border-gray-200 bg-gray-50 cursor-default'
              : 'border-gray-300 bg-gray-50 hover:border-ori-ink hover:bg-white cursor-pointer'
            }`}
        >
          {/* Preview */}
          {preview && (
            <div className="absolute inset-0 rounded-xl overflow-hidden">
              <img src={preview} alt="สลิป" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                {isProcessing && (
                  <div className="bg-white rounded-2xl px-6 py-4 text-center shadow-xl">
                    <Loader2 size={32} className="animate-spin text-ori-orange mx-auto mb-2" />
                    <p className="font-black text-sm">
                      {status === 'uploading' ? 'กำลังอัปโหลด...' : 'AI กำลังตรวจสอบ...'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Placeholder */}
          {!preview && (
            <>
              <Upload size={40} className="text-gray-400" />
              <div className="text-center">
                <p className="font-black text-ori-ink">กดเพื่อเลือกรูปสลิป</p>
                <p className="text-sm font-bold text-ori-ink-l">
                  หรือลากไฟล์มาวางที่นี่
                </p>
                <p className="text-xs font-bold text-gray-400 mt-1">JPG, PNG · ไม่เกิน 10MB</p>
              </div>
            </>
          )}

          {/* Loading overlay (no preview) */}
          {!preview && isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center
              bg-white/80 rounded-xl">
              <div className="text-center">
                <Loader2 size={32} className="animate-spin text-ori-orange mx-auto mb-2" />
                <p className="font-black text-sm">
                  {status === 'uploading' ? 'กำลังอัปโหลด...' : 'AI กำลังตรวจสอบ...'}
                </p>
              </div>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onInputChange}
        />

        {/* Status messages */}
        {status === 'approved' && (
          <div className="mt-4 p-4 bg-green-50 border-2 border-green-400
            rounded-2xl flex items-center gap-3">
            <CheckCircle2 size={24} className="text-green-600 shrink-0" />
            <div>
              <p className="font-black text-green-800">สลิปผ่านแล้ว! 🎉</p>
              <p className="text-sm font-bold text-green-600">{message}</p>
            </div>
          </div>
        )}

        {status === 'pending' && (
          <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-400
            rounded-2xl flex items-center gap-3">
            <Clock size={24} className="text-amber-600 shrink-0" />
            <div>
              <p className="font-black text-amber-800">รออนุมัติ</p>
              <p className="text-sm font-bold text-amber-600">{message}</p>
            </div>
          </div>
        )}

        {status === 'rejected' && (
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-400
            rounded-2xl flex items-start gap-3">
            <AlertCircle size={24} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-red-800">ตรวจสอบไม่ผ่าน</p>
              <p className="text-sm font-bold text-red-600">{message}</p>
              <button
                onClick={() => {
                  setStatus('idle')
                  setPreview(null)
                  setMessage('')
                  inputRef.current?.click()
                }}
                className="mt-2 text-xs font-black text-red-700
                  underline hover:text-red-900"
              >
                ลองส่งสลิปใหม่
              </button>
            </div>
          </div>
        )}

        {/* Re-upload button */}
        {preview && !isProcessing && status !== 'approved' && (
          <button
            onClick={() => {
              setStatus('idle')
              setPreview(null)
              setMessage('')
            }}
            className="mt-3 w-full py-2 text-sm font-black text-ori-ink-l
              border-2 border-gray-200 rounded-xl hover:border-ori-ink
              hover:text-ori-ink transition-all"
          >
            เลือกรูปใหม่
          </button>
        )}
      </div>

      {/* ── Trust signals ── */}
      <div className="flex items-center justify-center gap-2
        text-xs font-bold text-ori-ink-l">
        <Shield size={14} />
        <span>AI ตรวจสอบสลิปภายใน 30 วินาที · ถ้าไม่ผ่านอัตโนมัติ Admin ตรวจภายใน 2 ชม.</span>
      </div>
    </div>
  )
}

// 2. สร้าง Component หลัก ห่อด้วย Suspense ตามกฎของ Next.js
export default function PaymentSlipPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-ori-orange" />
      </div>
    }>
      <PaymentSlipContent />
    </Suspense>
  )
}