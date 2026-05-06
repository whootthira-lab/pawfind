import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function trackEvent(eventName: string, params: {
  targetId?: string,
  platform?: string,
  metadata?: any
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    await supabase.from('user_events').insert({
      event_name: eventName,
      user_id: session?.user?.id || null, // เก็บ ID ถ้าล็อกอิน
      target_id: params.targetId,
      platform: params.platform,
      metadata: params.metadata
    })
  } catch (error) {
    console.error('Analytics Error:', error)
  }
}