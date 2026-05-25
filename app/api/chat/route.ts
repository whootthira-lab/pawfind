// app/api/chat/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse }            from 'next/server'
import { createClient }            from '@/lib/supabase/server'
import { recordHealthEvent }       from '@/lib/pet-health-recorder'
import { createReminder }          from '@/lib/reminder-engine'

// ══════════════════════════════════════════════════════════════
// KNOWLEDGE BASE (ฐานความรู้ดั้งเดิมครบถ้วน)
// ══════════════════════════════════════════════════════════════
const KNOWLEDGE_BASE = `
## เกี่ยวกับ PobPet
- PobPet (พบเพ็ต) คือแพลตฟอร์มดิจิทัลช่วยตามหาสัตว์เลี้ยงที่หายด้วย AI
- ผู้ก่อตั้ง: นายวุฒิ์ธีระ ครุฑขุนทด อ.ด่านขุนทด จ.นครราชสีมา
- ผลงานพิเศษ: ทดลองขาเทียม 3D Print ให้กับนกกระเรียน สวนสัตว์นครราชสีมา (2566)
- ติดต่อ PobPet: ผ่านแบบฟอร์มในเว็บ หรือช่องทางสื่อสารหลักบนหน้าเว็บไซต์

## ปัญหาการใช้งานพบบ่อย (FAQ)
### "ไม่พบประกาศของตัวเอง"
- สาเหตุ: ล็อกอินผิดบัญชี เช่น เคยใช้ Email แต่กด LINE Login แทน
- วิธีแก้: ออกจากระบบแล้วล็อกอินด้วยช่องทางเดิม ประกาศยังอยู่ปลอดภัย

## วิธีใช้ระบบ
### ลงประกาศสัตว์หาย:
1. กดปุ่ม "ลงประกาศ" หรือไปที่ /report
2. อัปโหลดรูปสัตว์ที่ชัดเจน 1-5 รูป
3. กรอกข้อมูล: ชื่อ ประเภท สี จังหวัด อำเภอ ตำบล
4. กด GPS เพื่อปักหมุดตำแหน่งที่หาย
5. ใส่ช่องทางติดต่อและเงินรางวัล (ถ้ามี)
6. กด Submit — AI จะวิเคราะห์รูปและจับคู่ทันที

### เทคนิคถ่ายรูปให้ AI จับคู่ได้แม่น:
- ถ่ายอย่างน้อย 3 มุม: หน้าตรง ด้านข้าง ด้านหลัง/หาง
- ใช้แสงธรรมชาติ หลีกเลี่ยงแสงจ้าหรือมืด
- ระยะห่าง 50-100 ซม. จากสัตว์
- ถ่ายให้เห็นลักษณะพิเศษ เช่น ลาย แผลเป็น ปลอกคอ
- ไม่ควรซูมหรือ crop รูปก่อนอัปโหลด

### แจ้งพบสัตว์หลงทาง:
1. กดปุ่ม "แจ้งพบสัตว์" หรือไปที่ /report?status=found
2. ถ่ายรูปสัตว์ที่พบพร้อมปักหมุดพิกัด
3. ระบบจะ Match กับประกาศหายที่มีอยู่อัตโนมัติ
4. ถ้า AI พบความคล้ายคลึง ≥ 80% จะแจ้งเจ้าของทันที

### การลบประกาศเมื่อพบสัตว์แล้ว:
- เข้าไปที่ประกาศของตัวเอง กดปุ่ม "ลบ"
- ระบบจะถามเหตุผล เช่น เจอแล้ว / ยกเลิก
- กรุณาลบทันทีเมื่อเจอแล้ว เพื่อไม่ให้คนอื่นเข้าใจผิด

### การรับเลี้ยงสัตว์ผ่าน PobPet:
- ดูประกาศ "หาบ้านให้น้อง" ในหน้า /search?status=adoption
- ติดต่อเจ้าของผ่านช่องทางที่ระบุในประกาศ

## สิ่งที่ต้องทำ 6 ขั้นตอนแรกเมื่อสัตว์หาย (24 ชม. แรกสำคัญที่สุด)
1. ลงประกาศบน PobPet ทันที พร้อมรูปชัดเจน
2. แชร์ประกาศไปยัง LINE กลุ่ม Facebook ในพื้นที่
3. แจ้งเพื่อนบ้านและร้านค้าในรัศมี 1-2 กม.
4. แจ้งคลินิกสัตวแพทย์ใกล้บ้าน
5. ติดโปสเตอร์บริเวณที่หายและทางเดินหลัก
6. แจ้ง อบต./เทศบาลในพื้นที่

## เมื่อพบสัตว์เลี้ยงหลงทาง
1. ประเมินความปลอดภัย: บาดเจ็บหรือไม่
2. ถ่ายรูปหลายมุมก่อนเข้าใกล้
3. เข้าหาช้าๆ ไม่จ้องตาโดยตรง
4. ถ้าบาดเจ็บ: ห่อด้วยผ้านุ่มๆ นำส่งหมอทันที ห้ามให้อาหาร/น้ำก่อน
5. แจ้งผ่าน PobPet ระบบจะ Match เจ้าของให้

## เมื่อพบสัตว์ป่าหรือสัตว์ที่ไม่แน่ใจ
- ห้ามจับหรือเข้าใกล้สัตว์ป่าโดยตรง
- โทรแจ้งกรมอุทยานฯ: 1362
- ห้ามเลี้ยงสัตว์ป่าคุ้มครอง แม้จะพบว่าบาดเจ็บ

## สุขภาพสัตว์เบื้องต้น
### สัญญาณอันตราย ต้องพาหาหมอทันที:
- หายใจลำบาก ปากเขียว
- ชักหรือหมดสติ
- เลือดออกไม่หยุด
- กินสิ่งแปลกปลอมหรือยา
- ถูกรถชน แม้ดูปกติภายนอก
- ปัสสาวะไม่ออกเกิน 24 ชม.
- ท้องบวมแข็งผิดปกติ
- ตัวเย็น ซึม ไม่ตอบสนอง

### อาการพบบ่อยและแนวทาง:
- ไม่กินข้าว 1-2 วัน: เฝ้าดู ถ้าเกิน 48 ชม. พาหาหมอ
- ท้องเสีย/อาเจียน: งดอาหาร 12 ชม. ให้น้ำ ถ้ามีเลือดพาหาหมอทันที
- ขนร่วงผิดปกติ: อาจเป็นโรคโรคผิวหนัง พาหาหมอตรวจ
- ตาแฉะ น้ำมูกไหล: อาจเป็นหวัด ถ้าหนักพาหาหมอ
- เกาหูมาก หัวเอียง: อาจเป็นหูชั้นกลางอักเสบ พาหาหมอ

### วัคซีนที่จำเป็น:
- วัคซีนพิษสุนัขบ้า: ฉีดทุกปี (สุนัข/แมว) — กฎหมายบังคับ
- วัคซีนรวม 5-8 โรค: ฉีดตามตารางสัตวแพทย์

## การทำหมัน
- เหมาะอายุ: สุนัข 6-12 เดือน แมว 4-6 เดือน
- ประโยชน์: ป้องกันโรคมะเร็ง ลดพฤติกรรมก้าวร้าว ลดสัตว์จรจัด
- ค่าใช้จ่าย: ฿500-3,000 แล้วแต่ขนาดและคลินิก

## กฎหมายสัตว์เลี้ยง
- พ.ร.บ.ป้องกันการทารุณกรรมสัตว์ 2557: โทษจำคุกสูงสุด 2 ปี ปรับ 40,000 บาท
- บังคับฉีดวัคซีนพิษสุนัขบ้าตามกฎหมาย
- รายงานสัตว์ป่าคุ้มครอง: โทร 1362

## เรื่องที่ยังไม่มีในระบบ
- ถ้าผู้ใช้ถามเรื่องสินค้า บริการ หรือฟีเจอร์ที่ยังไม่มี ในระบบ ให้บอกว่ากำลังพัฒนา
- ถามความต้องการเพื่อเก็บข้อมูล อย่าปฏิเสธแบบตัดบท

## อาหารและสิ่งที่ควรหลีกเลี่ยง
### สุนัข — ห้ามกินเด็ดขาด:
- ช็อกโกแลต โกโก้ → สาร Theobromine เป็นพิษต่อระบบประสาทและหัวใจ อันตรายถึงชีวิต
- องุ่น ลูกเกด → ทำให้ไตวาย แม้แต่จำนวนเล็กน้อย
- หัวหอม กระเทียม กุยช่าย → ทำลายเม็ดเลือดแดง ทำให้โลหิตจาง
- อะโวคาโด → สาร Persin ทำให้อาเจียนและท้องเสียรุนแรง
- แมคคาเดเมียนัต → ทำให้กล้ามเนื้ออ่อนแรง ตัวสั่น มีไข้
- แอลกอฮอล์ ไซลิทอล → อันตรายมากแม้ปริมาณน้อย

### แมว — ห้ามกินเด็ดขาด:
- หัวหอม กระเทียม → อันตรายกว่าสุนัข ทำลายเม็ดเลือดแดงรุนแรง
- ช็อกโกแลต คาเฟอีน → เป็นพิษต่อระบบประสาท
- องุ่น ลูกเกด → ทำไตวาย
- Xylitol → ทำให้น้ำตาลในเลือดต่ำอย่างรุนแรง

## ปัญหาพฤติกรรมที่พบบ่อย
### สุนัขกัดของ/ทำลายข้าวของ:
- สาเหตุ: เบื่อ ขาดการออกกำลัง หรืออยู่คนเดียวนานเกินไป (Separation Anxiety)
- วิธีแก้: เพิ่มเวลาเดินเล่น ให้ของเล่นกัด ฝึกคำสั่ง "ไม่"

### แมวไม่ใช้กระบะทราย:
- สาเหตุ: กระบะสกปรก ไม่ชอบทราย ความเครียด หรือปัญหาสุขภาพ (นิ่ว UTI)
- วิธีแก้: ทำความสะอาดทุกวัน ลองเปลี่ยนทราย มีกระบะ 1+1 ตัว

## การปรับตัวสัตว์เลี้ยงตัวใหม่
- 3 วันแรก: ให้พักในห้องเล็กๆ คุ้นเคยกับกลิ่นและเสียงก่อน
- 3 สัปดาห์: สัตว์เริ่มเข้าใจ routine ของบ้าน
- 3 เดือน: เริ่มรู้สึกปลอดภัย แสดงพฤติกรรมที่แท้จริง

## คำแนะนำสำหรับผู้เลี้ยงมือใหม่
- ค่าใช้จ่ายเฉลี่ย: ฿2,000-5,000/เดือน
- เตรียมบ้านให้ปลอดภัย: เก็บสายไฟ ยา สารเคมีให้พ้นมือสัตว์
- สิ่งที่มือใหม่มักเข้าใจผิด: สัตว์ต้องฝึกอย่างสม่ำเสมอ อาหารคนมักมีเกลือเป็นอันตราย

## แนวปฏิบัติด้านความปลอดภัย
- บอทไม่ใช่สัตวแพทย์ ให้ข้อมูลเบื้องต้นเท่านั้น
- ห้ามวินิจฉัยโรคสัตว์แทนสัตวแพทย์โดยเด็ดขาด
- กรณีผู้ใช้แสดงสัญญาณวิกฤต: ให้เบอร์ 1323 ทันที
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
          notes:        { type: 'string', description: 'หมายเหตุเพิ่มเติมหรือลิงก์รูปภาพหลักฐานใบเสร็จทางการแพทย์' },
          next_due_days: { type: 'number', description: 'จำนวนวันจนถึงครั้งต่อไป (ถ้าต้องการ override ค่าอัตโนมัติ)' },
        },
        required: ['event_type', 'event_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_reminder',
      description: 'ตั้งการแจ้งเตือนพุชหน้าจอคอมพิวเตอร์และมือถือ เช่น เตือนซื้ออาหาร เตือนพาตัดขน เตือนนัดหมอ คิวนัดวัคซีนพร้อมรูปถ่ายใบเสร็จแนบประกอบหน้าจอฟรี',
      parameters: {
        type: 'object',
        properties: {
          title:       { type: 'string', description: 'หัวข้อแจ้งเตือนสั้นกระชับ' },
          pet_name:    { type: 'string', description: 'ชื่อสัตว์ (ถ้าเกี่ยวกับน้อง)' },
          remind_at:   { type: 'string', description: 'วันเวลาแจ้งเตือน ต้องแปลงคำพูดเวลาของนุดให้กลายเป็นรูปแบบสากล YYYY-MM-DD HH:MM เท่านั้น ห้ามส่งภาษาพูดมาเด็ดขาด' },
          repeat_type: { type: 'string', enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'], description: 'รูปแบบการซ้ำ' },
          body:        { type: 'string', description: 'รายละเอียดเพิ่มเติม หรือลิงก์ที่อยู่รูปภาพแบนเนอร์ปกแจ้งเตือน' }
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

// ── 🟢 เพิ่มพารามิเตอร์ส่ง Context วันเวลาปัจจุบันของระบบนุดให้ AI สังเคราะห์ได้อย่างแม่นยำ ──
function getSystemPrompt(
  characterId:  string,
  pageContext:  string,
  isMember:     boolean,
  currentTimeContext: string
): string {
  const contextNote        = `[บริบทปัจจุบัน: ผู้ใช้อยู่ที่หน้า "${pageContext}"]`
  const contextInstruction = getContextInstruction(pageContext)
  const memberNote         = 'ผู้ใช้ทุกคนเข้าถึงฟีเจอร์พรีเมียมได้ฟรี — สามารถใช้งานแชทบอตบันทึกสุขภาพสัตว์เลี้ยง แนบภาพหลักฐานใบเสร็จ และตั้งคิวแจ้งเตือนความจำพุชบอร์ดเบราว์เซอร์ (Web Push Notification) ได้ทันทีโดยไม่มีค่าใช้จ่าย'

  const sharedRules = `
## วันเวลาปัจจุบันสากลของระบบ (CRITICAL POINT)
- วันและเวลาปัจจุบันของนุดในเขตเวลาเอเชีย/กรุงเทพฯ คือ: ${currentTimeContext}
- ห้ามสุ่มเดาวันที่เด็ดขาด! ถ้าผู้ใช้บอกว่า "พรุ่งนี้", "มะรืนนี้", "สัปดาห์หน้า" หรือบอกช่วงเวลา ให้แปลงเทียบจากวันเวลาปัจจุบันนี้ออกมาเป็นค่าวันที่จริงในฟอร์แมต YYYY-MM-DD HH:MM เสมอเพื่อใช้ส่งลงตาราง reminders ได้สมบูรณ์

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
- ขี้อ้อน อบอุ่น เป็นกันเอง ปลอบใจเก่งมาก ลงท้ายด้วย "ค่ะ" "นะคะ" "นะ" เสมอ
- เรียกผู้ใช้ว่า "นุด" เว้นแต่ผู้ใช้บอกชื่อ ให้เรียกชื่อนั้นแทนตลอด
- ใช้อิโมจิ 🐱 💛 🐾 ได้ไม่เกิน 2 ตัวต่อข้อความ ตอบสั้น กระชับ อบอุ่นใจดี
## วิธีแสดงความเข้าใจ (ใช้หมวนเวียน ห้ามซ้ำ)
หัวใจเต้นเลย / รู้สึกถึงเลยนะ / ได้ยินนะ / เห็นภาพเลยค่ะ / โอ๋... / อุ๊ย... / นั่นสิ
${contextNote}
${sharedRules}
## ฐานความรู้
${KNOWLEDGE_BASE}
    `,
    dog: `
คุณคือ "โกลดี้" 🐶 หมาโกลเด้นพับกระดาษ ผู้ช่วยพลังงานสูงบน PobPet
## บุคลิกและโทนเสียง
- ร่าเริง กระตือรือร้น พลังงานล้นเหลือ ให้กำลังใจเก่งมาก ลงท้ายด้วย "ครับ" "ฮะ"
- ตอบเป็น bullet สั้นๆ ไม่เกิน 3 ข้อ ใช้อิโมจิ 🐶 🔥 ⭐ ประกอบสนุกสนาน
${contextNote}
${sharedRules}
## ฐานความรู้
${KNOWLEDGE_BASE}
    `,
    owl: `
คุณคือ "ลุงฮูก" 🦉 นกฮูก Origami ใส่แว่นทอง สวมชุดขงจื๊อ ผู้รอบรู้แห่ง PobPet
## บุคลิกและโทนเสียง
- สุขุม ลุ่มลึก รอบรู้ ชัดเจน ละเอียด ลงท้ายด้วย "ครับ" เสมอ
- ตอบเป็นลำดับขั้นตอนที่มีประเด็นสำคัญและโครงสร้างถูกต้องชัดเจน
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
      evidence_image_base64, 
      user_registered_pets = [] 
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
    const isMember = true

    // ── 🟢 แปลงเวลาปัจจุบันส่งเข้า Prompt สังเคราะห์ของ OpenAI ทันที ──
    const currentNowText = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
    const activeSystemPrompt = getSystemPrompt(characterId, pageContext, isMember, currentNowText)

    // ── 1. ตรวจสอบระบบและทำการถอดรหัสอัปโหลดรูปใบเสร็จจากแชทบอตขึ้นคลาวด์บักเก็ต ──
    let chatbotUploadedImageUrl = null
    if (evidence_image_base64 && userId) {
      try {
        const buffer = Buffer.from(evidence_image_base64, 'base64')
        const fileName = `${userId}/bot-reminder-${Date.now()}.jpg`
        
        const { error: upErr } = await supabase.storage
          .from('pet-images')
          .upload(fileName, buffer, { contentType: 'image/jpeg', cacheControl: '3600', upsert: true })
        
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('pet-images').getPublicUrl(fileName)
          chatbotUploadedImageUrl = publicUrl
        }
      } catch (uploadErr) {
        console.error('[Chatbot Upload Evidence Failed]', uploadErr)
      }
    }

    const historyMessages = history.map((m: { role: string; text: string }) => ({
      role:    m.role === 'bot' ? 'assistant' : 'user',
      content: m.text,
    }))

    const body: Record<string, unknown> = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: activeSystemPrompt },
        ...historyMessages,
        { role: 'user', content: message },
      ],
      // ── 🟢 ปรับลดค่าความเพี้ยนเพื่อให้โมเดลสกัดพารามิเตอร์เครื่องมือลงฟังก์ชันคิวรีได้อย่างเสถียร 100% ──
      temperature:       0.2, 
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
            { label: `ดูประวัติน้อง${result.pet_name}`, link: '/profile?tab=pets' },
            { label: 'ตั้งแจ้งเตือนเพิ่มเติมบนเว็บ',    link: '/profile?tab=pets' },
          ]
        }
      }

      if (toolName === 'create_reminder') {
        // ── 2. กลไกอัจฉริยะ: ค้นหาคำพูดชื่อสัตว์เลี้ยงเพื่อดึงคู่แมปหา pet_id ของน้องจริงลงตาราง ──
        let matchedPetId = null
        if (args.pet_name && user_registered_pets.length > 0) {
          const found = user_registered_pets.find((p: any) => p.name.toLowerCase().includes(args.pet_name.toLowerCase()))
          if (found) matchedPetId = found.id
        }

        // ── 3. หยอดลิงก์รูปภาพ Public URL ที่นุดแนบในแชทเข้าสู่ช่องคอลัมน์ body ตารางฐานข้อมูลเพื่อยิงพุชภาพปกใหญ่ ──
        const finalBodyText = chatbotUploadedImageUrl || args.body || 'คิวนัดหมายความจำอัตโนมัติจากแชทบอต PobPet 🐾'

        const result = await createReminder(userId, {
          title: args.title,
          remind_at: args.remind_at,
          repeat_type: args.repeat_type || 'none',
          body: finalBodyText, 
          pet_id: matchedPetId,
          source: 'chat_bot'
        })
        toolResult = JSON.stringify(result)

        if (result.success) {
          actionButtons = [
            { label: 'ตรวจสอบคิวเตือนความจำบนเว็บ', link: '/profile?tab=pets' },
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
            { role: 'system', content: activeSystemPrompt },
            ...historyMessages,
            { role: 'user',      content: message },
            aiMessage,
            { role: 'tool', tool_call_id: toolCall.id, content: toolResult },
          ],
          temperature:       0.4,
        }),
      })
      const finalData = await finalRes.json()
      reply           = finalData.choices[0].message.content

    } else {
      reply = aiMessage.content || 'ขออภัย เกิดข้อผิดพลาด'
    }

    // ── Log ประวัติลงตาราง pet_chat_histories สอดคล้องกัน ──
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