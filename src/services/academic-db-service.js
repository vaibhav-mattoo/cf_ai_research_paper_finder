// Academic database service that combines multiple sources for comprehensive results

import { CONFIG } from '../config/constants.js';
import { globalCache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class AcademicDBService {
  constructor() {
    this.cache = globalCache;
  }

  async searchPapers(query) {
    const cacheKey = this.cache.generateKey('academic', query);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.info('Academic DB results retrieved from cache', { query: query.substring(0, 50) });
      return cached;
    }

    const timer = logger.time('Academic DB search');
    
    try {
      const allPapers = [];
      
      // Search multiple academic databases in parallel
      const searchPromises = [
        this.searchPubMed(query),
        this.searchDOAJ(query),
        this.searchCORE(query),
        this.searchBASE(query)
      ];

      const results = await Promise.allSettled(searchPromises);
      
      // Collect successful results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allPapers.push(...result.value);
        } else {
          logger.warn(`Academic DB search ${index} failed`, { error: result.reason.message });
        }
      });

      // Remove duplicates and sort by relevance
      const uniquePapers = this.removeDuplicates(allPapers);
      const sortedPapers = this.sortByRelevance(uniquePapers, query);
      
      // Cache the result
      this.cache.set(cacheKey, sortedPapers, CONFIG.CACHE_TTL_SECONDS);
      
      timer.end();
      logger.info('Academic DB search completed', { 
        query: query.substring(0, 50), 
        papersFound: sortedPapers.length 
      });
      
      return sortedPapers;
    } catch (error) {
      timer.end();
      logger.error('Academic DB search failed', error);
      return [];
    }
  }

  async searchPubMed(query) {
    try {
      // Use E-utilities API for PubMed
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=10&retmode=json`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Research-Paper-Finder/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`PubMed API error: ${response.status}`);
      }

      const data = await response.json();
      const pmids = data.esearchresult?.idlist || [];
      
      if (pmids.length === 0) {
        return [];
      }

      // Get detailed information for each paper
      const detailsUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`;
      
      const detailsResponse = await fetch(detailsUrl, {
        headers: {
          'User-Agent': 'Research-Paper-Finder/1.0'
        }
      });

      if (!detailsResponse.ok) {
        throw new Error(`PubMed details API error: ${detailsResponse.status}`);
      }

      const xmlText = await detailsResponse.text();
      return this.parsePubMedXML(xmlText);
      
    } catch (error) {
      logger.warn('PubMed search failed', { error: error.message });
      return [];
    }
  }

  parsePubMedXML(xmlText) {
    const papers = [];
    const articles = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];
    
    for (const article of articles) {
      try {
        const titleMatch = article.match(/<ArticleTitle>([^<]+)<\/ArticleTitle>/);
        const abstractMatch = article.match(/<AbstractText[^>]*>([^<]+)<\/AbstractText>/);
        const authorsMatch = article.match(/<Author[^>]*>[\s\S]*?<LastName>([^<]+)<\/LastName>[\s\S]*?<ForeName>([^<]+)<\/ForeName>[\s\S]*?<\/Author>/g);
        const pmidMatch = article.match(/<PMID[^>]*>([^<]+)<\/PMID>/);
        const dateMatch = article.match(/<PubDate>[\s\S]*?<Year>([^<]+)<\/Year>[\s\S]*?<\/PubDate>/);
        
        if (titleMatch) {
          const authors = authorsMatch ? 
            authorsMatch.map(author => {
              const lastMatch = author.match(/<LastName>([^<]+)<\/LastName>/);
              const firstMatch = author.match(/<ForeName>([^<]+)<\/ForeName>/);
              return `${firstMatch?.[1] || ''} ${lastMatch?.[1] || ''}`.trim();
            }).filter(name => name) : 
            ['Unknown Author'];

          const pmid = pmidMatch ? pmidMatch[1] : '';
          const year = dateMatch ? dateMatch[1] : new Date().getFullYear().toString();
          
          papers.push({
            title: titleMatch[1].trim(),
            abstract: abstractMatch ? abstractMatch[1].trim() : 'No abstract available',
            authors: authors.length > 0 ? authors : ['Unknown Author'],
            publishedDate: `${year}-01-01`,
            url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : 'https://pubmed.ncbi.nlm.nih.gov/',
            source: 'PubMed',
            citations: 0, // Would need additional API call to get citation count
            relevanceScore: Math.random() * 0.4 + 0.6
          });
        }
      } catch (error) {
        logger.warn('Failed to parse PubMed article', { error: error.message });
      }
    }
    
    return papers;
  }

  async searchDOAJ(query) {
    try {
      // Directory of Open Access Journals
      const url = `https://doaj.org/api/v2/search/articles/${encodeURIComponent(query)}?pageSize=10`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Research-Paper-Finder/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`DOAJ API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.results?.map(article => ({
        title: article.bibjson?.title || 'Untitled',
        abstract: article.bibjson?.abstract || 'No abstract available',
        authors: article.bibjson?.author?.map(author => author.name) || ['Unknown Author'],
        publishedDate: article.bibjson?.year || new Date().getFullYear().toString(),
        url: article.bibjson?.link?.[0]?.url || `https://doaj.org/article/${article.id}`,
        source: 'DOAJ',
        citations: 0,
        relevanceScore: Math.random() * 0.4 + 0.6
      })) || [];
      
    } catch (error) {
      logger.warn('DOAJ search failed', { error: error.message });
      return [];
    }
  }

  async searchCORE(query) {
    try {
      // CORE - Aggregating the world's open access research papers
      const url = `https://core.ac.uk/api-v2/search/${encodeURIComponent(query)}?page=1&pageSize=10`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Research-Paper-Finder/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`CORE API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.data?.map(paper => ({
        title: paper.title || 'Untitled',
        abstract: paper.abstract || 'No abstract available',
        authors: paper.authors || ['Unknown Author'],
        publishedDate: paper.publishedDate || new Date().toISOString().split('T')[0],
        url: paper.downloadUrl || paper.uri || `https://core.ac.uk/display/${paper.id}`,
        source: 'CORE',
        citations: 0,
        relevanceScore: Math.random() * 0.4 + 0.6
      })) || [];
      
    } catch (error) {
      logger.warn('CORE search failed', { error: error.message });
      return [];
    }
  }

  async searchBASE(query) {
    try {
      // BASE - Bielefeld Academic Search Engine
      const url = `https://www.base-search.net/cgi-bin/BaseHttpSearchInterface.cgi?func=cgiwrap_basesearch&query=${encodeURIComponent(query)}&format=json&num=10`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Research-Paper-Finder/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`BASE API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.results?.map(result => ({
        title: result.title || 'Untitled',
        abstract: result.abstract || 'No abstract available',
        authors: result.author || ['Unknown Author'],
        publishedDate: result.year || new Date().getFullYear().toString(),
        url: result.url || result.link || 'https://www.base-search.net/',
        source: 'BASE',
        citations: 0,
        relevanceScore: Math.random() * 0.4 + 0.6
      })) || [];
      
    } catch (error) {
      logger.warn('BASE search failed', { error: error.message });
      return [];
    }
  }

  removeDuplicates(papers) {
    const seen = new Set();
    return papers.filter(paper => {
      const key = paper.title.toLowerCase().replace(/[^\w\s]/g, '');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  sortByRelevance(papers, query) {
    const queryWords = query.toLowerCase().split(' ');
    
    return papers.sort((a, b) => {
      // Calculate relevance score based on title and abstract
      const aScore = this.calculateRelevanceScore(a, queryWords);
      const bScore = this.calculateRelevanceScore(b, queryWords);
      
      return bScore - aScore;
    });
  }

  calculateRelevanceScore(paper, queryWords) {
    const title = paper.title.toLowerCase();
    const abstract = paper.abstract.toLowerCase();
    
    let score = 0;
    
    queryWords.forEach(word => {
      if (title.includes(word)) score += 3;
      if (abstract.includes(word)) score += 1;
    });
    
    return score + paper.relevanceScore;
  }
}
