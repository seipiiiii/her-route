import { useState } from 'react'
import type { CrimeRecord, CrimeFilters } from '../types/crime'
import { OFFENSE_GROUPS, PRECINCTS, DATE_RANGE_LABELS } from '../types/crime'
import { RoutePanel } from './RoutePanel'
import type { RouteScore } from '../utils/routeScore'

interface Props {
  filters: CrimeFilters
  onFilterChange: (filters: CrimeFilters) => void
  data: CrimeRecord[]
  loading: boolean
  lastUpdated: Date | null
  onRefetch: () => void
  selectedCrime: CrimeRecord | null
  onSelectCrime: (crime: CrimeRecord) => void
  isOpen: boolean
  onToggle: () => void
  onRoutesReady: (routes: google.maps.DirectionsRoute[], scores: RouteScore[], selectedIndex: number) => void
  onRouteClear: () => void
  isLoaded: boolean
  pinMode: 'none' | 'origin' | 'destination'
  onPinModeChange: (mode: 'none' | 'origin' | 'destination') => void
  originCoords: google.maps.LatLngLiteral | null
  destCoords: google.maps.LatLngLiteral | null
  onOriginCoordsChange: (coords: google.maps.LatLngLiteral | null) => void
  onDestCoordsChange: (coords: google.maps.LatLngLiteral | null) => void
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function SidePanel({
  filters,
  onFilterChange,
  data,
  loading,
  lastUpdated,
  onRefetch,
  selectedCrime,
  onSelectCrime,
  isOpen,
  onToggle,
  onRoutesReady,
  onRouteClear,
  isLoaded,
  pinMode,
  onPinModeChange,
  originCoords,
  destCoords,
  onOriginCoordsChange,
  onDestCoordsChange,
}: Props) {
  const [activeTab, setActiveTab] = useState<'data' | 'route'>('data')

  const updateFilter = <K extends keyof CrimeFilters>(key: K, value: CrimeFilters[K]) => {
    onFilterChange({ ...filters, [key]: value })
  }

  // 犯罪種別ごとの件数集計
  const offenseCounts = data.reduce<Record<string, number>>((acc, c) => {
    const key = c.offense_sub_category || 'その他'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  const topOffenses = Object.entries(offenseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <>
      {/* トグルボタン（スマホ・タブレット向け） */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-40 md:hidden bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 shadow-lg font-semibold transition-colors"
      >
        {isOpen ? '× 閉じる' : '☰ メニュー'}
      </button>

      {/* サイドパネル */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          bg-slate-900/95 backdrop-blur-md border-r border-blue-500/20
          w-80 transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:relative md:h-screen
        `}
      >
        {/* ヘッダー */}
        <div className="px-5 pt-6 pb-4 border-b border-blue-500/20">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-xl">🚔</span>
            <h1 className="text-white font-bold text-lg leading-tight">
              Her Route
            </h1>
          </div>
        </div>

        {/* タブ */}
        <div className="flex border-b border-blue-500/20">
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'data'
                ? 'text-white border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            犯罪データ
          </button>
          <button
            onClick={() => setActiveTab('route')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'route'
                ? 'text-white border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            ルート探索
          </button>
        </div>

        {/* スクロールエリア */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 scrollbar-thin">
        {activeTab === 'route' && (
          <RoutePanel
            crimes={data}
            isLoaded={isLoaded}
            pinMode={pinMode}
            onPinModeChange={onPinModeChange}
            originCoords={originCoords}
            destCoords={destCoords}
            onOriginCoordsChange={onOriginCoordsChange}
            onDestCoordsChange={onDestCoordsChange}
            onRoutesReady={onRoutesReady}
            onClear={onRouteClear}
          />
        )}
        {activeTab === 'data' && (<>

          {/* フィルター */}
          <section>
            <h2 className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-3">
              フィルター
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">期間</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => updateFilter('dateRange', e.target.value as CrimeFilters['dateRange'])}
                  className="w-full bg-slate-800 border border-blue-500/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                >
                  {(Object.keys(DATE_RANGE_LABELS) as CrimeFilters['dateRange'][]).map((k) => (
                    <option key={k} value={k}>{DATE_RANGE_LABELS[k]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">犯罪種別</label>
                <select
                  value={filters.offenseGroup}
                  onChange={(e) => updateFilter('offenseGroup', e.target.value)}
                  className="w-full bg-slate-800 border border-blue-500/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                >
                  {OFFENSE_GROUPS.map((g) => (
                    <option key={g} value={g}>{g === 'ALL' ? 'すべての種別' : g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">地区 (Precinct)</label>
                <select
                  value={filters.precinct}
                  onChange={(e) => updateFilter('precinct', e.target.value)}
                  className="w-full bg-slate-800 border border-blue-500/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                >
                  {PRECINCTS.map((p) => (
                    <option key={p} value={p}>{p === 'ALL' ? 'すべての地区' : p}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* 統計サマリー */}
          <section>
            <h2 className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-3">
              統計
            </h2>
            <div className="bg-slate-800/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">総件数</span>
                <span className="text-white font-bold text-lg">
                  {loading ? '...' : data.length.toLocaleString()}
                </span>
              </div>
              {lastUpdated && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">最終更新</span>
                  <span className="text-slate-300 text-xs">
                    {lastUpdated.toLocaleTimeString('ja-JP')}
                  </span>
                </div>
              )}
            </div>

            {/* トップ5犯罪種別 */}
            {topOffenses.length > 0 && (
              <div className="mt-3 space-y-2">
                {topOffenses.map(([name, count]) => {
                  const pct = Math.round((count / data.length) * 100)
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-300 truncate pr-2">{name}</span>
                        <span className="text-blue-400 shrink-0">{count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* 犯罪リスト */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-blue-300 text-xs font-semibold uppercase tracking-widest">
                最新の犯罪
              </h2>
              <button
                onClick={onRefetch}
                disabled={loading}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
              >
                更新
              </button>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="text-slate-400 text-sm text-center py-4">読み込み中...</div>
              ) : data.slice(0, 30).map((crime) => (
                <button
                  key={crime.offense_id}
                  onClick={() => onSelectCrime(crime)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors border ${
                    selectedCrime?.offense_id === crime.offense_id
                      ? 'bg-blue-600/30 border-blue-500/50'
                      : 'bg-slate-800/50 border-transparent hover:bg-slate-700/50'
                  }`}
                >
                  <p className="text-white text-xs font-medium truncate">{crime.nibrs_offense_code_description}</p>
                  <p className="text-slate-400 text-xs mt-0.5 truncate">{crime.block_address}</p>
                  <p className="text-blue-400 text-xs mt-0.5">
                    {formatShortDate(crime.report_date_time)}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </>)}
        </div>
      </aside>
    </>
  )
}
