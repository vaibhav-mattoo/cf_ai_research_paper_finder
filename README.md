# 🔬 AI Research Paper Finder

An AI-powered application that helps researchers find relevant academic papers based on their research queries. Built with Cloudflare Agents SDK, this application uses Llama 3.3 to process queries, search multiple academic databases, and return papers sorted by relevance, citations, and publication date.

## ✨ Features

- **AI-Powered Query Processing**: Uses Llama 3.3 to understand research queries and generate optimal search terms
- **Multi-Source Paper Search**: Searches arXiv and Google Scholar for comprehensive coverage
- **Smart Sorting**: Papers are sorted by relevance score, citation count, and publication date
- **Real-time Chat Interface**: Interactive web interface for seamless research discovery
- **State Management**: Maintains conversation history and session state
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

This application consists of:

1. **Cloudflare Worker** (`src/index.js`): Main AI agent that handles research queries
2. **Durable Object**: Persistent state management for conversation history
3. **Cloudflare Pages** (`frontend/`): Web interface for user interaction
4. **Workers AI**: Llama 3.3 model for natural language processing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Cloudflare account
- Wrangler CLI installed globally

### Installation

1. **Clone and setup the project:**
```bash
git clone <your-repo-url>
cd cf_ai_research_paper_finder
npm install
```

2. **Configure Cloudflare:**
```bash
# Login to Cloudflare
wrangler login

# Update wrangler.toml with your account details
```

3. **Deploy the Worker:**
```bash
npm run deploy
```

4. **Deploy the frontend:**
```bash
npm run pages:deploy
```

### Local Development

1. **Start the Worker locally:**
```bash
npm run dev
```

2. **Start the frontend locally:**
```bash
npm run pages:dev
```

## 📖 Usage

### Web Interface

1. Open the deployed frontend URL
2. Enter your research query (e.g., "machine learning in healthcare")
3. The AI will:
   - Process your query using Llama 3.3
   - Generate relevant search terms
   - Search arXiv and Google Scholar
   - Return papers sorted by relevance and citations
   - Provide a summary of findings

### API Endpoints

#### Chat Endpoint
```bash
POST /chat
Content-Type: application/json

{
  "query": "quantum computing applications",
  "sessionId": "session_123"
}
```

**Response:**
```json
{
  "response": "AI-generated summary of research landscape...",
  "papers": [
    {
      "title": "Quantum Computing Applications in Cryptography",
      "abstract": "This paper explores...",
      "authors": ["Dr. Jane Smith", "Prof. John Doe"],
      "publishedDate": "2024-01-15",
      "url": "https://arxiv.org/abs/2401.12345",
      "source": "arXiv",
      "citations": 45,
      "relevanceScore": 0.92
    }
  ],
  "searchTerms": ["quantum computing", "cryptography", "quantum algorithms"]
}
```

#### Search Endpoint
```bash
POST /search
Content-Type: application/json

{
  "query": "machine learning healthcare"
}
```

## 🔧 Configuration

### Environment Variables

Update `wrangler.toml` with your configuration:

```toml
name = "cf-ai-research-paper-finder"
main = "src/index.js"
compatibility_date = "2024-01-01"

[durable_objects.bindings]
name = "ResearchAgent"
class_name = "ResearchAgent"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["ResearchAgent"]

[ai]
binding = "AI"
```

### Customization

- **Search Sources**: Modify `searchResearchPapers()` to add more databases
- **AI Model**: Change the model in `generateSearchTerms()` and `generateResponse()`
- **Sorting Logic**: Adjust `sortPapers()` for different ranking criteria
- **UI Theme**: Customize the CSS in `frontend/index.html`

## 🧪 Testing

### Test Queries

Try these example queries to test the system:

1. **Machine Learning**: "deep learning applications in computer vision"
2. **Healthcare**: "AI-powered drug discovery methods"
3. **Physics**: "quantum entanglement experiments"
4. **Computer Science**: "distributed systems consensus algorithms"

### Expected Behavior

- AI generates 3-5 relevant search terms
- Returns 10-20 papers from multiple sources
- Papers sorted by relevance, citations, and date
- Provides contextual summary of research landscape

## 📊 Performance

- **Response Time**: 2-5 seconds for typical queries
- **Rate Limiting**: Built-in delays to respect API limits
- **Scalability**: Handles multiple concurrent users
- **Caching**: State persistence for improved performance

## 🔒 Security

- Input validation and sanitization
- Rate limiting protection
- Secure API endpoints
- No sensitive data storage

## 🐛 Troubleshooting

### Common Issues

1. **"AI binding not found"**
   - Ensure AI binding is configured in `wrangler.toml`
   - Check Cloudflare account has Workers AI enabled

2. **"No papers found"**
   - Verify internet connectivity
   - Check arXiv API availability
   - Try different search terms

3. **Frontend not loading**
   - Verify Pages deployment
   - Check API endpoint URL in frontend code
   - Ensure CORS headers are set

### Debug Mode

Enable debug logging by adding to your Worker:
```javascript
console.log("Debug info:", { query, searchTerms, papers });
```

## 📈 Future Enhancements

- [ ] Add more academic databases (PubMed, IEEE Xplore)
- [ ] Implement paper recommendation system
- [ ] Add citation network visualization
- [ ] Support for PDF analysis
- [ ] Multi-language support
- [ ] Advanced filtering options

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Cloudflare for the Agents SDK and Workers AI
- arXiv for providing free access to research papers
- The open-source community for inspiration and tools

---

**Built with ❤️ using Cloudflare Workers AI and Agents SDK**
