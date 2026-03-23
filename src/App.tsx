import { useState } from 'react'
import { Map } from './components/Map'
import { SidePanel } from './components/SidePanel'
import { CrimeDetail } from './components/CrimeDetail'
import { useCrimeData } from './hooks/useCrimeData'
import type { CrimeFilters, CrimeRecord } from './types/crime'

const DEFAULT_FILTERS: CrimeFilters = {
  offenseGroup: 'ALL',
  dateRange: 'month',
  precinct: 'ALL',
}

export default function App() {
  const [filters, setFilters] = useState<CrimeFilters>(DEFAULT_FILTERS)
  const [selectedCrime, setSelectedCrime] = useState<CrimeRecord | null>(null)
  const [sidePanelOpen, setSidePanelOpen] = useState(true)

  const { data, loading, error, refetch, lastUpdated } = useCrimeData(filters)

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
      />

      <main className="flex-1 flex flex-col relative">
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

        {!loading && (
          <div className="absolute top-4 right-4 z-20 bg-slate-900/90 border border-blue-500/30 px-3 py-2 rounded-xl backdrop-blur">
            <span className="text-blue-300 text-xs">
              {data.length.toLocaleString()} 件表示中
            </span>
          </div>
        )}

        <Map
          data={data}
          selectedCrime={selectedCrime}
          onSelectCrime={setSelectedCrime}
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
