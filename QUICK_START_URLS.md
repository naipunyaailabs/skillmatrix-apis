# 🚀 Quick Start Guide - URL-Based Multiple Matching

## Overview
Your API now accepts **file URLs** instead of requiring file uploads! This makes it perfect for:
- ✅ Files already in cloud storage (S3, Google Cloud Storage, Azure Blob)
- ✅ Automated HR pipelines
- ✅ Integration with document management systems
- ✅ Reducing client bandwidth usage

## What You Need

### 1. File URLs
Your PDF files must be:
- Hosted online (publicly accessible or accessible from your server)
- Accessible via `http://` or `https://`
- Valid PDF files (not scanned images for best results)

### Example Valid URLs:
```
https://storage.googleapis.com/my-bucket/resumes/john_doe.pdf
https://s3.amazonaws.com/hr-docs/jds/software_engineer.pdf
https://mycdn.com/documents/resume.pdf
```

## Quick Test

### Step 1: Prepare Your URLs
Edit `test-urls-example.json` with your actual file URLs:
```json
{
  "job_description_urls": [
    "https://your-storage.com/jds/position1.pdf",
    "https://your-storage.com/jds/position2.pdf"
  ],
  "resume_urls": [
    "https://your-storage.com/resumes/candidate1.pdf",
    "https://your-storage.com/resumes/candidate2.pdf"
  ]
}
```

### Step 2: Test with cURL
```bash
curl -X POST http://localhost:3001/match-multiple \
  -H "Content-Type: application/json" \
  -d @test-urls-example.json
```

### Step 3: View Results
The API will return ALL combinations with matching scores:
```json
{
  "POST Response": [
    {
      "Id": "...",
      "Resume Data": {
        "name": "John Doe",
        "email": "john@example.com",
        "Job Title": "Software Engineer",
        "Matching Percentage": "75",
        "skills": ["Python", "JavaScript", "React"]
      },
      "Analysis": {
        "Matching Score": 75,
        "Matched Skills": ["Python", "JavaScript"],
        "Unmatched Skills": ["Go", "Kubernetes"],
        "Strengths": ["Strong backend experience"],
        "Recommendations": ["Consider learning containerization"]
      }
    }
  ]
}
```

## Integration Examples

### JavaScript/TypeScript
```typescript
const response = await fetch('http://localhost:3001/match-multiple', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
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

// Process matches
matches.forEach(match => {
  console.log(`${match['Resume Data'].name}: ${match.Analysis['Matching Score']}%`);
});
```

### Python
```python
import requests

url = 'http://localhost:3001/match-multiple'
payload = {
    'job_description_urls': [
        'https://storage.example.com/jds/engineer.pdf'
    ],
    'resume_urls': [
        'https://storage.example.com/resumes/candidate1.pdf',
        'https://storage.example.com/resumes/candidate2.pdf'
    ]
}

response = requests.post(url, json=payload)
result = response.json()

# Process matches
for match in result['POST Response']:
    name = match['Resume Data']['name']
    score = match['Analysis']['Matching Score']
    print(f"{name}: {score}%")
```

### Node.js
```javascript
const fetch = require('node-fetch');

async function matchCandidates() {
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
  return result['POST Response'];
}

matchCandidates().then(matches => {
  matches.forEach(match => {
    console.log(`${match['Resume Data'].name}: ${match.Analysis['Matching Score']}%`);
  });
});
```

## Common Use Cases

### 1. Files in AWS S3
```json
{
  "job_description_urls": [
    "https://s3.amazonaws.com/my-bucket/jds/position1.pdf"
  ],
  "resume_urls": [
    "https://s3.amazonaws.com/my-bucket/resumes/candidate1.pdf"
  ]
}
```

### 2. Files in Google Cloud Storage
```json
{
  "job_description_urls": [
    "https://storage.googleapis.com/my-bucket/jds/position1.pdf"
  ],
  "resume_urls": [
    "https://storage.googleapis.com/my-bucket/resumes/candidate1.pdf"
  ]
}
```

### 3. Files in Azure Blob Storage
```json
{
  "job_description_urls": [
    "https://mystorageaccount.blob.core.windows.net/jds/position1.pdf"
  ],
  "resume_urls": [
    "https://mystorageaccount.blob.core.windows.net/resumes/candidate1.pdf"
  ]
}
```

### 4. Mixed Sources
```json
{
  "job_description_urls": [
    "https://s3.amazonaws.com/bucket1/jd.pdf",
    "https://storage.googleapis.com/bucket2/jd.pdf"
  ],
  "resume_urls": [
    "https://cdn.example.com/resume1.pdf",
    "https://myserver.com/files/resume2.pdf"
  ]
}
```

## Response Structure

Every match includes:

### Resume Data
- `name`: Candidate name
- `email`: Candidate email
- `mobile_number`: Phone number
- `skills`: All skills (matched + unmatched)
- `experience`: Years of experience
- `certifications`: List of certifications
- `Job Title`: JD position title
- `Matching Percentage`: Score as string

### Analysis
- `Matching Score`: Overall match percentage (0-100)
- `Matched Skills`: Skills candidate has
- `Unmatched Skills`: Required skills candidate lacks
- `Matched Skills Percentage`: % of skills matched
- `Strengths`: List of candidate strengths
- `Recommendations`: Suggestions for candidate
- `Required Industrial Experience`: JD requirement
- `Candidate Industrial Experience`: Candidate's experience
- `Required Domain Experience`: Domain requirement
- `Candidate Domain Experience`: Candidate's domain exp

## Key Changes from Previous Version

### ✅ Returns ALL Matches
**Before**: Only matches with score ≥ 60% were returned
**Now**: ALL combinations are returned with actual scores

**Why?** So you can:
- See the full picture
- Apply your own filtering criteria
- Understand why candidates don't match
- Make informed decisions

### ✅ URL Support
**Before**: Only file uploads via FormData
**Now**: Also accepts file URLs via JSON

**Why?** Because:
- Files are often already online
- Reduces upload time
- Easier automation
- Better cloud integration

## Error Handling

### Invalid URLs
```json
{
  "success": false,
  "error": "Invalid URL format(s) detected",
  "invalidUrls": ["not-a-url", "ftp://wrong-protocol.com/file.pdf"]
}
```

### Download Failures
```json
{
  "success": false,
  "error": "Failed to download some resume files",
  "failures": [
    {
      "url": "https://example.com/missing.pdf",
      "error": "HTTP error! status: 404 - Not Found"
    }
  ]
}
```

### No Files
```json
{
  "success": false,
  "error": "No resume files provided. Provide either \"resume_urls\" (JSON) or \"resumes\" (FormData)."
}
```

## Troubleshooting

### Problem: No results returned
**Solution**: 
- Check if URLs are accessible
- Verify PDFs are valid (not corrupted)
- Check server logs for extraction errors

### Problem: Download fails
**Solution**:
- Ensure URLs are publicly accessible
- Check firewall/network settings
- Verify HTTPS certificates are valid

### Problem: Low matching scores
**Solution**:
- This is expected! You now see ALL matches
- Filter results on your end based on your criteria
- Scores <60% indicate poor fit

## Performance Tips

1. **Use Cached URLs**: If possible, use CDN URLs for faster downloads
2. **Batch Smartly**: Don't exceed limits (10 JDs × 50 resumes)
3. **Monitor Timing**: First request is slower (extraction), subsequent requests are cached
4. **Check File Sizes**: Smaller PDFs download and process faster

## Limits

- **Max JDs**: 10
- **Max Resumes**: 50
- **Max Combinations**: 500
- **File Size**: 10MB per file (recommended)
- **Cache Duration**: 24h for extractions, 12h for matches

## Support

For issues or questions:
1. Check `API_DOCUMENTATION_URLS.md` for detailed docs
2. Review `CHANGES_SUMMARY.md` for what changed
3. Check server logs in terminal where `bun run dev` is running
4. Test with `bun run test-urls` (after updating URLs)

## Example Workflow

```bash
# 1. Start server
bun run dev

# 2. Test with example URLs
curl -X POST http://localhost:3001/match-multiple \
  -H "Content-Type: application/json" \
  -d @test-urls-example.json

# 3. View results
cat test-url-results.json | jq '.["POST Response"][0]'

# 4. Integrate into your app
# Use the JavaScript/Python examples above
```

## Next Steps

1. ✅ Update `test-urls-example.json` with your URLs
2. ✅ Test: `curl -X POST http://localhost:3001/match-multiple -H "Content-Type: application/json" -d @test-urls-example.json`
3. ✅ Integrate into your application using the examples above
4. ✅ Process results based on your criteria (scores, skills, etc.)

---

**Happy Matching! 🎯**
