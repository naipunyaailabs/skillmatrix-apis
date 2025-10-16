# Multiple Job Matching API - URL-Based Input

## Overview
The `/match-multiple` endpoint now supports **TWO input methods**:
1. **URL-based**: Provide URLs to PDF files (recommended for remote files)
2. **File Upload**: Upload PDF files directly via FormData (original method)

## Endpoint
```
POST /match-multiple
```

## Method 1: URL-Based Input (NEW)

### Request Format
```http
POST /match-multiple
Content-Type: application/json
```

### Request Body
```json
{
  "job_description_urls": [
    "https://example.com/jds/ai_ml_intern.pdf",
    "https://example.com/jds/frontend_developer.pdf"
  ],
  "resume_urls": [
    "https://example.com/resumes/candidate1.pdf",
    "https://example.com/resumes/candidate2.pdf",
    "https://example.com/resumes/candidate3.pdf"
  ]
}
```

### Alternative Field Names (Supported)
```json
{
  "jdUrls": ["..."],      // Alternative to job_description_urls
  "resumeUrls": ["..."]   // Alternative to resume_urls
}
```

### Example with cURL
```bash
curl -X POST http://localhost:3001/match-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "job_description_urls": [
      "https://storage.example.com/jds/ai_ml_intern.pdf"
    ],
    "resume_urls": [
      "https://storage.example.com/resumes/john_doe.pdf",
      "https://storage.example.com/resumes/jane_smith.pdf"
    ]
  }'
```

### Example with JavaScript/TypeScript
```typescript
const response = await fetch('http://localhost:3001/match-multiple', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    job_description_urls: [
      'https://example.com/jds/ai_ml_intern.pdf'
    ],
    resume_urls: [
      'https://example.com/resumes/candidate1.pdf',
      'https://example.com/resumes/candidate2.pdf'
    ]
  })
});

const result = await response.json();
```

### Example with Python
```python
import requests

url = 'http://localhost:3001/match-multiple'
data = {
    'job_description_urls': [
        'https://example.com/jds/ai_ml_intern.pdf'
    ],
    'resume_urls': [
        'https://example.com/resumes/candidate1.pdf',
        'https://example.com/resumes/candidate2.pdf'
    ]
}

response = requests.post(url, json=data)
result = response.json()
```

## Method 2: File Upload (Original)

### Request Format
```http
POST /match-multiple
Content-Type: multipart/form-data
```

### Example with cURL
```bash
curl -X POST http://localhost:3001/match-multiple \
  -F "job_descriptions=@jd1.pdf" \
  -F "job_descriptions=@jd2.pdf" \
  -F "resumes=@resume1.pdf" \
  -F "resumes=@resume2.pdf"
```

### Example with JavaScript FormData
```typescript
const formData = new FormData();

// Add JD files
formData.append('job_descriptions', jdFile1);
formData.append('job_descriptions', jdFile2);

// Add resume files
formData.append('resumes', resumeFile1);
formData.append('resumes', resumeFile2);

const response = await fetch('http://localhost:3001/match-multiple', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

## Response Format

### Success Response (200 OK)
```json
{
  "POST Response": [
    {
      "Id": "uuid-here",
      "Resume Data": {
        "Job Title": "AI / ML Intern",
        "Matching Percentage": "75",
        "college_name": null,
        "company_names": [],
        "degree": null,
        "designation": null,
        "email": "candidate@example.com",
        "experience": 3,
        "mobile_number": "+1234567890",
        "name": "John Doe",
        "no_of_pages": null,
        "skills": ["Python", "Machine Learning", "TensorFlow"],
        "certifications": ["AWS Certified ML"],
        "total_experience": ["3 years at XYZ Corp"]
      },
      "Analysis": {
        "Matching Score": 75,
        "Unmatched Skills": ["Deep Learning", "PyTorch"],
        "Matched Skills": ["Python", "Machine Learning"],
        "Matched Skills Percentage": 65,
        "Unmatched Skills Percentage": 35,
        "Strengths": ["Strong Python background", "ML experience"],
        "Recommendations": ["Consider learning PyTorch"],
        "Required Industrial Experience": "2 years",
        "Required Domain Experience": "1 years",
        "Candidate Industrial Experience": "3 years",
        "Candidate Domain Experience": "2 years"
      }
    }
  ]
}
```

## Error Responses

### Invalid URL Format (400 Bad Request)
```json
{
  "success": false,
  "requestId": "uuid-here",
  "error": "Invalid URL format(s) detected",
  "invalidUrls": [
    "not-a-valid-url",
    "ftp://invalid-protocol.com/file.pdf"
  ]
}
```

### Download Failed (400 Bad Request)
```json
{
  "success": false,
  "requestId": "uuid-here",
  "error": "Failed to download some resume files",
  "failures": [
    {
      "url": "https://example.com/missing.pdf",
      "error": "HTTP error! status: 404 - Not Found"
    }
  ]
}
```

### No Files Provided (400 Bad Request)
```json
{
  "success": false,
  "requestId": "uuid-here",
  "error": "No resume files provided. Provide either \"resume_urls\" (JSON) or \"resumes\" (FormData)."
}
```

### Batch Limit Exceeded (400 Bad Request)
```json
{
  "success": false,
  "requestId": "uuid-here",
  "error": "Batch size limit exceeded: maximum 10 JDs × 50 resumes allowed"
}
```

### Server Error (500 Internal Server Error)
```json
{
  "success": false,
  "error": "Error message here",
  "details": "Stack trace (only in development mode)"
}
```

## Features

### ✅ Returns ALL Matches
- Returns **every combination** of JD × Resume
- No filtering by score (unlike previous version which filtered <60%)
- You receive complete matching data for all combinations

### ✅ Smart Caching
- Extractions are cached for 24 hours
- Matching results cached for 12 hours
- Significantly faster for repeated requests with same files

### ✅ Concurrent Processing
- Sequential extraction (concurrency: 1) to avoid race conditions
- Parallel matching (concurrency: 3) for optimal performance

### ✅ Comprehensive Analysis
Each match includes:
- Overall matching score (0-100)
- Matched vs unmatched skills breakdown
- Strengths and recommendations
- Experience comparison (industrial & domain)
- Detailed candidate information

## Limits

- **Maximum JDs**: 10
- **Maximum Resumes**: 50
- **Maximum Combinations**: 500 (10 × 50)
- **File Size**: 10MB per file (configurable)
- **File Type**: PDF only

## URL Requirements

### Valid URLs
- Must use `http://` or `https://` protocol
- Must be publicly accessible or accessible from server
- Must point directly to PDF files

### Examples of Valid URLs
```
✅ https://storage.googleapis.com/bucket/resume.pdf
✅ https://s3.amazonaws.com/bucket/jd.pdf
✅ http://example.com/files/document.pdf
✅ https://cdn.example.com/pdfs/file.pdf
```

### Examples of Invalid URLs
```
❌ ftp://example.com/file.pdf          (Wrong protocol)
❌ /local/path/file.pdf                (Local path, not URL)
❌ example.com/file.pdf                (Missing protocol)
❌ https://example.com/file.docx       (Not a PDF - will fail)
```

## Performance Considerations

### URL-Based Input
- **Pros**: 
  - No file upload time
  - Works great for files already in cloud storage
  - Lower client bandwidth usage
- **Cons**: 
  - Server must download files
  - Requires files to be publicly accessible
  - Additional network latency

### File Upload
- **Pros**: 
  - Works with local files
  - No need for file hosting
- **Cons**: 
  - Upload time for large files
  - Higher client bandwidth usage

## Use Cases

### URL-Based (Recommended When)
- Files are already hosted in cloud storage (S3, GCS, Azure Blob)
- Integrating with existing document management systems
- Building automated pipelines
- Files are large and already online

### File Upload (Recommended When)
- Files are on user's local machine
- Files are not yet hosted anywhere
- Privacy concerns (files stay within your control)
- Testing with local files

## Example: Complete Workflow

```typescript
// 1. Upload files to your storage (if needed)
const jdUrl = await uploadToStorage(jdFile);
const resumeUrl = await uploadToStorage(resumeFile);

// 2. Call matching API
const response = await fetch('http://localhost:3001/match-multiple', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    job_description_urls: [jdUrl],
    resume_urls: [resumeUrl]
  })
});

// 3. Process results
const result = await response.json();
const matches = result['POST Response'];

matches.forEach(match => {
  console.log(`${match['Resume Data'].name} - ${match.Analysis['Matching Score']}%`);
});
```

## Testing

Run the test script with URLs:
```bash
# 1. Update URLs in testMultipleWithUrls.ts
# 2. Run test
bun run testMultipleWithUrls.ts
```

Or test with cURL:
```bash
curl -X POST http://localhost:3001/match-multiple \
  -H "Content-Type: application/json" \
  -d @test-urls.json
```

Where `test-urls.json` contains:
```json
{
  "job_description_urls": ["https://..."],
  "resume_urls": ["https://..."]
}
```
