/**
 * Test Multiple Match API
 * 
 * This script tests the /match-multiple endpoint with local files
 * Run: bun run testMultipleMatch.ts
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const API_URL = 'http://localhost:3001/match-multiple';
const RESUMES_DIR = './resumes';
const JD_DIR = './jd';

async function testMultipleMatch() {
  console.log('\n=== TESTING MULTIPLE MATCH API ===\n');
  
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
    
    console.log('\n=== API RESPONSE ===\n');
    
    if (result['POST Response']) {
      const matches = result['POST Response'];
      console.log(`Total results returned: ${matches.length}`);
      console.log(`Results filtered out: ${totalCombinations - matches.length}\n`);
      
      // Group by resume
      const byResume = new Map<string, typeof matches>();
      matches.forEach(match => {
        const name = match['Resume Data'].name || 'Unknown';
        if (!byResume.has(name)) {
          byResume.set(name, []);
        }
        byResume.get(name)!.push(match);
      });
      
      console.log('=== MATCHES BY CANDIDATE ===\n');
      
      byResume.forEach((candidateMatches, name) => {
        console.log(`\n📄 ${name}`);
        console.log(`   Email: ${candidateMatches[0]['Resume Data'].email}`);
        console.log(`   Phone: ${candidateMatches[0]['Resume Data'].mobile_number}`);
        console.log(`   Experience: ${candidateMatches[0]['Resume Data'].experience} years`);
        console.log(`   Skills: ${candidateMatches[0]['Resume Data'].skills.length} found`);
        console.log(`   Matches: ${candidateMatches.length} jobs\n`);
        
        candidateMatches.forEach((match, idx) => {
          const score = match.Analysis['Matching Score'];
          const jdTitle = match['Resume Data']['Job Title'];
          const matchedSkills = match.Analysis['Matched Skills'];
          const unmatchedSkills = match.Analysis['Unmatched Skills'];
          
          console.log(`   ${idx + 1}. ${jdTitle || 'Unknown Position'}`);
          console.log(`      Score: ${score}% ${score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴'}`);
          console.log(`      Matched Skills: ${matchedSkills.length} | Unmatched: ${unmatchedSkills.length}`);
          if (matchedSkills.length > 0) {
            console.log(`      ✓ ${matchedSkills.slice(0, 5).join(', ')}${matchedSkills.length > 5 ? '...' : ''}`);
          }
          if (unmatchedSkills.length > 0 && unmatchedSkills.length <= 5) {
            console.log(`      ✗ ${unmatchedSkills.join(', ')}`);
          }
        });
      });
      
      // Validation
      console.log('\n\n=== VALIDATION ===\n');
      
      let validCount = 0;
      let emptyCount = 0;
      let lowScoreCount = 0;
      
      matches.forEach(match => {
        const name = match['Resume Data'].name;
        const email = match['Resume Data'].email;
        const skills = match['Resume Data'].skills;
        const score = match.Analysis['Matching Score'];
        
        if (!name && !email && skills.length === 0) {
          emptyCount++;
        } else if (score === 0 || !score) {
          lowScoreCount++;
        } else {
          validCount++;
        }
      });
      
      console.log(`✅ Valid matches: ${validCount}`);
      console.log(`⚠️  Zero score matches: ${lowScoreCount}`);
      console.log(`❌ Empty data matches: ${emptyCount}`);
      
      if (emptyCount > 0) {
        console.log('\n⚠️  WARNING: Found matches with empty data!');
        console.log('These indicate extraction failures.');
        console.log('Check server logs for PDF text extraction errors.\n');
      } else {
        console.log('\n✅ All extractions successful!\n');
      }
      
      // Detailed breakdown
      console.log('\n=== SCORE DISTRIBUTION ===\n');
      
      const scoreRanges = {
        'Excellent (80-100)': 0,
        'Good (60-79)': 0,
        'Fair (40-59)': 0,
        'Poor (1-39)': 0,
        'No Match (0)': 0
      };
      
      matches.forEach(match => {
        const score = match.Analysis['Matching Score'];
        if (score >= 80) scoreRanges['Excellent (80-100)']++;
        else if (score >= 60) scoreRanges['Good (60-79)']++;
        else if (score >= 40) scoreRanges['Fair (40-59)']++;
        else if (score > 0) scoreRanges['Poor (1-39)']++;
        else scoreRanges['No Match (0)']++;
      });
      
      Object.entries(scoreRanges).forEach(([range, count]) => {
        if (count > 0) {
          const bar = '█'.repeat(Math.ceil(count / matches.length * 20));
          console.log(`${range.padEnd(20)} ${count.toString().padStart(3)} ${bar}`);
        }
      });
      
      // Save results
      const outputFile = './test-results.json';
      Bun.write(outputFile, JSON.stringify(result, null, 2));
      console.log(`\n📝 Full results saved to: ${outputFile}`);
      
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
  }
}

// Run test
console.log('🚀 Starting Multiple Match API Test...');
console.log('Make sure server is running on http://localhost:3001\n');

testMultipleMatch().catch(console.error);
