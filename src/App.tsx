import { useState } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import { Map } from './components/Map'
import { SidePanel } from './components/SidePanel'
import { CrimeDetail } from './components/CrimeDetail'
import { useCrimeData } from './hooks/useCrimeData'
import type { CrimeFilters, CrimeRecord } from './types/crime'
import type { RouteScore } from './utils/routeScore'

const DEFAULT_FILTERS: CrimeFilters = {
  offenseGroup: 'ALL',
  dateRange: 'month',
  precinct: 'ALL',
}

// ライブラリ配列はモジュールレベルで定義（再レンダリングで参照が変わらないようにする）
const LIBRARIES: ('places' | 'visualization')[] = ['places', 'visualization']

export default function App() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  })

  const [filters, setFilters] = useState<CrimeFilters>(DEFAULT_FILTERS)
  const [selectedCrime, setSelectedCrime] = useState<CrimeRecord | null>(null)
  const [sidePanelOpen, setSidePanelOpen] = useState(true)
  const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([])
  const [routeScores, setRouteScores] = useState<RouteScore[]>([])
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [pinMode, setPinMode] = useState<'none' | 'origin' | 'destination'>('none')
  const [originCoords, setOriginCoords] = useState<google.maps.LatLngLiteral | null>(null)
  const [destCoords, setDestCoords] = useState<google.maps.LatLngLiteral | null>(null)
  const [showHeatmap, setShowHeatmap] = useState(false)

  const { data, loading, error, refetch, lastUpdated } = useCrimeData(filters)

  const handleRoutesReady = (
    newRoutes: google.maps.DirectionsRoute[],
    scores: RouteScore[],
    selectedIndex: number
  ) => {
    setRoutes(newRoutes)
    setRouteScores(scores)
    setSelectedRouteIndex(selectedIndex)
  }

  const handleRouteClear = () => {
    setRoutes([])
    setRouteScores([])
    setSelectedRouteIndex(0)
    setOriginCoords(null)
    setDestCoords(null)
    setPinMode('none')
  }

  const handleMapClick = (coords: google.maps.LatLngLiteral) => {
    if (pinMode === 'origin') {
      setOriginCoords(coords)
      setPinMode('none')
    } else if (pinMode === 'destination') {
      setDestCoords(coords)
      setPinMode('none')
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <SidePanel
        filters={filters}
        onFilterChange={setFilters}
        data={data}
        loading={loading}
        lastUpdated={lastUpdated}
        onRefetch={refetch}
        selectedCrime={selectedCrime}
        onSelectCrime={setSelectedCrime}
        isOpen={sidePanelOpen}
        onToggle={() => setSidePanelOpen(!sidePanelOpen)}
        onRoutesReady={handleRoutesReady}
        onRouteClear={handleRouteClear}
        isLoaded={isLoaded}
        pinMode={pinMode}
        onPinModeChange={setPinMode}
        originCoords={originCoords}
        destCoords={destCoords}
        onOriginCoordsChange={setOriginCoords}
        onDestCoordsChange={setDestCoords}
      />

      <main className="flex-1 flex flex-col relative">
        {/* ピンモード時のヒント */}
        {pinMode !== 'none' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-blue-700/90 border border-blue-400/50 text-white px-4 py-2 rounded-xl text-sm backdrop-blur shadow-lg">
            <span>📍</span>
            <span>{pinMode === 'origin' ? '出発地' : '目的地'}を地図上でクリックしてください</span>
            <button onClick={() => setPinMode('none')} className="ml-2 text-blue-200 hover:text-white">✕</button>
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-900/90 border border-red-500/50 text-red-200 px-4 py-2 rounded-xl text-sm backdrop-blur">
            {error}
          </div>
        )}

        {loading && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-900/90 border border-blue-500/30 px-3 py-2 rounded-xl backdrop-blur">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-blue-300 text-xs">データ取得中...</span>
          </div>
        )}

        {!loading && routes.length === 0 && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-900/90 border border-blue-500/30 px-3 py-2 rounded-xl backdrop-blur">
            <span className="text-blue-300 text-xs">
              {data.length.toLocaleString()} 件表示中
            </span>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`text-xs px-2 py-1 rounded-lg font-semibold transition-colors ${
                showHeatmap
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {showHeatmap ? '🔥 ヒートマップ ON' : '🔥 ヒートマップ'}
            </button>
          </div>
        )}

        <Map
          isLoaded={isLoaded}
          loadError={loadError}
          data={data}
          selectedCrime={selectedCrime}
          onSelectCrime={setSelectedCrime}
          routes={routes}
          routeScores={routeScores}
          selectedRouteIndex={selectedRouteIndex}
          pinMode={pinMode}
          originCoords={originCoords}
          destCoords={destCoords}
          onMapClick={handleMapClick}
          showHeatmap={showHeatmap}
        />
      </main>

      {selectedCrime && (
        <CrimeDetail
          crime={selectedCrime}
          onClose={() => setSelectedCrime(null)}
        />
      )}
    </div>
  )
}
