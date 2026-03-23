import { useCallback, useRef, useState } from 'react'
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api'
import type { CrimeRecord } from '../types/crime'

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
  const color = getMarkerColor(crime.offense_parent_group)
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
        title={crime.offense}
      />
    </OverlayView>
  )
}

interface Props {
  data: CrimeRecord[]
  selectedCrime: CrimeRecord | null
  onSelectCrime: (crime: CrimeRecord) => void
}

export function Map({ data, selectedCrime, onSelectCrime }: Props) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  })

  const mapRef = useRef<google.maps.Map | null>(null)
  const [zoom, setZoom] = useState(12)

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  const onZoomChanged = useCallback(() => {
    if (mapRef.current) {
      setZoom(mapRef.current.getZoom() || 12)
    }
  }, [])

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
    <div className="flex-1 relative">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={SEATTLE_CENTER}
        zoom={12}
        onLoad={onLoad}
        onZoomChanged={onZoomChanged}
        options={{
          styles: MAP_STYLES,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
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
