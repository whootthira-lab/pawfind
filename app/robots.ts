// robots.ts
import type { MetadataRoute } from 'next'

// 💡 เปลี่ยน URL พื้นฐานให้เป็นโดเมนจริงของคุณ
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pobpet.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/og'],
        disallow: ['/admin/', '/dashboard/', '/_next/'],
      },
      {
        userAgent: 'facebookexternalhit',
        allow: '/',
      },
      {
        userAgent: 'Twitterbot',
        allow: '/',
      },
      {
        userAgent: 'Line',
        allow: '/',
      }
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}