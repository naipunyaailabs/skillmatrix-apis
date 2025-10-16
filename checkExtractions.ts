/**
 * Check Extraction Status Script
 * 
 * This script helps diagnose extraction issues by checking cache status
 * and providing detailed information about what's stored.
 * 
 * Run: bun run checkExtractions.ts
 */

import { getRedisClient, initializeRedisClient } from './utils/redisClient';

async function checkExtractions() {
  console.log('\n=== CHECKING EXTRACTION STATUS ===\n');
  
  try {
    // Initialize Redis
    await initializeRedisClient();
    const client = getRedisClient();
    
    if (!client) {
      console.log('\u26a0\ufe0f  Redis is NOT connected');
      console.log('   This means:');
      console.log('   - No caching is active');
      console.log('   - Every extraction calls Groq API fresh');
      console.log('   - Empty cached data is NOT the issue');
      console.log('\n\u2705 Conclusion: Cache is not causing empty values\n');
      console.log('The issue is in the extraction process itself.');
      console.log('Run the server and check logs for PDF text extraction.');
      return;
    }
    
    console.log('\u2705 Redis is connected\n');
    
    // Get all keys
    const keys = await client.keys('*');
    console.log(`Total cached items: ${keys.length}\n`);
    
    if (keys.length === 0) {
      console.log('\u2139\ufe0f  Cache is empty');
      console.log('   This means fresh extractions will be performed.');
      return;
    }
    
    // Categorize keys
    const resumeKeys = keys.filter(k => k.startsWith('resume_extract_'));
    const jdKeys = keys.filter(k => k.startsWith('jd_extract_'));
    const matchKeys = keys.filter(k => k.startsWith('match_'));
    const otherKeys = keys.filter(k => !k.startsWith('resume_extract_') && !k.startsWith('jd_extract_') && !k.startsWith('match_'));
    
    console.log('=== CACHE BREAKDOWN ===');
    console.log(`Resume extractions: ${resumeKeys.length}`);
    console.log(`JD extractions: ${jdKeys.length}`);
    console.log(`Match results: ${matchKeys.length}`);
    console.log(`Other: ${otherKeys.length}`);
    console.log('');
    
    // Track overall empty counts
    let totalEmptyCount = 0;
    let totalValidCount = 0;
    
    // Check resume extractions for empty data
    if (resumeKeys.length > 0) {
      console.log('=== CHECKING RESUME EXTRACTIONS ===\n');
      
      let emptyCount = 0;
      let validCount = 0;
      
      for (const key of resumeKeys.slice(0, 20)) { // Check first 20
        const value = await client.get(key);
        if (value) {
          try {
            const data = JSON.parse(value);
            const isEmpty = !data.name && !data.email && (!data.skills || data.skills.length === 0);
            
            if (isEmpty) {
              emptyCount++;
              console.log(`\u274c EMPTY: ${key}`);
              console.log(`   Data: ${JSON.stringify(data).substring(0, 100)}...`);
            } else {
              validCount++;
              console.log(`\u2705 VALID: ${key}`);
              console.log(`   Name: ${data.name}, Email: ${data.email}, Skills: ${data.skills?.length || 0}`);
            }
          } catch (e) {
            console.log(`\u26a0\ufe0f  PARSE ERROR: ${key}`);
          }
        }
      }
      
      console.log('');
      console.log(`Summary: ${validCount} valid, ${emptyCount} empty (out of ${Math.min(20, resumeKeys.length)} checked)`);
      
      totalEmptyCount += emptyCount;
      totalValidCount += validCount;
      
      if (emptyCount > 0) {
        console.log('');
        console.log('\u26a0\ufe0f  FOUND EMPTY CACHED EXTRACTIONS!');
        console.log('   This means previous extractions failed and got cached.');
        console.log('   Solution: Clear the cache');
        console.log('   Run: npm run clear-cache');
      }
    }
    
    // Check JD extractions
    if (jdKeys.length > 0) {
      console.log('\n=== CHECKING JD EXTRACTIONS ===\n');
      
      let emptyCount = 0;
      let validCount = 0;
      
      for (const key of jdKeys.slice(0, 20)) {
        const value = await client.get(key);
        if (value) {
          try {
            const data = JSON.parse(value);
            const isEmpty = !data.title && !data.company && (!data.skills || data.skills.length === 0);
            
            if (isEmpty) {
              emptyCount++;
              console.log(`\u274c EMPTY: ${key}`);
              console.log(`   Data: ${JSON.stringify(data).substring(0, 100)}...`);
            } else {
              validCount++;
              console.log(`\u2705 VALID: ${key}`);
              console.log(`   Title: ${data.title}, Company: ${data.company}, Skills: ${data.skills?.length || 0}`);
            }
          } catch (e) {
            console.log(`\u26a0\ufe0f  PARSE ERROR: ${key}`);
          }
        }
      }
      
      console.log('');
      console.log(`Summary: ${validCount} valid, ${emptyCount} empty (out of ${Math.min(20, jdKeys.length)} checked)`);
      
      totalEmptyCount += emptyCount;
      totalValidCount += validCount;
      
      if (emptyCount > 0) {
        console.log('');
        console.log('\u26a0\ufe0f  FOUND EMPTY CACHED JD EXTRACTIONS!');
        console.log('   This means previous extractions failed and got cached.');
        console.log('   Solution: Clear the cache');
        console.log('   Run: npm run clear-cache');
      }
    }
    
    console.log('\n=== RECOMMENDATIONS ===\n');
    
    if (totalEmptyCount > 0) {
      console.log('1. \u26a0\ufe0f  Clear the cache to remove bad cached data:');
      console.log('   npm run clear-cache');
      console.log('');
      console.log('2. Restart your server:');
      console.log('   bun run dev');
      console.log('');
      console.log('3. Try extraction again with fresh data');
    } else if (resumeKeys.length === 0 && jdKeys.length === 0) {
      console.log('\u2713 No cached extractions found');
      console.log('  Next extractions will be fresh from PDFs');
    } else {
      console.log('\u2713 All cached extractions look valid');
      console.log('  Issue is likely in fresh extractions, not cache');
      console.log('  Check server logs for PDF text extraction errors');
    }
    
    console.log('');
    
  } catch (error) {
    console.error('Error checking extractions:', error);
  }
  
  process.exit(0);
}

checkExtractions();
