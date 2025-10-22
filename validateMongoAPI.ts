/**
 * Quick Validation Script for MongoDB NL Query API
 */

const API_URL = 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(
  testName: string,
  testFn: () => Promise<{ passed: boolean; message: string }>
): Promise<void> {
  const startTime = Date.now();
  try {
    const result = await testFn();
    results.push({
      name: testName,
      passed: result.passed,
      message: result.message,
      duration: Date.now() - startTime
    });
  } catch (error) {
    results.push({
      name: testName,
      passed: false,
      message: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    });
  }
}

// Test 1: GET /mongo-info endpoint
async function testMongoInfo() {
  const response = await fetch(`${API_URL}/mongo-info`);
  const data = await response.json();
  
  if (!data.success) {
    return { passed: false, message: `API returned success: false - ${data.error}` };
  }
  
  if (!data.collections || !Array.isArray(data.collections)) {
    return { passed: false, message: 'No collections array in response' };
  }
  
  if (!data.schemas || typeof data.schemas !== 'object') {
    return { passed: false, message: 'No schemas object in response' };
  }
  
  return { 
    passed: true, 
    message: `✓ Found ${data.totalCollections} collections: ${data.collections.slice(0, 3).join(', ')}...` 
  };
}

// Test 2: POST /query-mongo with dry run
async function testDryRun() {
  const response = await fetch(`${API_URL}/query-mongo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'Find all documents',
      dryRun: true
    })
  });
  
  const data = await response.json();
  
  if (!data.success) {
    return { passed: false, message: `Dry run failed: ${data.error}` };
  }
  
  if (!data.generatedQuery) {
    return { passed: false, message: 'No generatedQuery in response' };
  }
  
  if (!data.generatedQuery.collection || !data.generatedQuery.operation) {
    return { passed: false, message: 'Invalid query structure' };
  }
  
  if (data.dryRun !== true) {
    return { passed: false, message: 'dryRun flag not set correctly' };
  }
  
  return { 
    passed: true, 
    message: `✓ Generated query for collection: ${data.generatedQuery.collection}, operation: ${data.generatedQuery.operation}` 
  };
}

// Test 3: POST /query-mongo with execution
async function testQueryExecution() {
  const response = await fetch(`${API_URL}/query-mongo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'Count total documents',
      maxResults: 5,
      dryRun: false
    })
  });
  
  const data = await response.json();
  
  if (!data.success) {
    return { passed: false, message: `Query execution failed: ${data.error}` };
  }
  
  if (!data.generatedQuery) {
    return { passed: false, message: 'No generatedQuery in response' };
  }
  
  if (data.results === undefined) {
    return { passed: false, message: 'No results in response' };
  }
  
  return { 
    passed: true, 
    message: `✓ Query executed: ${data.generatedQuery.operation} on ${data.generatedQuery.collection}, got ${typeof data.results === 'number' ? data.results : data.resultCount} results` 
  };
}

// Test 4: POST /query-mongo with specific collection
async function testCollectionTarget() {
  // First get available collections
  const infoResponse = await fetch(`${API_URL}/mongo-info`);
  const infoData = await infoResponse.json();
  
  if (!infoData.success || !infoData.collections || infoData.collections.length === 0) {
    return { passed: false, message: 'No collections available for testing' };
  }
  
  const targetCollection = infoData.collections[0];
  
  const response = await fetch(`${API_URL}/query-mongo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'Find first 3 documents',
      collection: targetCollection,
      maxResults: 3,
      dryRun: false
    })
  });
  
  const data = await response.json();
  
  if (!data.success) {
    return { passed: false, message: `Targeted query failed: ${data.error}` };
  }
  
  if (data.generatedQuery.collection !== targetCollection) {
    return { passed: false, message: `Expected collection ${targetCollection}, got ${data.generatedQuery.collection}` };
  }
  
  return { 
    passed: true, 
    message: `✓ Targeted query on ${targetCollection}, returned ${data.resultCount} results` 
  };
}

// Test 5: Error handling - invalid request
async function testErrorHandling() {
  const response = await fetch(`${API_URL}/query-mongo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: '', // Empty query should fail
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    return { passed: false, message: 'Empty query should have failed but succeeded' };
  }
  
  if (response.status !== 400) {
    return { passed: false, message: `Expected status 400, got ${response.status}` };
  }
  
  return { 
    passed: true, 
    message: `✓ Properly rejected invalid request with status ${response.status}` 
  };
}

// Test 6: Response structure validation
async function testResponseStructure() {
  const response = await fetch(`${API_URL}/query-mongo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'Show me 2 documents',
      maxResults: 2,
      dryRun: true
    })
  });
  
  const data = await response.json();
  
  const requiredFields = ['success', 'requestId', 'naturalLanguageQuery', 'generatedQuery', 'dryRun'];
  const missingFields = requiredFields.filter(field => !(field in data));
  
  if (missingFields.length > 0) {
    return { passed: false, message: `Missing required fields: ${missingFields.join(', ')}` };
  }
  
  const requiredQueryFields = ['collection', 'operation', 'query', 'explanation'];
  const missingQueryFields = requiredQueryFields.filter(field => !(field in data.generatedQuery));
  
  if (missingQueryFields.length > 0) {
    return { passed: false, message: `Missing query fields: ${missingQueryFields.join(', ')}` };
  }
  
  return { 
    passed: true, 
    message: `✓ Response structure valid with all required fields` 
  };
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting MongoDB NL Query API Validation\n');
  console.log('='.repeat(70) + '\n');
  
  await runTest('1. Database Info Endpoint', testMongoInfo);
  await runTest('2. Query Generation (Dry Run)', testDryRun);
  await runTest('3. Query Execution', testQueryExecution);
  await runTest('4. Collection Targeting', testCollectionTarget);
  await runTest('5. Error Handling', testErrorHandling);
  await runTest('6. Response Structure', testResponseStructure);
  
  console.log('\n' + '='.repeat(70) + '\n');
  console.log('📊 TEST RESULTS:\n');
  
  let passed = 0;
  let failed = 0;
  
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    const status = result.passed ? 'PASS' : 'FAIL';
    console.log(`${icon} Test ${index + 1}: ${result.name}`);
    console.log(`   Status: ${status} (${result.duration}ms)`);
    console.log(`   ${result.message}\n`);
    
    if (result.passed) passed++;
    else failed++;
  });
  
  console.log('='.repeat(70));
  console.log(`\n📈 Summary: ${passed}/${results.length} tests passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! MongoDB NL Query API is working correctly.\n');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Please review the errors above.\n`);
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('\n❌ Fatal test error:', error);
  process.exit(1);
});
