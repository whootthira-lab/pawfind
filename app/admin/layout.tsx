import { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminAssistant from '@/components/chat/AdminAssistant'

const ADMIN_EMAILS = ['whootthira@gmail.com', 'pobpet.th@gmail.com']

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const user = session?.user
  const isExplicitAdmin = user?.email && ADMIN_EMAILS.includes(user.email)
  const isRoleAdmin = user?.app_metadata?.role === 'admin'
  const isAdmin = isExplicitAdmin || isRoleAdmin

  if (!isAdmin) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-washi flex text-black">
      <aside className="w-64 bg-black text-white p-6 hidden md:block">
        <h2 className="text-xl font-bold mb-8">PawFind CMS</h2>
        <nav className="space-y-4 font-bold">
          <a href="/" className="block hover:text-wagashi-kinako transition-colors">← กลับหน้าแรก</a>
          <a href="/admin" className="block hover:text-wagashi-sakura transition-colors">Overview</a>
          <a href="/admin/posts" className="block hover:text-wagashi-matcha transition-colors">Articles</a>
          <a href="/admin/pets" className="block hover:text-wagashi-sora transition-colors">Pet Cases</a>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
      <AdminAssistant />
    </div>
  )
}
