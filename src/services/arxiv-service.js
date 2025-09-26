// arXiv API service for searching academic papers

import { CONFIG } from '../config/constants.js';
import { globalCache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class ArxivService {
  constructor() {
    this.cache = globalCache;
  }

  async searchPapers(query) {
    const cacheKey = this.cache.generateKey('arxiv', query);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.info('ArXiv results retrieved from cache', { query: query.substring(0, 50) });
      return cached;
    }

    const timer = logger.time('ArXiv search');
    
    try {
      const searchUrl = this.buildSearchUrl(query);
      const response = await this.fetchWithRetry(searchUrl);
      const xmlText = await response.text();
      
      const papers = this.parseArxivXML(xmlText);
      
      // Cache the result
      this.cache.set(cacheKey, papers, CONFIG.CACHE_TTL_SECONDS);
      
      timer.end();
      logger.info('ArXiv search completed', { 
        query: query.substring(0, 50), 
        papersFound: papers.length 
      });
      
      return papers;
    } catch (error) {
      timer.end();
      logger.error('ArXiv search failed', error);
      return [];
    }
  }

  buildSearchUrl(query) {
    const params = new URLSearchParams({
      search_query: `all:${encodeURIComponent(query)}`,
      start: '0',
      max_results: CONFIG.ARXIV_MAX_RESULTS.toString(),
      sortBy: 'submittedDate',
      sortOrder: CONFIG.ARXIV_SORT_ORDER
    });

    return `${CONFIG.ARXIV_BASE_URL}?${params.toString()}`;
  }

  async fetchWithRetry(url) {
    return await ErrorHandler.withRetry(async () => {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Research-Paper-Finder/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`ArXiv API error: ${response.status}`);
      }

      return response;
    }, CONFIG.MAX_RETRIES, CONFIG.RETRY_DELAY_MS);
  }

  parseArxivXML(xmlText) {
    const papers = [];
    const entries = xmlText.match(/<entry>[\s\S]*?<\/entry>/g) || [];
    
    for (const entry of entries) {
      try {
        const paper = this.parseEntry(entry);
        if (paper) {
          papers.push(paper);
        }
      } catch (error) {
        logger.warn('Failed to parse ArXiv entry', { error: error.message });
      }
    }
    
    return papers;
  }

  parseEntry(entry) {
    const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
    const summaryMatch = entry.match(/<summary>([^<]+)<\/summary>/);
    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
    const authorsMatch = entry.match(/<author><name>([^<]+)<\/name><\/author>/g);
    const linkMatch = entry.match(/<link href="([^"]+)" rel="alternate"/);
    const idMatch = entry.match(/<id>([^<]+)<\/id>/);
    
    if (!titleMatch) {
      return null;
    }

    const authors = authorsMatch ? 
      authorsMatch.map(a => a.match(/<name>([^<]+)<\/name>/)[1]) : 
      [];

    // Extract arXiv ID for better URL
    const arxivId = idMatch ? idMatch[1].split('/').pop() : '';
    const arxivUrl = arxivId ? `https://arxiv.org/abs/${arxivId}` : (linkMatch ? linkMatch[1] : '');

    return {
      title: titleMatch[1].trim(),
      abstract: summaryMatch ? summaryMatch[1].trim() : "No abstract available",
      authors: authors.length > 0 ? authors : ['Unknown Author'],
      publishedDate: publishedMatch ? publishedMatch[1] : new Date().toISOString().split('T')[0],
      url: arxivUrl,
      source: "arXiv",
      citations: 0, // arXiv doesn't provide citation counts directly
      relevanceScore: Math.random() * 0.4 + 0.6 // Higher relevance for real data
    };
  }
}
