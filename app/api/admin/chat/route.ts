// app/api/admin/chat/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = ['whootthira@gmail.com', 'pobpet.th@gmail.com']

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_admin_stats',
      description: 'ดึงข้อมูลสถิติภาพรวมของระบบ เช่น จำนวนสัตว์เลี้ยงทั้งหมด การกระจายประเภทประกาศ และจำนวนผู้ใช้ทั้งหมด',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_system_tokens',
      description: 'วิเคราะห์สถิติการใช้งาน Token และจำนวนครั้งการสนทนาสะสมของ AI Chatbot ทั้งหมดในระบบ',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_pending_reviews',
      description: 'ดึงรายการประกาศหรือโพสต์กิจกรรมที่รอแอดมินตรวจสอบและอนุมัติ (Status เป็น pending_admin หรือ pending_ai)',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'moderate_post',
      description: 'สั่งการอนุมัติ (approve) หรือปฏิเสธ (reject) ประกาศโพสต์ตามไอดีที่ระบุ',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'ไอดีโพสต์กิจกรรมที่ต้องการจัดการ' },
          action: { type: 'string', enum: ['approve', 'reject'], description: 'คำสั่งอนุมัติหรือปฏิเสธ' }
        },
        required: ['eventId', 'action']
      }
    }
  }
]

// ── Helper functions for Tools ──

async function getAdminStats(supabase: any) {
  const [
    { count: totalPets },
    { count: lostPets },
    { count: foundPets },
    { count: matingPets },
    { count: adoptionPets },
    { count: showcasePets },
    { count: totalUsers },
    { count: totalEvents }
  ] = await Promise.all([
    supabase.from('pets').select('*', { count: 'exact', head: true }),
    supabase.from('pets').select('*', { count: 'exact', head: true }).eq('status', 'lost'),
    supabase.from('pets').select('*', { count: 'exact', head: true }).eq('status', 'found'),
    supabase.from('pets').select('*', { count: 'exact', head: true }).eq('status', 'mating'),
    supabase.from('pets').select('*', { count: 'exact', head: true }).eq('status', 'adoption'),
    supabase.from('pets').select('*', { count: 'exact', head: true }).eq('status', 'showcase'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true })
  ])

  return {
    success: true,
    total_pets: totalPets || 0,
    status_breakdown: {
      lost: lostPets || 0,
      found: foundPets || 0,
      mating: matingPets || 0,
      adoption: adoptionPets || 0,
      showcase: showcasePets || 0
    },
    total_users: totalUsers || 0,
    total_events: totalEvents || 0
  }
}

async function getSystemTokens(supabase: any) {
  // ดึงจำนวนแถวประวัติสนทนาในระบบ
  const { count: totalChats } = await supabase
    .from('pet_chat_histories')
    .select('*', { count: 'exact', head: true })

  const chatsCount = totalChats || 0
  // ประมาณการใช้งาน Token: เฉลี่ยคนละ 150 characters ต่อข้อความ และบอทตอบกลับ 350 characters
  // 1 token เฉลี่ยประมาณ 0.75-1.2 คำ/อักขระ (สำหรับภาษาไทยคำนวณประมาณ 1.5 token ต่อตัวอักษร)
  const estInputTokens = Math.round(chatsCount * 120 * 1.5)
  const estOutputTokens = Math.round(chatsCount * 300 * 1.5)
  const estTotalTokens = estInputTokens + estOutputTokens

  return {
    success: true,
    total_chats: chatsCount,
    estimated_tokens: {
      input_tokens: estInputTokens,
      output_tokens: estOutputTokens,
      total_tokens: estTotalTokens
    }
  }
}

async function getPendingReviews(supabase: any) {
  const { data: pendingEvents, error } = await supabase
    .from('events')
    .select('id, title, event_type, status, organizer_name, province, created_at')
    .in('status', ['pending_admin', 'pending_ai'])
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    pending_count: pendingEvents?.length || 0,
    posts: pendingEvents || []
  }
}

async function moderatePost(supabase: any, eventId: string, action: 'approve' | 'reject') {
  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  const { error } = await supabase
    .from('events')
    .update({ status: newStatus })
    .eq('id', eventId)

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    eventId,
    action,
    newStatus,
    message: `ทำรายการ ${action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'} โพสต์ไอดี ${eventId} เรียบร้อยแล้วค่ะ`
  }
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY')

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const user = session?.user
    const isExplicitAdmin = user?.email && ADMIN_EMAILS.includes(user.email)
    const isRoleAdmin = user?.app_metadata?.role === 'admin'
    const isAdmin = isExplicitAdmin || isRoleAdmin

    if (!isAdmin) {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ เฉพาะแอดมินเท่านั้นค่ะ' }, { status: 403 })
    }

    const { message, history = [] } = await req.json()

    const systemPrompt = `คุณคือ "แอดมินผู้ช่วย AI" (Admin Analytics Assistant) ประจำหลังบ้านระบบ PobPet 🐾
มีหน้าที่รายงานข้อมูลทางสถิติ ประสานงานอนุมัติโพสต์ และรายงานค่า Token ต่างๆ ให้แอดมินรับทราบ

## กฎและข้อบังคับ:
1. ตอบกลับด้วยความสุภาพ กระชับ ชัดเจน มีความเป็นมืออาชีพ และตอบเป็นภาษาไทย
2. ใช้อิโมจิที่เหมาะสม เช่น 📊 🐶 🤖 ⏳ 🐾 เพื่อให้อ่านง่ายและสวยงามแบบ Neubrutalism
3. หากแอดมินสั่งอนุมัติหรือตรวจสอบ ให้ค้นหาและเรียกใช้ Tool ที่เกี่ยวข้องทันที
4. รายงานสถิติแยกเป็นหมวดหมู่หรือรายการให้ชัดเจน
5. ข้อมูลวันที่/เวลาปัจจุบันคือ: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}
`

    const historyMessages = history.map((m: { role: string; text: string }) => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.text,
    }))

    const bodyData = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: message },
      ],
      temperature: 0.2,
      max_tokens: 600,
      tools: TOOLS,
      tool_choice: 'auto'
    }

    const openAIRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(bodyData),
    })

    if (!openAIRes.ok) {
      const err = await openAIRes.json()
      throw new Error(err.error?.message || 'OpenAI API error')
    }

    const openAIData = await openAIRes.json()
    const aiMessage = openAIData.choices[0].message

    let reply = ''
    let actionButtons: { label: string; link: string }[] = []

    if (aiMessage.tool_calls?.length) {
      const toolCall = aiMessage.tool_calls[0]
      const toolName = toolCall.function.name
      const args = JSON.parse(toolCall.function.arguments)

      let toolResult = ''

      if (toolName === 'get_admin_stats') {
        const result = await getAdminStats(supabase)
        toolResult = JSON.stringify(result)
      } else if (toolName === 'get_system_tokens') {
        const result = await getSystemTokens(supabase)
        toolResult = JSON.stringify(result)
      } else if (toolName === 'get_pending_reviews') {
        const result = await getPendingReviews(supabase)
        toolResult = JSON.stringify(result)
        if (result.success && result.posts?.length > 0) {
          actionButtons = result.posts.slice(0, 3).map((p: any) => ({
            label: `อนุมัติ "${p.title.substring(0, 15)}..."`,
            link: `action:อนุมัติโพสต์ไอดี ${p.id}`
          }))
        }
      } else if (toolName === 'moderate_post') {
        const result = await moderatePost(supabase, args.eventId, args.action)
        toolResult = JSON.stringify(result)
      }

      const finalRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...historyMessages,
            { role: 'user', content: message },
            aiMessage,
            { role: 'tool', tool_call_id: toolCall.id, content: toolResult },
          ],
          temperature: 0.3,
        }),
      })

      const finalData = await finalRes.json()
      reply = finalData.choices[0].message.content
    } else {
      reply = aiMessage.content || 'ไม่สามารถประมวลผลคำตอบได้ค่ะ'
    }

    return NextResponse.json({ reply, action_buttons: actionButtons })

  } catch (error: any) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Admin Chat API]', msg)
    return NextResponse.json({ error: `เกิดข้อขัดข้องในบอทแอดมิน: ${msg}` }, { status: 500 })
  }
}
