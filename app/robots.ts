export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/',
      disallow: ['/api/', '/admin/', '/(protected)/'] },
    sitemap: 'https://pawfind.th/sitemap.xml',
  }
}
