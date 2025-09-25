// AI service for generating search terms and responses

import { CONFIG } from '../config/constants.js';
import { globalCache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class AIService {
  constructor(env) {
    this.env = env;
    this.cache = globalCache;
  }

  async generateSearchTerms(query) {
    const cacheKey = this.cache.generateKey('search_terms', query);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.info('Search terms retrieved from cache', { query: query.substring(0, 50) });
      return cached;
    }

    const timer = logger.time('AI search terms generation');
    
    try {
      const prompt = this.createSearchTermsPrompt(query);
      const response = await this.callAI(prompt, CONFIG.MAX_TOKENS_SEARCH_TERMS);
      
      const searchTerms = this.parseSearchTerms(response);
      
      // Cache the result
      this.cache.set(cacheKey, searchTerms, CONFIG.CACHE_TTL_SECONDS);
      
      timer.end();
      logger.logAI('generateSearchTerms', CONFIG.AI_MODEL, CONFIG.MAX_TOKENS_SEARCH_TERMS, timer.end());
      
      return searchTerms;
    } catch (error) {
      timer.end();
      logger.error('Failed to generate search terms', error);
      
      // Fallback to simple keyword extraction
      return this.extractKeywords(query);
    }
  }

  async generateResponse(query, papers) {
    const cacheKey = this.cache.generateKey('ai_response', query, papers.length.toString());
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.info('AI response retrieved from cache', { query: query.substring(0, 50) });
      return cached;
    }

    const timer = logger.time('AI response generation');
    
    try {
      const prompt = this.createResponsePrompt(query, papers);
      const response = await this.callAI(prompt, CONFIG.MAX_TOKENS_RESPONSE);
      
      // Cache the result
      this.cache.set(cacheKey, response, CONFIG.CACHE_TTL_SECONDS);
      
      timer.end();
      logger.logAI('generateResponse', CONFIG.AI_MODEL, CONFIG.MAX_TOKENS_RESPONSE, timer.end());
      
      return response;
    } catch (error) {
      timer.end();
      logger.error('Failed to generate AI response', error);
      
      // Fallback response
      return this.createFallbackResponse(query, papers);
    }
  }

  async callAI(prompt, maxTokens) {
    return await ErrorHandler.withRetry(async () => {
      const response = await this.env.AI.run(CONFIG.AI_MODEL, {
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: maxTokens
      });

      return response.response;
    }, CONFIG.MAX_RETRIES, CONFIG.RETRY_DELAY_MS);
  }

  createSearchTermsPrompt(query) {
    return `Given this research query: "${query}"

Generate 3-5 specific search terms that would help find relevant academic research papers. Focus on:
- Technical terms and keywords
- Academic terminology
- Specific methodologies or approaches
- Domain-specific vocabulary

Return only the search terms, one per line, without numbering or bullet points.`;
  }

  createResponsePrompt(query, papers) {
    const topPapers = papers.slice(0, 5);
    const papersSummary = topPapers.map((paper, index) => 
      `${index + 1}. "${paper.title}" by ${paper.authors.join(', ')} (${paper.citations} citations, ${paper.source})`
    ).join('\n');

    return `Based on the research query "${query}", I found ${papers.length} relevant research papers. Here are the top results:

${papersSummary}

Please provide a brief summary of the research landscape for this topic, highlighting the most important findings and trends. Keep the response concise and informative.`;
  }

  parseSearchTerms(response) {
    const searchTerms = response
      .split('\n')
      .map(term => term.trim())
      .filter(term => term.length > 0)
      .slice(0, CONFIG.MAX_SEARCH_TERMS);

    return searchTerms.length > 0 ? searchTerms : ['research'];
  }

  extractKeywords(query) {
    return query
      .toLowerCase()
      .split(' ')
      .filter(word => word.length > 2)
      .slice(0, CONFIG.MAX_SEARCH_TERMS);
  }

  createFallbackResponse(query, papers) {
    const sources = [...new Set(papers.map(p => p.source))];
    return `I found ${papers.length} research papers related to "${query}". The top results include papers from ${sources.join(', ')}. These papers cover various aspects of the topic and provide valuable insights for further research.`;
  }
}
