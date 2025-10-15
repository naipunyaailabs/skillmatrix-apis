/**
 * Cache Reset Utility
 * 
 * This script clears all cached data from Redis including:
 * - Resume extractions
 * - Job description extractions
 * - Match results
 * - MCQ generations
 * - Voice interview questions
 * - Answer evaluations
 * - Audio evaluations
 */

import { initializeRedisClient, getRedisClient } from "./utils/redisClient";
import { config } from "dotenv";

// Load environment variables
config();

async function clearAllCache() {
  console.log('\n' + '='.repeat(60));
  console.log('  CACHE RESET UTILITY');
  console.log('='.repeat(60) + '\n');

  try {
    // Initialize Redis connection
    console.log('📡 Connecting to Redis...');
    await initializeRedisClient();
    
    const client = getRedisClient();
    
    if (!client) {
      console.error('❌ Redis client not available');
      console.log('\nPossible reasons:');
      console.log('  • Redis server is not running');
      console.log('  • REDIS_URL environment variable is incorrect');
      console.log('  • Network connectivity issues\n');
      process.exit(1);
    }

    console.log('✅ Connected to Redis\n');

    // Get all keys
    console.log('🔍 Scanning for cached entries...');
    const keys = await client.keys('*');
    
    if (keys.length === 0) {
      console.log('✅ Cache is already empty (0 entries)\n');
      await client.quit();
      process.exit(0);
    }

    // Categorize keys
    const resumeKeys = keys.filter(k => k.startsWith('resume_extract_'));
    const jdKeys = keys.filter(k => k.startsWith('jd_extract_'));
    const matchKeys = keys.filter(k => k.startsWith('job_match_') || k.startsWith('match_'));
    const mcqKeys = keys.filter(k => k.startsWith('mcq_questions_'));
    const voiceKeys = keys.filter(k => k.startsWith('voice_questions_'));
    const answerEvalKeys = keys.filter(k => k.startsWith('answer_eval_'));
    const audioEvalKeys = keys.filter(k => k.startsWith('audio_eval_'));
    const otherKeys = keys.filter(k => 
      !k.startsWith('resume_extract_') &&
      !k.startsWith('jd_extract_') &&
      !k.startsWith('job_match_') &&
      !k.startsWith('match_') &&
      !k.startsWith('mcq_questions_') &&
      !k.startsWith('voice_questions_') &&
      !k.startsWith('answer_eval_') &&
      !k.startsWith('audio_eval_')
    );

    console.log(`\n📊 Found ${keys.length} cached entries:\n`);
    console.log(`   📄 Resume Extractions:      ${resumeKeys.length}`);
    console.log(`   📋 JD Extractions:          ${jdKeys.length}`);
    console.log(`   🔗 Match Results:           ${matchKeys.length}`);
    console.log(`   ❓ MCQ Generations:         ${mcqKeys.length}`);
    console.log(`   🎤 Voice Questions:         ${voiceKeys.length}`);
    console.log(`   ✍️  Answer Evaluations:     ${answerEvalKeys.length}`);
    console.log(`   🎵 Audio Evaluations:       ${audioEvalKeys.length}`);
    console.log(`   🔧 Other Entries:           ${otherKeys.length}\n`);

    // Confirm deletion
    console.log('⚠️  This will DELETE all cached data!\n');
    
    // In non-interactive mode or with confirmation
    const shouldDelete = process.argv.includes('--confirm') || process.argv.includes('-y');
    
    if (!shouldDelete) {
      console.log('❌ Deletion cancelled.');
      console.log('\nTo confirm deletion, run:');
      console.log('  bun run clearCache.ts --confirm\n');
      await client.quit();
      process.exit(0);
    }

    console.log('🗑️  Deleting all cache entries...\n');

    // Delete all keys
    let deletedCount = 0;
    
    if (keys.length > 0) {
      // Delete keys in batches to avoid argument length issues
      for (const key of keys) {
        await client.del(key);
        deletedCount++;
      }
    }

    console.log(`✅ Successfully deleted ${deletedCount} cache entries\n`);
    console.log('Cache breakdown:');
    console.log(`   📄 Resume extractions:      ${resumeKeys.length} deleted`);
    console.log(`   📋 JD extractions:          ${jdKeys.length} deleted`);
    console.log(`   🔗 Match results:           ${matchKeys.length} deleted`);
    console.log(`   ❓ MCQ generations:         ${mcqKeys.length} deleted`);
    console.log(`   🎤 Voice questions:         ${voiceKeys.length} deleted`);
    console.log(`   ✍️  Answer evaluations:     ${answerEvalKeys.length} deleted`);
    console.log(`   🎵 Audio evaluations:       ${audioEvalKeys.length} deleted`);
    console.log(`   🔧 Other entries:           ${otherKeys.length} deleted\n`);

    console.log('='.repeat(60));
    console.log('✨ Cache reset complete!');
    console.log('='.repeat(60) + '\n');

    // Close Redis connection
    await client.quit();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error clearing cache:', error);
    console.error('\nDetails:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the cache clear
clearAllCache();
