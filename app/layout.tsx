// app/layout.tsx — Origami design system
import type { Metadata } from 'next'
import './globals.css'

import { Suspense } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { WelcomePopup } from '@/components/WelcomePopup'
import { GlobalTicker } from '@/components/layout/GlobalTicker'

// 💡 1. ปรับ URL ให้ชี้ไปที่โดเมนจริง pobpet.com
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pobpet.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'PobPet · ตามหาน้อง 🐾',
    template: '%s | PobPet ตามหาน้อง',
  },
  // 💡 2. เพิ่มข้อความเรื่อง "ข่าวสารกิจกรรม" เข้าไปให้ครอบคลุมฟีเจอร์ใหม่
  description: 'แพลตฟอร์มตามหาสัตว์เลี้ยงด้วย AI ช่วยกันส่งน้องกลับบ้าน แจ้งพบสัตว์หลง หาบ้านให้สัตว์เลี้ยง และศูนย์รวมข่าวสารกิจกรรมเพื่อชุมชนคนรักสัตว์',
  
  openGraph: {
    title: 'PobPet · แพลตฟอร์มเพื่อคนรักสัตว์',
    description: 'แจ้งสัตว์หาย แจ้งพบสัตว์หลง และค้นหาด้วย AI ',
    url: BASE_URL,
    type: 'website',
    locale: 'th_TH',
    siteName: 'PobPet · ตามหาน้อง',
    // 💡 3. เรียกใช้รูปภาพที่คุณวุฒิ์เตรียมไว้ในโฟลเดอร์ public
    images: [
      { 
        url: '/og-pobpet.png', 
        width: 1200, 
        height: 630,
        alt: 'PobPet - แพลตฟอร์มเพื่อชุมชนคนรักสัตว์'
      }
    ],
  },
  
  // 💡 4. เผื่อการแชร์ลง X (Twitter) ให้แสดงรูปภาพแบบเต็มตา
  twitter: { 
    card: 'summary_large_image',
    title: 'PobPet · แพลตฟอร์มเพื่อชุมชนคนรักสัตว์',
    description: 'แจ้งสัตว์เลี้ยงสูญหาย ประกาศพบสัตว์หลงทาง หาบ้านให้น้องๆ และติดตามข่าวสารกิจกรรมชุมชนคนรักสัตว์',
    images: ['/og-pobpet.png'],
  },
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
        
        <Suspense fallback={null}>
          <WelcomePopup />
        </Suspense>
        
        <div className="sticky top-0 z-[200] w-full flex flex-col">
          <Navbar />
          <GlobalTicker />
        </div>
        
        <main className="flex-grow">
          {children}
        </main>
        
        <footer className="border-t-[3px] border-ori-ink bg-ori-ink text-ori-cream py-6 font-bold text-center text-sm">
          <p>© {new Date().getFullYear()} PobPet · พบเพ็ท · Community for Pets 🐾</p>
        </footer>
      </body>
    </html>
  )
}