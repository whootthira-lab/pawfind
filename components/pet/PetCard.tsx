'use client'
// components/pet/PetCard.tsx — พร้อม CTR + Share tracking

import { Pet } from '@/types/pet'
import Link from 'next/link'
import { MapPin, Share2 } from 'lucide-react'
import { trackCardClick, buildShareUrl } from '@/lib/analytics'

function speciesIcon(type: string) {
  return ({ dog:'🐕', cat:'🐈', bird:'🦜', rabbit:'🐰', fish:'🐟', other:'🐾' } as any)[type] ?? '🐾'
}

function statusCfg(status: string) {
  return ({
    lost:     { label:'หาย',    color:'#D94F1E', bg:'#FDEEE8' },
    found:    { label:'พบเห็น', color:'#2D6A2D', bg:'#E8F3E8' },
    adoption: { label:'รอบ้าน', color:'#1A5EA8', bg:'#E3EEF8' },
  } as any)[status] ?? { label: status, color:'#1A1208', bg:'#F5EDD8' }
}

export function PetCard({ pet }: { pet: Pet }) {
  const imgUrl = (pet as any).primary_image || pet.image_url
  const cfg    = statusCfg((pet as any).status || 'lost')
  const icon   = speciesIcon((pet as any).species || (pet as any).type || 'other')
  const days   = (pet as any).days_missing

  // ── Mini share จากการ์ด (ไม่เปิด dropdown — share ตรงไป platform native) ──
  const handleCardShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    trackCardClick(pet.id, 'share_from_card')

    const shareUrl = buildShareUrl(pet.id, 'card_share')
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cfg.label}: ${pet.name || 'สัตว์เลี้ยง'} - PobPet`,
          text:  `ช่วยแชร์เพื่อส่งน้องกลับบ้าน 🐾`,
          url:   shareUrl,
        })
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      alert('คัดลอกลิงก์แล้ว!')
    }
  }

  return (
    <div className="ori-card flex flex-col group">
      {/* 💡 Image (เปลี่ยนเป็น w-full aspect-square) ── */}
      <div className="relative w-full aspect-square overflow-hidden border-b-2 border-ori-ink shrink-0"
        style={{ background: `linear-gradient(135deg, ${cfg.bg}, #E8F3E8)` }}>
        {imgUrl ? (
          <img
            src={imgUrl.startsWith('data:') || imgUrl.startsWith('http')
              ? imgUrl : `data:image/jpeg;base64,${imgUrl}`}
            alt={pet.name || 'pet'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">{icon}</div>
        )}

        {/* Status badge */}
        <div className="absolute top-2.5 left-2.5 text-xs font-black px-2.5 py-1 rounded-full border-2 border-ori-ink"
          style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </div>

        {/* Days missing */}
        {days !== undefined && (
          <div className="absolute top-2.5 right-2.5 bg-ori-ink/75 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
            ⏱ {days < 1 ? 'วันนี้' : `${days} วัน`}
          </div>
        )}

        {/* Mini share button บนการ์ด */}
        <button
          onClick={handleCardShare}
          title="แชร์ทันที"
          className="absolute bottom-2.5 right-2.5 bg-white/90 border-2 border-ori-ink rounded-full p-1.5 hover:bg-white transition-colors shadow-sm"
        >
          <Share2 size={13} className="text-ori-ink" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: cfg.color }} />
      </div>

      {/* ── Body ── */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-black text-lg leading-tight text-ori-ink">
            {pet.name || 'ไม่ทราบชื่อ'} {icon}
          </h3>
          {(pet as any).reward_amount > 0 && (
            <span className="text-xs font-black px-2 py-0.5 rounded-full border-2 border-ori-yellow bg-ori-yellow-bg text-ori-yellow-d shrink-0">
              💰 มีรางวัล
            </span>
          )}
        </div>
        {(pet as any).breed && (
          <p className="text-sm text-ori-ink-l font-medium">{(pet as any).breed}</p>
        )}
        <div className="flex items-center gap-1.5 text-sm font-bold text-ori-ink-m">
          <MapPin size={14} className="shrink-0" />
          <span>{(pet as any).province || 'ไม่ระบุพื้นที่'}</span>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="px-4 pb-4">
        <Link
          href={`/pet/${pet.id}`}
          onClick={() => trackCardClick(pet.id, 'view_detail')}
          className="ori-btn ori-btn-orange w-full text-sm"
        >
          ดูรายละเอียด →
        </Link>
      </div>
    </div>
  )
}