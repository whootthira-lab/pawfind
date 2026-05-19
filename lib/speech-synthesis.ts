// lib/speech-synthesis.ts
// ── Text-to-Speech ผ่าน Web Speech API (ฟรี ไม่มีค่าใช้จ่าย) ─

let currentUtterance: SpeechSynthesisUtterance | null = null

export function speakText(text: string, lang = 'th-TH'): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  // หยุดถ้ากำลังพูดอยู่
  stopSpeaking()

  // ตัด markdown/emoji บางส่วนออกเพื่อให้ฟังดีขึ้น
  const cleaned = text
    .replace(/\*\*(.*?)\*\*/g, '$1')   // bold
    .replace(/\*(.*?)\*/g, '$1')        // italic
    .replace(/#{1,3}\s/g, '')           // headers
    .replace(/\[.*?\]\(.*?\)/g, '')     // links
    // ลบ emoji ด้วย char code range (ไม่ใช้ /u flag เพื่อ compatibility)
    .replace(/[\uD800-\uDFFF]/g, '')   // surrogate pairs (emoji)
    .trim()

  currentUtterance = new SpeechSynthesisUtterance(cleaned)
  currentUtterance.lang  = lang
  currentUtterance.rate  = 0.92   // ช้าลงนิด อ่านง่าย
  currentUtterance.pitch = 1.05
  currentUtterance.volume = 1

  // เลือกเสียงภาษาไทยถ้ามี
  const voices   = window.speechSynthesis.getVoices()
  const thVoice  = voices.find(v => v.lang === 'th-TH' || v.lang.startsWith('th'))
  if (thVoice) currentUtterance.voice = thVoice

  window.speechSynthesis.speak(currentUtterance)
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined') return
  window.speechSynthesis?.cancel()
  currentUtterance = null
}

export function isSpeaking(): boolean {
  if (typeof window === 'undefined') return false
  return window.speechSynthesis?.speaking ?? false
}
