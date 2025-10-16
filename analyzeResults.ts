/**
 * Analyze Test Results to Identify Failed Combinations
 * 
 * Run: bun run analyzeResults.ts
 */

import { readFileSync } from 'fs';

const RESULTS_FILE = './test-results-detailed.json';

try {
  const data = JSON.parse(readFileSync(RESULTS_FILE, 'utf-8'));
  const matches = data['POST Response'];
  
  console.log('\n=== ANALYZING TEST RESULTS ===\n');
  console.log(`Total results: ${matches.length}\n`);
  
  // Categorize results
  const valid: any[] = [];
  const empty: any[] = [];
  
  matches.forEach((match: any, index: number) => {
    const name = match['Resume Data'].name;
    const email = match['Resume Data'].email;
    const skills = match['Resume Data'].skills || [];
    const jdTitle = match['Resume Data']['Job Title'];
    const score = match.Analysis['Matching Score'];
    
    if (!name && !email && skills.length === 0) {
      empty.push({ index, jdTitle, score, match });
    } else {
      valid.push({ index, name, email, jdTitle, score, skillsCount: skills.length });
    }
  });
  
  console.log(`✅ Valid: ${valid.length}`);
  console.log(`❌ Empty: ${empty.length}\n`);
  
  // Analyze empty results to find pattern
  console.log('=== EMPTY RESULTS ANALYSIS ===\n');
  
  // Expected files
  const resumes = [
    'Jaswanth_4+ UIpath.pdf',
    'ShariefResume_updated.pdf',
    'Sunny Kumar_Data Engineer_4_years_Resume.pdf',
    'SWAPNAJA_DATA ENGINEER_Resume.pdf'
  ];
  
  const jds = [
    'AI_ML_Intern_Job_Description.pdf',
    'Frontend_Developer_Job_Description.pdf',
    'MERN_Stack_Intern_Job_Description.pdf'
  ];
  
  console.log('Expected: 12 combinations (4 resumes × 3 JDs)\n');
  
  // Map indices to combinations
  const emptyIndices = empty.map(e => e.index);
  const validIndices = valid.map(v => v.index);
  
  console.log(`Empty result indices: [${emptyIndices.join(', ')}]`);
  console.log(`Valid result indices: [${validIndices.join(', ')}]\n`);
  
  // Try to identify which resume/JD combinations are empty
  // Assuming results are ordered: JD0+Resume0, JD0+Resume1, JD0+Resume2, JD0+Resume3, JD1+Resume0, ...
  console.log('=== LIKELY FAILED COMBINATIONS ===\n');
  
  emptyIndices.forEach(index => {
    const jdIndex = Math.floor(index / resumes.length);
    const resumeIndex = index % resumes.length;
    
    console.log(`Result ${index}:`);
    console.log(`  Likely JD: ${jds[jdIndex] || 'Unknown'} (index ${jdIndex})`);
    console.log(`  Likely Resume: ${resumes[resumeIndex] || 'Unknown'} (index ${resumeIndex})`);
    console.log('');
  });
  
  console.log('=== SUCCESSFUL COMBINATIONS ===\n');
  
  validIndices.forEach(index => {
    const jdIndex = Math.floor(index / resumes.length);
    const resumeIndex = index % resumes.length;
    const match = valid.find(v => v.index === index);
    
    console.log(`Result ${index}:`);
    console.log(`  Candidate: ${match?.name}`);
    console.log(`  JD: ${match?.jdTitle}`);
    console.log(`  Score: ${match?.score}%`);
    console.log(`  Likely JD File: ${jds[jdIndex] || 'Unknown'} (index ${jdIndex})`);
    console.log(`  Likely Resume File: ${resumes[resumeIndex] || 'Unknown'} (index ${resumeIndex})`);
    console.log('');
  });
  
  // Pattern detection
  console.log('=== PATTERN DETECTION ===\n');
  
  const emptyResumeIndices = new Set(emptyIndices.map(i => i % resumes.length));
  const emptyJDIndices = new Set(emptyIndices.map(i => Math.floor(i / resumes.length)));
  
  console.log(`Resumes appearing in empty results: ${Array.from(emptyResumeIndices).map(i => `${resumes[i]} (index ${i})`).join(', ')}`);
  console.log(`JDs appearing in empty results: ${Array.from(emptyJDIndices).map(i => `${jds[i]} (index ${i})`).join(', ')}`);
  
  // Check if specific resumes or JDs always fail
  const allResumeIndices = new Set([0, 1, 2, 3]);
  const allJDIndices = new Set([0, 1, 2]);
  
  const successfulResumeIndices = new Set(validIndices.map(i => i % resumes.length));
  const successfulJDIndices = new Set(validIndices.map(i => Math.floor(i / resumes.length)));
  
  const alwaysFailingResumes = Array.from(allResumeIndices).filter(i => !successfulResumeIndices.has(i));
  const alwaysFailingJDs = Array.from(allJDIndices).filter(i => !successfulJDIndices.has(i));
  
  console.log('\n=== ALWAYS FAILING ===\n');
  if (alwaysFailingResumes.length > 0) {
    console.log('❌ Resumes that never extracted successfully:');
    alwaysFailingResumes.forEach(i => {
      console.log(`   - ${resumes[i]} (index ${i})`);
    });
  } else {
    console.log('✅ All resumes extracted at least once');
  }
  
  if (alwaysFailingJDs.length > 0) {
    console.log('\n❌ JDs that never extracted successfully:');
    alwaysFailingJDs.forEach(i => {
      console.log(`   - ${jds[i]} (index ${i})`);
    });
  } else {
    console.log('\n✅ All JDs extracted at least once');
  }
  
  console.log('\n=== RECOMMENDATION ===\n');
  if (alwaysFailingResumes.length > 0 || alwaysFailingJDs.length > 0) {
    console.log('Some files consistently fail extraction.');
    console.log('Check server logs for errors related to these specific files.');
  } else if (emptyIndices.length > 0) {
    console.log('Some combinations fail even though all files work individually.');
    console.log('This suggests a caching or matching logic issue.');
  } else {
    console.log('All extractions successful!');
  }
  
  console.log('\n');
  
} catch (error) {
  console.error('Error analyzing results:', error);
  console.error('\nMake sure you have run: bun run test-multiple-logs');
  console.error('And the file exists: ./test-results-detailed.json');
}
