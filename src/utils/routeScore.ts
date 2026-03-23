import type { CrimeRecord } from '../types/crime'

// Haversine距離計算（メートル）
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Googleポリライン文字列をデコード
export function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    let b, shift = 0, result = 0
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
    lat += (result & 1) ? ~(result >> 1) : result >> 1
    shift = 0; result = 0
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
    lng += (result & 1) ? ~(result >> 1) : result >> 1
    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }
  return points
}

// 犯罪カテゴリの重み
function crimeWeight(crime: CrimeRecord): number {
  const cat = crime.offense_category?.toUpperCase() || ''
  const sub = crime.offense_sub_category?.toUpperCase() || ''
  if (cat === 'VIOLENT CRIME') return 3
  if (sub.includes('ROBBERY') || sub.includes('BURGLARY')) return 2
  if (cat === 'PROPERTY CRIME') return 1
  return 0.5
}

const RADIUS_M = 300 // ルートから何メートル以内の犯罪をカウントするか

export interface RouteScore {
  index: number
  crimeCount: number
  weightedScore: number
  safetyScore: number // 0〜100（高いほど安全）
  label: string
  color: string
}

export function scoreRoutes(
  routes: google.maps.DirectionsRoute[],
  crimes: CrimeRecord[]
): RouteScore[] {
  const scores = routes.map((route, index) => {
    const points = decodePolyline(route.overview_polyline)

    let weightedScore = 0
    let crimeCount = 0

    for (const crime of crimes) {
      const lat = parseFloat(crime.latitude)
      const lng = parseFloat(crime.longitude)
      if (isNaN(lat) || isNaN(lng)) continue

      // ポリラインの各点との最短距離を計算
      let minDist = Infinity
      // パフォーマンスのため間引き（5点ごと）
      for (let i = 0; i < points.length; i += 5) {
        const d = distanceMeters(lat, lng, points[i].lat, points[i].lng)
        if (d < minDist) minDist = d
        if (minDist < 50) break // 十分近ければ打ち切り
      }

      if (minDist <= RADIUS_M) {
        weightedScore += crimeWeight(crime) * (1 - minDist / RADIUS_M)
        crimeCount++
      }
    }

    return { index, crimeCount, weightedScore }
  })

  // 安全スコアを正規化（最高スコアを基準に0〜100）
  const maxScore = Math.max(...scores.map((s) => s.weightedScore), 1)

  return scores.map((s, i) => {
    const safetyScore = Math.round(100 - (s.weightedScore / maxScore) * 100)
    const rank = scores
      .slice()
      .sort((a, b) => a.weightedScore - b.weightedScore)
      .findIndex((r) => r.index === i)

    const labels = ['最安全ルート', '代替ルート', '危険ルート']
    const colors = ['#22c55e', '#f59e0b', '#ef4444']

    return {
      ...s,
      safetyScore,
      label: labels[rank] ?? `ルート${i + 1}`,
      color: colors[rank] ?? '#94a3b8',
    }
  })
}
