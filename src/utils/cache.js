// Simple in-memory cache implementation for Cloudflare Workers

export class Cache {
  constructor(maxEntries = 1000, ttlSeconds = 3600) {
    this.cache = new Map();
    this.maxEntries = maxEntries;
    this.ttlSeconds = ttlSeconds;
  }

  generateKey(prefix, ...args) {
    return `${prefix}:${args.join(':')}`;
  }

  set(key, value, customTtl = null) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const ttl = customTtl || this.ttlSeconds;
    const expiresAt = Date.now() + (ttl * 1000);
    
    this.cache.set(key, {
      value,
      expiresAt
    });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    this.cleanup();
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      ttlSeconds: this.ttlSeconds
    };
  }
}

// Global cache instance
export const globalCache = new Cache();
