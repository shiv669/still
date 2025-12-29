/**
 * Simple in-memory cache for freshness states
 * In production, this would use Redis or similar
 */

interface CacheEntry {
  state: string
  timestamp: number
  ttl: number
}

class FreshnessCache {
  private cache: Map<string, CacheEntry> = new Map()
  private readonly DEFAULT_TTL = 60 * 1000 // 60 seconds

  set(postId: string, state: string, ttl?: number): void {
    this.cache.set(postId, {
      state,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    })
  }

  get(postId: string): string | null {
    const entry = this.cache.get(postId)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(postId)
      return null
    }

    return entry.state
  }

  invalidate(postId: string): void {
    this.cache.delete(postId)
  }

  invalidateThread(threadId: string): void {
    // In production, we'd maintain a threadId -> postIds mapping
    // For now, just clear all
    this.cache.clear()
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Singleton instance
export const freshnessCache = new FreshnessCache()
