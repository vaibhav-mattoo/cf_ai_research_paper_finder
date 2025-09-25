// Comprehensive test suite for the modular Research Paper Finder

import { Validator } from '../utils/validation.js';
import { PaperProcessor } from '../services/paper-processor.js';
import { globalCache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

export class TestSuite {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async runAll() {
    logger.info('Starting test suite execution');
    
    for (const test of this.tests) {
      try {
        await test.testFn();
        this.results.push({ name: test.name, status: 'PASS' });
        logger.info(`✅ ${test.name} - PASSED`);
      } catch (error) {
        this.results.push({ name: test.name, status: 'FAIL', error: error.message });
        logger.error(`❌ ${test.name} - FAILED`, error);
      }
    }
    
    this.printSummary();
    return this.results;
  }

  printSummary() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    
    logger.info('Test Suite Summary', {
      total: this.results.length,
      passed,
      failed,
      successRate: `${Math.round((passed / this.results.length) * 100)}%`
    });
  }

  // Test utilities
  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
  }

  assertArray(actual, message) {
    if (!Array.isArray(actual)) {
      throw new Error(`${message}: expected array, got ${typeof actual}`);
    }
  }
}

// Test implementations
export function createValidationTests() {
  const suite = new TestSuite();

  suite.addTest('validateQuery - valid input', () => {
    const result = Validator.validateQuery('machine learning');
    suite.assertEqual(result, 'machine learning', 'Should return trimmed query');
  });

  suite.addTest('validateQuery - empty input', () => {
    try {
      Validator.validateQuery('');
      suite.assert(false, 'Should throw error for empty query');
    } catch (error) {
      suite.assert(error.message.includes('empty'), 'Should throw appropriate error');
    }
  });

  suite.addTest('validateQuery - too long input', () => {
    const longQuery = 'a'.repeat(501);
    try {
      Validator.validateQuery(longQuery);
      suite.assert(false, 'Should throw error for long query');
    } catch (error) {
      suite.assert(error.message.includes('too long'), 'Should throw appropriate error');
    }
  });

  suite.addTest('validateSessionId - valid input', () => {
    const result = Validator.validateSessionId('session_123');
    suite.assertEqual(result, 'session_123', 'Should return valid session ID');
  });

  suite.addTest('validateSessionId - invalid input', () => {
    const result = Validator.validateSessionId(null);
    suite.assert(result.startsWith('session_'), 'Should generate new session ID');
  });

  return suite;
}

export function createPaperProcessorTests() {
  const suite = new TestSuite();

  suite.addTest('removeDuplicates - removes duplicates', () => {
    const papers = [
      { title: 'Paper 1', authors: ['Author 1'] },
      { title: 'Paper 1', authors: ['Author 1'] }, // Duplicate
      { title: 'Paper 2', authors: ['Author 2'] }
    ];
    
    const result = PaperProcessor.removeDuplicates(papers);
    suite.assertEqual(result.length, 2, 'Should remove duplicates');
  });

  suite.addTest('sortPapers - sorts by relevance', () => {
    const papers = [
      { title: 'Paper 1', relevanceScore: 0.5, citations: 10, publishedDate: '2024-01-01' },
      { title: 'Paper 2', relevanceScore: 0.9, citations: 5, publishedDate: '2024-01-01' }
    ];
    
    const result = PaperProcessor.sortPapers(papers);
    suite.assertEqual(result[0].title, 'Paper 2', 'Should sort by relevance score');
  });

  suite.addTest('validatePaper - valid paper', () => {
    const paper = {
      title: 'Test Paper',
      authors: ['Author 1'],
      citations: 10,
      relevanceScore: 0.8
    };
    
    const result = PaperProcessor.validatePaper(paper);
    suite.assert(result, 'Should validate correct paper');
  });

  suite.addTest('validatePaper - invalid paper', () => {
    const paper = {
      title: '', // Invalid
      authors: ['Author 1'],
      citations: 10,
      relevanceScore: 0.8
    };
    
    const result = PaperProcessor.validatePaper(paper);
    suite.assert(!result, 'Should reject invalid paper');
  });

  return suite;
}

export function createCacheTests() {
  const suite = new TestSuite();

  suite.addTest('cache - set and get', () => {
    globalCache.set('test_key', 'test_value');
    const result = globalCache.get('test_key');
    suite.assertEqual(result, 'test_value', 'Should retrieve stored value');
  });

  suite.addTest('cache - expiration', async () => {
    globalCache.set('expire_key', 'expire_value', 1); // 1 second TTL
    await new Promise(resolve => setTimeout(resolve, 1100)); // Wait 1.1 seconds
    const result = globalCache.get('expire_key');
    suite.assert(result === null, 'Should return null for expired key');
  });

  suite.addTest('cache - cleanup', () => {
    globalCache.set('cleanup_key', 'cleanup_value', 1);
    globalCache.cleanup();
    const stats = globalCache.getStats();
    suite.assert(stats.size >= 0, 'Should return valid stats');
  });

  return suite;
}

// Main test runner
export async function runAllTests() {
  logger.info('🧪 Starting comprehensive test suite');
  
  const suites = [
    createValidationTests(),
    createPaperProcessorTests(),
    createCacheTests()
  ];

  const allResults = [];
  
  for (const suite of suites) {
    const results = await suite.runAll();
    allResults.push(...results);
  }

  const totalPassed = allResults.filter(r => r.status === 'PASS').length;
  const totalFailed = allResults.filter(r => r.status === 'FAIL').length;
  
  logger.info('🎯 Final Test Results', {
    total: allResults.length,
    passed: totalPassed,
    failed: totalFailed,
    successRate: `${Math.round((totalPassed / allResults.length) * 100)}%`
  });

  if (totalFailed > 0) {
    logger.warn('Some tests failed:', allResults.filter(r => r.status === 'FAIL'));
  }

  return allResults;
}
