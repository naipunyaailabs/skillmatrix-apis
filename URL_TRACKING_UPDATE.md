# URL and Filename Tracking - Update Summary

## What Changed

The Multiple Job Matching API now includes **JD URL**, **Resume URL**, **JD Filename**, and **Resume Filename** in each match result.

---

## Updated Response Format

### Before
```json
{
  "POST Response": [
    {
      "Id": "uuid",
      "Resume Data": { ... }
    }
  ]
}
```

### After (NEW)
```json
{
  "POST Response": [
    {
      "Id": "uuid",
      "JD URL": "https://storage.example.com/jds/engineer.pdf",
      "Resume URL": "https://storage.example.com/resumes/john_doe.pdf",
      "JD Filename": "engineer.pdf",
      "Resume Filename": "john_doe.pdf",
      "Resume Data": { ... },
      "Analysis": { ... }
    }
  ]
}
```

---

## New Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `JD URL` | string or null | URL of the job description file (null if uploaded via FormData) | `"https://storage.example.com/jds/engineer.pdf"` |
| `Resume URL` | string or null | URL of the resume file (null if uploaded via FormData) | `"https://storage.example.com/resumes/john.pdf"` |
| `JD Filename` | string | Filename of the job description | `"engineer.pdf"` |
| `Resume Filename` | string | Filename of the resume | `"john_doe.pdf"` |

---

## Benefits

✅ **Traceability** - Know exactly which files were matched  
✅ **File Linking** - Direct access to source files via URLs  
✅ **Debugging** - Easier to identify problematic files  
✅ **Audit Trail** - Track which documents were processed  
✅ **Re-downloading** - Access original files when needed  

---

## Example Response

### URL-Based Input
When files are provided via URLs, both URL and filename are included:

```json
{
  "Id": "abc-123",
  "JD URL": "https://s3.amazonaws.com/hr-bucket/jds/software_engineer.pdf",
  "Resume URL": "https://s3.amazonaws.com/hr-bucket/resumes/jane_smith.pdf",
  "JD Filename": "software_engineer.pdf",
  "Resume Filename": "jane_smith.pdf",
  "Resume Data": {
    "name": "Jane Smith",
    "Job Title": "Software Engineer",
    "Matching Percentage": "85"
  },
  "Analysis": {
    "Matching Score": 85,
    "Matched Skills": ["Python", "JavaScript", "React"],
    "Unmatched Skills": ["Go"]
  }
}
```

### File Upload Input
When files are uploaded via FormData, URLs will be `null`:

```json
{
  "Id": "xyz-789",
  "JD URL": null,
  "Resume URL": null,
  "JD Filename": "software_engineer.pdf",
  "Resume Filename": "jane_smith.pdf",
  "Resume Data": { ... },
  "Analysis": { ... }
}
```

---

## Use Cases

### 1. Download Source Files
```javascript
const matches = result['POST Response'];

matches.forEach(match => {
  if (match['JD URL']) {
    // Download the JD file
    fetch(match['JD URL']).then(response => {
      // Process file
    });
  }
  
  if (match['Resume URL']) {
    // Download the resume file
    fetch(match['Resume URL']).then(response => {
      // Process file
    });
  }
});
```

### 2. Display File Information
```javascript
matches.forEach(match => {
  console.log(`Match: ${match['Resume Filename']} → ${match['JD Filename']}`);
  console.log(`Score: ${match.Analysis['Matching Score']}%`);
  
  if (match['Resume URL']) {
    console.log(`Resume: ${match['Resume URL']}`);
  }
  if (match['JD URL']) {
    console.log(`JD: ${match['JD URL']}`);
  }
});
```

### 3. Audit Logging
```javascript
const auditLog = matches.map(match => ({
  timestamp: new Date(),
  jdFile: match['JD Filename'],
  jdUrl: match['JD URL'],
  resumeFile: match['Resume Filename'],
  resumeUrl: match['Resume URL'],
  candidateName: match['Resume Data'].name,
  matchScore: match.Analysis['Matching Score']
}));

// Save audit log
saveAuditLog(auditLog);
```

### 4. Re-processing Failed Matches
```javascript
const lowScoreMatches = matches.filter(m => m.Analysis['Matching Score'] < 50);

// Re-download and verify files
for (const match of lowScoreMatches) {
  if (match['Resume URL']) {
    const resume = await fetch(match['Resume URL']);
    // Verify file integrity
  }
}
```

---

## Files Modified

1. **`services/multipleJobMatcher.ts`**
   - Added `jdUrls` and `resumeUrls` to `MultipleMatchInput` interface
   - Added `jdUrl`, `resumeUrl`, `jdFileName`, `resumeFileName` to `MultipleMatchResult` interface
   - Updated match result creation to include URLs and filenames

2. **`routes/multipleJobMatch.ts`**
   - Added URL tracking for both JSON and FormData inputs
   - Updated response formatting to include URLs and filenames

3. **`MULTIPLE_MATCH_API.md`**
   - Updated response examples
   - Added new fields to documentation

---

## Testing

### Test with URLs
```bash
curl -X POST http://localhost:3001/match-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "job_description_urls": ["https://example.com/jd.pdf"],
    "resume_urls": ["https://example.com/resume.pdf"]
  }'
```

**Expected Response:**
```json
{
  "POST Response": [
    {
      "Id": "...",
      "JD URL": "https://example.com/jd.pdf",
      "Resume URL": "https://example.com/resume.pdf",
      "JD Filename": "jd.pdf",
      "Resume Filename": "resume.pdf",
      ...
    }
  ]
}
```

### Test with File Upload
```bash
curl -X POST http://localhost:3001/match-multiple \
  -F "job_descriptions=@jd.pdf" \
  -F "resumes=@resume.pdf"
```

**Expected Response:**
```json
{
  "POST Response": [
    {
      "Id": "...",
      "JD URL": null,
      "Resume URL": null,
      "JD Filename": "jd.pdf",
      "Resume Filename": "resume.pdf",
      ...
    }
  ]
}
```

---

## Important Notes

⚠️ **URL vs Filename**:
- URLs are only available when files are provided via JSON (URL-based input)
- Filenames are always available regardless of input method

⚠️ **Null Values**:
- When using FormData upload, `JD URL` and `Resume URL` will be `null`
- This is expected behavior - filenames are still provided

⚠️ **URL Validity**:
- URLs in the response are the same URLs provided in the request
- No validation is done on URL accessibility in the response
- URLs are for reference/tracking purposes

---

## Backward Compatibility

✅ **Fully backward compatible**
- Existing integrations continue to work
- New fields are added to the response
- No breaking changes to existing fields

---

## Next Steps

1. ✅ Restart server: `bun run dev`
2. ✅ Clear cache: `bun run clear-cache`
3. ✅ Test with URLs: `bun run test-urls`
4. ✅ Verify response includes URLs and filenames
5. ✅ Update your client code to use the new fields (optional)
