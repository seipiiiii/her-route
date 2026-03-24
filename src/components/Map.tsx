import { useCallback, useEffect, useRef, useState } from 'react'
import { GoogleMap, OverlayView } from '@react-google-maps/api'
import type { CrimeRecord } from '../types/crime'
import type { RouteScore } from '../utils/routeScore'

const SEATTLE_CENTER = { lat: 47.6062, lng: -122.3321 }

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e3a5f' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#93aac3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1d4ed8' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1e3a8a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c1a2e' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d6e8c' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0f2a1e' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1e2d4a' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2563eb' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#4e6da1' }] },
]

function getMarkerColor(offenseGroup: string): string {
  const group = offenseGroup?.toLowerCase() || ''
  if (group.includes('assault') || group.includes('homicide')) return '#ef4444'
  if (group.includes('robbery') || group.includes('weapon')) return '#f97316'
  if (group.includes('burglary') || group.includes('motor vehicle')) return '#eab308'
  if (group.includes('larceny') || group.includes('theft')) return '#3b82f6'
  if (group.includes('drug')) return '#a855f7'
  if (group.includes('sex')) return '#ec4899'
  return '#64748b'
}

interface MarkerProps {
  crime: CrimeRecord
  onClick: (crime: CrimeRecord) => void
  isSelected: boolean
}

function CrimeMarker({ crime, onClick, isSelected }: MarkerProps) {
  const color = getMarkerColor(crime.offense_sub_category)
  return (
    <OverlayView
      position={{ lat: parseFloat(crime.latitude), lng: parseFloat(crime.longitude) }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
        onClick={() => onClick(crime)}
        style={{
          width: isSelected ? 14 : 8,
          height: isSelected ? 14 : 8,
          borderRadius: '50%',
          backgroundColor: color,
          border: isSelected ? `2px solid white` : `1px solid ${color}99`,
          boxShadow: isSelected ? `0 0 12px ${color}` : `0 0 4px ${color}88`,
          cursor: 'pointer',
          transform: 'translate(-50%, -50%)',
          transition: 'all 0.15s ease',
        }}
        title={crime.nibrs_offense_code_description}
      />
    </OverlayView>
  )
}

interface Props {
  isLoaded: boolean
  loadError: Error | undefined
  data: CrimeRecord[]
  selectedCrime: CrimeRecord | null
  onSelectCrime: (crime: CrimeRecord) => void
  routes?: google.maps.DirectionsRoute[]
  routeScores?: RouteScore[]
  selectedRouteIndex?: number
  pinMode?: 'none' | 'origin' | 'destination'
  originCoords?: google.maps.LatLngLiteral | null
  destCoords?: google.maps.LatLngLiteral | null
  onMapClick?: (coords: google.maps.LatLngLiteral) => void
  showHeatmap?: boolean
}

export function Map({
  isLoaded, loadError,
  data, selectedCrime, onSelectCrime,
  routes = [], routeScores = [], selectedRouteIndex = 0,
  pinMode = 'none', originCoords, destCoords, onMapClick,
  showHeatmap = false,
}: Props) {
  const mapRef = useRef<google.maps.Map | null>(null)
  const polylineRefs = useRef<google.maps.Polyline[]>([])
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null)
  const [zoom, setZoom] = useState(12)

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  const onZoomChanged = useCallback(() => {
    if (mapRef.current) {
      setZoom(mapRef.current.getZoom() || 12)
    }
  }, [])

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (pinMode !== 'none' && e.latLng && onMapClick) {
      onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() })
    }
  }, [pinMode, onMapClick])

  // ルートをポリラインで描画
  useEffect(() => {
    // 既存ポリラインを削除
    polylineRefs.current.forEach((p) => p.setMap(null))
    polylineRefs.current = []
    if (!isLoaded || !mapRef.current || routes.length === 0) return

    routes.forEach((route, index) => {
      const score = routeScores.find((s) => s.index === index)
      const isSelected = index === selectedRouteIndex
      const color = score?.color ?? '#94a3b8'
      const path = google.maps.geometry?.encoding?.decodePath(route.overview_polyline)
        ?? route.overview_path

      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: isSelected ? 0.9 : 0.35,
        strokeWeight: isSelected ? 6 : 3,
        map: mapRef.current!,
        zIndex: isSelected ? 10 : 1,
      })
      polylineRefs.current.push(polyline)
    })

    // 選択中ルートにフィット
    const selected = routes[selectedRouteIndex]
    if (selected && mapRef.current) {
      const bounds = new google.maps.LatLngBounds()
      selected.legs.forEach((leg) => {
        bounds.extend(leg.start_location)
        bounds.extend(leg.end_location)
      })
      mapRef.current.fitBounds(bounds, 80)
    }

    return () => {
      polylineRefs.current.forEach((p) => p.setMap(null))
    }
  }, [isLoaded, routes, routeScores, selectedRouteIndex])

  // ヒートマップ
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return

    if (showHeatmap) {
      const points = data
        .map((r) => {
          const lat = parseFloat(r.latitude)
          const lng = parseFloat(r.longitude)
          if (isNaN(lat) || isNaN(lng)) return null
          return new google.maps.LatLng(lat, lng)
        })
        .filter(Boolean) as google.maps.LatLng[]

      if (!heatmapRef.current) {
        heatmapRef.current = new google.maps.visualization.HeatmapLayer({
          data: points,
          map: mapRef.current,
          radius: 30,
          opacity: 0.7,
          gradient: [
            'rgba(0,0,255,0)',
            'rgba(0,100,255,0.5)',
            'rgba(0,200,200,0.7)',
            'rgba(0,255,100,0.8)',
            'rgba(255,255,0,0.9)',
            'rgba(255,100,0,1)',
            'rgba(255,0,0,1)',
          ],
        })
      } else {
        heatmapRef.current.setData(points)
        heatmapRef.current.setMap(mapRef.current)
      }
    } else {
      heatmapRef.current?.setMap(null)
    }

    return () => {
      heatmapRef.current?.setMap(null)
    }
  }, [isLoaded, showHeatmap, data])

  if (loadError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <p className="text-red-400 text-lg font-semibold">マップの読み込みに失敗しました</p>
          <p className="text-slate-400 text-sm mt-2">Google Maps API キーを確認してください</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-blue-400 mt-4 text-sm">マップを読み込み中...</p>
        </div>
      </div>
    )
  }

  // ズームが低いときはマーカーを間引く
  const visibleData = zoom < 11 ? data.filter((_, i) => i % 3 === 0) : data

  return (
    <div className={`flex-1 relative ${pinMode !== 'none' ? 'cursor-crosshair' : ''}`}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={SEATTLE_CENTER}
        zoom={12}
        onLoad={onLoad}
        onZoomChanged={onZoomChanged}
        onClick={handleMapClick}
        options={{
          styles: MAP_STYLES,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          draggableCursor: pinMode !== 'none' ? 'crosshair' : undefined,
        }}
      >
        {visibleData.map((crime) => (
          <CrimeMarker
            key={crime.offense_id}
            crime={crime}
            onClick={onSelectCrime}
            isSelected={selectedCrime?.offense_id === crime.offense_id}
          />
        ))}

        {/* 出発地ピン */}
        {originCoords && (
          <OverlayView position={originCoords} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div style={{ transform: 'translate(-50%, -100%)' }} className="flex flex-col items-center">
              <div className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                出発地
              </div>
              <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '10px solid #22c55e' }} />
            </div>
          </OverlayView>
        )}

        {/* 目的地ピン */}
        {destCoords && (
          <OverlayView position={destCoords} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div style={{ transform: 'translate(-50%, -100%)' }} className="flex flex-col items-center">
              <div className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                目的地
              </div>
              <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '10px solid #ef4444' }} />
            </div>
          </OverlayView>
        )}
      </GoogleMap>

      {/* 凡例 */}
      <div className="absolute bottom-8 right-4 bg-slate-900/90 backdrop-blur border border-blue-500/20 rounded-xl p-3 text-xs space-y-1.5">
        <p className="text-blue-300 font-semibold mb-2">凡例</p>
        {[
          { label: '暴行・殺人', color: '#ef4444' },
          { label: '強盗・武器', color: '#f97316' },
          { label: '窃盗・盗難', color: '#eab308' },
          { label: '財産犯罪', color: '#3b82f6' },
          { label: '薬物', color: '#a855f7' },
          { label: '性犯罪', color: '#ec4899' },
          { label: 'その他', color: '#64748b' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-slate-300">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
