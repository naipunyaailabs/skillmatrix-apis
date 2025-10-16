# Multiple Job Matching API

## Overview
Match multiple job descriptions with multiple resumes in a single API call. Returns comprehensive matching analysis for **ALL combinations**.

---

## Endpoint
```
POST /match-multiple
```

---

## Input Methods

### Option 1: URL-Based (Recommended for Cloud Storage)
**Content-Type:** `application/json`

```json
{
  "job_description_urls": [
    "https://storage.example.com/jds/software_engineer.pdf",
    "https://storage.example.com/jds/data_scientist.pdf"
  ],
  "resume_urls": [
    "https://storage.example.com/resumes/john_doe.pdf",
    "https://storage.example.com/resumes/jane_smith.pdf",
    "https://storage.example.com/resumes/bob_jones.pdf"
  ]
}
```

**Alternative field names:**
- `jdUrls` instead of `job_description_urls`
- `resumeUrls` instead of `resume_urls`

### Option 2: File Upload (Original Method)
**Content-Type:** `multipart/form-data`

```bash
curl -X POST http://localhost:3001/match-multiple \
  -F "job_descriptions=@jd1.pdf" \
  -F "job_descriptions=@jd2.pdf" \
  -F "resumes=@resume1.pdf" \
  -F "resumes=@resume2.pdf"
```

---

## Response Format

```json
{
  "POST Response": [
    {
      "Id": "550e8400-e29b-41d4-a716-446655440000",
      "JD URL": "https://storage.example.com/jds/ai_ml_intern.pdf",
      "Resume URL": "https://storage.example.com/resumes/john_doe.pdf",
      "JD Filename": "ai_ml_intern.pdf",
      "Resume Filename": "john_doe.pdf",
      "Resume Data": {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "mobile_number": "+1-234-567-8900",
        "Job Title": "Software Engineer",
        "Matching Percentage": "75",
        "experience": 3,
        "skills": ["Python", "JavaScript", "React", "Node.js"],
        "certifications": ["AWS Certified Developer"],
        "total_experience": ["Software Engineer at XYZ Corp - 2 years"]
      },
      "Analysis": {
        "Matching Score": 75,
        "Matched Skills": ["Python", "JavaScript", "React"],
        "Unmatched Skills": ["Go", "Kubernetes"],
        "Matched Skills Percentage": 65,
        "Unmatched Skills Percentage": 35,
        "Strengths": [
          "Strong backend development experience",
          "Proven frontend skills with React"
        ],
        "Recommendations": [
          "Consider learning containerization with Kubernetes",
          "Explore Go programming for microservices"
        ],
        "Required Industrial Experience": "2 years",
        "Candidate Industrial Experience": "3 years",
        "Required Domain Experience": "1 years",
        "Candidate Domain Experience": "2 years"
      }
    }
  ]
}
```

---

## Examples

### JavaScript/TypeScript
```javascript
const response = await fetch('http://localhost:3001/match-multiple', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    job_description_urls: [
      'https://storage.example.com/jds/engineer.pdf'
    ],
    resume_urls: [
      'https://storage.example.com/resumes/candidate1.pdf',
      'https://storage.example.com/resumes/candidate2.pdf'
    ]
  })
});

const result = await response.json();
const matches = result['POST Response'];

// Filter high-scoring matches
const topCandidates = matches.filter(m => m.Analysis['Matching Score'] >= 70);
```

### Python
```python
import requests

response = requests.post(
    'http://localhost:3001/match-multiple',
    json={
        'job_description_urls': ['https://storage.example.com/jd.pdf'],
        'resume_urls': [
            'https://storage.example.com/resume1.pdf',
            'https://storage.example.com/resume2.pdf'
        ]
    }
)

matches = response.json()['POST Response']
for match in matches:
    name = match['Resume Data']['name']
    score = match['Analysis']['Matching Score']
    print(f"{name}: {score}%")
```

### cURL
```bash
# URL-based
curl -X POST http://localhost:3001/match-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "job_description_urls": ["https://example.com/jd.pdf"],
    "resume_urls": ["https://example.com/resume.pdf"]
  }'

# File upload
curl -X POST http://localhost:3001/match-multiple \
  -F "job_descriptions=@jd.pdf" \
  -F "resumes=@resume.pdf"
```

---

## Key Features

✅ **Returns ALL Combinations** - No score filtering (e.g., 3 JDs × 4 Resumes = 12 results)  
✅ **Dual Input Support** - Accept URLs or file uploads  
✅ **Smart Caching** - 24h for extractions, 12h for matches  
✅ **Comprehensive Analysis** - Skills, experience, strengths, recommendations  
✅ **Cloud Ready** - Works with S3, Google Cloud Storage, Azure Blob  
✅ **Concurrent Processing** - Optimized for performance  

---

## Limits

| Item | Limit |
|------|-------|
| Max JDs | 10 |
| Max Resumes | 50 |
| Max Combinations | 500 (10 × 50) |
| Max File Size | 10 MB |
| Supported Format | PDF only |
| URL Protocol | http:// or https:// |

---

## Error Responses

### Invalid URL Format (400)
```json
{
  "success": false,
  "requestId": "uuid",
  "error": "Invalid URL format(s) detected",
  "invalidUrls": ["ftp://wrong-protocol.com/file.pdf"]
}
```

### Download Failed (400)
```json
{
  "success": false,
  "requestId": "uuid",
  "error": "Failed to download some resume files",
  "failures": [
    {
      "url": "https://example.com/missing.pdf",
      "error": "HTTP error! status: 404 - Not Found"
    }
  ]
}
```

### No Files Provided (400)
```json
{
  "success": false,
  "requestId": "uuid",
  "error": "No resume files provided. Provide either \"resume_urls\" (JSON) or \"resumes\" (FormData)."
}
```

### Batch Limit Exceeded (400)
```json
{
  "success": false,
  "requestId": "uuid",
  "error": "Batch size limit exceeded: maximum 10 JDs × 50 resumes allowed"
}
```

---

## Use Cases

### 1. Recruitment Pipeline
```javascript
// Match 50 candidates against 5 job openings
const result = await matchMultiple({
  job_description_urls: [/* 5 JD URLs */],
  resume_urls: [/* 50 resume URLs */]
});
// Returns 250 matches (5 × 50)
```

### 2. Talent Pool Screening
```python
# Screen candidate database against new position
matches = match_multiple(
    job_description_urls=[new_position_url],
    resume_urls=database_candidate_urls
)
```

### 3. Cloud Storage Integration
```bash
# Process S3-hosted files directly
curl -X POST http://localhost:3001/match-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "job_description_urls": [
      "https://s3.amazonaws.com/hr-bucket/jds/engineer.pdf"
    ],
    "resume_urls": [
      "https://s3.amazonaws.com/hr-bucket/resumes/candidate1.pdf"
    ]
  }'
```

---

## Important Notes

⚠️ **ALL combinations are returned** - Unlike other APIs, this endpoint returns every combination regardless of matching score. Filter results on your end based on your criteria.

⚠️ **URL Requirements:**
- Must use `http://` or `https://` protocol
- Files must be publicly accessible or accessible from server
- Must point to valid PDF files

⚠️ **PDF Requirements:**
- Text-based PDFs (not scanned images) work best
- Maximum 10 MB per file
- Corrupted or encrypted PDFs will fail

---

## Performance Tips

1. **Use Caching**: Subsequent requests with same files are 10-20x faster
2. **Cloud Storage**: Use CDN URLs for faster downloads
3. **Batch Smartly**: Stay within limits for optimal performance
4. **Monitor Results**: First request is slower (extraction), subsequent are cached

---

## Testing

### Quick Test
```bash
# 1. Update test file with your URLs
nano test-urls-example.json

# 2. Test API
curl -X POST http://localhost:3001/match-multiple \
  -H "Content-Type: application/json" \
  -d @test-urls-example.json

# 3. Or use test script
bun run test-urls
```

### Clear Cache
```bash
bun run clear-cache
```

---

## Response Fields Reference

### Resume Data Fields
- `Id` - Unique match identifier
- `JD URL` - URL of the job description file (null if uploaded via FormData)
- `Resume URL` - URL of the resume file (null if uploaded via FormData)
- `JD Filename` - Filename of the job description
- `Resume Filename` - Filename of the resume
- `name` - Candidate name
- `email` - Contact email
- `mobile_number` - Phone number
- `Job Title` - JD position title
- `Matching Percentage` - Overall score (string)
- `experience` - Years of experience (number)
- `skills` - All skills (matched + unmatched)
- `certifications` - List of certifications
- `total_experience` - Detailed work history

### Analysis Fields
- `Matching Score` - Overall score (0-100)
- `Matched Skills` - Skills candidate has
- `Unmatched Skills` - Skills candidate lacks
- `Matched Skills Percentage` - % of skills matched
- `Strengths` - Key candidate strengths
- `Recommendations` - Improvement suggestions
- `Required Industrial Experience` - JD requirement
- `Candidate Industrial Experience` - Candidate's experience
- `Required Domain Experience` - Domain requirement
- `Candidate Domain Experience` - Candidate's domain exp

---

## Troubleshooting

**Problem:** No results returned  
**Solution:** Check server logs, verify PDFs are text-based, clear cache

**Problem:** Download failures  
**Solution:** Verify URLs are accessible, check network/firewall settings

**Problem:** Low matching scores  
**Solution:** Normal behavior - all combinations returned. Filter based on your criteria

**Problem:** Server timeout  
**Solution:** Reduce batch size, check file sizes, verify PDFs are valid

---

## Support

- **Documentation:** See related docs in project folder
- **Test Script:** `bun run test-urls`
- **Clear Cache:** `bun run clear-cache`
- **Server Logs:** Check terminal where `bun run dev` is running

For detailed examples and integration guides, refer to:
- `QUICK_START_URLS.md`
- `API_DOCUMENTATION_URLS.md`
- `CHANGES_SUMMARY.md`
