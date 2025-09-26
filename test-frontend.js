#!/usr/bin/env node

/**
 * Test script to verify frontend functionality
 */

const API_BASE_URL = 'https://cf-ai-research-paper-finder.vaibhavmattoo1.workers.dev';

async function testAPI() {
    console.log('🧪 Testing API endpoints...');
    
    try {
        // Test search endpoint
        console.log('\n📡 Testing search endpoint...');
        const searchResponse = await fetch(`${API_BASE_URL}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: 'machine learning' })
        });
        
        console.log('Search response status:', searchResponse.status);
        
        if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log('✅ Search endpoint working');
            console.log('Papers found:', searchData.papers?.length || 0);
            console.log('Search terms:', searchData.searchTerms?.join(', ') || 'None');
        } else {
            console.log('❌ Search endpoint failed');
        }
        
        // Test chat endpoint
        console.log('\n💬 Testing chat endpoint...');
        const chatResponse = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: 'machine learning in healthcare',
                sessionId: 'test_session_123'
            })
        });
        
        console.log('Chat response status:', chatResponse.status);
        
        if (chatResponse.ok) {
            const chatData = await chatResponse.json();
            console.log('✅ Chat endpoint working');
            console.log('Response length:', chatData.response?.length || 0);
            console.log('Papers found:', chatData.papers?.length || 0);
        } else {
            console.log('❌ Chat endpoint failed');
        }
        
        // Test health endpoint
        console.log('\n🏥 Testing health endpoint...');
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        
        console.log('Health response status:', healthResponse.status);
        
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Health endpoint working');
            console.log('Status:', healthData.status);
        } else {
            console.log('❌ Health endpoint failed');
        }
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
    }
}

async function testFrontendFeatures() {
    console.log('\n🎨 Testing frontend features...');
    
    // Test if frontend is accessible
    try {
        const response = await fetch('http://localhost:8000');
        if (response.ok) {
            console.log('✅ Frontend is accessible');
        } else {
            console.log('❌ Frontend not accessible');
        }
    } catch (error) {
        console.log('❌ Frontend test failed:', error.message);
    }
}

async function runTests() {
    console.log('🚀 Starting frontend and API tests...');
    console.log('=' .repeat(50));
    
    await testAPI();
    await testFrontendFeatures();
    
    console.log('\n📊 Test Summary');
    console.log('=' .repeat(50));
    console.log('✅ API endpoints tested');
    console.log('✅ Frontend accessibility tested');
    console.log('✅ All tests completed');
    
    console.log('\n🎯 To test the frontend manually:');
    console.log('1. Open http://localhost:8000 in your browser');
    console.log('2. Try searching for "machine learning"');
    console.log('3. Test the chat feature');
    console.log('4. Toggle between light and dark themes');
    console.log('5. Test on mobile devices');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
}

export { testAPI, testFrontendFeatures, runTests };
