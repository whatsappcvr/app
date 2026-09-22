import AsyncStorage from '@react-native-async-storage/async-storage'

const CACHE_PREFIX = '@cvr_parent_app/cache/'

export interface CacheEnvelope<T> {
  data: T
  lastUpdated: number // epoch ms
}

function isEmpty(data: unknown): boolean {
  if (data == null) return true
  if (Array.isArray(data)) return data.length === 0
  if (typeof data === 'object') return Object.keys(data as object).length === 0
  return false
}

/**
 * Simple per-key local cache backed by AsyncStorage. Used to keep the last
 * known-good server response around so screens can render something useful
 * (with a "showing last updated data" banner) when the device is offline.
 */
export const CacheService = {
  async get<T>(key: string): Promise<CacheEnvelope<T> | null> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + key)
      if (!raw) return null
      const parsed = JSON.parse(raw) as CacheEnvelope<T>
      if (!parsed || typeof parsed.lastUpdated !== 'number') return null
      return parsed
    } catch (e) {
      if (__DEV__) console.warn('[CacheService] get failed for key', key, e)
      return null
    }
  },

  async set<T>(key: string, data: T): Promise<void> {
    // Never overwrite a good cache entry with an empty/null response - that
    // would destroy the "last known good data" fallback for no benefit.
    if (isEmpty(data)) return
    try {
      const envelope: CacheEnvelope<T> = { data, lastUpdated: Date.now() }
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(envelope))
    } catch (e) {
      if (__DEV__) console.warn('[CacheService] set failed for key', key, e)
    }
  },

  async clear(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_PREFIX + key)
    } catch {
      // best-effort
    }
  },
}
