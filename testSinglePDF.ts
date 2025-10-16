/**
 * Test Single PDF Extraction
 * 
 * This script tests extraction of a single PDF to see detailed error logs
 * Run: bun run testSinglePDF.ts
 */

import { readFileSync } from 'fs';

const API_URL = 'http://localhost:3001/extract-resume';
const TEST_FILE = './resumes/Jaswanth_4+ UIpath.pdf';

async function testSingleExtraction() {
  console.log('\n=== TESTING SINGLE PDF EXTRACTION ===\n');
  
  try {
    console.log(`File: ${TEST_FILE}`);
    
    // Read file
    const buffer = readFileSync(TEST_FILE);
    console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);
    
    // Create FormData
    const formData = new FormData();
    const fileName = TEST_FILE.split(/[/\\]/).pop() || 'resume.pdf';
    const blob = new Blob([buffer], { type: 'application/pdf' });
    formData.append('resume', blob, fileName);
    
    console.log('\n--- Calling API ---');
    console.log(`URL: ${API_URL}`);
    console.log('Starting request...\n');
    
    const startTime = Date.now();
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData
    });
    const endTime = Date.now();
    
    console.log(`\n--- Response Received ---`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Time taken: ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n❌ API Error (${response.status}):`);
      console.error(errorText);
      return;
    }
    
    // Parse response
    const result = await response.json();
    
    console.log('\n=== EXTRACTION RESULT ===\n');
    console.log(JSON.stringify(result, null, 2));
    
    // Check if empty
    if (result.name || result.email || (result.skills && result.skills.length > 0)) {
      console.log('\n✅ Extraction successful!');
    } else {
      console.log('\n❌ Extraction returned EMPTY data!');
      console.log('⚠️  Check server console for error logs');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
  
  console.log('\n=== TEST COMPLETE ===\n');
}

// Run test
console.log('🚀 Starting Single PDF Extraction Test...');
console.log('Make sure server is running on http://localhost:3001\n');

testSingleExtraction().catch(console.error);
