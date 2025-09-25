// Performance monitoring and optimization utilities

import { logger } from './logger.js';
import { CONFIG } from '../config/constants.js';

export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.activeTimers = new Map();
  }

  startTimer(operation) {
    const startTime = Date.now();
    this.activeTimers.set(operation, startTime);
    return {
      end: () => {
        const duration = Date.now() - startTime;
        this.recordMetric(operation, duration);
        this.activeTimers.delete(operation);
        return duration;
      }
    };
  }

  recordMetric(operation, value) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const metrics = this.metrics.get(operation);
    metrics.push({
      value,
      timestamp: Date.now()
    });

    // Keep only recent metrics (last 100 entries)
    if (metrics.length > 100) {
      metrics.shift();
    }

    logger.info(`Performance metric recorded`, { operation, value });
  }

  getMetrics(operation) {
    const metrics = this.metrics.get(operation) || [];
    
    if (metrics.length === 0) {
      return null;
    }

    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      average: Math.round(sum / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1]
    };
  }

  getAllMetrics() {
    const result = {};
    for (const [operation] of this.metrics) {
      result[operation] = this.getMetrics(operation);
    }
    return result;
  }

  // Rate limiting utility
  static createRateLimiter(maxRequests, windowMs) {
    const requests = new Map();
    
    return (identifier) => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean old requests
      if (requests.has(identifier)) {
        const userRequests = requests.get(identifier);
        const validRequests = userRequests.filter(time => time > windowStart);
        requests.set(identifier, validRequests);
        
        if (validRequests.length >= maxRequests) {
          return false; // Rate limited
        }
      } else {
        requests.set(identifier, []);
      }
      
      // Add current request
      requests.get(identifier).push(now);
      return true; // Allowed
    };
  }

  // Memory usage monitoring
  static getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    
    // Fallback for Cloudflare Workers
    return {
      rss: 0,
      heapTotal: 0,
      heapUsed: 0,
      external: 0
    };
  }

  // Performance optimization utilities
  static async batchProcess(items, processor, batchSize = 5) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(item => processor(item))
      );
      
      results.push(...batchResults);
      
      // Add delay between batches to prevent overwhelming
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.SEARCH_DELAY_MS));
      }
    }
    
    return results;
  }

  static debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Cache performance monitoring
  static createCacheMonitor(cache) {
    return {
      hitRate: () => {
        const stats = cache.getStats();
        return stats.hits / (stats.hits + stats.misses) || 0;
      },
      
      size: () => cache.size(),
      
      efficiency: () => {
        const stats = cache.getStats();
        return stats.hits / stats.size || 0;
      }
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Rate limiter for API requests
export const apiRateLimiter = PerformanceMonitor.createRateLimiter(
  CONFIG.MAX_CONCURRENT_SEARCHES * 2, // Allow some burst
  60000 // 1 minute window
);
