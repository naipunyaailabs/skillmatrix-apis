/**
 * Extraction Diagnostic Test Script
 * 
 * This script helps diagnose extraction issues by testing with a sample PDF
 * Run: bun run testExtraction.ts <path-to-pdf>
 */

import { extractResumeData } from './services/resumeExtractor';
import { extractJobDescriptionData } from './services/jdExtractor';
import { parsePDF } from './utils/pdfParser';
import { readFileSync } from 'fs';

async function testExtraction(filePath: string, type: 'resume' | 'jd' = 'resume') {
  console.log('\n=== EXTRACTION DIAGNOSTIC TEST ===\n');
  console.log(`File: ${filePath}`);
  console.log(`Type: ${type}`);
  console.log('\n--- STEP 1: Reading File ---');
  
  try {
    // Read file
    const buffer = readFileSync(filePath);
    console.log(`✓ File read successfully - Size: ${buffer.length} bytes`);
    
    if (buffer.length < 100) {
      console.error('⚠️  WARNING: File size is suspiciously small (< 100 bytes)');
      console.error('   This might indicate a corrupted or invalid PDF');
    }
    
    console.log('\n--- STEP 2: Testing PDF Text Extraction ---');
    
    // Test PDF parsing
    const text = await parsePDF(buffer);
    console.log(`✓ PDF parsed - Extracted ${text.length} characters`);
    
    if (text.length === 0) {
      console.error('✗ ERROR: PDF text extraction returned EMPTY string!');
      console.error('  Possible causes:');
      console.error('  1. PDF is a scanned image (not text-based)');
      console.error('  2. PDF is corrupted or invalid');
      console.error('  3. PDF parser (unpdf) failed');
      console.error('\n  Solution: Try with a text-based PDF where you can select text');
      return;
    }
    
    console.log('\nFirst 500 characters of extracted text:');
    console.log('---');
    console.log(text.substring(0, 500));
    console.log('---');
    
    if (text.length < 100) {
      console.warn('\n⚠️  WARNING: Extracted text is very short (< 100 chars)');
      console.warn('   The AI might not have enough information to extract data');
    }
    
    console.log(`\n--- STEP 3: Testing ${type.toUpperCase()} Data Extraction ---`);
    
    // Test extraction
    let extractedData: any;
    if (type === 'resume') {
      extractedData = await extractResumeData(buffer);
      console.log('\n✓ Resume extraction completed');
      console.log('\n=== EXTRACTED DATA ===');
      console.log(JSON.stringify(extractedData, null, 2));
      
      // Validate
      console.log('\n--- VALIDATION ---');
      const issues: string[] = [];
      
      if (!extractedData.name || extractedData.name === '') {
        issues.push('✗ Name is EMPTY');
      } else {
        console.log(`✓ Name: ${extractedData.name}`);
      }
      
      if (!extractedData.email || extractedData.email === '') {
        issues.push('✗ Email is EMPTY');
      } else {
        console.log(`✓ Email: ${extractedData.email}`);
      }
      
      if (!extractedData.skills || extractedData.skills.length === 0) {
        issues.push('✗ Skills array is EMPTY');
      } else {
        console.log(`✓ Skills: ${extractedData.skills.length} found`);
      }
      
      if (!extractedData.experience || extractedData.experience.length === 0) {
        issues.push('✗ Experience array is EMPTY');
      } else {
        console.log(`✓ Experience: ${extractedData.experience.length} entries`);
      }
      
      if (extractedData.totalIndustrialExperienceYears === 0 || !extractedData.totalIndustrialExperienceYears) {
        issues.push('⚠️  Total experience years is 0 or missing');
      } else {
        console.log(`✓ Total years: ${extractedData.totalIndustrialExperienceYears}`);
      }
      
      if (issues.length > 0) {
        console.log('\n⚠️  ISSUES FOUND:');
        issues.forEach(issue => console.log(`  ${issue}`));
      } else {
        console.log('\n✓ All critical fields populated!');
      }
      
    } else {
      extractedData = await extractJobDescriptionData(buffer);
      console.log('\n✓ Job Description extraction completed');
      console.log('\n=== EXTRACTED DATA ===');
      console.log(JSON.stringify(extractedData, null, 2));
      
      // Validate
      console.log('\n--- VALIDATION ---');
      const issues: string[] = [];
      
      if (!extractedData.title || extractedData.title === '') {
        issues.push('✗ Title is EMPTY');
      } else {
        console.log(`✓ Title: ${extractedData.title}`);
      }
      
      if (!extractedData.company || extractedData.company === '') {
        issues.push('✗ Company is EMPTY');
      } else {
        console.log(`✓ Company: ${extractedData.company}`);
      }
      
      if (!extractedData.skills || extractedData.skills.length === 0) {
        issues.push('✗ Skills array is EMPTY');
      } else {
        console.log(`✓ Skills: ${extractedData.skills.length} found`);
      }
      
      if (!extractedData.requirements || extractedData.requirements.length === 0) {
        issues.push('✗ Requirements array is EMPTY');
      } else {
        console.log(`✓ Requirements: ${extractedData.requirements.length} found`);
      }
      
      if (issues.length > 0) {
        console.log('\n⚠️  ISSUES FOUND:');
        issues.forEach(issue => console.log(`  ${issue}`));
      } else {
        console.log('\n✓ All critical fields populated!');
      }
    }
    
    console.log('\n=== TEST COMPLETE ===\n');
    
  } catch (error) {
    console.error('\n✗ ERROR DURING EXTRACTION:');
    console.error(error);
    console.error('\nStack trace:');
    if (error instanceof Error) {
      console.error(error.stack);
    }
    
    console.log('\n--- TROUBLESHOOTING TIPS ---');
    console.log('1. Clear cache: npm run clear-cache -- --confirm');
    console.log('2. Check .env has valid GROQ_API_KEYS');
    console.log('3. Verify Redis is running: redis-cli ping');
    console.log('4. Check logs above for specific error messages');
    console.log('5. See EXTRACTION_DIAGNOSTICS.md for detailed guide');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: bun run testExtraction.ts <path-to-pdf> [resume|jd]');
  console.log('');
  console.log('Examples:');
  console.log('  bun run testExtraction.ts ./sample-resume.pdf');
  console.log('  bun run testExtraction.ts ./sample-resume.pdf resume');
  console.log('  bun run testExtraction.ts ./sample-jd.pdf jd');
  console.log('');
  process.exit(1);
}

const filePath = args[0];
const type = (args[1] as 'resume' | 'jd') || 'resume';

if (type !== 'resume' && type !== 'jd') {
  console.error('Error: Type must be "resume" or "jd"');
  process.exit(1);
}

// Run test
testExtraction(filePath, type).catch(console.error);
