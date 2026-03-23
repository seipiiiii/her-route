import axios from 'axios'
import type { CrimeRecord, CrimeFilters } from '../types/crime'

const BASE_URL = 'https://data.seattle.gov/resource/tazs-3rd5.json'
const APP_TOKEN = '' // オプション：Socrataアプリトークン（レート制限緩和用）

function getDateFilter(dateRange: CrimeFilters['dateRange']): string {
  const now = new Date()
  let fromDate: Date | null = null

  switch (dateRange) {
    case 'today':
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '3months':
      fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case 'year':
      fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    case 'all':
      return ''
  }

  if (!fromDate) return ''
  return `&$where=report_datetime >= '${fromDate.toISOString()}'`
}

export async function fetchCrimeData(
  filters: CrimeFilters,
  limit = 2000
): Promise<CrimeRecord[]> {
  let query = `${BASE_URL}?$limit=${limit}&$order=report_datetime DESC`

  if (filters.offenseGroup !== 'ALL') {
    query += `&offense_parent_group=${encodeURIComponent(filters.offenseGroup)}`
  }

  if (filters.precinct !== 'ALL') {
    query += `&precinct=${encodeURIComponent(filters.precinct)}`
  }

  const dateFilter = getDateFilter(filters.dateRange)
  query += dateFilter

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (APP_TOKEN) {
    headers['X-App-Token'] = APP_TOKEN
  }

  const response = await axios.get<CrimeRecord[]>(query, { headers })

  // 座標データがあるものだけ返す
  return response.data.filter(
    (r) =>
      r.latitude &&
      r.longitude &&
      !isNaN(parseFloat(r.latitude)) &&
      !isNaN(parseFloat(r.longitude))
  )
}
