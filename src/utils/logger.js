// Logging utility for the Research Paper Finder

export class Logger {
  constructor(context = 'ResearchAgent') {
    this.context = context;
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...(data && { data })
    };

    // In production, you might want to send logs to an external service
    console.log(JSON.stringify(logEntry));
  }

  info(message, data = null) {
    this.log('INFO', message, data);
  }

  warn(message, data = null) {
    this.log('WARN', message, data);
  }

  error(message, error = null) {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : null;
    
    this.log('ERROR', message, errorData);
  }

  debug(message, data = null) {
    this.log('DEBUG', message, data);
  }

  // Performance logging
  time(label) {
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        this.info(`Performance: ${label}`, { duration: `${duration}ms` });
        return duration;
      }
    };
  }

  // Request logging
  logRequest(method, path, status, duration) {
    this.info('Request processed', {
      method,
      path,
      status,
      duration: `${duration}ms`
    });
  }

  // Search logging
  logSearch(query, searchTerms, papersFound, duration) {
    this.info('Search completed', {
      query: query.substring(0, 100), // Truncate for privacy
      searchTermsCount: searchTerms.length,
      papersFound,
      duration: `${duration}ms`
    });
  }

  // AI logging
  logAI(operation, model, tokens, duration) {
    this.info('AI operation completed', {
      operation,
      model,
      tokens,
      duration: `${duration}ms`
    });
  }
}

// Global logger instance
export const logger = new Logger();
