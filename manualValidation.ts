/**
 * Manual Validation - Real-world Query Examples
 */

const MANUAL_TEST_API_URL = 'http://localhost:3001';

async function testRealWorldQuery(queryText: string, description: string) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📝 ${description}`);
  console.log(`Query: "${queryText}"\n`);
  
  try {
    const response = await fetch(`${MANUAL_TEST_API_URL}/query-mongo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: queryText,
        maxResults: 5,
        dryRun: false
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Success!`);
      console.log(`\nGenerated MongoDB Query:`);
      console.log(`  Collection: ${data.generatedQuery.collection}`);
      console.log(`  Operation: ${data.generatedQuery.operation}`);
      console.log(`  Query: ${JSON.stringify(data.generatedQuery.query, null, 2)}`);
      console.log(`  Explanation: ${data.generatedQuery.explanation}`);
      console.log(`\nResults: ${data.resultCount} documents found`);
      
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        console.log(`\nFirst Result Preview:`);
        const preview = data.results[0];
        const keys = Object.keys(preview).slice(0, 5);
        keys.forEach(key => {
          const value = preview[key];
          const displayValue = typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : String(value).substring(0, 50);
          console.log(`  ${key}: ${displayValue}`);
        });
      } else if (typeof data.results === 'number') {
        console.log(`\nCount Result: ${data.results}`);
      }
    } else {
      console.log(`❌ Failed: ${data.error}`);
      if (data.generatedQuery) {
        console.log(`\nAttempted Query:`);
        console.log(JSON.stringify(data.generatedQuery, null, 2));
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function runManualValidation() {
  console.log('\n🔍 MongoDB NL Query API - Real-world Query Validation\n');
  
  // Get available collections first
  console.log('Getting database information...');
  const infoResponse = await fetch(`${MANUAL_TEST_API_URL}/mongo-info`);
  const infoData = await infoResponse.json();
  
  if (infoData.success) {
    console.log(`\n📚 Available Collections (${infoData.totalCollections}):`);
    infoData.collections.forEach((col: string, idx: number) => {
      console.log(`  ${idx + 1}. ${col}`);
    });
  }
  
  // Test various natural language queries
  await testRealWorldQuery(
    'Show me all users',
    'Simple Find Query'
  );
  
  await testRealWorldQuery(
    'How many users are in the database?',
    'Count Query'
  );
  
  await testRealWorldQuery(
    'Find recent applications',
    'Time-based Query'
  );
  
  await testRealWorldQuery(
    'Get all scheduled tests that are active',
    'Filtered Query'
  );
  
  await testRealWorldQuery(
    'List distinct user roles',
    'Distinct Query'
  );
  
  console.log(`\n${'='.repeat(70)}`);
  console.log('\n✅ Manual validation complete!\n');
}

runManualValidation().catch(console.error);
