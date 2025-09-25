// Paper processing and sorting utilities

import { CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export class PaperProcessor {
  static removeDuplicates(papers) {
    const seen = new Set();
    const uniquePapers = [];

    for (const paper of papers) {
      const key = this.generatePaperKey(paper);
      if (!seen.has(key)) {
        seen.add(key);
        uniquePapers.push(paper);
      }
    }

    logger.info('Duplicate removal completed', { 
      original: papers.length, 
      unique: uniquePapers.length 
    });

    return uniquePapers;
  }

  static sortPapers(papers) {
    const sorted = papers.sort((a, b) => {
      // First sort by relevance score (higher is better)
      if (Math.abs(a.relevanceScore - b.relevanceScore) > CONFIG.RELEVANCE_THRESHOLD) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      // Then by citation count (higher is better)
      if (a.citations !== b.citations) {
        return b.citations - a.citations;
      }
      
      // Finally by publication date (newer is better)
      return new Date(b.publishedDate) - new Date(a.publishedDate);
    });

    logger.info('Papers sorted successfully', { count: sorted.length });
    return sorted;
  }

  static generatePaperKey(paper) {
    // Create a unique key based on title and first author
    const title = paper.title.toLowerCase().replace(/[^\w\s]/g, '');
    const firstAuthor = paper.authors[0] ? 
      paper.authors[0].toLowerCase().replace(/[^\w\s]/g, '') : '';
    
    return `${title}_${firstAuthor}`;
  }

  static validatePaper(paper) {
    return paper && 
           typeof paper.title === 'string' && 
           paper.title.length > 0 &&
           Array.isArray(paper.authors) &&
           typeof paper.citations === 'number' &&
           typeof paper.relevanceScore === 'number' &&
           paper.relevanceScore >= 0 &&
           paper.relevanceScore <= 1;
  }

  static enrichPaper(paper) {
    return {
      ...paper,
      // Ensure all required fields exist
      title: paper.title || 'Untitled',
      abstract: paper.abstract || '',
      authors: Array.isArray(paper.authors) ? paper.authors : ['Unknown'],
      publishedDate: paper.publishedDate || new Date().toISOString().split('T')[0],
      url: paper.url || '',
      source: paper.source || 'Unknown',
      citations: typeof paper.citations === 'number' ? paper.citations : CONFIG.DEFAULT_CITATIONS,
      relevanceScore: typeof paper.relevanceScore === 'number' ? paper.relevanceScore : Math.random()
    };
  }

  static processPapers(papers) {
    const timer = logger.time('Paper processing');
    
    // Validate and enrich papers
    const validPapers = papers
      .filter(paper => this.validatePaper(paper))
      .map(paper => this.enrichPaper(paper));

    // Remove duplicates
    const uniquePapers = this.removeDuplicates(validPapers);

    // Sort papers
    const sortedPapers = this.sortPapers(uniquePapers);

    timer.end();
    
    return sortedPapers;
  }

  static limitPapers(papers, limit = CONFIG.MAX_TOTAL_PAPERS) {
    return papers.slice(0, limit);
  }

  static groupPapersBySource(papers) {
    const grouped = {};
    
    for (const paper of papers) {
      const source = paper.source || 'Unknown';
      if (!grouped[source]) {
        grouped[source] = [];
      }
      grouped[source].push(paper);
    }

    return grouped;
  }

  static getPaperStatistics(papers) {
    const stats = {
      total: papers.length,
      sources: {},
      citationStats: {
        total: 0,
        average: 0,
        max: 0,
        min: Infinity
      },
      dateRange: {
        earliest: null,
        latest: null
      }
    };

    for (const paper of papers) {
      // Source statistics
      const source = paper.source || 'Unknown';
      stats.sources[source] = (stats.sources[source] || 0) + 1;

      // Citation statistics
      stats.citationStats.total += paper.citations;
      stats.citationStats.max = Math.max(stats.citationStats.max, paper.citations);
      stats.citationStats.min = Math.min(stats.citationStats.min, paper.citations);

      // Date range
      const date = new Date(paper.publishedDate);
      if (!stats.dateRange.earliest || date < stats.dateRange.earliest) {
        stats.dateRange.earliest = date;
      }
      if (!stats.dateRange.latest || date > stats.dateRange.latest) {
        stats.dateRange.latest = date;
      }
    }

    stats.citationStats.average = stats.total > 0 ? 
      Math.round(stats.citationStats.total / stats.total) : 0;

    if (stats.citationStats.min === Infinity) {
      stats.citationStats.min = 0;
    }

    return stats;
  }
}
