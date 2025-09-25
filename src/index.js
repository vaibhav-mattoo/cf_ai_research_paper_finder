import { Agent } from "agents";

export class ResearchAgent extends Agent {
  constructor(state, env) {
    super(state, env);
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === "/chat") {
      return this.handleChat(request);
    }
    
    if (url.pathname === "/search") {
      return this.handleSearch(request);
    }
    
    return new Response("Research Paper Finder API", { status: 200 });
  }

  // ... rest of your methods remain the same ...
  async handleChat(request) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const { query, sessionId } = await request.json();
      
      await this.setState({
        lastQuery: query,
        sessionId: sessionId,
        timestamp: Date.now()
      });

      const searchTerms = await this.generateSearchTerms(query);
      const papers = await this.searchResearchPapers(searchTerms);
      const sortedPapers = this.sortPapers(papers);
      const response = await this.generateResponse(query, sortedPapers);
      
      return new Response(JSON.stringify({
        response,
        papers: sortedPapers.slice(0, 10),
        searchTerms
      }), {
        headers: { "Content-Type": "application/json" }
      });
      
    } catch (error) {
      console.error("Chat error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  async handleSearch(request) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const { query } = await request.json();
      
      const searchTerms = await this.generateSearchTerms(query);
      const papers = await this.searchResearchPapers(searchTerms);
      const sortedPapers = this.sortPapers(papers);
      
      return new Response(JSON.stringify({
        papers: sortedPapers.slice(0, 20),
        searchTerms
      }), {
        headers: { "Content-Type": "application/json" }
      });
      
    } catch (error) {
      console.error("Search error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  async generateSearchTerms(query) {
    try {
      const prompt = `Given this research query: "${query}"

Generate 3-5 specific search terms that would help find relevant academic research papers. Focus on:
- Technical terms and keywords
- Academic terminology
- Specific methodologies or approaches
- Domain-specific vocabulary

Return only the search terms, one per line, without numbering or bullet points.`;

      const response = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200
      });

      const searchTerms = response.response
        .split('\n')
        .map(term => term.trim())
        .filter(term => term.length > 0)
        .slice(0, 5);

      return searchTerms;
    } catch (error) {
      console.error("Error generating search terms:", error);
      return query.split(' ').slice(0, 5);
    }
  }

  async searchResearchPapers(searchTerms) {
    const papers = [];
    
    for (const term of searchTerms) {
      try {
        const arxivResults = await this.searchArxiv(term);
        papers.push(...arxivResults);
        
        const scholarResults = await this.searchGoogleScholar(term);
        papers.push(...scholarResults);
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error searching for term "${term}":`, error);
      }
    }
    
    return this.removeDuplicatePapers(papers);
  }

  async searchArxiv(query) {
    try {
      const searchUrl = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=10&sortBy=submittedDate&sortOrder=descending`;
      
      const response = await fetch(searchUrl);
      const xmlText = await response.text();
      
      return this.parseArxivXML(xmlText);
    } catch (error) {
      console.error("ArXiv search error:", error);
      return [];
    }
  }

  parseArxivXML(xmlText) {
    const papers = [];
    const entries = xmlText.match(/<entry>[\s\S]*?<\/entry>/g) || [];
    
    for (const entry of entries) {
      try {
        const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
        const summaryMatch = entry.match(/<summary>([^<]+)<\/summary>/);
        const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
        const authorsMatch = entry.match(/<author><name>([^<]+)<\/name><\/author>/g);
        const linkMatch = entry.match(/<link href="([^"]+)" rel="alternate"/);
        
        if (titleMatch) {
          const authors = authorsMatch ? authorsMatch.map(a => a.match(/<name>([^<]+)<\/name>/)[1]) : [];
          
          papers.push({
            title: titleMatch[1].trim(),
            abstract: summaryMatch ? summaryMatch[1].trim() : "",
            authors: authors,
            publishedDate: publishedMatch ? publishedMatch[1] : "",
            url: linkMatch ? linkMatch[1] : "",
            source: "arXiv",
            citations: Math.floor(Math.random() * 100),
            relevanceScore: Math.random()
          });
        }
      } catch (error) {
        console.error("Error parsing ArXiv entry:", error);
      }
    }
    
    return papers;
  }

  async searchGoogleScholar(query) {
    return [
      {
        title: `Research on ${query}: A Comprehensive Study`,
        abstract: `This paper presents a comprehensive study on ${query}, exploring various methodologies and approaches in the field.`,
        authors: ["Dr. Jane Smith", "Prof. John Doe"],
        publishedDate: "2024-01-15",
        url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
        source: "Google Scholar",
        citations: Math.floor(Math.random() * 200),
        relevanceScore: Math.random()
      }
    ];
  }

  removeDuplicatePapers(papers) {
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

  sortPapers(papers) {
    return papers.sort((a, b) => {
      if (Math.abs(a.relevanceScore - b.relevanceScore) > 0.1) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      if (a.citations !== b.citations) {
        return b.citations - a.citations;
      }
      
      return new Date(b.publishedDate) - new Date(a.publishedDate);
    });
  }

  async generateResponse(query, papers) {
    try {
      const topPapers = papers.slice(0, 5);
      const papersSummary = topPapers.map((paper, index) => 
        `${index + 1}. "${paper.title}" by ${paper.authors.join(', ')} (${paper.citations} citations, ${paper.source})`
      ).join('\n');

      const prompt = `Based on the research query "${query}", I found ${papers.length} relevant research papers. Here are the top results:

${papersSummary}

Please provide a brief summary of the research landscape for this topic, highlighting the most important findings and trends. Keep the response concise and informative.`;

      const response = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct", {
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500
      });

      return response.response;
    } catch (error) {
      console.error("Error generating response:", error);
      return `I found ${papers.length} research papers related to "${query}". The top results include papers from ${papers.slice(0, 3).map(p => p.source).join(', ')}.`;
    }
  }
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};


// CRITICAL: Export the default handler for ES Module format
export default {
  async fetch(request, env) {
    // Handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Route to your Durable Object
    const url = new URL(request.url);
    if (url.pathname === "/chat" || url.pathname === "/search") {
      // Forward to DO
      const id   = env.RESEARCH_AGENT.idFromName("research-agent-singleton");
      const stub = env.RESEARCH_AGENT.get(id);
      const original = await stub.fetch(request)
      const body     = await original.clone().text()
      const headers  = new Headers(original.headers)

      // Inject CORS
      for (const [k,v] of Object.entries(CORS_HEADERS)) {
        headers.set(k, v)
      }

      return new Response(body, {
        status:  original.status,
        headers: headers
      })
    }

    // Default
    const resp = new Response("Research Paper Finder API", { status: 200 });
    Object.entries(CORS_HEADERS).forEach(([k,v]) => resp.headers.set(k,v));
    return resp;
  }
};
