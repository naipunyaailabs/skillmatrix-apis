/**
 * Test Multiple Match API with URLs
 * 
 * This script tests the /match-multiple endpoint using file URLs instead of file uploads
 * Run: bun run testMultipleWithUrls.ts
 */

const API_URL = 'http://localhost:3001/match-multiple';

// Example URLs - Replace these with your actual file URLs
const TEST_DATA = {
  job_description_urls: [
    'https://example.com/jds/ai_ml_intern.pdf',
    'https://example.com/jds/frontend_developer.pdf',
    'https://example.com/jds/mern_stack_intern.pdf'
  ],
  resume_urls: [
    'https://example.com/resumes/jaswanth.pdf',
    'https://example.com/resumes/sharief.pdf',
    'https://example.com/resumes/sunny_kumar.pdf',
    'https://example.com/resumes/swapnaja.pdf'
  ]
};

async function testMultipleMatchWithUrls() {
  console.log('\n=== TESTING MULTIPLE MATCH API WITH URLS ===\n');
  
  try {
    console.log('📋 Job Description URLs:', TEST_DATA.job_description_urls.length);
    TEST_DATA.job_description_urls.forEach((url, i) => {
      console.log(`  ${i + 1}. ${url}`);
    });
    
    console.log('\n📄 Resume URLs:', TEST_DATA.resume_urls.length);
    TEST_DATA.resume_urls.forEach((url, i) => {
      console.log(`  ${i + 1}. ${url}`);
    });
    
    const totalCombinations = TEST_DATA.job_description_urls.length * TEST_DATA.resume_urls.length;
    console.log(`\n📊 Total combinations: ${totalCombinations}\n`);
    
    // Make API request
    console.log('🚀 Calling API...');
    console.log(`URL: ${API_URL}`);
    console.log(`Method: POST`);
    console.log(`Content-Type: application/json\n`);
    
    const startTime = Date.now();
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_DATA)
    });
    const endTime = Date.now();
    
    console.log(`\n✅ Response received`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Time taken: ${((endTime - startTime) / 1000).toFixed(2)} seconds\n`);
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error Response:');
      console.error(JSON.stringify(result, null, 2));
      return;
    }
    
    // Display results
    const matches = result['POST Response'] || [];
    console.log('=== RESULTS ===\n');
    console.log(`Total matches: ${matches.length}\n`);
    
    if (matches.length > 0) {
      // Group by candidate
      const byCand = new Map<string, any[]>();
      matches.forEach((match: any) => {
        const name = match['Resume Data'].name || 'Unknown';
        if (!byCand.has(name)) {
          byCand.set(name, []);
        }
        byCand.get(name)!.push(match);
      });
      
      byCand.forEach((candidateMatches, name) => {
        console.log(`\n👤 ${name}`);
        console.log(`   Email: ${candidateMatches[0]['Resume Data'].email}`);
        console.log(`   Phone: ${candidateMatches[0]['Resume Data'].mobile_number}`);
        console.log(`   Matches: ${candidateMatches.length}\n`);
        
        candidateMatches.forEach((match, idx) => {
          const score = match.Analysis['Matching Score'];
          const jdTitle = match['Resume Data']['Job Title'];
          
          console.log(`   ${idx + 1}. ${jdTitle || 'Unknown Position'}`);
          console.log(`      Score: ${score}% ${score >= 80 ? '🟢' : score >= 60 ? '🟡' : score >= 40 ? '🟠' : '🔴'}`);
          console.log(`      Matched Skills: ${match.Analysis['Matched Skills'].length}`);
          console.log(`      Missing Skills: ${match.Analysis['Unmatched Skills'].length}`);
        });
      });
    } else {
      console.log('⚠️  No matches found');
    }
    
    // Save results
    const outputFile = './test-url-results.json';
    await Bun.write(outputFile, JSON.stringify(result, null, 2));
    console.log(`\n\n📝 Full results saved to: ${outputFile}`);
    
    console.log('\n=== TEST COMPLETE ===\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

console.log('🚀 Starting URL-based Multiple Match API Test...');
console.log('Make sure server is running on http://localhost:3001\n');
console.log('⚠️  IMPORTANT: Update the TEST_DATA object with your actual file URLs before running!\n');

testMultipleMatchWithUrls().catch(console.error);
