"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheContextType {
  get: <T>(key: string) => T | null
  set: <T>(key: string, data: T, ttlSeconds?: number) => void
  invalidate: (key: string) => void
  invalidateAll: () => void
}

const CacheContext = createContext<CacheContextType | null>(null)

const DEFAULT_TTL = 5 * 60 // 5 dakika (saniye cinsinden)

export function CacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<Map<string, CacheEntry<unknown>>>(new Map())

  const get = useCallback(<T,>(key: string): T | null => {
    const entry = cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      // Expired, remove it
      setCache(prev => {
        const next = new Map(prev)
        next.delete(key)
        return next
      })
      return null
    }
    return entry.data as T
  }, [cache])

  const set = useCallback(<T,>(key: string, data: T, ttlSeconds = DEFAULT_TTL) => {
    setCache(prev => {
      const next = new Map(prev)
      next.set(key, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttlSeconds * 1000
      })
      return next
    })
  }, [])

  const invalidate = useCallback((key: string) => {
    setCache(prev => {
      const next = new Map(prev)
      next.delete(key)
      return next
    })
  }, [])

  const invalidateAll = useCallback(() => {
    setCache(new Map())
  }, [])

  return (
    <CacheContext.Provider value={{ get, set, invalidate, invalidateAll }}>
      {children}
    </CacheContext.Provider>
  )
}

export function useCache() {
  const context = useContext(CacheContext)
  if (!context) {
    throw new Error("useCache must be used within CacheProvider")
  }
  return context
}
