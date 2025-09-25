// Centralized error handling for the Research Paper Finder

import { HTTP_STATUS, ERROR_MESSAGES, CORS_HEADERS } from '../config/constants.js';
import { logger } from './logger.js';

export class ErrorHandler {
  static handle(error, context = 'Unknown') {
    logger.error(`Error in ${context}`, error);

    // Determine error type and appropriate response
    if (error.message.includes('Method not allowed')) {
      return this.createErrorResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, ERROR_MESSAGES.METHOD_NOT_ALLOWED);
    }

    if (error.message.includes('Invalid JSON')) {
      return this.createErrorResponse(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_JSON);
    }

    if (error.message.includes('Query')) {
      return this.createErrorResponse(HTTP_STATUS.BAD_REQUEST, error.message);
    }

    if (error.message.includes('AI')) {
      return this.createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.AI_ERROR);
    }

    if (error.message.includes('Search')) {
      return this.createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.SEARCH_ERROR);
    }

    // Default internal server error
    return this.createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }

  static createErrorResponse(status, message, details = null) {
    const response = {
      error: message,
      ...(details && { details })
    };

    return new Response(JSON.stringify(response), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    });
  }

  static createSuccessResponse(data, status = HTTP_STATUS.OK) {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    });
  }

  static async withErrorHandling(operation, context) {
    try {
      return await operation();
    } catch (error) {
      return this.handle(error, context);
    }
  }

  static validateAndHandle(validationFn, operation, context) {
    try {
      validationFn();
      return operation();
    } catch (error) {
      return this.handle(error, context);
    }
  }

  // Retry mechanism with exponential backoff
  static async withRetry(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        logger.warn(`Retry attempt ${attempt} failed, retrying in ${delay}ms`, { error: error.message });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}
