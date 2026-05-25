import { createClient } from '@/lib/supabase/server'
import { createEmbedding } from '@/lib/ai/embed'
import type { SearchResult, MatchTier } from '@/types/pet'

const RADIUS_STEPS = [20, 50, 100, 200, null] // km, null = unlimited
const MIN_RESULTS = 5

// Threshold ลดลงเมื่อรัศมีขยาย
function getThreshold(radiusKm: number | null): number {
  if (!radiusKm) return 0.50
  if (radiusKm <= 20) return 0.70
  if (radiusKm <= 50) return 0.65
  if (radiusKm <= 100) return 0.60
  return 0.55
}

function getTier(score: number): MatchTier {
  if (score >= 0.75) return 'high'
  if (score >= 0.50) return 'possible'
  return 'low'
}

export interface HybridSearchOptions {
  queryText: string   // full_description จาก Gemini
  lat: number
  lng: number
  type: string
  marking?: string
  initialRadiusKm?: number
}

export interface HybridSearchResult {
  results: SearchResult[]
  radiusUsed: number | null
  expanded: boolean
}

export async function hybridSearch(
  opts: HybridSearchOptions
): Promise<HybridSearchResult> {
  const supabase = createClient()
  const queryVector = await createEmbedding(opts.queryText)
  const vectorStr = `[${queryVector.join(',')}]`

  let results: SearchResult[] = []
  let radiusUsed: number | null = opts.initialRadiusKm ?? 20
  let expanded = false

  for (const radius of RADIUS_STEPS) {
    const threshold = getThreshold(radius)
    const { data, error } = await supabase.rpc('hybrid_search', {
      query_vector: vectorStr,
      search_lat: opts.lat,
      search_lng: opts.lng,
      pet_type: opts.type,
      radius_meters: radius ? radius * 1000 : null,
      similarity_threshold: threshold,
      marking_filter: opts.marking ?? '',
      result_limit: 20
    })
    if (error) throw error
    results = (data ?? []).map((r: any) => ({
      ...r,
      tier: getTier(r.similarity)
    }))
    if (results.length >= MIN_RESULTS) {
      radiusUsed = radius
      break
    }
    expanded = true
  }
  return { results: results.slice(0, 10), radiusUsed, expanded }
}
