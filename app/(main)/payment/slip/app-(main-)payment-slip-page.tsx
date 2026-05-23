'use client'
// app/(main)/payment/slip/page.tsx

import { useState, useRef, useMemo, Suspense, useEffect } from 'react'
import { createBrowserClient }        from '@supabase/ssr'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Upload, CheckCircle2, AlertCircle, Loader2,
  Download, ChevronRight, Shield, Clock,
  MessageCircle, QrCode
} from 'lucide-react'

const PROMPTPAY_ID = process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER || '0935352653'
const LINE_OA_URL  = 'https://line.me/R/ti/p/@pobpet'
const QR_IMAGE_URL = '/images/qr-pobpet.jpg'

const SLIP_CONFIG: Record<string, { label: string; amount: number }> = {
  member:  { label: '⭐ Member 1 ปี',   amount: 399 },
  addon_1: { label: '➕ Add-on +1 ตัว', amount: 79  },
  addon_3: { label: '➕ Add-on +3 ตัว', amount: 199 },
}

type VerifyStatus = 'idle' | 'uploading' | 'verifying' | 'approved' | 'pending' | 'rejected'

export default function PaymentSlipPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-ori-orange" />
      </div>
    }>
      <SlipContent />
    </Suspense>
  )
}

function SlipContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()

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
  const [lineId,    setLineId]    = useState('')
  const [lineError, setLineError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // ดึง LINE ID เดิมจากฐานข้อมูลมาแสดงรอก่อน (ถ้ามี)
  useEffect(() => {
    async function fetchExistingLineId() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('line_id')
          .eq('id', session.user.id)
          .single()
        if (data?.line_id) setLineId(data.line_id)
      }
    }
    fetchExistingLineId()
  }, [supabase])

  const handleFile = async (file: File) => {
    if (!file) return
    
    // บังคับกรอก LINE ID เพื่อสิทธิประโยชน์การแชทและการแจ้งเตือนบน LINE OA
    if (!lineId.trim()) {
      setLineError('⚠️ กรุณากรอก LINE ID ก่อนอัปโหลดสลิป เพื่อผูกสิทธิ์ระบบแจ้งเตือนค่ะ')
      return
    }
    setLineError('')

    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setStatus('uploading')
    setMessage('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login?next=/payment/slip'); return }

      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload  = () => res((r.result as string).split(',')[1])
        r.onerror = () => rej(new Error('Read failed'))
        r.readAsDataURL(file)
      })

      setStatus('verifying')

      const resp = await fetch('/api/payments/verify-slip', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          userId:      session.user.id,
          slip_type:   slipType,
          line_id:     lineId.trim() // ← ส่งพ่วงไปอัปเดตที่ API ในธุรกรรมเดียวกัน
        }),
      })

      const data = await resp.json()

      if (data.success) {
        setStatus('approved')
        setMessage('สลิปผ่านการตรวจสอบแล้วค่ะ 🎉')
        return
      }

      if (data.pending) {
        setStatus('pending')
        setMessage(data.message || 'กำลังตรวจสอบ ภายใน 1-2 ชั่วโมง')
        return
      }

      setStatus('rejected')
      setMessage(data.reason || 'ไม่สามารถยืนยันสลิปได้')

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

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black mb-2">ชำระเงิน 🐾</h1>
        <p className="font-bold text-ori-ink-l">{slipInfo.label}</p>
        <p className="text-ori-ink-l font-bold">
          โอน <strong className="text-2xl text-ori-ink">฿{AMOUNT}</strong> แล้วส่งสลิปได้เลยค่ะ
        </p>
      </div>

      {/* ── QR Code ── */}
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper mb-6">
        <h2 className="font-black text-lg mb-4 flex items-center gap-2">
          <QrCode size={20} /> สแกน QR เพื่อโอนเงิน
        </h2>

        <div className="flex flex-col items-center gap-4">
          <div className="border-4 border-ori-ink rounded-2xl overflow-hidden
            shadow-paper-sm bg-white p-3 w-56 h-56 flex items-center justify-center">
            <img
              src={QR_IMAGE_URL}
              alt="QR Code PobPet"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="text-center">
            <p className="font-black text-lg">PobPet</p>
            <p className="text-sm font-bold text-ori-ink-l">{PROMPTPAY_ID}</p>
            <p className="text-xs font-bold text-green-600 mt-0.5">PromptPay</p>
          </div>

          <a href={QR_IMAGE_URL} download="qr-pobpet.jpg"
            className="flex items-center gap-2 px-4 py-2 text-sm font-black
              bg-white border-2 border-ori-ink rounded-xl hover:bg-gray-50
              transition-all shadow-paper-sm">
            <Download size={14} /> ดาวน์โหลด QR Code
          </a>
        </div>

        <div className="mt-4 p-3 bg-amber-50 rounded-2xl border-2 border-amber-300
          flex items-center justify-between">
          <span className="font-black text-amber-800">ยอดที่ต้องโอน</span>
          <span className="font-black text-2xl text-amber-700">฿{AMOUNT}</span>
        </div>
      </div>

      {/* ── LINE ID field ── */}
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper mb-6">
        <h2 className="font-black text-lg mb-1 flex items-center gap-2">
          <MessageCircle size={20} className="text-green-600" /> LINE ID ของคุณ *
        </h2>
        <p className="text-xs font-bold text-ori-ink-l mb-4">
          โปรดระบุ LINE ID เพื่อให้ทีมงานผูกสิทธิ์ระบบแอดมินและการแจ้งเตือนความปลอดภัยบน LINE OA
        </p>

        <input
          value={lineId}
          disabled={isProcessing || status === 'approved'}
          onChange={e => setLineId(e.target.value)}
          placeholder="เช่น @wutthira หรือ wutthira123"
          className="w-full border-4 border-ori-ink rounded-xl px-4 py-2.5
            text-sm font-bold focus:outline-none focus:border-green-500"
        />
        {lineError && <p className="text-xs font-bold text-red-500 mt-2">{lineError}</p>}
      </div>

      {/* ── Upload slip ── */}
      <div className="bg-white border-4 border-ori-ink rounded-3xl p-6 shadow-paper mb-6">
        <h2 className="font-black text-lg mb-4 flex items-center gap-2">
          <Upload size={20} /> อัปโหลดสลิป
        </h2>

        <div
          onClick={() => !isProcessing && handleFile}
          className={`relative border-4 border-dashed rounded-2xl min-h-[180px]
            flex flex-col items-center justify-center gap-3 transition-all
            ${isProcessing
              ? 'border-gray-200 bg-gray-50 cursor-default'
              : 'border-gray-300 bg-gray-50 hover:border-ori-ink hover:bg-white cursor-pointer'
            }`}
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onInputChange} />
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center" onClick={() => !isProcessing && inputRef.current?.click()}>
            {preview ? (
              <div className="absolute inset-0 rounded-xl overflow-hidden bg-white">
                <img src={preview} alt="สลิป" className="w-full h-full object-contain" />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-white rounded-2xl px-6 py-4 text-center shadow-xl">
                      <Loader2 size={32} className="animate-spin text-ori-orange mx-auto mb-2" />
                      <p className="font-black text-sm">
                        {status === 'uploading' ? 'กำลังอัปโหลด...' : 'AI กำลังตรวจสอบ...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Upload size={40} className="text-gray-400" />
                <div className="text-center">
                  <p className="font-black text-ori-ink">กดเพื่อเลือกรูปสลิป</p>
                  <p className="text-sm font-bold text-ori-ink-l">หรือลากไฟล์มาวางที่นี่</p>
                  <p className="text-xs font-bold text-gray-400 mt-1">JPG, PNG · ไม่เกิน 10MB</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status messages */}
        {status === 'approved' && (
          <div className="mt-4 space-y-3">
            <div className="p-4 bg-green-50 border-2 border-green-400
              rounded-2xl flex items-center gap-3">
              <CheckCircle2 size={24} className="text-green-600 shrink-0" />
              <div>
                <p className="font-black text-green-800">สลิปผ่านแล้ว! 🎉</p>
                <p className="text-sm font-bold text-green-600">แพ็คเกจเปิดใช้งานและบันทึก LINE ID เรียบร้อยแล้วค่ะ</p>
              </div>
            </div>

            <div className="p-4 bg-[#06C755]/10 border-2 border-[#06C755] rounded-2xl">
              <p className="font-black text-sm mb-3 text-green-800">
                📲 ขั้นตอนสุดท้าย: เพิ่มเพื่อนบน LINE OA เพื่อใช้งานแชท AI และรับประกาศแมตช์ด่วน
              </p>
              <div className="flex gap-2">
                <a href={LINE_OA_URL} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3
                    bg-[#06C755] text-white font-black rounded-xl border-2
                    border-green-600 hover:bg-green-600 transition-all text-sm">
                  <MessageCircle size={16} /> เพิ่ม LINE OA ของ PobPet
                </a>
              </div>
            </div>

            <a href={slipType.startsWith('addon_') ? '/account/subscription?addon=success' : '/account/subscription'}
              className="flex items-center justify-center gap-2 py-3 px-6
                bg-ori-ink text-white font-black rounded-xl border-2 border-ori-ink
                hover:bg-gray-800 transition-all">
              กลับหน้าจัดการแพ็คเกจ <ChevronRight size={16} />
            </a>
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
                onClick={() => { setStatus('idle'); setPreview(null); setMessage('') }}
                className="mt-2 text-xs font-black text-red-700 underline">
                ลองส่งสลิปใหม่
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-xs font-bold text-ori-ink-l">
        <Shield size={14} />
        <span>AI ตรวจสอบสลิปภายใน 30 วินาที · ถ้าไม่ผ่านอัตโนมัติ Admin ตรวจภายใน 2 ชม.</span>
      </div>
    </div>
  )
}