import { useState, useEffect, useCallback } from 'react'
import type { CrimeRecord, CrimeFilters } from '../types/crime'
import { fetchCrimeData } from '../utils/api'

export function useCrimeData(filters: CrimeFilters) {
  const [data, setData] = useState<CrimeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const records = await fetchCrimeData(filters)
      setData(records)
      setLastUpdated(new Date())
    } catch (e) {
      setError('データの取得に失敗しました。しばらくしてから再試行してください。')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filters.offenseGroup, filters.dateRange, filters.precinct])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load, lastUpdated }
}
