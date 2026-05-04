import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawfind-eta.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/api/og', // ✨ สำคัญ: ต้องอนุญาตให้บอททุกตัวเข้าถึงตัวสร้างรูปภาพ OG ได้
        ],
        disallow: [
          '/admin/',      
          '/dashboard/',
          '/_next/',
          // '/api/',  <-- นำบรรทัดนี้ออกเพื่อให้บอทเข้าถึง /api/og ได้
        ],
      },
      // ✨ อนุญาตบอทโซเชียลเป็นแขก VIP เข้าได้ทุกส่วน
      {
        userAgent: ['facebookexternalhit', 'Twitterbot', 'Line'],
        allow: '/',
      }
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}