import type { CrimeRecord, CrimeFilters } from '../types/crime'

const BASE_URL = 'https://data.seattle.gov/resource/tazs-3rd5.json'

function getFromDate(dateRange: CrimeFilters['dateRange']): Date | null {
  const now = new Date()
  switch (dateRange) {
    case 'today': return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case 'month': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '3months': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case 'year': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    default: return null
  }
}

export async function fetchCrimeData(
  filters: CrimeFilters,
  limit = 5000
): Promise<CrimeRecord[]> {
  // $where は等値のみサポート。日付・座標はクライアント側でフィルタリング
  let url = `${BASE_URL}?$limit=${limit}&$order=report_date_time%20DESC`

  if (filters.offenseGroup !== 'ALL') {
    url += `&offense_sub_category=${encodeURIComponent(filters.offenseGroup)}`
  }

  if (filters.precinct !== 'ALL') {
    url += `&precinct=${encodeURIComponent(filters.precinct)}`
  }

  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`API error: ${res.status}`)

  const data: CrimeRecord[] = await res.json()

  const fromDate = getFromDate(filters.dateRange)

  return data.filter((r) => {
    // 座標フィルター（シアトル範囲）
    const lat = parseFloat(r.latitude)
    const lng = parseFloat(r.longitude)
    if (isNaN(lat) || isNaN(lng) || lat < 47.0 || lat > 48.5 || lng < -123.0 || lng > -121.5) {
      return false
    }
    // 日付フィルター
    if (fromDate && new Date(r.report_date_time) < fromDate) {
      return false
    }
    return true
  })
}
