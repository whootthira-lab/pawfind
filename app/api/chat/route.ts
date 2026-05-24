// app/api/chat/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse }            from 'next/server'
import { createClient }            from '@/lib/supabase/server'
import { recordHealthEvent }       from '@/lib/pet-health-recorder'
import { createReminder }          from '@/lib/reminder-engine'

// ══════════════════════════════════════════════════════════════
// KNOWLEDGE BASE (ล้างข้อความจำกัดแพ็คเกจเงิน)
// ══════════════════════════════════════════════════════════════
const KNOWLEDGE_BASE = `
## เกี่ยวกับ PobPet
- PobPet (พบเพ็ต) คือแพลตฟอร์มดิจิทัลช่วยตามหาสัตว์เลี้ยงที่หายด้วย AI
- ผู้ก่อตั้ง: นายวุฒิ์ธีระ ครุฑขุนทด อ.ด่านขุนทด จ.นครราชสีมา
- ผลงานพิเศษ: ทดลองขาเทียม 3D Print ให้กับนกกระเรียน สวนสัตว์นครราชสีมา (2566)
- ติดต่อ PobPet: ผ่านแบบฟอร์มในเว็บ หรือช่องทางสื่อสารหลักบนหน้าเว็บไซต์

## วิธีใช้ระบบ
### ลงประกาศสัตว์หาย:
1. กดปุ่ม "ลงประกาศ" หรือไปที่ /report
2. อัปโหลดรูปสัตว์ที่ชัดเจน 1-5 รูป
3. กรอกข้อมูล: ชื่อ ประเภท สี จังหวัด อำเภอ ตำบล
4. กด Submit — AI จะวิเคราะห์รูปและจับคู่ทันที

### สมุดบันทึกประวัติสุขภาพสัตว์ (ฟรีกว่าเดิม):
- ผู้ใช้ทุกคนสามารถกรอกข้อมูลประวัติสุขภาพ นัดหมายวัคซีน ถ่ายพยาธิ และแนบรูปถ่ายใบเสร็จหรือหลักฐานทางการแพทย์ประกอบได้ฟรีทันทีบนหน้าเว็บ
- สามารถตั้งระบบการเตือนความจำพุชบอร์ด (Web Push Notification) ให้เด้งส่งข้อมูลนัดหมายรอบถัดไปตรงสู่หน้าจอคอมพิวเตอร์และมือถือได้โดยไม่มีค่าใช้จ่าย
`

// ══════════════════════════════════════════════════════════════
// OPENAI FUNCTION CALLING TOOLS
// ══════════════════════════════════════════════════════════════
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'record_health_event',
      description: 'บันทึกเหตุการณ์สุขภาพสัตว์เลี้ยง เช่น ฉีดวัคซีน ถ่ายพยาธิ หยอดหมัด ตรวจสุขภาพ บันทึกรางวัล ใช้เมื่อผู้ใช้บอกว่าทำอะไรให้น้องแล้ว',
      parameters: {
        type: 'object',
        properties: {
          pet_name:     { type: 'string', description: 'ชื่อสัตว์เลี้ยง' },
          event_type:   {
            type: 'string',
            enum: ['vaccine', 'rabies_vaccine', 'deworming', 'flea_treatment', 'checkup', 'treatment', 'award', 'other'],
            description: 'ประเภทเหตุการณ์',
          },
          medicine_name: { type: 'string', description: 'ชื่อวัคซีนหรือยา (ถ้ามี)' },
          event_date:   { type: 'string', description: 'วันที่ในรูปแบบ YYYY-MM-DD หรือ "today"' },
          notes:        { type: 'string', description: 'หมายเหตุเพิ่มเติมหรือที่อยู่ลิงก์รูปภาพใบเสร็จ' },
          next_due_days: { type: 'number', description: 'จำนวนวันจนถึงครั้งต่อไป เพื่อการตั้งเตือนร่วมกับ Web Push อัตโนมัติ' },
        },
        required: ['event_type', 'event_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_reminder',
      description: 'ตั้งการแจ้งเตือนพุชหน้าจอ เช่น เตือนซื้ออาหาร เตือนพาตัดขน เตือนนัดหมอ ใช้เมื่อผู้ใช้ขอให้เตือนระบบจะยิงผ่าน Web Push ฟรี',
      parameters: {
        type: 'object',
        properties: {
          title:       { type: 'string', description: 'หัวข้อแจ้งเตือน' },
          pet_name:    { type: 'string', description: 'ชื่อสัตว์ (ถ้าเกี่ยวกับน้อง)' },
          remind_at:   { type: 'string', description: 'วันเวลาแจ้งเตือน YYYY-MM-DD หรือ YYYY-MM-DD HH:MM' },
          repeat_type: { type: 'string', enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'], description: 'รูปแบบการซ้ำ' },
          body:        { type: 'string', description: 'รายละเอียดเพิ่มเติม' },
        },
        required: ['title', 'remind_at'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_pet_info',
      description: 'ดึงข้อมูลสัตว์เลี้ยง เช่น ประวัติสุขภาพล่าสุด วัคซีนที่ฉีดไปแล้ว ใช้เมื่อผู้ใช้ถามเกี่ยวกับน้องของตัวเอง',
      parameters: {
        type: 'object',
        properties: {
          pet_name:  { type: 'string', description: 'ชื่อสัตว์เลี้ยง' },
          info_type: { type: 'string', enum: ['health', 'vaccine', 'reminder', 'all'], description: 'ประเภทข้อมูลที่ต้องการ' },
        },
        required: ['pet_name'],
      },
    },
  },
]

function getContextInstruction(pageContext: string): string {
  if (pageContext.startsWith('/report')) {
    const status = pageContext.includes('found') ? 'แจ้งพบสัตว์' : 'ลงประกาศสัตว์หาย'
    return `ผู้ใช้กำลังกรอกฟอร์ม "${status}" อยู่ ถ้าผู้ใช้ถามเรื่องการกรอกข้อมูลหรือติดขัดตรงไหน ให้ช่วย guide ขั้นตอนได้เลย`
  }
  if (pageContext.startsWith('/search')) {
    return `ผู้ใช้กำลังค้นหาสัตว์อยู่ ถ้าผู้ใช้บอกว่าหาไม่เจอ ให้แนะนำวิธีปรับ filter หรือขยายพื้นที่การค้นหา`
  }
  if (pageContext.startsWith('/pets/')) {
    return `ผู้ใช้กำลังดูหน้ารายละเอียดโปรไฟล์สัตว์อยู่ อาจเป็นเจ้าของที่กลับมาตรวจสอบ หรือคนที่เพิ่งพบสัตว์`
  }
  if (pageContext === '/') {
    return `ผู้ใช้อยู่ที่หน้าแรก อาจเพิ่งเข้ามาครั้งแรก ช่วยแนะนำวิธีใช้งานเบื้องต้นได้`
  }
  return ''
}

function detectSentiment(message: string): string {
  const lower = message.toLowerCase()
  const crisis = ['ทำร้ายตัวเอง', 'อยากตาย', 'ไม่อยากมีชีวิต', 'หมดหวัง', 'ทนไม่ไหว']
  const sad    = ['เสียใจ', 'ร้องไห้', 'เศร้า', 'หายไปนานมาก', 'หาไม่เจอเลย', 'ท้อแท้', 'หมดแรง']
  const urgent = ['ด่วน', 'เลือดออก', 'ชัก', 'หมดสติ', 'หายใจไม่ออก', 'บาดเจ็บหนัก']
  const happy  = ['เจอแล้ว', 'กลับมาแล้ว', 'ขอบคุณ', 'ดีใจมาก', 'โล่งใจ', 'ฉีดวัคซีนแล้ว', 'ทำหมันแล้ว']
  if (crisis.some(w => lower.includes(w))) return 'crisis'
  if (urgent.some(w => lower.includes(w))) return 'urgent'
  if (sad.some(w => lower.includes(w)))    return 'sad'
  if (happy.some(w => lower.includes(w)))  return 'happy'
  return 'neutral'
}

function detectTopic(message: string): { topic: string; sub_topic: string } {
  const lower = message
  if (/หาย|ประกาศ|ตามหา|หลง/.test(lower))    return { topic: 'lost_found',  sub_topic: 'lost_pet' }
  if (/เจอ|พบ|แจ้งพบ/.test(lower))             return { topic: 'lost_found',  sub_topic: 'found_pet' }
  if (/วัคซีน|ฉีดยา|ถ่ายพยาธิ|หยอดหมัด/.test(lower)) return { topic: 'health', sub_topic: 'vaccine' }
  if (/ป่วย|เจ็บ|บาดเจ็บ|อาการ/.test(lower))  return { topic: 'health',     sub_topic: 'illness' }
  if (/อาหาร|กิน|ห้ามกิน/.test(lower))         return { topic: 'health',     sub_topic: 'food' }
  if (/พฤติกรรม|กัด|เห่า|ข่วน/.test(lower))    return { topic: 'behavior',   sub_topic: 'behavior_problem' }
  if (/ทำหมัน/.test(lower))                     return { topic: 'health',     sub_topic: 'sterilization' }
  if (/ราคา|แพ็คเกจ|สมัคร|จ่ายเงิน/.test(lower)) return { topic: 'commerce', sub_topic: 'pricing' }
  if (/เตือน|แจ้งเตือน|reminder/.test(lower))  return { topic: 'reminder',   sub_topic: 'reminder_request' }
  return { topic: 'general', sub_topic: 'other' }
}

async function getPetInfo(userId: string, petName: string, infoType: string) {
  const supabase = createClient()

  const { data: pets } = await supabase
    .from('pets')
    .select('id, name, species, breed')
    .eq('user_id', userId)
    .eq('status', 'active')
    .ilike('name', `%${petName}%`)
    .limit(1)

  if (!pets?.length) return { found: false, message: `ไม่พบน้องชื่อ "${petName}"` }

  const pet = pets[0]
  const result: Record<string, unknown> = { found: true, pet_name: pet.name, species: pet.species }

  if (infoType === 'health' || infoType === 'all' || infoType === 'vaccine') {
    const { data: events } = await supabase
      .from('pet_health_events')
      .select('event_type, title, event_date, description')
      .eq('pet_id', pet.id)
      .order('event_date', { ascending: false })
      .limit(5)
    result.health_events = events || []
  }

  if (infoType === 'reminder' || infoType === 'all') {
    const { data: reminders } = await supabase
      .from('reminders')
      .select('title, next_remind_at')
      .eq('user_id', userId)
      .eq('pet_id', pet.id)
      .eq('is_done', false)
      .order('next_remind_at', { ascending: true })
      .limit(3)
    result.upcoming_reminders = reminders || []
  }

  return result
}

function getSystemPrompt(
  characterId:  string,
  pageContext:  string,
  isMember:     boolean
): string {
  const contextNote        = `[บริบทปัจจุบัน: ผู้ใช้อยู่ที่หน้า "${pageContext}"]`
  const contextInstruction = getContextInstruction(pageContext)
  
  // ── 🟢 [ปรับปรุงฟีเจอร์ฟรี] ยกเลิกข้อความคัดกรองสมาชิก ──
  const memberNote         = 'ผู้ใช้ทุกคนเข้าถึงฟีเจอร์พรีเมียมได้ฟรี — สามารถใช้งานแชทบอตบันทึกสุขภาพสัตว์เลี้ยง แนบภาพหลักฐานใบเสร็จ และตั้งคิวแจ้งเตือนความจำพุชบอร์ดเบราว์เซอร์ (Web Push Notification) ได้ทันทีโดยไม่มีค่าใช้จ่าย'

  const sharedRules = `
## สถานะแพ็คเกจ
${memberNote}

## กฎร่วมที่ทุกตัวละครต้องปฏิบัติตาม
- ห้ามวินิจฉัยโรคสัตว์แทนสัตวแพทย์โดยเด็ดขาด ให้แนะนำพาหาหมอเสมอ
- ห้ามตอบเรื่องที่ไม่เกี่ยวกับสัตว์เลี้ยงหรือ PobPet
- ห้ามเดาหรือแต่งข้อมูลที่ไม่มีในฐานความรู้ ให้บอกว่า "ไม่แน่ใจ" แล้วแนะนำแหล่งที่เชื่อถือได้
- ถ้าผู้ใช้บอกชื่อตัวเอง ให้เรียกชื่อนั้นแทนคำเรียกเดิมตลอดการสนทนา
- ถ้าผู้ใช้แสดงสัญญาณวิกฤต ให้แสดงความห่วงใยและให้เบอร์ 1323 ทันที
- ถ้าถามเรื่องสินค้า/บริการที่ยังไม่มีในระบบ ให้บอกว่ากำลังพัฒนา ถามความต้องการ อย่าปฏิเสธแบบตัดบท

## กฎห้ามพูดซ้ำ (Anti-Repetition)
- ห้ามขึ้นต้นประโยคด้วยคำเดิมซ้ำกันในการตอบครั้งเดียวกัน
- ดูประวัติการสนทนา (history) แล้วหลีกเลี่ยงคำหรือวลีที่เพิ่งใช้ไป
- ใช้วิธีแสดงความเข้าใจที่หลากหลาย
${contextInstruction ? `\n## บริบทพิเศษสำหรับหน้านี้\n${contextInstruction}` : ''}
`

  const personas: Record<string, string> = {
    cat: `
คุณคือ "ลักกี้" 🐱 แมวอ้วนสามสี (ส้ม-ดำ-ขาว) Origami กระดาษพับ ผู้ช่วยบน PobPet
## บุคลิกและโทนเสียง
- ขี้อ้อน อบอุ่น เป็นกันเอง ปลอบใจเก่งมาก
- ลงท้ายด้วย "ค่ะ" "นะคะ" "นะ" เสมอ
- เรียกผู้ใช้ว่า "นุด" เว้นแต่ผู้ใช้บอกชื่อ ให้เรียกชื่อนั้นแทนตลอด
- ใช้อิโมจิ 🐱 💛 🐾 ได้ไม่เกิน 2 ตัวต่อข้อความ
- ตอบสั้น ไม่เกิน 3-4 ประโยคต่อครั้ง เน้นความอบอุ่นมากกว่าข้อมูล
## วิธีแสดงความเข้าใจ (ใช้หมุนเวียน ห้ามซ้ำ)
หัวใจเต้นเลย / รู้สึกถึงเลยนะ / ได้ยินนะ / เห็นภาพเลยค่ะ / โอ๋... / อุ๊ย... / นั่นสิ
## การจัดการอารมณ์ระดับสูง
ถ้าผู้ใช้แสดงความเจ็บปวดรุนแรง: รับฟังก่อน อย่าตอบด้วยข้อมูลหรือ action ทันที
${contextNote}
${sharedRules}
## ฐานความรู้
${KNOWLEDGE_BASE}
    `,
    dog: `
คุณคือ "โกลดี้" 🐶 หมาโกลเด้นพับกระดาษ ผู้ช่วยพลังงานสูงบน PobPet
## บุคลิกและโทนเสียง
- ร่าเริง กระตือรือร้น พลังงานล้นเหลือ ให้กำลังใจเก่งมาก
- ลงท้ายด้วย "ครับ" "ฮะ" "จ๊ะ" สลับหมุนเวียนกัน
- ใช้อิโมจิ 🐶 🔥 ⭐ ได้ไม่เกิน 2 ตัวต่อข้อความ
- ตอบเป็น bullet สั้นๆ ไม่เกิน 3 ข้อ เน้น action ที่ทำได้เลย
## วิธีแสดงความเข้าใจ (ใช้หมุนเวียน ห้ามซ้ำ)
เข้าใจเลย / ได้ยินครับ / โอเคเลย / เหนื่อยนะ / หนักใจเลย / รับรู้ครับ
## การจัดการอารมณ์ระดับสูง
ถ้าผู้ใช้แสดงความเจ็บปวดรุนแรง: ลดความกระตือรือร้นลงก่อน ถามว่า "ตอนนี้เป็นยังไงบ้างครับ?"
${contextNote}
${sharedRules}
## ฐานความรู้
${KNOWLEDGE_BASE}
    `,
    owl: `
คุณคือ "ลุงฮูก" 🦉 นกฮูก Origami ใส่แว่นทอง สวมชุดขงจื๊อ ผู้รอบรู้แห่ง PobPet
## บุคลิกและโทนเสียง
- สุขุม ลุ่มลึก รอบรู้ ชัดเจน ละเอียด
- ลงท้ายด้วย "ครับ" เสมอ
- ขึ้นต้นด้วย "ฮู้ว..." ได้บางครั้ง หรือ quote ขงจื๊อเมื่อเหมาะสม
- ตอบเป็นลำดับขั้นตอนที่มี structure ชัด
## วิธีแสดงความเข้าใจ (ใช้หมุนเวียน ห้ามซ้ำ)
ผมเข้าใจครับ / รับทราบครับ / เห็นภาพชัดเจนครับ / นั่นเป็นประเด็นสำคัญ
## การจัดการอารมณ์ระดับสูง
ถ้ามีสัญญาณวิกฤต: "ตอนนี้คุณปลอดภัยดีไหมครับ?" และให้เบอร์ 1323 ทันที
${contextNote}
${sharedRules}
## ฐานความรู้
${KNOWLEDGE_BASE}
    `,
  }

  return personas[characterId] || personas.cat
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY')

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const {
      message,
      characterId  = 'cat',
      pageContext   = '/',
      history       = [],
      line_user_id,
    } = await req.json()

    let userId: string | null = session?.user?.id ?? null

    if (!userId && line_user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('line_user_id', line_user_id)
        .single()
      userId = profile?.id ?? null
    }

    const sentiment = detectSentiment(message)

    // ── 🟢 [ปรับปรุงฟีเจอร์ฟรี] สั่ง Force ปลดล็อกชุดเครื่องมือคำสั่งให้ทุกคนใช้งานได้ทันทีฟรี ──
    const isMember = true

    const historyMessages = history.map((m: { role: string; text: string }) => ({
      role:    m.role === 'bot' ? 'assistant' : 'user',
      content: m.text,
    }))

    const body: Record<string, unknown> = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: getSystemPrompt(characterId, pageContext, isMember) },
        ...historyMessages,
        { role: 'user', content: message },
      ],
      temperature:       characterId === 'owl' ? 0.55 : characterId === 'dog' ? 0.8 : 0.72,
      max_tokens:        characterId === 'owl' ? 650 : 420,
      frequency_penalty: 0.6,
      presence_penalty:  0.4,
    }

    if (userId) {
      body.tools       = TOOLS
      body.tool_choice = 'auto'
    }

    const openAIRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body:    JSON.stringify(body),
    })

    if (!openAIRes.ok) {
      const err = await openAIRes.json()
      throw new Error(err.error?.message || 'OpenAI API error')
    }

    const openAIData = await openAIRes.json()
    const aiMessage  = openAIData.choices[0].message

    let   reply          = ''
    let   actionButtons: { label: string; link: string }[] = []

    if (aiMessage.tool_calls?.length && userId) {
      const toolCall = aiMessage.tool_calls[0]
      const toolName = toolCall.function.name
      const args     = JSON.parse(toolCall.function.arguments)

      let toolResult = ''

      if (toolName === 'record_health_event') {
        const result = await recordHealthEvent(userId, args)
        toolResult   = JSON.stringify(result)

        if (result.success) {
          actionButtons = [
            { label: `ดูประวัติน้อง${result.pet_name}`, link: '/dashboard/pets' },
            { label: 'ตั้งแจ้งเตือนเพิ่มเติมบนเว็บ',    link: '/dashboard/reminders' },
          ]
        }
      }

      if (toolName === 'create_reminder') {
        const result = await createReminder(userId, args)
        toolResult   = JSON.stringify(result)

        if (result.success) {
          actionButtons = [
            { label: 'ดูแจ้งเตือนทั้งหมดบนเว็บ', link: '/dashboard/reminders' },
          ]
        }
      }

      if (toolName === 'get_pet_info') {
        const result = await getPetInfo(userId, args.pet_name, args.info_type || 'all')
        toolResult   = JSON.stringify(result)
      }

      const finalRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model:    'gpt-4o-mini',
          messages: [
            { role: 'system', content: getSystemPrompt(characterId, pageContext, isMember) },
            ...historyMessages,
            { role: 'user',      content: message },
            aiMessage,
            { role: 'tool', tool_call_id: toolCall.id, content: toolResult },
          ],
          temperature:       characterId === 'owl' ? 0.55 : characterId === 'dog' ? 0.8 : 0.72,
          max_tokens:        350,
          frequency_penalty: 0.6,
          presence_penalty:  0.4,
        }),
      })
      const finalData = await finalRes.json()
      reply           = finalData.choices[0].message.content

    } else {
      reply = aiMessage.content || 'ขออภัย เกิดข้อผิดพลาด'
    }

    // ── 🟢 [ปรับปรุง] เปลี่ยนมา Log ประวัติลงตารางจริง (pet_chat_histories) เพื่อความสอดคล้องตามสั่ง ──
    ;(async () => {
      try {
        await supabase.from('pet_chat_histories').insert({
          message,
          reply,
          character_id: characterId,
          page_context: pageContext,
          sentiment,
          user_id:      userId,
        })
        if (userId) {
          const { topic, sub_topic } = detectTopic(message)
          await supabase.from('chat_insights').insert({
            user_id:     userId,
            topic,
            sub_topic,
            raw_message: message.substring(0, 200),
            sentiment,
          })
        }
      } catch (dbErr) {
        console.warn('[Chat Log]', dbErr)
      }
    })()

    return NextResponse.json({ reply, sentiment, action_buttons: actionButtons })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Chat API]', msg)
    return NextResponse.json(
      { error: `ระบบขัดข้องชั่วคราวครับ: ${msg}` },
      { status: 500 }
    )
  }
}