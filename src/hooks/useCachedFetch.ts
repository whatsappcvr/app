import { useCallback, useEffect, useRef, useState } from 'react'
import { CacheService } from '../services/cacheService'
import { useIsOffline } from './useNetworkStatus'

export interface UseCachedFetchResult<T> {
  data: T | null
  isLoading: boolean
  /** true once we've shown data (fresh or cached) at least once */
  isReady: boolean
  /** the currently shown data came from local cache, not a live fetch */
  isFromCache: boolean
  error: unknown
  lastUpdated: number | null
  refresh: () => Promise<void>
}

/**
 * Fetch-with-offline-fallback pattern used across the read-only screens
 * (profile, attendance, results, mentor, fees, notifications):
 *
 *  - On mount, try the network fetch.
 *  - On success: cache the response and show it.
 *  - On failure/offline: fall back to the last cached response if there is
 *    one (caller shows the NetworkStatusBanner in that case); otherwise
 *    surface a clean empty/error state so the caller can render a Retry button.
 *
 * `cacheKey` should be unique per screen + per selected ward (roll number)
 * so switching wards doesn't show another student's cached data.
 */
export function useCachedFetch<T>(
  cacheKey: string | null,
  fetcher: () => Promise<T>,
  options?: { pollMs?: number },
): UseCachedFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFromCache, setIsFromCache] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const isOffline = useIsOffline()
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const load = useCallback(async () => {
    if (!cacheKey) return
    setIsLoading(true)
    try {
      const result = await fetcherRef.current()
      setData(result)
      setIsFromCache(false)
      setError(null)
      setLastUpdated(Date.now())
      await CacheService.set(cacheKey, result)
    } catch (err) {
      if (__DEV__) console.warn(`[useCachedFetch:${cacheKey}] network fetch failed, falling back to cache`, err)
      const cached = await CacheService.get<T>(cacheKey)
      if (cached) {
        setData(cached.data)
        setIsFromCache(true)
        setLastUpdated(cached.lastUpdated)
        setError(null)
      } else {
        setError(err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [cacheKey])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!options?.pollMs) return
    const id = setInterval(() => {
      if (!isOffline) load()
    }, options.pollMs)
    return () => clearInterval(id)
  }, [options?.pollMs, isOffline, load])

  return { data, isLoading, isReady: data != null, isFromCache, error, lastUpdated, refresh: load }
}
