import { useState, useMemo } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import { Map } from './components/Map'
import { Header } from './components/Header'
import { NavBar, type NavItem } from './components/NavBar'
import { RightPanel } from './components/RightPanel'
import { CrimeDetail } from './components/CrimeDetail'
import { SettingsPage } from './components/Settings'
import { ProfilePage } from './components/Profile'
import { useCrimeData } from './hooks/useCrimeData'
import type { CrimeFilters, CrimeRecord, CityId } from './types/crime'
import { OFFENSE_GROUPS } from './types/crime'
import type { RouteScore } from './utils/routeScore'

const DEFAULT_FILTERS: CrimeFilters = {
  offenseGroup: 'ALL',
  dateRange: 'month',
  precinct: 'ALL',
}

// 都市ごとのデフォルト日付範囲
// LA/NYC は公開データの更新頻度が低いため 'all' を使用
const CITY_DEFAULT_DATE_RANGE: Record<CityId, CrimeFilters['dateRange']> = {
  seattle:    'month',
  losangeles: 'all',
  newyork:    'all',
}

// ライブラリ配列はモジュールレベルで定義（再レンダリングで参照が変わらないようにする）
const LIBRARIES: ('places' | 'visualization')[] = ['places', 'visualization']

const FULL_PAGE_NAVS: NavItem[] = ['settings', 'profile']

export default function App() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  })

  const [city, setCity] = useState<CityId>('seattle')
  const [activeNav, setActiveNav] = useState<NavItem>('map')
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [filters, setFilters] = useState<CrimeFilters>(DEFAULT_FILTERS)
  const [neighborhood, setNeighborhood] = useState<string>('ALL')
  const [selectedCrime, setSelectedCrime] = useState<CrimeRecord | null>(null)
  const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([])
  const [routeScores, setRouteScores] = useState<RouteScore[]>([])
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [pinMode, setPinMode] = useState<'none' | 'origin' | 'destination'>('none')
  const [originCoords, setOriginCoords] = useState<google.maps.LatLngLiteral | null>(null)
  const [destCoords, setDestCoords] = useState<google.maps.LatLngLiteral | null>(null)
  const [showHeatmap, setShowHeatmap] = useState(false)

  const { data, loading, error, refetch, lastUpdated } = useCrimeData(city, filters)

  const availableNeighborhoods = useMemo(
    () => [...new Set(data.map((r) => r.neighborhood).filter(Boolean))].sort(),
    [data],
  )

  // 犯罪種別: Seattle は静的リスト（サーバー側フィルター対応）、他都市はデータから動的生成
  const availableOffenseGroups = useMemo(() => {
    if (city === 'seattle') return OFFENSE_GROUPS
    const groups = [...new Set(data.map((r) => r.offense_sub_category).filter(Boolean))].sort()
    return ['ALL', ...groups]
  }, [city, data])

  // エリア: データから動的生成（全都市対応）
  const availablePrecincts = useMemo(
    () => ['ALL', ...new Set(data.map((r) => r.precinct).filter(Boolean))].sort(),
    [data],
  )

  const filteredData = useMemo(() => {
    let result = neighborhood === 'ALL' ? data : data.filter((r) => r.neighborhood === neighborhood)
    // Seattle以外はクライアント側でprecinctフィルター適用
    if (city !== 'seattle' && filters.precinct !== 'ALL') {
      result = result.filter((r) => r.precinct === filters.precinct)
    }
    return result
  }, [data, neighborhood, city, filters.precinct])

  const handleCityChange = (newCity: CityId) => {
    setCity(newCity)
    setFilters({ ...DEFAULT_FILTERS, dateRange: CITY_DEFAULT_DATE_RANGE[newCity] })
    setNeighborhood('ALL')
  }

  const isFullPage = FULL_PAGE_NAVS.includes(activeNav)

  const handleNavChange = (item: NavItem) => {
    const wasFullPage = FULL_PAGE_NAVS.includes(activeNav)
    const willBeFullPage = FULL_PAGE_NAVS.includes(item)

    if (item === activeNav && !willBeFullPage) {
      // same map-area tab: toggle right panel
      setRightPanelOpen((prev) => !prev)
    } else {
      setActiveNav(item)
      // restore right panel when returning to map area from full-page
      if (wasFullPage && !willBeFullPage) {
        setRightPanelOpen(true)
      }
    }
  }

  const handleRoutesReady = (
    newRoutes: google.maps.DirectionsRoute[],
    scores: RouteScore[],
    selectedIndex: number,
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
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <Header
        city={city}
        onCityChange={handleCityChange}
        dataCount={filteredData.length}
        loading={loading}
        onRefetch={refetch}
        lastUpdated={lastUpdated}
      />

      <div className="flex flex-1 overflow-hidden">
        <NavBar activeNav={activeNav} onNavChange={handleNavChange} />

        {/* Full-page views (Settings / Profile) */}
        {isFullPage ? (
          activeNav === 'settings' ? <SettingsPage /> : <ProfilePage />
        ) : (
          <>
            {/* Map area */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
              {/* Pin mode hint */}
              {pinMode !== 'none' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 bg-white border border-green-300 text-gray-800 px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg">
                  <span className="text-green-500">📍</span>
                  <span>{pinMode === 'origin' ? '出発地' : '目的地'}を地図上でクリック</span>
                  <button
                    onClick={() => setPinMode('none')}
                    className="ml-1 w-5 h-5 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors text-[11px]"
                  >
                    ✕
                  </button>
                </div>
              )}

              {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-xs font-medium shadow">
                  {error}
                </div>
              )}

              {/* Open panel button when collapsed */}
              {!rightPanelOpen && (
                <button
                  onClick={() => setRightPanelOpen(true)}
                  className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl shadow-sm text-gray-500 hover:text-gray-700 hover:border-green-300 transition-all"
                  title="パネルを開く"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                  </svg>
                </button>
              )}

              <Map
                isLoaded={isLoaded}
                loadError={loadError}
                city={city}
                data={filteredData}
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

            {/* Right panel */}
            {rightPanelOpen && (
              <RightPanel
                activeNav={activeNav}
                onClose={() => setRightPanelOpen(false)}
                city={city}
                filters={filters}
                onFilterChange={setFilters}
                neighborhood={neighborhood}
                onNeighborhoodChange={setNeighborhood}
                availableNeighborhoods={availableNeighborhoods}
                availableOffenseGroups={availableOffenseGroups}
                availablePrecincts={availablePrecincts}
                data={filteredData}
                loading={loading}
                selectedCrime={selectedCrime}
                onSelectCrime={setSelectedCrime}
                onRoutesReady={handleRoutesReady}
                onRouteClear={handleRouteClear}
                isLoaded={isLoaded}
                pinMode={pinMode}
                onPinModeChange={setPinMode}
                originCoords={originCoords}
                destCoords={destCoords}
                onOriginCoordsChange={setOriginCoords}
                onDestCoordsChange={setDestCoords}
                showHeatmap={showHeatmap}
                onHeatmapToggle={() => setShowHeatmap(!showHeatmap)}
              />
            )}
          </>
        )}
      </div>

      {selectedCrime && (
        <CrimeDetail crime={selectedCrime} onClose={() => setSelectedCrime(null)} />
      )}
    </div>
  )
}
