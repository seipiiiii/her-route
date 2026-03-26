import { useState, useEffect } from 'react'
import type { CityId } from '../types/crime'
import { fetchFBIStats, type FBIOffenseCount } from '../utils/api'
import { CITIES } from '../utils/cityConfig'

export function useFBIStats(city: CityId) {
  const [stats, setStats] = useState<FBIOffenseCount[]>([])
  const [loading, setLoading] = useState(false)
  const [hasKey] = useState(() => Boolean(import.meta.env.VITE_FBI_API_KEY))

  useEffect(() => {
    if (!hasKey) return
    const { fbiOri } = CITIES[city]
    setLoading(true)
    setStats([])
    fetchFBIStats(fbiOri)
      .then(setStats)
      .finally(() => setLoading(false))
  }, [city, hasKey])

  return { stats, loading, hasKey }
}
