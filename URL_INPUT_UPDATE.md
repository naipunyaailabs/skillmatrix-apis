# URL Input Support Update

## Overview

Both **JD Extractor New** and **MCQ Generator** endpoints now support **URL-based input** in addition to file uploads. This allows you to provide file URLs instead of uploading files directly.

---

## 🎯 Updated Endpoints

### 1. JD Extractor New - `/extract-jd-new`
**Supports:** File Upload OR URL Input

### 2. MCQ Generator - `/generate-mcq`
**Supports:** File Upload OR URL Input

### 3. Voice Interview Generator - `/generate-voice-questions`
**Supports:** File Upload OR URL Input

---

## 📝 API Usage

### Option 1: URL-Based Input (NEW ✨)

#### JD Extractor New with URL

**Endpoint:** `POST /extract-jd-new`  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "job_description_url": "https://example.com/jd.pdf"
}
```

**Alternative field names:**
```json
{
  "jd_url": "https://example.com/jd.pdf"
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:3001/extract-jd-new \
  -H "Content-Type: application/json" \
  -d '{
    "job_description_url": "https://example.com/jd.pdf"
  }'
```

**Example with JavaScript:**
```javascript
const response = await fetch('http://localhost:3001/extract-jd-new', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    job_description_url: 'https://example.com/jd.pdf'
  })
});

const data = await response.json();
```

---

#### MCQ Generator with URLs

**Endpoint:** `POST /generate-mcq`  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "job_description_url": "https://example.com/jd.pdf",
  "resume_url": "https://example.com/resume.pdf"
}
```

**Alternative field names:**
```json
{
  "jd_url": "https://example.com/jd.pdf",
  "resume_url": "https://example.com/resume.pdf"
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:3001/generate-mcq \
  -H "Content-Type: application/json" \
  -d '{
    "job_description_url": "https://example.com/jd.pdf",
    "resume_url": "https://example.com/resume.pdf"
  }'
```

**Example with JavaScript:**
```javascript
const response = await fetch('http://localhost:3001/generate-mcq', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    job_description_url: 'https://example.com/jd.pdf',
    resume_url: 'https://example.com/resume.pdf'
  })
});

const data = await response.json();
```

**Example with Python:**
```python
import requests

response = requests.post(
    'http://localhost:3001/generate-mcq',
    json={
        'job_description_url': 'https://example.com/jd.pdf',
        'resume_url': 'https://example.com/resume.pdf'
    }
)

data = response.json()
```

---

#### Voice Interview Generator with URL

**Endpoint:** `POST /generate-voice-questions`  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "job_description_url": "https://example.com/jd.pdf"
}
```

**Alternative field names:**
```json
{
  "jd_url": "https://example.com/jd.pdf"
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:3001/generate-voice-questions \
  -H "Content-Type: application/json" \
  -d '{
    "job_description_url": "https://example.com/jd.pdf"
  }'
```

**Example with JavaScript:**
```javascript
const response = await fetch('http://localhost:3001/generate-voice-questions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    job_description_url: 'https://example.com/jd.pdf'
  })
});

const data = await response.json();
```

**Example with Python:**
```python
import requests

response = requests.post(
    'http://localhost:3001/generate-voice-questions',
    json={'job_description_url': 'https://example.com/jd.pdf'}
)

data = response.json()
```

---

### Option 2: File Upload (Existing)

#### JD Extractor New with File Upload

**Endpoint:** `POST /extract-jd-new`  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `job_description`: PDF file

**Example with cURL:**
```bash
curl -X POST http://localhost:3001/extract-jd-new \
  -F "job_description=@/path/to/jd.pdf"
```

---

#### MCQ Generator with File Upload

**Endpoint:** `POST /generate-mcq`  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `job_description`: PDF file
- `resumes`: PDF file (or `resume` for backward compatibility)

**Example with cURL:**
```bash
curl -X POST http://localhost:3001/generate-mcq \
  -F "job_description=@/path/to/jd.pdf" \
  -F "resumes=@/path/to/resume.pdf"
```

---

#### Voice Interview Generator with File Upload

**Endpoint:** `POST /generate-voice-questions`  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `job_description`: PDF file

**Example with cURL:**
```bash
curl -X POST http://localhost:3001/generate-voice-questions \
  -F "job_description=@/path/to/jd.pdf"
```

---

## 🔍 Request/Response Details

### JD Extractor New Response

**Success Response:**
```json
{
  "success": true,
  "data": {
    "jobTitle": "Senior Software Engineer",
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "employmentType": "Full-time",
    "experienceRequired": "5+ years",
    "skillsRequired": ["Python", "JavaScript", "React"],
    "responsibilities": ["Design systems", "Lead team"],
    "qualifications": ["Bachelor's degree", "5+ years experience"],
    "benefits": ["Health insurance", "401k"],
    "salaryRange": "$120,000 - $180,000",
    "applicationDeadline": "2025-11-30",
    "contactInfo": "hr@techcorp.com"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to download file from URL",
  "details": "HTTP error! status: 404"
}
```

---

### MCQ Generator Response

**Success Response:**
```json
{
  "POST Response": [
    {
      "Id": "uuid-string",
      "MCQ with answers": {
        "questions": [
          {
            "question": "What is React?",
            "options": ["A", "B", "C", "D"],
            "answer": "A library for building UIs",
            "explanation": "React is a JavaScript library..."
          }
        ]
      }
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "No job description URL provided. Expected field: job_description_url or jd_url"
}
```

---

### Voice Interview Generator Response

**Success Response:**
```json
{
  "POST Response": [
    {
      "Id": "uuid-string",
      "Questions": {
        "questions": [
          {
            "question": "Can you describe your experience with React?"
          },
          {
            "question": "How do you handle state management in large applications?"
          }
        ]
      }
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to download file from URL",
  "details": "HTTP error! status: 404"
}
```

---

## ⚠️ Error Handling

### Common Errors

#### 1. Missing URL
**Status:** 400  
**Response:**
```json
{
  "success": false,
  "error": "No job description URL provided. Expected field: job_description_url or jd_url"
}
```

#### 2. Invalid URL Format
**Status:** 400  
**Response:**
```json
{
  "success": false,
  "error": "Invalid URL format. URL must start with http:// or https://"
}
```

#### 3. Download Failed
**Status:** 400  
**Response:**
```json
{
  "success": false,
  "error": "Failed to download file from URL",
  "details": "HTTP error! status: 404 - Not Found"
}
```

#### 4. Invalid Content Type
**Status:** 400  
**Response:**
```json
{
  "success": false,
  "error": "Invalid content type. Expected application/json (for URLs) or multipart/form-data (for file upload)"
}
```

---

## 🎨 URL Requirements

### Valid URL Format
- ✅ Must start with `http://` or `https://`
- ✅ Must be accessible (publicly available)
- ✅ Must point to a valid PDF file
- ✅ Should return proper content-type headers

### Examples of Valid URLs
```
https://example.com/documents/jd.pdf
https://storage.googleapis.com/bucket/jd.pdf
https://s3.amazonaws.com/bucket/resume.pdf
http://localhost:8000/files/document.pdf
```

### Examples of Invalid URLs
```
ftp://example.com/file.pdf          ❌ (wrong protocol)
example.com/file.pdf                 ❌ (missing protocol)
https://example.com/private.pdf      ❌ (not accessible)
```

---

## 🔧 Testing

### Test Scripts Provided

1. **`testJdExtractUrl.ts`** - Test JD extraction with URL
2. **`testMcqUrl.ts`** - Test MCQ generation with URLs

**Run tests:**
```bash
# Test JD extraction
bun run testJdExtractUrl.ts

# Test MCQ generation
bun run testMcqUrl.ts
```

**Note:** Update the URLs in test files with real PDF URLs before running.

---

## 📊 Comparison: File Upload vs URL Input

| Feature | File Upload | URL Input |
|---------|-------------|-----------|
| **Content-Type** | multipart/form-data | application/json |
| **Request Size** | Larger (includes file) | Smaller (just URL) |
| **Network** | Upload required | Download by server |
| **Use Case** | User uploads | Files already hosted |
| **Latency** | Upload time | Download time |
| **Caching** | Limited | Can be cached by URL |

---

## 🚀 Benefits of URL Input

1. **Reduced Client Bandwidth** - No need to upload large files
2. **Simplified Integration** - Just pass URLs from your storage
3. **Better for Already-Hosted Files** - Files in S3, Google Cloud, etc.
4. **Easier Testing** - Use publicly available test documents
5. **Backward Compatible** - File upload still works

---

## 💡 Use Cases

### When to Use URL Input
- Files are already stored in cloud storage (S3, Google Cloud, etc.)
- Integrating with existing document management systems
- Processing publicly available job postings
- Batch processing from a file server
- Testing with sample documents

### When to Use File Upload
- Users uploading files directly from their device
- Files not yet hosted anywhere
- Better privacy (files don't need to be publicly accessible)
- One-time processing

---

## 🔒 Security Considerations

### URL Input
- ⚠️ Server downloads files from provided URLs
- ✅ URL validation performed
- ✅ Only HTTP/HTTPS protocols allowed
- ⚠️ Ensure URLs point to trusted sources
- ⚠️ Rate limiting recommended for production

### Recommendations
1. Validate URL sources in production
2. Implement download timeouts
3. Limit file sizes
4. Add authentication if needed
5. Monitor download traffic

---

## 📝 Migration Guide

### Updating Existing Integrations

**Before (File Upload Only):**
```javascript
const formData = new FormData();
formData.append('job_description', fileBlob);

fetch('/extract-jd-new', {
  method: 'POST',
  body: formData
});
```

**After (Can Use URL):**
```javascript
// Option 1: Keep using file upload (backward compatible)
const formData = new FormData();
formData.append('job_description', fileBlob);

fetch('/extract-jd-new', {
  method: 'POST',
  body: formData
});

// Option 2: Use URL if file is already hosted
fetch('/extract-jd-new', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    job_description_url: 'https://your-storage.com/jd.pdf'
  })
});
```

---

## ✅ Summary

### What Changed
- ✅ Both endpoints now accept URL-based input
- ✅ Backward compatible with file uploads
- ✅ Automatic content-type detection
- ✅ Comprehensive error handling
- ✅ URL validation

### Field Names Reference

| Endpoint | URL Field Names | File Field Names |
|----------|----------------|------------------|
| `/extract-jd-new` | `job_description_url` or `jd_url` | `job_description` |
| `/generate-mcq` | `job_description_url` or `jd_url`<br>`resume_url` | `job_description`<br>`resumes` or `resume` |
| `/generate-voice-questions` | `job_description_url` or `jd_url` | `job_description` |

---

## 📞 Support

If you encounter issues:
1. Verify URL is accessible (try in browser)
2. Check URL format (must include http:// or https://)
3. Ensure PDF is valid
4. Check server logs for detailed errors

---

**Status:** ✅ **IMPLEMENTED AND READY TO USE**

**Files Modified:**
- `routes/jdExtractorNew.ts`
- `routes/mcqGenerate.ts`
- `routes/voiceInterview.ts`

**Files Created:**
- `testJdExtractUrl.ts`
- `testMcqUrl.ts`
- `testVoiceInterviewUrl.ts`
- `URL_INPUT_UPDATE.md` (this file)
