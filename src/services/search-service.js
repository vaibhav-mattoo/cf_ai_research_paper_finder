// Main search service that coordinates all paper search operations

import { CONFIG } from '../config/constants.js';
import { ArxivService } from './arxiv-service.js';
import { ScholarService } from './scholar-service.js';
import { PaperProcessor } from './paper-processor.js';
import { logger } from '../utils/logger.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class SearchService {
  constructor() {
    this.arxivService = new ArxivService();
    this.scholarService = new ScholarService();
  }

  async searchResearchPapers(searchTerms) {
    const timer = logger.time('Research paper search');
    
    try {
      const allPapers = [];
      const searchPromises = [];

      // Limit concurrent searches
      const limitedTerms = searchTerms.slice(0, CONFIG.MAX_CONCURRENT_SEARCHES);
      
      for (const term of limitedTerms) {
        searchPromises.push(this.searchTerm(term));
      }

      // Wait for all searches to complete
      const results = await Promise.allSettled(searchPromises);
      
      // Collect successful results
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allPapers.push(...result.value);
        } else {
          logger.warn('Search term failed', { error: result.reason.message });
        }
      }

      // Process and return papers
      const processedPapers = PaperProcessor.processPapers(allPapers);
      const limitedPapers = PaperProcessor.limitPapers(processedPapers);

      timer.end();
      logger.logSearch('multi-term', searchTerms, limitedPapers.length, timer.end());

      return limitedPapers;
    } catch (error) {
      timer.end();
      logger.error('Research paper search failed', error);
      return [];
    }
  }

  async searchTerm(term) {
    const papers = [];
    
    try {
      // Search arXiv
      const arxivPapers = await this.arxivService.searchPapers(term);
      papers.push(...arxivPapers);
      
      // Add delay to respect rate limits
      await this.delay(CONFIG.SEARCH_DELAY_MS);
      
      // Search Google Scholar
      const scholarPapers = await this.scholarService.searchPapers(term);
      papers.push(...scholarPapers);
      
      logger.info('Search term completed', { 
        term: term.substring(0, 50), 
        papersFound: papers.length 
      });
      
      return papers;
    } catch (error) {
      logger.error('Search term failed', { term, error: error.message });
      return [];
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get search statistics
  getSearchStats() {
    return {
      maxConcurrentSearches: CONFIG.MAX_CONCURRENT_SEARCHES,
      searchDelayMs: CONFIG.SEARCH_DELAY_MS,
      maxPapersPerTerm: CONFIG.MAX_PAPERS_PER_TERM,
      maxTotalPapers: CONFIG.MAX_TOTAL_PAPERS
    };
  }

  // Health check for search services
  async healthCheck() {
    const health = {
      arxiv: false,
      scholar: false,
      timestamp: new Date().toISOString()
    };

    try {
      // Test arXiv with a simple query
      const arxivTest = await this.arxivService.searchPapers('test');
      health.arxiv = Array.isArray(arxivTest);
    } catch (error) {
      logger.warn('ArXiv health check failed', { error: error.message });
    }

    try {
      // Test Scholar with a simple query
      const scholarTest = await this.scholarService.searchPapers('test');
      health.scholar = Array.isArray(scholarTest);
    } catch (error) {
      logger.warn('Scholar health check failed', { error: error.message });
    }

    return health;
  }
}
