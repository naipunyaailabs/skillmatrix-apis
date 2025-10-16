/**
 * Test Multiple Match API with Detailed Logging
 * 
 * This script makes an API call and logs all console output to a file
 * Run: bun run testMultipleWithLogs.ts
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const API_URL = 'http://localhost:3001/match-multiple';
const RESUMES_DIR = './resumes';
const JD_DIR = './jd';
const LOG_FILE = './test-multiple-logs.txt';

// Capture console output
const logMessages: string[] = [];
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args: any[]) => {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
  logMessages.push(`[LOG] ${new Date().toISOString()} - ${message}`);
  originalLog(...args);
};

console.error = (...args: any[]) => {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
  logMessages.push(`[ERROR] ${new Date().toISOString()} - ${message}`);
  originalError(...args);
};

console.warn = (...args: any[]) => {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
  logMessages.push(`[WARN] ${new Date().toISOString()} - ${message}`);
  originalWarn(...args);
};

async function testMultipleMatch() {
  console.log('\n=== TESTING MULTIPLE MATCH API WITH LOGGING ===\n');
  
  try {
    // Get all resume files
    const resumeFiles = readdirSync(RESUMES_DIR)
      .filter(f => f.endsWith('.pdf'))
      .map(f => join(RESUMES_DIR, f));
    
    // Get all JD files
    const jdFiles = readdirSync(JD_DIR)
      .filter(f => f.endsWith('.pdf'))
      .map(f => join(JD_DIR, f));
    
    console.log(`Found ${resumeFiles.length} resumes:`);
    resumeFiles.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
    
    console.log(`\nFound ${jdFiles.length} JDs:`);
    jdFiles.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
    
    const totalCombinations = resumeFiles.length * jdFiles.length;
    console.log(`\nTotal combinations: ${totalCombinations} (${resumeFiles.length} × ${jdFiles.length})`);
    
    // Create FormData
    const formData = new FormData();
    
    // Add all resumes
    console.log('\n--- Adding Resumes to FormData ---');
    for (const resumePath of resumeFiles) {
      const buffer = readFileSync(resumePath);
      const fileName = resumePath.split(/[/\\]/).pop() || 'resume.pdf';
      const blob = new Blob([buffer], { type: 'application/pdf' });
      formData.append('resumes', blob, fileName);
      console.log(`✓ Added: ${fileName} (${(buffer.length / 1024).toFixed(1)} KB)`);
    }
    
    // Add all JDs
    console.log('\n--- Adding JDs to FormData ---');
    for (const jdPath of jdFiles) {
      const buffer = readFileSync(jdPath);
      const fileName = jdPath.split(/[/\\]/).pop() || 'jd.pdf';
      const blob = new Blob([buffer], { type: 'application/pdf' });
      formData.append('job_descriptions', blob, fileName);
      console.log(`✓ Added: ${fileName} (${(buffer.length / 1024).toFixed(1)} KB)`);
    }
    
    // Make API request
    console.log('\n--- Calling API ---');
    console.log(`URL: ${API_URL}`);
    console.log('Method: POST');
    console.log(`Timestamp: ${new Date().toISOString()}`);
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
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n❌ API Error (${response.status}):`);
      console.error(errorText);
      return;
    }
    
    // Parse response
    const result = await response.json();
    
    console.log('\n=== API RESPONSE SUMMARY ===\n');
    
    if (result['POST Response']) {
      const matches = result['POST Response'];
      console.log(`Total results returned: ${matches.length}`);
      console.log(`Results filtered out: ${totalCombinations - matches.length}\n`);
      
      // Validation
      let validCount = 0;
      let emptyCount = 0;
      let zeroScoreCount = 0;
      
      const emptyMatches: any[] = [];
      const validMatches: any[] = [];
      
      matches.forEach((match: any, index: number) => {
        const name = match['Resume Data'].name;
        const email = match['Resume Data'].email;
        const skills = match['Resume Data'].skills;
        const score = match.Analysis['Matching Score'];
        const jdTitle = match['Resume Data']['Job Title'];
        
        if (!name && !email && skills.length === 0) {
          emptyCount++;
          emptyMatches.push({
            index,
            jdTitle: jdTitle || 'Unknown',
            score,
            rawData: match
          });
        } else if (score === 0 || !score) {
          zeroScoreCount++;
        } else {
          validCount++;
          validMatches.push({
            index,
            name,
            email,
            jdTitle,
            score,
            skillsCount: skills.length
          });
        }
      });
      
      console.log('=== VALIDATION RESULTS ===\n');
      console.log(`✅ Valid matches: ${validCount}`);
      console.log(`⚠️  Zero score matches: ${zeroScoreCount}`);
      console.log(`❌ Empty data matches: ${emptyCount}\n`);
      
      if (emptyCount > 0) {
        console.log('\n⚠️  EMPTY MATCHES DETAILS:\n');
        emptyMatches.forEach((match, i) => {
          console.log(`Empty Match #${i + 1}:`);
          console.log(`  Result Index: ${match.index}`);
          console.log(`  JD Title: ${match.jdTitle}`);
          console.log(`  Score: ${match.score}%`);
          console.log(`  Raw Data:`);
          console.log(JSON.stringify(match.rawData, null, 2));
          console.log('');
        });
      }
      
      if (validCount > 0) {
        console.log('\n✅ VALID MATCHES:\n');
        validMatches.forEach((match, i) => {
          console.log(`Valid Match #${i + 1}:`);
          console.log(`  Name: ${match.name}`);
          console.log(`  Email: ${match.email}`);
          console.log(`  JD Title: ${match.jdTitle}`);
          console.log(`  Score: ${match.score}%`);
          console.log(`  Skills Count: ${match.skillsCount}`);
          console.log('');
        });
      }
      
      // Save full results
      const outputFile = './test-results-detailed.json';
      writeFileSync(outputFile, JSON.stringify(result, null, 2));
      console.log(`📝 Full results saved to: ${outputFile}`);
      
    } else {
      console.log('Unexpected response format:');
      console.log(JSON.stringify(result, null, 2));
    }
    
    console.log('\n=== TEST COMPLETE ===\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  } finally {
    // Save all logs to file
    const logContent = [
      '='.repeat(80),
      'MULTIPLE MATCH API TEST - COMPLETE LOGS',
      '='.repeat(80),
      `Test Time: ${new Date().toISOString()}`,
      `Log File: ${LOG_FILE}`,
      '='.repeat(80),
      '',
      ...logMessages,
      '',
      '='.repeat(80),
      'END OF LOGS',
      '='.repeat(80)
    ].join('\n');
    
    writeFileSync(LOG_FILE, logContent);
    originalLog(`\n📝 Complete logs saved to: ${LOG_FILE}`);
    originalLog(`\n⚠️  IMPORTANT: Check your server console (where 'bun run dev' is running) for extraction errors!`);
    originalLog(`   Look for messages containing:`);
    originalLog(`   - [ERROR]`);
    originalLog(`   - ⚠️  JD EXTRACTION ERRORS`);
    originalLog(`   - ⚠️  RESUME EXTRACTION ERRORS`);
    originalLog(`   - PDF text extraction failed`);
    originalLog(`   - Stack traces\n`);
  }
}

// Run test
console.log('🚀 Starting Multiple Match API Test with Logging...');
console.log('Make sure server is running on http://localhost:3001\n');

testMultipleMatch().catch(console.error);
