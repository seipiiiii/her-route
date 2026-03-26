import type { CrimeRecord, CrimeFilters, CityId } from '../types/crime'
import { CITIES } from './cityConfig'

// ─── 各都市オープンデータ API (Socrata) ───────────────────────────────────────
// データソース：
//   Seattle  : Seattle Police Department Crime Data
//   LA       : LAPD Crime Data 2020 to Present
//   New York : NYPD Complaint Data Current Year (YTD)

const CITY_API_URLS: Record<CityId, string> = {
  seattle: 'https://data.seattle.gov/resource/tazs-3rd5.json',
  losangeles: 'https://data.lacity.org/resource/2nrs-mtv8.json',
  newyork: 'https://data.cityofnewyork.us/resource/qgea-i56i.json',
}

// ─── FBI Crime Data Explorer API ─────────────────────────────────────────────
// APIキーは https://api.data.gov/signup/ から無料取得
// 環境変数 VITE_FBI_API_KEY に設定してください
const FBI_CDE_BASE = 'https://api.usa.gov/crime/fbi/cde'

// ─── 日付ヘルパー ─────────────────────────────────────────────────────────────

function getFromDate(dateRange: CrimeFilters['dateRange']): Date | null {
  const now = new Date()
  switch (dateRange) {
    case 'today':    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'week':     return new Date(now.getTime() - 7   * 86400_000)
    case 'month':    return new Date(now.getTime() - 30  * 86400_000)
    case '3months':  return new Date(now.getTime() - 90  * 86400_000)
    case 'year':     return new Date(now.getTime() - 365 * 86400_000)
    default:         return null
  }
}

// ─── 正規化関数 ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSeattle(raw: any): CrimeRecord {
  return {
    offense_id:                    raw.offense_id ?? '',
    report_date_time:              raw.report_date_time ?? '',
    offense_date:                  raw.offense_date ?? '',
    nibrs_offense_code_description: raw.nibrs_offense_code_description ?? raw.offense_sub_category ?? '',
    offense_sub_category:          raw.offense_sub_category ?? '',
    offense_category:              raw.offense_category ?? '',
    nibrs_group_a_b:               raw.nibrs_group_a_b ?? '',
    nibrs_crime_against_category:  raw.nibrs_crime_against_category ?? '',
    precinct:                      raw.precinct ?? '',
    sector:                        raw.sector ?? '',
    beat:                          raw.beat ?? '',
    neighborhood:                  raw.neighborhood ?? '',
    block_address:                 raw.block_address ?? '',
    longitude:                     raw.longitude ?? '',
    latitude:                      raw.latitude ?? '',
    city:                          'seattle',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeLA(raw: any): CrimeRecord {
  // time_occ は "1430" 形式 → "14:30"
  const t = (raw.time_occ ?? '0000').padStart(4, '0')
  const dateBase = (raw.date_occ ?? '').split('T')[0]
  const dateTime = dateBase ? `${dateBase}T${t.slice(0, 2)}:${t.slice(2, 4)}:00` : ''
  const desc = (raw.crm_cd_desc ?? '').toUpperCase()
  const isViolent = ['ASSAULT', 'HOMICIDE', 'ROBBERY', 'RAPE', 'MURDER', 'WEAPON'].some(k => desc.includes(k))

  return {
    offense_id:                    raw.dr_no ?? '',
    report_date_time:              dateTime,
    offense_date:                  dateBase,
    nibrs_offense_code_description: raw.crm_cd_desc ?? '',
    offense_sub_category:          raw.crm_cd_desc ?? '',
    offense_category:              isViolent ? 'VIOLENT CRIME' : 'PROPERTY CRIME',
    nibrs_group_a_b:               'A',
    nibrs_crime_against_category:  isViolent ? 'PERSON' : 'PROPERTY',
    precinct:                      raw.area_name ?? '',
    sector:                        raw.rpt_dist_no ?? '',
    beat:                          '',
    neighborhood:                  raw.area_name ?? '',
    block_address:                 raw.location ?? '',
    longitude:                     raw.lon ?? '',
    latitude:                      raw.lat ?? '',
    city:                          'losangeles',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeNYC(raw: any): CrimeRecord {
  const dateStr = (raw.cmplnt_fr_dt ?? '').split('T')[0]
  const timeStr = raw.cmplnt_fr_tm ?? '00:00:00'
  const dateTime = dateStr ? `${dateStr}T${timeStr}` : ''
  const desc = (raw.ofns_desc ?? '').toUpperCase()
  const isViolent = ['ASSAULT', 'MURDER', 'RAPE', 'ROBBERY', 'HOMICIDE', 'FELONY ASSAULT'].some(k => desc.includes(k))
  const borough = raw.boro_nm
    ? raw.boro_nm.charAt(0).toUpperCase() + raw.boro_nm.slice(1).toLowerCase()
    : ''

  return {
    offense_id:                    raw.cmplnt_num ?? '',
    report_date_time:              dateTime,
    offense_date:                  dateStr,
    nibrs_offense_code_description: raw.ofns_desc ?? '',
    offense_sub_category:          raw.ofns_desc ?? '',
    offense_category:              raw.law_cat_cd ?? (isViolent ? 'VIOLENT CRIME' : 'PROPERTY CRIME'),
    nibrs_group_a_b:               raw.law_cat_cd === 'FELONY' ? 'A' : 'B',
    nibrs_crime_against_category:  isViolent ? 'PERSON' : 'PROPERTY',
    precinct:                      raw.addr_pct_cd ? `P${raw.addr_pct_cd}` : '',
    sector:                        raw.patrol_boro ?? '',
    beat:                          '',
    neighborhood:                  borough,
    block_address:                 '',
    longitude:                     raw.longitude ?? '',
    latitude:                      raw.latitude ?? '',
    city:                          'newyork',
  }
}

// ─── メイン取得関数 ────────────────────────────────────────────────────────────

export async function fetchCrimeData(
  city: CityId,
  filters: CrimeFilters,
  limit = 5000,
): Promise<CrimeRecord[]> {
  const fromDate = getFromDate(filters.dateRange)
  const { bounds } = CITIES[city]

  const inBounds = (lat: number, lng: number) =>
    lat >= bounds.minLat && lat <= bounds.maxLat &&
    lng >= bounds.minLng && lng <= bounds.maxLng

  if (city === 'seattle') {
    // サーバー側フィルタリング対応
    let url = `${CITY_API_URLS.seattle}?$limit=${limit}&$order=report_date_time%20DESC`
    if (filters.offenseGroup !== 'ALL')
      url += `&offense_sub_category=${encodeURIComponent(filters.offenseGroup)}`
    if (filters.precinct !== 'ALL')
      url += `&precinct=${encodeURIComponent(filters.precinct)}`

    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`Seattle API error: ${res.status}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await res.json()

    return data.filter(r => {
      const lat = parseFloat(r.latitude), lng = parseFloat(r.longitude)
      if (isNaN(lat) || isNaN(lng) || !inBounds(lat, lng)) return false
      if (fromDate && new Date(r.report_date_time) < fromDate) return false
      return true
    }).map(normalizeSeattle)
  }

  if (city === 'losangeles') {
    const url = `${CITY_API_URLS.losangeles}?$limit=${limit}&$order=date_occ%20DESC`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`LA API error: ${res.status}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await res.json()

    return data.filter(r => {
      const lat = parseFloat(r.lat), lng = parseFloat(r.lon)
      if (isNaN(lat) || isNaN(lng) || !inBounds(lat, lng)) return false
      if (fromDate && r.date_occ && new Date(r.date_occ) < fromDate) return false
      return true
    }).map(normalizeLA)
  }

  // newyork
  const url = `${CITY_API_URLS.newyork}?$limit=${limit}&$order=cmplnt_fr_dt%20DESC`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`NYC API error: ${res.status}`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any[] = await res.json()

  return data.filter(r => {
    const lat = parseFloat(r.latitude), lng = parseFloat(r.longitude)
    if (isNaN(lat) || isNaN(lng) || !inBounds(lat, lng)) return false
    if (fromDate && r.cmplnt_fr_dt && new Date(r.cmplnt_fr_dt) < fromDate) return false
    return true
  }).map(normalizeNYC)
}

// ─── FBI Crime Data Explorer API ─────────────────────────────────────────────
// 集計統計データ（犯罪種別ごとの年間件数）を取得
// 参考: https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/docApi

export interface FBIOffenseCount {
  offense_name: string
  count: number
  data_year: number
}

/**
 * FBI CDE API から機関レベルの犯罪種別集計を取得する
 * @param ori  FBI ORI コード (例: WA030200)
 * @param year 対象年 (デフォルト: 2022)
 * @returns    犯罪種別ごとの件数配列（APIキー未設定時は空配列）
 */
export async function fetchFBIStats(ori: string, year = 2022): Promise<FBIOffenseCount[]> {
  const apiKey = import.meta.env.VITE_FBI_API_KEY
  if (!apiKey) return []

  try {
    const url =
      `${FBI_CDE_BASE}/offense/count/agencies/${ori}/offenses/offense` +
      `?from=${year}&to=${year}&api_key=${apiKey}`
    const res = await fetch(url)
    if (!res.ok) return []
    const json = await res.json()
    return Array.isArray(json.results) ? (json.results as FBIOffenseCount[]) : []
  } catch {
    return []
  }
}
