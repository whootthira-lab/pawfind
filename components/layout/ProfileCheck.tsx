// components/layout/ProfileCheck.tsx
'use client'

import { useEffect, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export function ProfileCheck() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone_number, first_name, last_name, address, province, subdistrict, birth_date')
            .eq('id', session.user.id)
            .maybeSingle()

          if (profile) {
            const isIncomplete = 
              !profile.phone_number?.trim() ||
              !profile.first_name?.trim() ||
              !profile.last_name?.trim() ||
              !profile.address?.trim() ||
              !profile.province?.trim() ||
              !profile.subdistrict?.trim() ||
              !profile.birth_date

            if (isIncomplete) {
              const isAlreadyOnSettings = pathname === '/profile' && searchParams.get('tab') === 'settings'
              if (!isAlreadyOnSettings) {
                alert('กรุณากรอกข้อมูลส่วนตัวให้ครบ')
                router.push('/profile?tab=settings')
              }
            }
          }
        }
      } catch (err) {
        console.error('Error checking profile completion:', err)
      }
    }
    checkProfile()
  }, [pathname, searchParams, router, supabase])

  return null
}
