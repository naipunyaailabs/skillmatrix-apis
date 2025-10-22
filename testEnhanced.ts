/**
 * Test Enhanced MongoDB Service
 */

const ENHANCED_API_URL = 'http://localhost:3001';

async function testEnhancedService() {
  console.log('\n🚀 Testing Enhanced MongoDB Service\n');
  console.log('='.repeat(70));
  
  // Test 1: Metadata query
  console.log('\n✅ Test 1: Metadata Query');
  console.log('Query: "how many collections are there in database"\n');
  
  try {
    const response1 = await fetch(`${ENHANCED_API_URL}/query-mongo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'how many collections are there in database'
      })
    });
    
    const data1 = await response1.json();
    console.log('Response:', JSON.stringify(data1, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log('\n' + '='.repeat(70));
  
  // Test 2: Simple find query
  console.log('\n✅ Test 2: Simple Find Query');
  console.log('Query: "show me 3 users"\n');
  
  try {
    const response2 = await fetch(`${ENHANCED_API_URL}/query-mongo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'show me 3 users',
        maxResults: 3
      })
    });
    
    const data2 = await response2.json();
    console.log('Success:', data2.success);
    console.log('Collection:', data2.generatedQuery?.collection);
    console.log('Operation:', data2.generatedQuery?.operation);
    console.log('Result Count:', data2.resultCount);
    console.log('Execution Time:', data2.executionTime + 'ms');
  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log('\n' + '='.repeat(70));
  
  // Test 3: Count query
  console.log('\n✅ Test 3: Count Query');
  console.log('Query: "count how many users exist"\n');
  
  try {
    const response3 = await fetch(`${ENHANCED_API_URL}/query-mongo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'count how many users exist'
      })
    });
    
    const data3 = await response3.json();
    console.log('Success:', data3.success);
    console.log('Collection:', data3.generatedQuery?.collection);
    console.log('Operation:', data3.generatedQuery?.operation);
    console.log('Result:', data3.results);
    console.log('Execution Time:', data3.executionTime + 'ms');
  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log('\n' + '='.repeat(70));
  
  // Test 4: Database info
  console.log('\n✅ Test 4: Database Info Endpoint\n');
  
  try {
    const response4 = await fetch(`${ENHANCED_API_URL}/mongo-info`);
    const data4 = await response4.json();
    console.log('Total Collections:', data4.totalCollections);
    console.log('Collections:', data4.collections.slice(0, 5).join(', '), '...');
    console.log('Total Documents:', data4.statistics?.totalDocuments);
  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n✅ All tests completed!\n');
}

testEnhancedService().catch(console.error);
