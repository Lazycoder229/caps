"use client"

import { useEffect, useState } from "react"
import { CustomerKiosk } from "./workspace"
import type { KioskCatalog } from "./data"

const DB_NAME = "prime-device-cache"
const STORE_NAME = "kiosk-catalog"
const CACHE_TTL = 3 * 60 * 1000
type CachedCatalog = { savedAt: number; data: KioskCatalog }

function openCache() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function readCache(key: string): Promise<CachedCatalog | null> {
  if (!("indexedDB" in window)) return null
  const db = await openCache()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key)
    request.onsuccess = () => { const value = (request.result as CachedCatalog | undefined) ?? null; db.close(); resolve(value) }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

async function writeCache(key: string, data: KioskCatalog) {
  if (!("indexedDB" in window)) return
  const db = await openCache()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite")
    transaction.objectStore(STORE_NAME).put({ savedAt: Date.now(), data } satisfies CachedCatalog, key)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
  db.close()
}

export function KioskDataLoader({ isAuthenticated, initialTableId }: { isAuthenticated: boolean; initialTableId: string | null }) {
  const [catalog, setCatalog] = useState<KioskCatalog | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const cacheKey = `catalog:v1:${initialTableId ?? "counter"}`

  useEffect(() => {
    let active = true
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("prime-device-cache")
    if (channel) channel.onmessage = (event) => {
      if (event.data?.type === "catalog-invalidated") setRefreshKey((key) => key + 1)
    }
    async function load() {
      let cached: CachedCatalog | null = null
      try {
        cached = await readCache(cacheKey)
        if (active && cached) setCatalog(cached.data)
      } catch {
        // Keep using the network when browser storage is disabled or unavailable.
      }
      if (refreshKey === 0 && cached && Date.now() - cached.savedAt < CACHE_TTL) return
      try {
        const query = initialTableId ? `?tableId=${encodeURIComponent(initialTableId)}` : ""
        const response = await fetch(`/api/customer/kiosk/catalog${query}`, { cache: "no-store" })
        if (!response.ok) throw new Error("Kiosk catalog request failed")
        const fresh = (await response.json()) as KioskCatalog
        if (!active) return
        setCatalog(fresh)
        setLoadError(false)
        try { await writeCache(cacheKey, fresh) } catch { /* IndexedDB is an optional device cache. */ }
      } catch {
        if (active && !cached) setLoadError(true)
      }
    }
    void load()
    return () => { active = false; channel?.close() }
  }, [cacheKey, initialTableId, refreshKey])

  if (!catalog) {
    return (
      <main className="mx-auto min-h-[60vh] w-full max-w-7xl px-4 py-8 sm:px-6" aria-busy="true" aria-label="Loading menu">
        {loadError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-950">
            Menu data is unavailable. Check your connection and refresh the page.
          </div>
        ) : (
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-56 rounded-xl bg-stone-200" />
            <div className="h-12 w-full rounded-xl bg-stone-100" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-stone-200"><div className="aspect-[4/3] bg-stone-200" /><div className="space-y-3 p-4"><div className="h-5 w-2/3 rounded bg-stone-200" /><div className="h-4 w-full rounded bg-stone-100" /><div className="h-9 w-28 rounded-full bg-stone-200" /></div></div>)}
            </div>
          </div>
        )}
      </main>
    )
  }

  return <CustomerKiosk {...catalog} isAuthenticated={isAuthenticated} initialTableId={initialTableId} />
}
