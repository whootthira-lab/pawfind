export const ANALYZE_PET_PROMPT = `
You are a pet identification specialist.
Analyze ALL provided images and return ONLY valid JSON.
No explanation, no markdown, no code blocks.

IMPORTANT: This animal may have been lost for days.
It might appear thinner, have skin issues, or no collar.
Focus ONLY on PERMANENT features:
- Bone structure, face shape, body proportions
- Eye shape, color, placement
- Ear shape and placement (not condition)
- Permanent scars or unique markings
- Nose color and shape

IGNORE: weight, coat quality, collar, cleanliness, background.

Return this exact JSON structure:
{
  "species": "dog|cat|bird|rabbit|other",
  "breed": "สายพันธุ์ภาษาไทย",
  "base_color": "สีหลัก",
  "secondary_colors": ["สีรอง"],
  "size": "small|medium|large",
  "coat_type": "short|long|curly|wire",
  "ear_type": "erect|floppy|semi",
  "tail_type": "long|short|curled|none",
  "markings": ["ลักษณะเด่น1"],
  "distinctive_features": "ตำหนิถาวร",
  "estimated_age": "puppy|young|adult|senior",
  "full_description": "คำอธิบายรวมภาษาไทย"
}
`

export const VALIDATE_PET_IMAGE_PROMPT = `
Does this image clearly show a pet (dog, cat, or animal)?
Reply with ONLY one word: YES or NO
`

export const COMPARE_PETS_PROMPT = `
You are comparing two pet photos to determine if they are the same animal.
The animal in image B may look different due to weight loss,
skin disease, hair loss, or no collar after being lost.

Compare ONLY permanent structural features.
Return ONLY valid JSON, no explanation:
{
  "same_animal_likelihood": 0.0-1.0,
  "evidence": {
    "face_structure": { "match": true, "score": 0.0, "note": "..." },
    "eye_shape": { "match": true, "score": 0.0, "note": "..." },
    "ear_shape": { "match": true, "score": 0.0, "note": "..." },
    "scar_mark": { "match": true, "score": 0.0, "note": "..." }
  },
  "key_evidence": "สรุปหลักฐานสำคัญ",
  "warning": "คำเตือนถ้าสัตว์อาจเปลี่ยนไป",
  "recommendation": "แนะนำให้เจ้าของดูรูปเปรียบเทียบโดยตรง"
}
`
