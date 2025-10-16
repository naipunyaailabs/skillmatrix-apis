/**
 * Test PDF Text Extraction Directly
 * 
 * This tests the PDF parsing layer directly to see if PDFs can be read
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parsePDF } from './utils/pdfParser';

async function testPDFParsing() {
  console.log('\n=== TESTING PDF TEXT EXTRACTION ===\n');
  
  const RESUMES_DIR = './resumes';
  const JD_DIR = './jd';
  
  // Test all resumes
  console.log('📄 TESTING RESUMES:\n');
  const resumeFiles = readdirSync(RESUMES_DIR).filter(f => f.endsWith('.pdf'));
  
  for (const file of resumeFiles) {
    const filePath = join(RESUMES_DIR, file);
    const buffer = readFileSync(filePath);
    
    console.log(`\nFile: ${file}`);
    console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB`);
    
    try {
      const text = await parsePDF(buffer);
      console.log(`✅ Extracted: ${text.length} characters`);
      
      if (text.length > 0) {
        console.log(`Preview: ${text.substring(0, 150)}...`);
      } else {
        console.log(`❌ EMPTY TEXT EXTRACTED!`);
      }
    } catch (error) {
      console.log(`❌ ERROR:`, error instanceof Error ? error.message : error);
    }
  }
  
  // Test all JDs
  console.log('\n\n📋 TESTING JOB DESCRIPTIONS:\n');
  const jdFiles = readdirSync(JD_DIR).filter(f => f.endsWith('.pdf'));
  
  for (const file of jdFiles) {
    const filePath = join(JD_DIR, file);
    const buffer = readFileSync(filePath);
    
    console.log(`\nFile: ${file}`);
    console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB`);
    
    try {
      const text = await parsePDF(buffer);
      console.log(`✅ Extracted: ${text.length} characters`);
      
      if (text.length > 0) {
        console.log(`Preview: ${text.substring(0, 150)}...`);
      } else {
        console.log(`❌ EMPTY TEXT EXTRACTED!`);
      }
    } catch (error) {
      console.log(`❌ ERROR:`, error instanceof Error ? error.message : error);
    }
  }
  
  console.log('\n=== TEST COMPLETE ===\n');
}

testPDFParsing().catch(console.error);
