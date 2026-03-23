import { useEffect, useRef, useState } from 'react'
import { Autocomplete } from '@react-google-maps/api'
import type { CrimeRecord } from '../types/crime'
import { scoreRoutes, type RouteScore } from '../utils/routeScore'

// シアトル周辺のバウンズ（Autocompleteの優先範囲）
const SEATTLE_BOUNDS = {
  north: 47.78, south: 47.45, east: -122.22, west: -122.55,
}

interface Props {
  crimes: CrimeRecord[]
  isLoaded: boolean
  pinMode: 'none' | 'origin' | 'destination'
  onPinModeChange: (mode: 'none' | 'origin' | 'destination') => void
  originCoords: google.maps.LatLngLiteral | null
  destCoords: google.maps.LatLngLiteral | null
  onOriginCoordsChange: (coords: google.maps.LatLngLiteral | null) => void
  onDestCoordsChange: (coords: google.maps.LatLngLiteral | null) => void
  onRoutesReady: (routes: google.maps.DirectionsRoute[], scores: RouteScore[], selectedIndex: number) => void
  onClear: () => void
}

export function RoutePanel({
  crimes, isLoaded,
  pinMode, onPinModeChange,
  originCoords, destCoords,
  onOriginCoordsChange, onDestCoordsChange,
  onRoutesReady, onClear,
}: Props) {
  const [originText, setOriginText] = useState('')
  const [destText, setDestText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scores, setScores] = useState<RouteScore[]>([])
  const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const originAcRef = useRef<google.maps.places.Autocomplete | null>(null)
  const destAcRef = useRef<google.maps.places.Autocomplete | null>(null)
  const originInputRef = useRef<HTMLInputElement>(null)
  const destInputRef = useRef<HTMLInputElement>(null)

  // マップクリックでピンが設置されたら逆ジオコーディングで住所を取得
  useEffect(() => {
    if (!isLoaded || !originCoords) return
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ location: originCoords }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        setOriginText(results[0].formatted_address)
      } else {
        setOriginText(`${originCoords.lat.toFixed(5)}, ${originCoords.lng.toFixed(5)}`)
      }
    })
  }, [originCoords, isLoaded])

  useEffect(() => {
    if (!isLoaded || !destCoords) return
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ location: destCoords }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        setDestText(results[0].formatted_address)
      } else {
        setDestText(`${destCoords.lat.toFixed(5)}, ${destCoords.lng.toFixed(5)}`)
      }
    })
  }, [destCoords, isLoaded])

  const handleOriginPlaceChanged = () => {
    const place = originAcRef.current?.getPlace()
    if (place?.formatted_address) setOriginText(place.formatted_address)
    if (place?.geometry?.location) {
      onOriginCoordsChange({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() })
    }
  }

  const handleDestPlaceChanged = () => {
    const place = destAcRef.current?.getPlace()
    if (place?.formatted_address) setDestText(place.formatted_address)
    if (place?.geometry?.location) {
      onDestCoordsChange({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() })
    }
  }

  const handleSearch = () => {
    const originReq = originCoords ?? originText.trim()
    const destReq = destCoords ?? destText.trim()
    if (!originReq || (typeof originReq === 'string' && !originReq)) {
      setError('出発地を入力してください')
      return
    }
    if (!destReq || (typeof destReq === 'string' && !destReq)) {
      setError('目的地を入力してください')
      return
    }
    setLoading(true)
    setError(null)
    setScores([])

    const service = new google.maps.DirectionsService()
    service.route(
      {
        origin: originReq,
        destination: destReq,
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true,
        region: 'us',
      },
      (result, status) => {
        setLoading(false)
        if (status !== google.maps.DirectionsStatus.OK || !result) {
          setError('ルートが見つかりませんでした。住所を確認してください。')
          return
        }
        const newRoutes = result.routes
        const newScores = scoreRoutes(newRoutes, crimes)
        const safestIndex = newScores.reduce(
          (best, s) => (s.safetyScore > newScores[best].safetyScore ? s.index : best), 0
        )
        setRoutes(newRoutes)
        setScores(newScores)
        setSelectedIndex(safestIndex)
        onRoutesReady(newRoutes, newScores, safestIndex)
      }
    )
  }

  const handleClear = () => {
    setOriginText('')
    setDestText('')
    setScores([])
    setRoutes([])
    setError(null)
    onClear()
  }

  const handleSelect = (index: number) => {
    setSelectedIndex(index)
    onRoutesReady(routes, scores, index)
  }

  const inputClass = 'w-full bg-slate-800 border border-blue-500/30 text-white rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-400'
  const pinBtnClass = (active: boolean) =>
    `px-2 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`

  const sortedScores = scores.slice().sort((a, b) => b.safetyScore - a.safetyScore)

  if (!isLoaded) {
    return <p className="text-slate-400 text-sm text-center py-4">マップ読み込み中...</p>
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {/* 出発地 */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">出発地</label>
          <div className="flex gap-1.5">
            <Autocomplete
              onLoad={(ac) => { originAcRef.current = ac }}
              onPlaceChanged={handleOriginPlaceChanged}
              options={{ bounds: SEATTLE_BOUNDS, fields: ['formatted_address', 'geometry'] }}
              className="flex-1"
            >
              <input
                ref={originInputRef}
                type="text"
                value={originText}
                onChange={(e) => { setOriginText(e.target.value); onOriginCoordsChange(null) }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="例: Pike Place Market"
                className={inputClass}
              />
            </Autocomplete>
            <button
              onClick={() => onPinModeChange(pinMode === 'origin' ? 'none' : 'origin')}
              className={pinBtnClass(pinMode === 'origin')}
              title="地図でクリック"
            >
              📍
            </button>
          </div>
        </div>

        {/* 目的地 */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">目的地</label>
          <div className="flex gap-1.5">
            <Autocomplete
              onLoad={(ac) => { destAcRef.current = ac }}
              onPlaceChanged={handleDestPlaceChanged}
              options={{ bounds: SEATTLE_BOUNDS, fields: ['formatted_address', 'geometry'] }}
              className="flex-1"
            >
              <input
                ref={destInputRef}
                type="text"
                value={destText}
                onChange={(e) => { setDestText(e.target.value); onDestCoordsChange(null) }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="例: Space Needle"
                className={inputClass}
              />
            </Autocomplete>
            <button
              onClick={() => onPinModeChange(pinMode === 'destination' ? 'none' : 'destination')}
              className={pinBtnClass(pinMode === 'destination')}
              title="地図でクリック"
            >
              📍
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {loading ? '検索中...' : 'ルートを検索'}
          </button>
          {(scores.length > 0 || originText || destText) && (
            <button
              onClick={handleClear}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
            >
              クリア
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-xs bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* ルート結果 */}
      {sortedScores.length > 0 && (
        <div className="space-y-2">
          <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest">
            ルート比較（{scores.length}件）
          </p>
          {sortedScores.map((score) => {
            const route = routes[score.index]
            const leg = route?.legs[0]
            const isSelected = score.index === selectedIndex
            return (
              <button
                key={score.index}
                onClick={() => handleSelect(score.index)}
                className={`w-full text-left rounded-xl p-3 border transition-colors ${
                  isSelected ? 'bg-slate-700/80 border-blue-400/50' : 'bg-slate-800/50 border-transparent hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: score.color }} />
                    <span className="text-white text-xs font-semibold">{score.label}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${score.color}22`, color: score.color }}>
                    安全 {score.safetyScore}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full" style={{ width: `${score.safetyScore}%`, backgroundColor: score.color }} />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{leg?.distance?.text ?? '-'}</span>
                  <span>{leg?.duration?.text ?? '-'}</span>
                  <span>犯罪 {score.crimeCount}件</span>
                </div>
              </button>
            )
          })}
          <p className="text-slate-500 text-xs text-center">※ ルート沿い300m以内の犯罪データを基に算出</p>
        </div>
      )}
    </div>
  )
}
