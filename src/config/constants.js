// Configuration constants for the Research Paper Finder

export const CONFIG = {
  // AI Model Configuration
  AI_MODEL: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  MAX_TOKENS_SEARCH_TERMS: 200,
  MAX_TOKENS_RESPONSE: 500,
  
  // Search Configuration
  MAX_SEARCH_TERMS: 5,
  MAX_PAPERS_PER_TERM: 10,
  MAX_TOTAL_PAPERS: 20,
  MAX_CHAT_PAPERS: 10,
  
  // Rate Limiting
  SEARCH_DELAY_MS: 100,
  MAX_CONCURRENT_SEARCHES: 3,
  
  // Cache Configuration
  CACHE_TTL_SECONDS: 3600, // 1 hour
  CACHE_MAX_ENTRIES: 1000,
  
  // API Configuration
  ARXIV_BASE_URL: "http://export.arxiv.org/api/query",
  ARXIV_MAX_RESULTS: 10,
  ARXIV_SORT_ORDER: "descending",
  
  // Response Configuration
  DEFAULT_CITATIONS: 0,
  RELEVANCE_THRESHOLD: 0.1,
  
  // Error Configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  
  // Session Configuration
  SESSION_TTL_HOURS: 24,
  MAX_QUERIES_PER_SESSION: 100
};

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const HTTP_STATUS = {
  OK: 200,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500,
  BAD_REQUEST: 400,
  NOT_FOUND: 404
};

export const ERROR_MESSAGES = {
  METHOD_NOT_ALLOWED: "Method not allowed",
  INVALID_JSON: "Invalid JSON in request body",
  MISSING_QUERY: "Query parameter is required",
  AI_ERROR: "AI service temporarily unavailable",
  SEARCH_ERROR: "Search service temporarily unavailable",
  INTERNAL_ERROR: "Internal server error"
};
