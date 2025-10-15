# 🗄️ Cache Management Guide

## Overview

The HR Tools API uses **Redis** for intelligent caching to improve performance and reduce API costs. This guide explains how to manage the cache effectively.

---

## 📊 What's Cached

### **1. Resume Extractions** (24-hour TTL)
- **Key Pattern**: `resume_extract_*`
- **Purpose**: Cache extracted resume data to avoid re-processing same PDFs
- **Size**: ~1-5 KB per entry
- **Benefit**: Instant response for re-uploaded resumes

### **2. Job Description Extractions** (24-hour TTL)
- **Key Pattern**: `jd_extract_*`
- **Purpose**: Cache extracted JD data
- **Size**: ~1-5 KB per entry
- **Benefit**: Instant response for re-uploaded JDs

### **3. Match Results** (12-hour TTL)
- **Key Pattern**: `job_match_*`, `match_*`
- **Purpose**: Cache job-resume matching results
- **Size**: ~2-10 KB per entry
- **Benefit**: Instant results for same JD-Resume combinations

### **4. MCQ Generations** (24-hour TTL)
- **Key Pattern**: `mcq_questions_*`
- **Purpose**: Cache generated MCQ questions
- **Size**: ~5-15 KB per entry
- **Benefit**: Instant question generation

### **5. Voice Questions** (24-hour TTL)
- **Key Pattern**: `voice_questions_*`
- **Purpose**: Cache voice interview questions
- **Size**: ~1-3 KB per entry

### **6. Answer Evaluations** (12-hour TTL)
- **Key Pattern**: `answer_eval_*`
- **Purpose**: Cache answer evaluation scores
- **Size**: ~0.5-1 KB per entry

### **7. Audio Evaluations** (24-hour TTL)
- **Key Pattern**: `audio_eval_*`
- **Purpose**: Cache audio evaluation results
- **Size**: ~2-5 KB per entry

---

## 🔧 Cache Management Commands

### **1. Check Cache Status**

See how many items are cached without deleting anything:

```bash
npm run cache-status
# or
bun run clearCache.ts
```

**Output:**
```
📊 Found 150 cached entries:

   📄 Resume Extractions:      45
   📋 JD Extractions:          30
   🔗 Match Results:           50
   ❓ MCQ Generations:         15
   🎤 Voice Questions:         8
   ✍️  Answer Evaluations:     2
   🎵 Audio Evaluations:       0
   🔧 Other Entries:           0
```

### **2. Clear All Cache**

Delete all cached data:

```bash
npm run clear-cache
# or
bun run clearCache.ts --confirm
```

**Output:**
```
✅ Successfully deleted 150 cache entries

Cache breakdown:
   📄 Resume extractions:      45 deleted
   📋 JD extractions:          30 deleted
   🔗 Match results:           50 deleted
   ...
```

### **3. Manual Cache Reset (Advanced)**

If you need more control, you can use Redis CLI:

```bash
# Connect to Redis
redis-cli

# View all keys
KEYS *

# Count all keys
DBSIZE

# Delete all keys
FLUSHALL

# Delete specific pattern
DEL resume_extract_*

# Exit
exit
```

---

## 🎯 When to Clear Cache

### **Clear Cache When:**

✅ **Testing new features** - Ensure you're not getting cached results
✅ **After code changes** - Force re-extraction/re-matching
✅ **Data quality issues** - Reset if cached data seems incorrect
✅ **Memory pressure** - Free up Redis memory
✅ **After AI model updates** - Get fresh results from updated models

### **Don't Clear Cache When:**

❌ **Production traffic is high** - Will cause API surge
❌ **Just deployed** - Cache is valuable for performance
❌ **No specific reason** - Cache improves user experience

---

## 📈 Cache Performance Benefits

### **Without Cache:**
```
Resume Extraction:     ~3-5 seconds
JD Extraction:         ~3-5 seconds
Job Matching:          ~8-12 seconds
MCQ Generation:        ~10-15 seconds
Total (full flow):     ~24-37 seconds
```

### **With Cache (hit):**
```
Resume Extraction:     ~50ms (60x faster)
JD Extraction:         ~50ms (60x faster)
Job Matching:          ~50ms (160x faster)
MCQ Generation:        ~50ms (200x faster)
Total (full flow):     ~200ms (120x faster)
```

**💰 Cost Savings:**
- API calls reduced by ~70-90%
- Processing time reduced by 120x on cache hits
- Server load reduced significantly

---

## 🔍 Monitoring Cache

### **Check Redis Connection**

```bash
# Check if Redis is running
redis-cli ping
# Should output: PONG

# Check Redis info
redis-cli info
```

### **Monitor Cache Size**

```bash
# Get database size
redis-cli DBSIZE

# Get memory usage
redis-cli INFO memory
```

### **View Cache Keys**

```bash
# List all resume extraction keys
redis-cli KEYS "resume_extract_*"

# Count specific pattern
redis-cli KEYS "jd_extract_*" | wc -l
```

---

## ⚙️ Cache Configuration

### **Environment Variables**

```env
# Redis connection
REDIS_URL=redis://localhost:6379

# Cache TTL (optional - has defaults)
RESUME_CACHE_TTL=86400      # 24 hours in seconds
JD_CACHE_TTL=86400          # 24 hours
MATCH_CACHE_TTL=43200       # 12 hours
MCQ_CACHE_TTL=86400         # 24 hours
```

### **Default TTL Values**

| Cache Type | TTL | Reason |
|------------|-----|--------|
| Resume Extraction | 24 hours | Resumes rarely change daily |
| JD Extraction | 24 hours | Job descriptions stable |
| Match Results | 12 hours | Balance freshness & performance |
| MCQ Generation | 24 hours | Questions don't need frequent updates |
| Answer Evaluation | 12 hours | Scores might change with model updates |
| Audio Evaluation | 24 hours | Audio analysis is expensive |

---

## 🚨 Troubleshooting

### **Issue: Cache not working**

**Check:**
1. Redis is running: `redis-cli ping`
2. REDIS_URL is correct in `.env`
3. Server logs show cache connections

**Fix:**
```bash
# Start Redis (if not running)
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:latest
```

### **Issue: Out of memory**

**Check memory:**
```bash
redis-cli INFO memory
```

**Fix:**
```bash
# Clear old cache
npm run clear-cache

# Or set max memory in redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### **Issue: Stale data**

**Fix:**
```bash
# Clear specific pattern
redis-cli DEL $(redis-cli KEYS "resume_extract_*")

# Or clear all
npm run clear-cache
```

---

## 💡 Best Practices

### **1. Development**
```bash
# Clear cache before testing
npm run clear-cache

# Run your tests
npm test

# Check what was cached
npm run cache-status
```

### **2. Production**
```bash
# Monitor cache hit rate
redis-cli INFO stats | grep keyspace

# Set up cache warming (optional)
# Upload common JDs/resumes to pre-populate cache
```

### **3. Debugging**
```bash
# Enable debug logging
LOG_LEVEL=debug npm start

# Watch server logs for cache hits/misses
tail -f logs.txt | grep "cache"
```

---

## 📝 Cache Key Structure

Cache keys follow this pattern:

```
{type}_{hash}
```

**Examples:**
```
resume_extract_a1b2c3d4e5f6...    # Resume extraction
jd_extract_f6e5d4c3b2a1...         # JD extraction
job_match_x1y2z3...                # Match result
mcq_questions_m1n2o3...            # MCQ generation
```

The hash is MD5 of the file content or input data, ensuring:
- ✅ Same input = Same cache key
- ✅ Different input = Different cache key
- ✅ No collisions

---

## 🎯 Cache Strategies

### **Strategy 1: Aggressive Caching**
```env
RESUME_CACHE_TTL=604800    # 7 days
JD_CACHE_TTL=604800        # 7 days
MATCH_CACHE_TTL=86400      # 1 day
```
**Best for:** Stable data, high traffic, cost optimization

### **Strategy 2: Balanced Caching** (Default)
```env
RESUME_CACHE_TTL=86400     # 24 hours
JD_CACHE_TTL=86400         # 24 hours
MATCH_CACHE_TTL=43200      # 12 hours
```
**Best for:** Most use cases, good balance

### **Strategy 3: Minimal Caching**
```env
RESUME_CACHE_TTL=3600      # 1 hour
JD_CACHE_TTL=3600          # 1 hour
MATCH_CACHE_TTL=1800       # 30 minutes
```
**Best for:** Rapidly changing data, testing

---

## 📊 Cache Analytics

### **Hit Rate Calculation**

```bash
# Get stats
redis-cli INFO stats

# Calculate hit rate
hits / (hits + misses) * 100
```

**Good hit rate:** > 70%
**Excellent hit rate:** > 90%

### **Memory Usage**

```bash
# Current memory
redis-cli INFO memory | grep used_memory_human

# Peak memory
redis-cli INFO memory | grep used_memory_peak_human
```

---

## ✅ Quick Reference

| Task | Command |
|------|---------|
| Check cache status | `npm run cache-status` |
| Clear all cache | `npm run clear-cache` |
| Check Redis is running | `redis-cli ping` |
| View all keys | `redis-cli KEYS "*"` |
| Count cache entries | `redis-cli DBSIZE` |
| Monitor Redis | `redis-cli MONITOR` |
| Get memory usage | `redis-cli INFO memory` |

---

## 🎉 Summary

- ✅ **Cache speeds up API by 120x** on hits
- ✅ **Reduces costs by 70-90%**
- ✅ **Easy to manage** with npm scripts
- ✅ **Configurable TTL** for each cache type
- ✅ **Safe to clear** anytime

**Cache is your friend for performance!** 🚀

---

**Last Updated:** 2025-10-15
**Version:** 1.0.0
