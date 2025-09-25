// Main Research Agent class

import { AIService } from '../services/ai-service.js';
import { SearchService } from '../services/search-service.js';
import { Validator } from '../utils/validation.js';
import { ErrorHandler } from '../utils/error-handler.js';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/constants.js';

export class ResearchAgent {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.aiService = new AIService(env);
    this.searchService = new SearchService();
  }

  async fetch(request) {
    const timer = logger.time('Request processing');
    
    try {
      const url = new URL(request.url);
      
      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return this.handleCORS();
      }
      
      // Route requests
      if (url.pathname === "/chat") {
        return await this.handleChat(request);
      }
      
      if (url.pathname === "/search") {
        return await this.handleSearch(request);
      }
      
      if (url.pathname === "/health") {
        return await this.handleHealth(request);
      }
      
      return this.handleNotFound();
    } catch (error) {
      timer.end();
      return ErrorHandler.handle(error, 'ResearchAgent.fetch');
    }
  }

  async handleChat(request) {
    return await ErrorHandler.withErrorHandling(async () => {
      Validator.validateRequest(request);
      
      const { query, sessionId } = await Validator.validateJsonBody(request);
      const validatedQuery = Validator.validateQuery(query);
      const validatedSessionId = Validator.validateSessionId(sessionId);
      
      // Store query in state for memory
      await this.updateSessionState(validatedQuery, validatedSessionId);
      
      // Generate search terms using AI
      const searchTerms = await this.aiService.generateSearchTerms(validatedQuery);
      
      // Search for papers
      const papers = await this.searchService.searchResearchPapers(searchTerms);
      
      // Generate AI response
      const response = await this.aiService.generateResponse(validatedQuery, papers);
      
      return ErrorHandler.createSuccessResponse({
        response,
        papers: papers.slice(0, CONFIG.MAX_CHAT_PAPERS),
        searchTerms
      });
    }, 'ResearchAgent.handleChat');
  }

  async handleSearch(request) {
    return await ErrorHandler.withErrorHandling(async () => {
      Validator.validateRequest(request);
      
      const { query } = await Validator.validateJsonBody(request);
      const validatedQuery = Validator.validateQuery(query);
      
      // Generate search terms using AI
      const searchTerms = await this.aiService.generateSearchTerms(validatedQuery);
      
      // Search for papers
      const papers = await this.searchService.searchResearchPapers(searchTerms);
      
      return ErrorHandler.createSuccessResponse({
        papers: papers.slice(0, CONFIG.MAX_TOTAL_PAPERS),
        searchTerms
      });
    }, 'ResearchAgent.handleSearch');
  }

  async handleHealth(request) {
    return await ErrorHandler.withErrorHandling(async () => {
      const health = await this.searchService.healthCheck();
      
      return ErrorHandler.createSuccessResponse({
        status: 'healthy',
        services: health,
        timestamp: new Date().toISOString()
      });
    }, 'ResearchAgent.handleHealth');
  }

  async handleCORS() {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }

  handleNotFound() {
    return ErrorHandler.createErrorResponse(404, "Endpoint not found");
  }

  async updateSessionState(query, sessionId) {
    try {
      await this.state.storage.put({
        lastQuery: query,
        sessionId: sessionId,
        timestamp: Date.now(),
        queryCount: (await this.state.storage.get('queryCount') || 0) + 1
      });
      
      logger.info('Session state updated', { sessionId, query: query.substring(0, 50) });
    } catch (error) {
      logger.warn('Failed to update session state', { error: error.message });
    }
  }
}
