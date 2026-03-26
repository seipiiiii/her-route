import type { CityId } from '../types/crime'

export interface CityInfo {
  id: CityId
  nameJa: string
  nameEn: string
  emoji: string
  center: { lat: number; lng: number }
  defaultZoom: number
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
  /** FBI Crime Data Explorer の ORI コード */
  fbiOri: string
}

export const CITIES: Record<CityId, CityInfo> = {
  seattle: {
    id: 'seattle',
    nameJa: 'シアトル',
    nameEn: 'Seattle',
    emoji: '🌲',
    center: { lat: 47.6062, lng: -122.3321 },
    defaultZoom: 12,
    bounds: { minLat: 47.0, maxLat: 48.5, minLng: -123.0, maxLng: -121.5 },
    fbiOri: 'WA030200',
  },
  losangeles: {
    id: 'losangeles',
    nameJa: 'ロサンゼルス',
    nameEn: 'Los Angeles',
    emoji: '☀️',
    center: { lat: 34.0522, lng: -118.2437 },
    defaultZoom: 11,
    bounds: { minLat: 33.7, maxLat: 34.4, minLng: -118.7, maxLng: -117.9 },
    fbiOri: 'CA0194200',
  },
  newyork: {
    id: 'newyork',
    nameJa: 'ニューヨーク',
    nameEn: 'New York',
    emoji: '🗽',
    center: { lat: 40.7128, lng: -74.006 },
    defaultZoom: 11,
    bounds: { minLat: 40.4, maxLat: 40.95, minLng: -74.3, maxLng: -73.7 },
    fbiOri: 'NY0303000',
  },
}

export const CITY_LIST: CityInfo[] = Object.values(CITIES)
