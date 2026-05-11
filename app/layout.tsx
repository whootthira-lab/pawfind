// app/layout.tsx — Origami design system
import type { Metadata } from 'next'
import './globals.css'

// 💡 1. นำเข้า Components ที่จำเป็นทั้งหมด
import { Suspense } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { WelcomePopup } from '@/components/WelcomePopup'
import { GlobalTicker } from '@/components/layout/GlobalTicker'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawfind-eta.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'PobPet · ตามหาน้อง 🐾',
    template: '%s | PobPet ตามหาน้อง',
  },
  description: 'แพลตฟอร์มตามหาสัตว์เลี้ยงด้วย AI ช่วยกันส่งน้องกลับบ้าน หมา แมว กระต่าย นก และสัตว์เลี้ยงทุกชนิด',
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    siteName: 'PobPet · ตามหาน้อง',
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700;800;900&family=Noto+Serif+Thai:wght@700;800;900&family=Fredoka+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-grid-paper text-ori-ink antialiased min-h-screen flex flex-col">
        
        {/* เอา <Suspense> มาครอบ WelcomePopup ไว้ เพื่อไม่ให้การอ่านลิงก์พังตอน Build Vercel */}
        <Suspense fallback={null}>
          <WelcomePopup />
        </Suspense>
        
        {/* 💡 2. มัดรวม Navbar และ GlobalTicker ให้อยู่ด้านบนสุดและติดขอบจอเสมอ (Sticky) */}
        <div className="sticky top-0 z-[200] w-full flex flex-col">
          <Navbar />
          <GlobalTicker />
        </div>
        
        <main className="flex-grow">
          {children}
        </main>
        
        <footer className="border-t-[3px] border-ori-ink bg-ori-ink text-ori-cream py-6 font-bold text-center text-sm">
          <p>© {new Date().getFullYear()} PobPet · ตามหาน้อง · Community for Pets 🐾</p>
        </footer>
      </body>
    </html>
  )
}