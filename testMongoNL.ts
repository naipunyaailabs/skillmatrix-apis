/**
 * Test MongoDB Natural Language Query API
 * Run: bun run testMongoNL.ts
 */

const MONGO_API_URL = 'http://localhost:3001';

async function testMongoNLQuery() {
  console.log('\n=== TESTING MONGODB NATURAL LANGUAGE QUERY API ===\n');
  
  try {
    // Test 1: Get Database Info
    console.log('📊 Test 1: Get Database Information\n');
    const infoResponse = await fetch(`${MONGO_API_URL}/mongo-info`);
    const info = await infoResponse.json();
    
    if (info.success) {
      console.log('✅ Database info retrieved successfully');
      console.log(`Collections found: ${info.totalCollections}`);
      console.log(`Available collections: ${info.collections.join(', ')}`);
      console.log('\nSample schemas:');
      for (const [collection, samples] of Object.entries(info.schemas)) {
        console.log(`\n  ${collection}:`);
        if (Array.isArray(samples) && samples.length > 0) {
          console.log(`    ${JSON.stringify(samples[0], null, 2).split('\n').join('\n    ')}`);
        } else {
          console.log('    (empty collection)');
        }
      }
    } else {
      console.log('❌ Failed to get database info');
      console.log(`Error: ${info.error}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 2: Dry Run Query
    console.log('🔍 Test 2: Dry Run - Preview Query Generation\n');
    const dryRunResponse = await fetch(`${MONGO_API_URL}/query-mongo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Find all candidates with Python skills',
        dryRun: true
      })
    });
    
    const dryRunResult = await dryRunResponse.json();
    
    if (dryRunResult.success) {
      console.log('✅ Query generated successfully (not executed)');
      console.log(`Natural Language: "${dryRunResult.naturalLanguageQuery}"`);
      console.log('\nGenerated Query:');
      console.log(`  Collection: ${dryRunResult.generatedQuery.collection}`);
      console.log(`  Operation: ${dryRunResult.generatedQuery.operation}`);
      console.log(`  Query: ${JSON.stringify(dryRunResult.generatedQuery.query, null, 2)}`);
      console.log(`  Explanation: ${dryRunResult.generatedQuery.explanation}`);
    } else {
      console.log('❌ Query generation failed');
      console.log(`Error: ${dryRunResult.error}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 3: Execute Simple Query
    console.log('🚀 Test 3: Execute Query\n');
    const queryResponse = await fetch(`${MONGO_API_URL}/query-mongo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Find all documents in the first available collection',
        maxResults: 5
      })
    });
    
    const queryResult = await queryResponse.json();
    
    if (queryResult.success) {
      console.log('✅ Query executed successfully');
      console.log(`Natural Language: "${queryResult.naturalLanguageQuery}"`);
      console.log(`\nGenerated Query:`);
      console.log(`  Collection: ${queryResult.generatedQuery.collection}`);
      console.log(`  Operation: ${queryResult.generatedQuery.operation}`);
      console.log(`  Explanation: ${queryResult.generatedQuery.explanation}`);
      console.log(`\nResults: ${queryResult.resultCount} documents found`);
      
      if (queryResult.results && queryResult.results.length > 0) {
        console.log('\nFirst result:');
        console.log(JSON.stringify(queryResult.results[0], null, 2));
      }
    } else {
      console.log('❌ Query execution failed');
      console.log(`Error: ${queryResult.error}`);
      if (queryResult.generatedQuery) {
        console.log('\nAttempted Query:');
        console.log(JSON.stringify(queryResult.generatedQuery, null, 2));
      }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 4: Count Query
    console.log('🔢 Test 4: Count Query\n');
    const countResponse = await fetch(`${MONGO_API_URL}/query-mongo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'How many total documents are there?',
        dryRun: false
      })
    });
    
    const countResult = await countResponse.json();
    
    if (countResult.success) {
      console.log('✅ Count query executed');
      console.log(`Collection: ${countResult.generatedQuery.collection}`);
      console.log(`Operation: ${countResult.generatedQuery.operation}`);
      console.log(`Result: ${JSON.stringify(countResult.results)}`);
    } else {
      console.log('❌ Count query failed');
      console.log(`Error: ${countResult.error}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test Summary
    console.log('=== TEST SUMMARY ===\n');
    console.log('All tests completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Check results above');
    console.log('2. Try your own natural language queries');
    console.log('3. Use dry run to preview generated queries');
    console.log('4. Integrate into your application\n');
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    console.log('\n⚠️  Make sure:');
    console.log('1. Server is running (bun run dev)');
    console.log('2. MongoDB is connected');
    console.log('3. Database has at least one collection');
  }
}

console.log('🚀 Starting MongoDB Natural Language Query API Tests...');
console.log('Make sure server is running on http://localhost:3001');
console.log('Make sure MongoDB is configured in .env\n');

testMongoNLQuery().catch(console.error);
