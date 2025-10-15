# Extraction Diagnostics Guide

## Issue: Empty Values in Resume and JD Extraction

This document helps diagnose why extraction is returning empty values.

## Diagnostic Logging Added

Enhanced logging has been added to trace the entire extraction pipeline:

### 1. PDF Parser (`utils/pdfParser.ts`)
**New Logs:**
- Buffer size in bytes
- Extraction result type (string/array)
- Number of characters extracted
- First 200 characters of extracted text
- **WARNING** if extracted text is empty

**What to look for:**
```
[PDF Parser] Starting PDF text extraction
[PDF Parser] Buffer size: 45678 bytes
[PDF Parser] Extraction result type: string, isArray: false
[PDF Parser] PDF text extraction completed - Extracted 1234 characters
[PDF Parser] First 200 chars: John Doe Software Engineer...
```

**Red flags:**
- `Extracted 0 characters` - PDF parsing failed
- `WARNING: Extracted text is EMPTY!` - No text in PDF or parsing error
- Buffer size is very small (< 1000 bytes) - Corrupted or invalid PDF

### 2. Resume Extractor (`services/resumeExtractor.ts`)
**New Logs:**
- Cache key for tracking
- Whether result is from cache or fresh extraction
- Text length received from PDF parser
- First 300 characters of PDF text
- Groq API response length and preview
- Parsed JSON data structure
- Empty field warnings
- Final data summary

**What to look for:**
```
[ResumeExtractor] Starting extraction, cache key: resume_extract_abc123...
[ResumeExtractor] Parsing PDF...
[ResumeExtractor] PDF parsed - Text length: 2345 characters
[ResumeExtractor] First 300 chars of extracted text: RESUME John Doe...
[ResumeExtractor] Calling Groq API...
[ResumeExtractor] Groq API response length: 567 characters
[ResumeExtractor] JSON parsed successfully
[ResumeExtractor] Parsed data keys: ["name", "email", "phone", "skills", ...]
[ResumeExtractor] Final data summary: {
  name: 'John Doe',
  email: 'john@example.com',
  skillsCount: 15,
  experienceCount: 3,
  totalYears: 5
}
```

**Red flags:**
- `ERROR: PDF text extraction returned EMPTY string!` - PDF parsing failed
- `ERROR: Groq API returned EMPTY response!` - API call failed or returned nothing
- `WARNING: name is empty!` - AI couldn't extract name
- `WARNING: email is empty!` - AI couldn't extract email
- `WARNING: skills array is empty!` - AI couldn't extract skills
- Final summary shows "EMPTY" values

### 3. JD Extractor (`services/jdExtractor.ts`)
**New Logs:**
- Same comprehensive logging as Resume Extractor
- Tracks title, company, skills, requirements extraction

**What to look for:**
```
[JDExtractor] Starting extraction, cache key: jd_extract_def456...
[JDExtractor] Final data summary: {
  title: 'Senior Software Engineer',
  company: 'Tech Corp',
  skillsCount: 10,
  requirementsCount: 8,
  requiredYears: 5
}
```

**Red flags:**
- Same as Resume Extractor
- `WARNING: The following fields are empty: title, company` - Critical fields missing

### 4. Groq Client (`utils/groqClient.ts`)
**New Logs:**
- User prompt length
- API call attempt number
- Model being used
- Response length
- Empty response warning

**What to look for:**
```
[GroqClient] Starting API call - User prompt length: 3456 chars, Max tokens: 1024
[GroqClient] Making API call (attempt 1/3) with model: openai/gpt-oss-120b
[GroqClient] API call successful - Response length: 789 chars
```

**Red flags:**
- `WARNING: API returned empty response!` - API issue
- Multiple retry attempts - Rate limiting or API errors
- Model name issues - Check GROQ_MODEL environment variable

## Diagnostic Workflow

### Step 1: Check Logs After API Call

Run your API endpoint and examine the logs in this order:

1. **PDF Parser logs** - Did text extraction work?
   - If "Extracted 0 characters" → PDF is corrupted or not parseable
   - If buffer size is tiny → File upload issue

2. **Extractor logs** - Did we get text and call the API?
   - If "PDF text extraction returned EMPTY string" → Go back to PDF parser
   - If "Groq API returned EMPTY response" → API issue (see Step 2)

3. **Groq Client logs** - Did API call succeed?
   - If no response or empty response → API key issue or model issue
   - If multiple retries → Rate limiting (see Step 3)

4. **Final data summary** - What was actually extracted?
   - Compare with what you expected
   - Check for "EMPTY" markers

### Step 2: Check Cache for Corrupted Data

Empty values might be cached from a previous failed extraction.

**Clear the cache:**
```bash
npm run clear-cache -- --confirm
```

**Check cache status:**
```bash
npm run cache-status
```

Then retry the extraction.

### Step 3: Verify Environment Configuration

**Check `.env` file:**
```bash
# Required
GROQ_API_KEYS=your-api-key-here

# Optional - defaults shown
GROQ_MODEL=openai/gpt-oss-120b
REDIS_URL=redis://localhost:6379
```

**Test Groq API key:**
```bash
# Check if API key is set
echo $GROQ_API_KEYS  # Linux/Mac
echo %GROQ_API_KEYS%  # Windows CMD
$env:GROQ_API_KEYS   # Windows PowerShell
```

**Verify Redis connection:**
```bash
redis-cli ping
# Should return: PONG
```

### Step 4: Test with Sample Files

Create test files to isolate the issue:

1. **Test with a simple text-based PDF:**
   - Create a PDF with clear text (not scanned image)
   - Should have extractable text content
   - Try with a minimal resume (just name, email, one skill)

2. **Check PDF file properties:**
   - Is it a valid PDF?
   - Is it a scanned image (non-extractable)?
   - Is it encrypted or password-protected?
   - File size reasonable? (Not too small or corrupted)

### Step 5: Check Groq API Status

**Possible API issues:**

1. **Rate limiting:**
   - Look for `Rate limit exceeded` in logs
   - Default: 30 requests per minute per key
   - Solution: Add more API keys (comma-separated in GROQ_API_KEYS)

2. **Invalid model:**
   - Default model: `openai/gpt-oss-120b`
   - Check if model is available/correct
   - Try setting to `llama-3.1-70b-versatile` in `.env`

3. **API key issues:**
   - Expired or invalid key
   - Quota exceeded
   - Test with curl:
   ```bash
   curl https://api.groq.com/openai/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

### Step 6: Enable Debug Mode

If still unclear, run with full debug output:

```bash
# Set debug mode
export DEBUG=*  # Linux/Mac
$env:DEBUG="*"  # Windows PowerShell

# Run server
bun run dev
```

## Common Scenarios and Solutions

### Scenario 0: Redis Connection Errors (MOST COMMON)

**Symptoms:**
```
[Redis] Redis Client Error: Socket closed unexpectedly
[Redis] Redis Client Error: Connection timeout
```

**Impact:** 
- ⚠️ Extractions will still work but won't be cached
- ⚠️ Every request will call Groq API (slower)
- ⚠️ Uses more API quota
- ✅ No data corruption or empty values from this

**Solutions:**
1. **Quick fix:** Ignore the errors - app works without Redis
2. **Recommended:** Set up Redis for caching benefits
3. **See:** `REDIS_SETUP.md` for detailed setup instructions

**Note:** If you're seeing empty extraction values, Redis errors are NOT the cause. Continue to other scenarios below.

---

### Scenario 1: All Extractions Return Empty Values

**Likely cause:** Groq API issue (keys, model, or service down)

**Solution:**
1. Check Groq API key is valid
2. Try different model in `.env`: `GROQ_MODEL=llama-3.1-70b-versatile`
3. Check Groq service status
4. Clear cache: `npm run clear-cache -- --confirm`

### Scenario 2: Some Fields Empty, Others Work

**Likely cause:** PDF quality or AI extraction limitations

**Solution:**
1. Check PDF has clear, extractable text (not scanned images)
2. Verify text extraction shows expected content in logs
3. The AI model might not be able to find certain fields
4. Try with a better-formatted resume/JD

### Scenario 3: First Request Empty, Subsequent Requests Work

**Likely cause:** Cache warming or initial API call failure

**Solution:**
1. This is expected behavior on first run
2. Second request uses cached result
3. If persists, clear cache and retry

### Scenario 4: Cached Results Are Empty

**Likely cause:** First extraction failed but got cached

**Solution:**
1. Clear cache: `npm run clear-cache -- --confirm`
2. Retry extraction
3. Check logs to see why first extraction failed

### Scenario 5: PDF Text Extraction Returns Empty

**Likely cause:** PDF is image-based or corrupted

**Solution:**
1. Verify PDF file is valid and text-based
2. Try opening PDF in a reader - can you select text?
3. If scanned image, need OCR preprocessing (not currently supported)
4. Try with a different, simpler PDF

## Log Analysis Example

### Healthy Extraction (Expected)

```
[PDF Parser] Starting PDF text extraction
[PDF Parser] Buffer size: 48392 bytes
[PDF Parser] Extraction result type: string, isArray: false
[PDF Parser] PDF text extraction completed - Extracted 3245 characters
[PDF Parser] First 200 chars: RESUME John Smith Email: john.smith@email.com Phone: (555) 123-4567 PROFESSIONAL SUMMARY Senior Software Engineer with 5+ years of experience...

[ResumeExtractor] Starting extraction, cache key: resume_extract_a1b2c3d4...
[ResumeExtractor] Parsing PDF...
[ResumeExtractor] PDF parsed - Text length: 3245 characters
[ResumeExtractor] First 300 chars of extracted text: RESUME John Smith Email: john.smith@email.com Phone: (555) 123-4567 PROFESSIONAL SUMMARY Senior Software Engineer with 5+ years of experience in full-stack development...
[ResumeExtractor] Calling Groq API...

[GroqClient] Starting API call - User prompt length: 3789 chars, Max tokens: 1024
[GroqClient] Making API call (attempt 1/3) with model: openai/gpt-oss-120b
[GroqClient] API call successful - Response length: 892 characters

[ResumeExtractor] Groq API response length: 892 characters
[ResumeExtractor] JSON parsed successfully
[ResumeExtractor] Parsed data keys: ["name","email","phone","skills","experience","education",...]
[ResumeExtractor] Final data summary: {
  name: 'John Smith',
  email: 'john.smith@email.com',
  phone: '(555) 123-4567',
  skillsCount: 18,
  experienceCount: 3,
  totalYears: 5.5
}
```

### Problematic Extraction (Red Flags)

```
[PDF Parser] Starting PDF text extraction
[PDF Parser] Buffer size: 234 bytes  ⚠️ TOO SMALL
[PDF Parser] Extraction result type: string, isArray: false
[PDF Parser] PDF text extraction completed - Extracted 0 characters  ⚠️ EMPTY
[PDF Parser] WARNING: Extracted text is EMPTY!  ⚠️ CRITICAL

[ResumeExtractor] Starting extraction, cache key: resume_extract_xyz123...
[ResumeExtractor] Parsing PDF...
[ResumeExtractor] PDF parsed - Text length: 0 characters  ⚠️ EMPTY
[ResumeExtractor] ERROR: PDF text extraction returned EMPTY string!  ⚠️ CRITICAL
Error: PDF text extraction returned empty content
```

## Quick Fixes Checklist

- [ ] Clear Redis cache: `npm run clear-cache -- --confirm`
- [ ] Verify `.env` has valid `GROQ_API_KEYS`
- [ ] Check Redis is running: `redis-cli ping`
- [ ] Test with a simple, text-based PDF
- [ ] Check Groq API key validity
- [ ] Try different model: `GROQ_MODEL=llama-3.1-70b-versatile`
- [ ] Review server logs for red flag messages
- [ ] Ensure PDF is not scanned image (must have selectable text)
- [ ] Check file upload is working correctly
- [ ] Verify buffer size is reasonable (> 1000 bytes)

## Getting Help

When reporting issues, include:

1. **Full log output** from the extraction attempt
2. **Cache status:** `npm run cache-status` output
3. **Environment:** Are GROQ_API_KEYS set? Which model?
4. **PDF type:** Text-based or scanned image?
5. **Buffer size:** From PDF Parser log
6. **Text extraction:** How many characters extracted?
7. **API response:** Did Groq return data?
8. **Specific empty fields:** Which fields are empty?

## Next Steps

After reviewing logs:

1. Identify which stage fails (PDF → Text → API → Parse → Cache)
2. Apply appropriate fix from scenarios above
3. Clear cache if needed
4. Retry with diagnostic logs enabled
5. Monitor logs for red flag messages

---

**Last Updated:** 2025-10-15
**Related Files:**
- `utils/pdfParser.ts` - PDF text extraction
- `services/resumeExtractor.ts` - Resume data extraction
- `services/jdExtractor.ts` - JD data extraction
- `utils/groqClient.ts` - Groq API client
- `CACHE_MANAGEMENT.md` - Cache troubleshooting
