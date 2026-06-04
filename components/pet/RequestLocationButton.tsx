// components/pet/RequestLocationButton.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldAlert, FileText, CheckCircle2, AlertTriangle, Loader2, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

interface RequestLocationButtonProps {
  petId: string
  size?: 'sm' | 'md'
}

export function RequestLocationButton({ petId, size = 'md' }: RequestLocationButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const router = useRouter()
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setIsLoggedIn(true)
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_verified')
            .eq('id', session.user.id)
            .single()
          if (profile?.is_verified) {
            setIsVerified(true)
          }
        } else {
          setIsLoggedIn(false)
          setIsVerified(false)
        }
      } catch (err) {
        console.error('Error checking verification status:', err)
      } finally {
        setCheckingStatus(false)
      }
    }
    checkStatus()
  }, [supabase])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null)
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('ขนาดไฟล์ต้องไม่เกิน 5MB ค่ะ')
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Action for unverified user: uploads ID and requests verification
  const handleVerifyAndUpload = async () => {
    if (!previewUrl) {
      setErrorMsg('กรุณาเลือกรูปภาพเอกสารยืนยันตัวตนก่อนค่ะ')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const response = await fetch('/api/verify-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: previewUrl })
      })

      const data = await response.json()
      if (data.success) {
        setSuccessMsg(data.message || 'ยืนยันตัวตนสำเร็จแล้วค่ะ!')
        
        // Log access to this specific pet coordinates automatically since they are now verified
        await fetch('/api/access-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ petId })
        })

        setIsVerified(true)

        setTimeout(() => {
          setIsOpen(false)
          window.location.reload()
        }, 1500)
      } else {
        setErrorMsg(data.reason || 'ภาพเอกสารไม่ถูกต้อง กรุณาอัปโหลดรูปใหม่อีกครั้งค่ะ')
      }
    } catch (err: any) {
      setErrorMsg(`เกิดข้อผิดพลาดในการยืนยัน: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  // Action for already verified user: confirms access logging
  const handleRequestAccess = async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      const response = await fetch('/api/access-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId })
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setSuccessMsg('บันทึกประวัติการเข้าชมและเปิดเผยพิกัดแล้วค่ะ!')
        setTimeout(() => {
          setIsOpen(false)
          window.location.reload()
        }, 1200)
      } else {
        setErrorMsg(data.error || data.reason || 'บันทึกประวัติเข้าถึงไม่สำเร็จ กรุณาลองอีกครั้งค่ะ')
      }
    } catch (err: any) {
      setErrorMsg(`เกิดข้อผิดพลาด: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return
    setIsOpen(false)
    setSelectedFile(null)
    setPreviewUrl(null)
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(true)
        }}
        className={`bg-ori-orange text-white hover:bg-ori-orange-d border-2 border-black rounded-xl font-black text-center flex items-center justify-center gap-1.5 shadow-paper-sm transition-all active:scale-95 cursor-pointer ${
          size === 'sm' ? 'px-3 py-1.5 text-[10px]' : 'px-4 py-2.5 text-xs'
        }`}
      >
        🔒 ขอพิกัดที่พบ
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white border-4 border-black rounded-3xl shadow-paper-lg p-6 max-w-md w-full z-10 text-black max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={handleClose}
                disabled={loading}
                className="absolute top-4 right-4 bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded-full p-2 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>

              {checkingStatus ? (
                <div className="text-center py-8">
                  <Loader2 size={32} className="animate-spin mx-auto text-ori-orange" />
                  <p className="font-bold text-xs mt-2 text-gray-500">กำลังตรวจสอบสิทธิ์...</p>
                </div>
              ) : !isLoggedIn ? (
                // State: Not Logged In
                <div className="text-center py-4">
                  <div className="mx-auto w-14 h-14 bg-ori-orange-bg border-4 border-black rounded-full flex items-center justify-center mb-4 shadow-paper-sm">
                    <ShieldAlert size={28} className="text-ori-orange" />
                  </div>
                  <h3 className="text-xl font-black mb-2">ต้องเข้าสู่ระบบก่อนค่ะ</h3>
                  <p className="text-gray-600 font-bold text-sm mb-6 leading-relaxed">
                    เพื่อความปลอดภัยและป้องกันพิกัดสัตว์เลี้ยงสูญหาย กรุณาเข้าสู่ระบบด้วยบัญชี Google หรืออีเมลก่อนกดขอพิกัดค่ะ
                  </p>
                  <Button
                    onClick={() => {
                      router.push(`/login?redirectTo=/pet/${petId}`)
                    }}
                    className="w-full bg-ori-yellow hover:bg-ori-yellow-d text-black border-2 border-black font-black text-sm py-4 rounded-xl shadow-paper-sm transition-transform active:scale-95"
                  >
                    🔐 ไปหน้าเข้าสู่ระบบ
                  </Button>
                </div>
              ) : isVerified ? (
                // State: Verified but needs to confirm logging access to this specific pet
                <div className="py-2">
                  <div className="text-center mb-4">
                    <div className="mx-auto w-14 h-14 bg-ori-blue-bg border-4 border-black rounded-full flex items-center justify-center mb-3 shadow-paper-sm">
                      <Key size={28} className="text-ori-blue" />
                    </div>
                    <h3 className="text-xl font-black">ยืนยันการขอพิกัดสัตว์เลี้ยง</h3>
                    <p className="text-gray-500 font-bold text-xs mt-1 leading-relaxed">
                      คุณได้ผ่านการยืนยันตัวตนแล้วค่ะ ระบบจะเก็บประวัติการเปิดดูพิกัดโพสต์นี้เพื่อความปลอดภัย
                    </p>
                  </div>

                  {/* Warning Warning Info */}
                  <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-xl flex gap-2 items-start text-blue-800 text-xs font-bold mb-5 leading-relaxed">
                    <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-sm">📝 ข้อชี้แจงด้านความปลอดภัย:</p>
                      <p className="mt-1">เมื่อคุณกดยอมรับ ระบบจะบันทึกรหัสโปรไฟล์ของคุณ เวลา และรหัสประกาศนี้ลงในประวัติผู้เข้าใช้ระบบ และจะเปิดเผยพิกัดที่พบของเคสนี้ให้ทันทีค่ะ</p>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="bg-red-50 border-2 border-red-300 p-3 rounded-xl flex gap-2 items-start text-red-700 text-xs font-bold mb-4">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <p>{errorMsg}</p>
                    </div>
                  )}

                  {successMsg && (
                    <div className="bg-green-50 border-2 border-green-300 p-3 rounded-xl flex gap-2 items-start text-green-700 text-xs font-bold mb-4">
                      <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                      <p>{successMsg}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={loading}
                      className="flex-1 py-4 border-2 border-black rounded-xl font-bold text-sm bg-gray-50 hover:bg-gray-100 text-black active:translate-y-0"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="button"
                      onClick={handleRequestAccess}
                      disabled={loading || !!successMsg}
                      className="flex-1 py-4 bg-ori-orange hover:bg-ori-orange-d text-white border-2 border-black rounded-xl font-black text-sm shadow-paper-sm transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-1.5"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>กำลังบันทึก...</span>
                        </>
                      ) : (
                        <span>ยอมรับและดูพิกัด</span>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                // State: Logged In but NOT verified yet (Show document upload form)
                <div>
                  <div className="text-center mb-4">
                    <div className="mx-auto w-14 h-14 bg-ori-blue-bg border-4 border-black rounded-full flex items-center justify-center mb-3 shadow-paper-sm animate-pulse">
                      <FileText size={28} className="text-ori-blue" />
                    </div>
                    <h3 className="text-xl font-black">ยืนยันตัวตนเพื่อขอพิกัด</h3>
                    <p className="text-gray-500 font-bold text-xs mt-1 leading-relaxed">
                      กรุณาแนบรูปถ่ายบัตรประชาชน หรือ ใบขับขี่ เพื่อให้ AI สแกนยืนยันตัวตน
                    </p>
                  </div>

                  <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-xl flex gap-2 items-start text-amber-800 text-[11px] font-bold mb-4">
                    <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                    <p>ระบบใช้ AI (Gemini) สแกนภาพตรวจจับเอกสาร และข้อมูลจะถูกจัดเก็บเป็นความลับเพื่อใช้ตรวจสอบความปลอดภัยและยืนยันตัวตนกับเจ้าของสัตว์เลี้ยงเท่านั้น</p>
                  </div>

                  {/* Upload Dropzone */}
                  {!previewUrl ? (
                    <div className="border-4 border-dashed border-black rounded-2xl p-6 bg-gray-50 text-center hover:bg-gray-100 transition-colors cursor-pointer relative mb-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <p className="text-3xl mb-2">📸</p>
                      <p className="font-black text-sm text-black">เลือกรูปถ่ายบัตรประชาชน / ใบขับขี่</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-1">ไฟล์รูปภาพขนาดไม่เกิน 5MB</p>
                    </div>
                  ) : (
                    <div className="border-4 border-black rounded-2xl p-3 bg-gray-100 text-center mb-4 shadow-paper-sm">
                      <div className="relative aspect-[1.6/1] border-2 border-black rounded-xl overflow-hidden bg-white mb-2">
                        <img src={previewUrl} alt="Preview ID" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null)
                            setPreviewUrl(null)
                            setErrorMsg(null)
                          }}
                          disabled={loading}
                          className="absolute top-2 right-2 bg-black/80 hover:bg-black text-white p-1 rounded-full border border-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-[10px] font-bold text-gray-500 truncate">{selectedFile?.name}</p>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="bg-red-50 border-2 border-red-300 p-3 rounded-xl flex gap-2 items-start text-red-700 text-xs font-bold mb-4 shadow-paper-sm">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <p>{errorMsg}</p>
                    </div>
                  )}

                  {successMsg && (
                    <div className="bg-green-50 border-2 border-green-300 p-3 rounded-xl flex gap-2 items-start text-green-700 text-xs font-bold mb-4 shadow-paper-sm">
                      <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                      <p>{successMsg}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={loading}
                      className="flex-1 py-4 border-2 border-black rounded-xl font-bold text-sm bg-gray-50 hover:bg-gray-100 text-black active:translate-y-0"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="button"
                      onClick={handleVerifyAndUpload}
                      disabled={loading || !previewUrl || !!successMsg}
                      className="flex-1 py-4 bg-ori-orange hover:bg-ori-orange-d text-white border-2 border-black rounded-xl font-black text-sm shadow-paper-sm transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-1.5"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>กำลังตรวจสอบด้วย AI...</span>
                        </>
                      ) : (
                        <span>ส่งเอกสารสแกน</span>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
