#!/usr/bin/env node

/**
 * Test script to verify real paper data
 */

const API_BASE_URL = 'https://cf-ai-research-paper-finder.vaibhavmattoo1.workers.dev';

async function testRealPapers() {
    console.log('🔬 Testing for real academic papers...');
    console.log('=' .repeat(50));
    
    try {
        // Test search endpoint
        console.log('\n📡 Testing search with "machine learning"...');
        const searchResponse = await fetch(`${API_BASE_URL}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: 'machine learning' })
        });
        
        if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log('✅ Search successful');
            console.log(`📚 Papers found: ${searchData.papers?.length || 0}`);
            
            if (searchData.papers && searchData.papers.length > 0) {
                console.log('\n📄 Sample papers:');
                searchData.papers.slice(0, 3).forEach((paper, index) => {
                    console.log(`\n${index + 1}. ${paper.title}`);
                    console.log(`   Authors: ${paper.authors.join(', ')}`);
                    console.log(`   Source: ${paper.source}`);
                    console.log(`   URL: ${paper.url}`);
                    console.log(`   Citations: ${paper.citations}`);
                    console.log(`   Published: ${paper.publishedDate}`);
                    
                    // Check if it's a real paper or mock data
                    if (paper.authors.includes('Dr. Jane Smith') || paper.authors.includes('Prof. John Doe')) {
                        console.log('   ⚠️  WARNING: This appears to be mock data');
                    } else if (paper.url.includes('arxiv.org') || paper.url.includes('pubmed') || paper.url.includes('doi.org')) {
                        console.log('   ✅ This appears to be a real academic paper');
                    } else {
                        console.log('   ❓ Unknown data source');
                    }
                });
            }
        } else {
            console.log('❌ Search failed');
        }
        
        // Test chat endpoint
        console.log('\n💬 Testing chat with "deep learning"...');
        const chatResponse = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: 'deep learning',
                sessionId: 'test_session_123'
            })
        });
        
        if (chatResponse.ok) {
            const chatData = await chatResponse.json();
            console.log('✅ Chat successful');
            console.log(`📚 Papers found: ${chatData.papers?.length || 0}`);
            
            if (chatData.papers && chatData.papers.length > 0) {
                console.log('\n📄 Sample chat papers:');
                chatData.papers.slice(0, 2).forEach((paper, index) => {
                    console.log(`\n${index + 1}. ${paper.title}`);
                    console.log(`   Authors: ${paper.authors.join(', ')}`);
                    console.log(`   Source: ${paper.source}`);
                    console.log(`   URL: ${paper.url}`);
                    
                    // Check if it's a real paper or mock data
                    if (paper.authors.includes('Dr. Jane Smith') || paper.authors.includes('Prof. John Doe')) {
                        console.log('   ⚠️  WARNING: This appears to be mock data');
                    } else if (paper.url.includes('arxiv.org') || paper.url.includes('pubmed') || paper.url.includes('doi.org')) {
                        console.log('   ✅ This appears to be a real academic paper');
                    } else {
                        console.log('   ❓ Unknown data source');
                    }
                });
            }
        } else {
            console.log('❌ Chat failed');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

async function testSpecificAPIs() {
    console.log('\n🔍 Testing specific academic APIs...');
    console.log('=' .repeat(50));
    
    // Test arXiv directly
    try {
        console.log('\n📚 Testing arXiv API...');
        const arxivResponse = await fetch('http://export.arxiv.org/api/query?search_query=all:machine%20learning&start=0&max_results=3');
        if (arxivResponse.ok) {
            const arxivText = await arxivResponse.text();
            const entries = arxivText.match(/<entry>[\s\S]*?<\/entry>/g) || [];
            console.log(`✅ arXiv API working: ${entries.length} papers found`);
            
            if (entries.length > 0) {
                const firstEntry = entries[0];
                const titleMatch = firstEntry.match(/<title>([^<]+)<\/title>/);
                const authorsMatch = firstEntry.match(/<author><name>([^<]+)<\/name><\/author>/g);
                
                if (titleMatch) {
                    console.log(`   Sample title: ${titleMatch[1]}`);
                    if (authorsMatch) {
                        const authors = authorsMatch.map(a => a.match(/<name>([^<]+)<\/name>/)[1]);
                        console.log(`   Authors: ${authors.join(', ')}`);
                    }
                }
            }
        } else {
            console.log('❌ arXiv API failed');
        }
    } catch (error) {
        console.log('❌ arXiv API error:', error.message);
    }
    
    // Test Semantic Scholar
    try {
        console.log('\n🧠 Testing Semantic Scholar API...');
        const semanticResponse = await fetch('https://api.semanticscholar.org/graph/v1/paper/search?query=machine%20learning&limit=3&fields=title,authors,url');
        if (semanticResponse.ok) {
            const semanticData = await semanticResponse.json();
            console.log(`✅ Semantic Scholar API working: ${semanticData.papers?.length || 0} papers found`);
            
            if (semanticData.papers && semanticData.papers.length > 0) {
                const firstPaper = semanticData.papers[0];
                console.log(`   Sample title: ${firstPaper.title}`);
                if (firstPaper.authors) {
                    const authors = firstPaper.authors.map(a => a.name);
                    console.log(`   Authors: ${authors.join(', ')}`);
                }
                console.log(`   URL: ${firstPaper.url}`);
            }
        } else {
            console.log('❌ Semantic Scholar API failed');
        }
    } catch (error) {
        console.log('❌ Semantic Scholar API error:', error.message);
    }
}

async function runTests() {
    console.log('🚀 Starting real paper verification tests...');
    console.log('=' .repeat(60));
    
    await testRealPapers();
    await testSpecificAPIs();
    
    console.log('\n📊 Test Summary');
    console.log('=' .repeat(50));
    console.log('✅ API endpoints tested');
    console.log('✅ Real paper verification completed');
    console.log('✅ Academic database integration tested');
    
    console.log('\n🎯 Recommendations:');
    console.log('1. Check if papers have real academic URLs');
    console.log('2. Verify authors are real researchers');
    console.log('3. Ensure abstracts are from actual papers');
    console.log('4. Test paper links in browser');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
}

export { testRealPapers, testSpecificAPIs, runTests };
