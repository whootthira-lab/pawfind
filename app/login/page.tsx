'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { LogIn, Mail, Loader2, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 💡 ฟังก์ชันล็อกอินด้วย Magic Link (ทำงานได้ทันที)
  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setMessage({ type: 'error', text: 'กรุณากรอกอีเมลของคุณ' })
      return
    }

    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'ส่งลิงก์เข้าสู่ระบบไปที่อีเมลของคุณแล้ว! กรุณาเช็คกล่องข้อความครับ' })
    }
    setLoading(false)
  }

  // ฟังก์ชันล็อกอินด้วย Social (ต้องไปตั้งค่า Client ID ใน Supabase ก่อนถึงจะใช้ได้)
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) alert('ระบบยังไม่เปิดรองรับ ' + provider)
  }

  return (
    <div className="max-w-md mx-auto mt-12 mb-20 p-8 bg-white border-4 border-black rounded-2xl shadow-paper text-center">
      <div className="flex justify-center mb-6">
        <div className="bg-wagashi-kinako border-2 border-black p-4 rounded-full shadow-paper-sm">
          <LogIn size={48} className="text-black" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">เข้าสู่ระบบ PawFind</h1>
      <p className="font-medium text-gray-600 mb-8">
        เพื่อใช้งานฟีเจอร์บันทึกและจัดการข้อมูลสัตว์เลี้ยง
      </p>

      {/* 💡 ฟอร์มกรอกอีเมลสำหรับ Magic Link */}
      <form onSubmit={handleMagicLinkLogin} className="mb-8 text-left">
        <label className="block font-bold mb-2">เข้าสู่ระบบด้วยอีเมล</label>
        <div className="flex gap-2">
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com" 
            className="flex-1 border-2 border-black rounded-lg px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full mt-4 bg-black text-white py-6 text-lg font-bold border-2 border-black shadow-paper-sm hover:shadow-paper transition-all"
        >
          {loading ? <Loader2 className="animate-spin w-6 h-6 mr-2" /> : <Mail className="w-6 h-6 mr-2" />}
          ส่งลิงก์เข้าสู่ระบบ (Magic Link)
        </Button>
      </form>

      {message && (
        <div className={`p-4 rounded-lg border-2 border-black mb-8 font-bold flex items-center gap-2 text-left ${message.type === 'success' ? 'bg-wagashi-matcha' : 'bg-wagashi-sakura text-red-800'}`}>
          {message.type === 'success' && <CheckCircle2 className="shrink-0" />}
          {message.text}
        </div>
      )}

      <div className="relative flex items-center py-5 mb-4">
        <div className="flex-grow border-t-2 border-black/10"></div>
        <span className="shrink-0 px-4 font-bold text-gray-500">หรือ</span>
        <div className="flex-grow border-t-2 border-black/10"></div>
      </div>

      {/* ปุ่ม Social Login (เตรียม UI ไว้ให้ แต่ต้องตั้งค่าหลังบ้านก่อน) */}
      <div className="flex flex-col gap-3">
        <Button onClick={() => handleSocialLogin('google')} variant="outline" className="w-full py-6 font-bold border-2 border-black hover:-translate-y-1 transition-transform">
          เข้าสู่ระบบด้วย Google
        </Button>
        <Button onClick={() => handleSocialLogin('facebook')} className="w-full py-6 font-bold bg-[#1877F2] hover:bg-[#1877F2]/90 text-white border-2 border-black hover:-translate-y-1 transition-transform">
          เข้าสู่ระบบด้วย Facebook
        </Button>
      </div>
    </div>
  )
}