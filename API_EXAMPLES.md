# API Usage Examples

## Direct API Testing

### Using curl

#### Chat Endpoint
```bash
curl -X POST https://your-worker-url.workers.dev/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning in healthcare",
    "sessionId": "test_session_123"
  }'
```

#### Search Endpoint
```bash
curl -X POST https://your-worker-url.workers.dev/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "quantum computing applications"
  }'
```

### Using JavaScript/Node.js

```javascript
const API_BASE_URL = 'https://your-worker-url.workers.dev';

async function searchPapers(query) {
  try {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Search terms:', data.searchTerms);
    console.log('Papers found:', data.papers.length);
    
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example usage
searchPapers('artificial intelligence ethics')
  .then(result => {
    result.papers.forEach((paper, index) => {
      console.log(`${index + 1}. ${paper.title} (${paper.citations} citations)`);
    });
  });
```

### Using Python

```python
import requests
import json

API_BASE_URL = 'https://your-worker-url.workers.dev'

def search_papers(query):
    try:
        response = requests.post(
            f'{API_BASE_URL}/search',
            headers={'Content-Type': 'application/json'},
            json={'query': query}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"Search terms: {', '.join(data['searchTerms'])}")
            print(f"Papers found: {len(data['papers'])}")
            return data
        else:
            print(f"Error: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"Error: {e}")
        return None

# Example usage
result = search_papers('blockchain technology')
if result:
    for i, paper in enumerate(result['papers'], 1):
        print(f"{i}. {paper['title']} ({paper['citations']} citations)")
```

## Expected Response Format

```json
{
  "response": "AI-generated summary of the research landscape...",
  "papers": [
    {
      "title": "Paper Title",
      "abstract": "Paper abstract...",
      "authors": ["Author 1", "Author 2"],
      "publishedDate": "2024-01-15",
      "url": "https://arxiv.org/abs/2401.12345",
      "source": "arXiv",
      "citations": 45,
      "relevanceScore": 0.92
    }
  ],
  "searchTerms": ["term1", "term2", "term3"]
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `405`: Method not allowed (use POST)
- `500`: Internal server error

Error responses include:
```json
{
  "error": "Error message description"
}
```
