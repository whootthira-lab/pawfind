// app/layout.tsx — แทนที่ไฟล์เดิมทั้งหมด
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans'
});

// ── ค่า default — ทุกหน้าที่ไม่ได้ set metadata จะใช้ค่านี้ ──
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawfind-eta.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),  // ← สำคัญมาก! ทำให้ relative URL กลายเป็น absolute

  title: {
    default: 'Pobpet · ตามหาน้อง 🐾',
    template: '%s | Pobpet ตามหาน้อง',  // หน้าย่อยจะได้: "บัตเตอร์ | Pobpet ตามหาน้อง"
  },
  description: 'แพลตฟอร์มตามหาสัตว์เลี้ยงด้วย AI ช่วยกันส่งน้องกลับบ้าน หมา แมว กระต่าย นก และสัตว์เลี้ยงทุกชนิด',
  keywords: ['ตามหาสัตว์เลี้ยง', 'สัตว์หาย', 'หมาหาย', 'แมวหาย', 'pobpet', 'pawfind', 'สัตว์เลี้ยง'],

  // ── Open Graph (Facebook, LINE, Discord) ──
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    siteName: 'Pobpet · ตามหาน้อง',
    url: BASE_URL,
    title: 'Pobpet · ตามหาน้อง 🐾',
    description: 'แพลตฟอร์มตามหาสัตว์เลี้ยงด้วย AI ช่วยกันส่งน้องกลับบ้าน',
    images: [
      {
        url: '/og-default.png',   // ใส่รูป default 1200×630 ไว้ที่ /public/og-default.png
        width: 1200,
        height: 630,
        alt: 'Pobpet · ตามหาน้อง',
      },
    ],
  },

  // ── Twitter / X Card ──
  twitter: {
    card: 'summary_large_image',
    site: '@pobpet',          // เปลี่ยนเป็น Twitter handle จริง
    creator: '@pobpet',
    title: 'Pobpet · ตามหาน้อง 🐾',
    description: 'แพลตฟอร์มตามหาสัตว์เลี้ยงด้วย AI',
    images: ['/og-default.png'],
  },

  // ── Robots ──
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',   // ให้ Google แสดงรูปใหญ่ใน search
      'max-snippet': -1,
    },
  },

  // ── Verification (เพิ่มทีหลังได้) ──
  // verification: {
  //   google: 'xxxx',
  // },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={cn("font-sans", inter.variable)}>
      <body className="antialiased bg-white text-black min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <footer className="border-t-4 border-black p-6 bg-gray-50 font-bold text-center">
          <p>© {new Date().getFullYear()} POBPET · ตามหาน้อง · Community for Pets</p>
        </footer>
      </body>
    </html>
  );
}
