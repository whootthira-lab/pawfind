'use client'

import { useState } from 'react'
import { SearchResult } from '@/types/pet'
import { Button } from '@/components/ui/button'

interface SearchUploadProps {
  onResults: (results: SearchResult[], radius: number) => void
  onLoading: (loading: boolean) => void
}

export function SearchUpload({ onResults, onLoading }: SearchUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [province, setProvince] = useState('')
  const [marking, setMarking] = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSearch = async () => {
    if (!preview) return
    onLoading(true)
    try {
      const b64 = preview.split(',')[1]
      const res = await fetch('/api/search', {
        method: 'POST',
        body: JSON.stringify({
          imageBase64: b64,
          province,
          marking,
        })
      })
      const { data, error } = await res.json()
      if (error) alert(error)
      if (data) {
        onResults(data.results, data.radiusUsed)
      }
    } catch (err) {
      console.error(err)
    } finally {
      onLoading(false)
    }
  }

  return (
    <div className="bg-washi border-2 border-black p-6 rounded-lg shadow-paper">
      <h2 className="text-xl font-bold mb-4">ค้นหาน้องด้วยรูปภาพ</h2>
      
      <div className="border-2 border-dashed border-black p-8 text-center rounded bg-white mb-4 cursor-pointer hover:bg-wagashi-sakura transition-colors">
        <input type="file" onChange={handleFile} accept="image/*" className="hidden" id="upload" />
        <label htmlFor="upload" className="cursor-pointer">
          {preview ? (
            <img src={preview} alt="preview" className="max-h-48 mx-auto" />
          ) : (
            <div>คลิกเพื่ออัปโหลด หรือลากรูปมาวางที่นี่</div>
          )}
        </label>
      </div>

      <div className="flex flex-col gap-4 mb-4">
        <input 
          type="text" 
          placeholder="จังหวัด (ไม่บังคับ)" 
          value={province} 
          onChange={e => setProvince(e.target.value)}
          className="border-2 border-black p-2 rounded shadow-paper-sm outline-none focus:bg-wagashi-sora transition-colors"
        />
        <input 
          type="text" 
          placeholder="ตำหนิพิเศษ (ไม่บังคับ)" 
          value={marking} 
          onChange={e => setMarking(e.target.value)}
          className="border-2 border-black p-2 rounded shadow-paper-sm outline-none focus:bg-wagashi-kinako transition-colors"
        />
      </div>

      <Button 
        onClick={handleSearch} 
        disabled={!preview}
        className="w-full bg-wagashi-matcha hover:bg-wagashi-matcha/80 text-black border-2 border-black shadow-paper-sm hover:shadow-paper transition-all font-bold"
      >
        เริ่มค้นหาด้วย AI
      </Button>
    </div>
  )
}
