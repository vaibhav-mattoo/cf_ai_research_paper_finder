# 🚀 Deployment Guide

## Quick Deployment Steps

### 1. Prerequisites
- Cloudflare account (free tier works)
- Node.js 18+ installed
- Git installed

### 2. Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd cf_ai_research_paper_finder

# Install dependencies
npm install

# Login to Cloudflare
npx wrangler login
```

### 3. Deploy Worker
```bash
# Deploy the AI agent worker
npm run deploy
```

### 4. Deploy Frontend
```bash
# Deploy the web interface
npm run pages:deploy
```

### 5. Test the Application
1. Get your Worker URL from the deployment output
2. Update the `API_BASE_URL` in `frontend/index.html` with your Worker URL
3. Redeploy the frontend: `npm run pages:deploy`
4. Open the Pages URL in your browser
5. Test with queries like "machine learning healthcare"

## Configuration

### Update wrangler.toml
Replace `your-subdomain` with your actual Cloudflare subdomain:
```toml
name = "cf-ai-research-paper-finder"
```

### Update Frontend API URL
In `frontend/index.html`, update:
```javascript
const API_BASE_URL = 'https://cf-ai-research-paper-finder.your-subdomain.workers.dev';
```

## Testing Locally

### Start Worker
```bash
npm run dev
```

### Start Frontend
```bash
npm run pages:dev
```

### Test API
```bash
curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "quantum computing", "sessionId": "test123"}'
```

## Troubleshooting

### Common Issues
1. **AI binding error**: Ensure Workers AI is enabled in your Cloudflare account
2. **CORS errors**: Check that API_BASE_URL matches your deployed Worker URL
3. **No papers found**: Verify internet connectivity and arXiv API availability

### Debug Mode
Add console.log statements in `src/index.js` to debug issues:
```javascript
console.log("Query received:", query);
console.log("Search terms:", searchTerms);
console.log("Papers found:", papers.length);
```

## Production Considerations

1. **Rate Limiting**: The app includes built-in delays to respect API limits
2. **Error Handling**: Graceful fallbacks for API failures
3. **Security**: Input validation and sanitization included
4. **Performance**: Optimized for 2-5 second response times

## Support

For issues or questions:
1. Check the README.md for detailed documentation
2. Review PROMPTS.md for AI prompt details
3. Run the test script: `node test.js`
4. Check Cloudflare Workers logs in the dashboard
