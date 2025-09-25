// Input validation and sanitization utilities

export class Validator {
  static validateQuery(query) {
    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a non-empty string');
    }

    const trimmed = query.trim();
    if (trimmed.length === 0) {
      throw new Error('Query cannot be empty');
    }

    if (trimmed.length > 500) {
      throw new Error('Query too long (max 500 characters)');
    }

    return trimmed;
  }

  static validateSessionId(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
      return this.generateSessionId();
    }

    // Basic session ID validation
    if (sessionId.length > 100) {
      throw new Error('Session ID too long');
    }

    return sessionId;
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .trim();
  }

  static validateSearchTerms(searchTerms) {
    if (!Array.isArray(searchTerms)) {
      throw new Error('Search terms must be an array');
    }

    if (searchTerms.length === 0) {
      throw new Error('At least one search term is required');
    }

    return searchTerms.map(term => this.sanitizeInput(term)).filter(term => term.length > 0);
  }

  static validatePapers(papers) {
    if (!Array.isArray(papers)) {
      throw new Error('Papers must be an array');
    }

    return papers.filter(paper => {
      return paper && 
             typeof paper.title === 'string' && 
             paper.title.length > 0 &&
             Array.isArray(paper.authors) &&
             typeof paper.citations === 'number' &&
             typeof paper.relevanceScore === 'number';
    });
  }

  static generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  static validateRequest(request) {
    if (!request) {
      throw new Error('Request is required');
    }

    if (request.method !== 'POST') {
      throw new Error('Only POST requests are allowed');
    }

    return true;
  }

  static async validateJsonBody(request) {
    try {
      const body = await request.json();
      return body;
    } catch (error) {
      throw new Error('Invalid JSON in request body');
    }
  }
}
