import type { CrimeRecord } from '../types/crime'

export type DangerLevel = 'high' | 'medium' | 'low'

export interface StreetSegment {
  blockAddress: string
  path: google.maps.LatLngLiteral[]
  crimeCount: number
  dangerLevel: DangerLevel
  dangerScore: number // 0-100
}

/** Seattle avenues run N-S; streets run E-W. Other cities default to E-W. */
function estimateOrientation(blockAddress: string): 'ns' | 'ew' {
  const lower = blockAddress.toLowerCase()
  if (
    /\bave\b/.test(lower) ||
    /\bavenue\b/.test(lower) ||
    /\bav\b/.test(lower) ||
    // numbered avenues: "3rd ave n", "15th ave"
    /\d+(st|nd|rd|th)\s+ave/.test(lower)
  ) {
    return 'ns'
  }
  return 'ew'
}

/** Returns a ~150 m polyline path centred at (lat, lng) with the given orientation. */
function makeSegmentPath(
  lat: number,
  lng: number,
  orientation: 'ns' | 'ew',
): google.maps.LatLngLiteral[] {
  // ~0.0007 deg ≈ 78 m → total segment ≈ 156 m
  const HALF = 0.0007
  if (orientation === 'ns') {
    return [
      { lat: lat - HALF, lng },
      { lat: lat + HALF, lng },
    ]
  }
  const lngAdj = HALF / Math.cos((lat * Math.PI) / 180)
  return [
    { lat, lng: lng - lngAdj },
    { lat, lng: lng + lngAdj },
  ]
}

/**
 * Groups crimes by block_address, ranks by count, and returns polyline segments
 * for the top `thresholdPct` percent of streets.
 */
export function computeStreetSegments(
  data: CrimeRecord[],
  thresholdPct = 30,
): StreetSegment[] {
  const blockMap = new Map<string, { latSum: number; lngSum: number; count: number }>()

  for (const crime of data) {
    if (!crime.block_address) continue
    const lat = parseFloat(crime.latitude)
    const lng = parseFloat(crime.longitude)
    if (isNaN(lat) || isNaN(lng)) continue

    const existing = blockMap.get(crime.block_address)
    if (existing) {
      existing.latSum += lat
      existing.lngSum += lng
      existing.count++
    } else {
      blockMap.set(crime.block_address, { latSum: lat, lngSum: lng, count: 1 })
    }
  }

  if (blockMap.size === 0) return []

  const sorted = Array.from(blockMap.entries()).sort((a, b) => b[1].count - a[1].count)
  const total = sorted.length
  const maxCount = sorted[0][1].count
  const cutoff = Math.ceil(total * (thresholdPct / 100))
  const top10 = Math.ceil(total * 0.1)
  const top20 = Math.ceil(total * 0.2)

  return sorted.slice(0, cutoff).map(([blockAddress, { latSum, lngSum, count }], i) => {
    const lat = latSum / count
    const lng = lngSum / count
    const path = makeSegmentPath(lat, lng, estimateOrientation(blockAddress))
    const dangerScore = Math.round((count / maxCount) * 100)

    let dangerLevel: DangerLevel
    if (i < top10) dangerLevel = 'high'
    else if (i < top20) dangerLevel = 'medium'
    else dangerLevel = 'low'

    return { blockAddress, path, crimeCount: count, dangerLevel, dangerScore }
  })
}

export interface StreetStyle {
  color: string
  opacity: number
  weight: number
  dashed: boolean
  label: string
}

export const STREET_STYLES: Record<DangerLevel, StreetStyle> = {
  high:   { color: '#EF4444', opacity: 0.65, weight: 6, dashed: false, label: '高危険' },
  medium: { color: '#F97316', opacity: 0.55, weight: 4, dashed: false, label: '中危険' },
  low:    { color: '#FBBF24', opacity: 0.45, weight: 3, dashed: true,  label: '注意' },
}
