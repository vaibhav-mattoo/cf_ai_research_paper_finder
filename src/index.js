// Main entry point for the Research Paper Finder
// This file handles routing and delegates to the ResearchAgent

import { ResearchAgent } from './agent/research-agent.js';
import { CORS_HEADERS } from './config/constants.js';
import { logger } from './utils/logger.js';

// CRITICAL: Export the default handler for ES Module format
export default {
  async fetch(request, env) {
    const timer = logger.time('Request routing');
    
    try {
      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: CORS_HEADERS });
      }

      // Route to Durable Object for chat and search endpoints
      const url = new URL(request.url);
      if (url.pathname === "/chat" || url.pathname === "/search" || url.pathname === "/health") {
        const id = env.RESEARCH_AGENT.idFromName("research-agent-singleton");
        const stub = env.RESEARCH_AGENT.get(id);
        const response = await stub.fetch(request);
        
        // Clone response and add CORS headers
        const body = await response.clone().text();
        const headers = new Headers(response.headers);
        
        // Inject CORS headers
        for (const [key, value] of Object.entries(CORS_HEADERS)) {
          headers.set(key, value);
        }

        timer.end();
        return new Response(body, {
          status: response.status,
          headers: headers
        });
      }

      // Default API response
      const response = new Response("Research Paper Finder API", { status: 200 });
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      timer.end();
      return response;
    } catch (error) {
      timer.end();
      logger.error('Request routing failed', error);
      
      const response = new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS
        }
      });
      
      return response;
    }
  }
};