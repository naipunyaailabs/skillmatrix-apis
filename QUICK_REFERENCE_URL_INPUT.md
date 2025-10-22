# Quick Reference: URL Input Support

## 🚀 Quick Start

### JD Extraction with URL
```bash
curl -X POST http://localhost:3001/extract-jd-new \
  -H "Content-Type: application/json" \
  -d '{"job_description_url": "https://example.com/jd.pdf"}'
```

### MCQ Generation with URLs
```bash
curl -X POST http://localhost:3001/generate-mcq \
  -H "Content-Type: application/json" \
  -d '{
    "job_description_url": "https://example.com/jd.pdf",
    "resume_url": "https://example.com/resume.pdf"
  }'
```

---

## 📋 Field Names Reference

| Endpoint | URL Fields | File Fields |
|----------|-----------|-------------|
| `/extract-jd-new` | `job_description_url` or `jd_url` | `job_description` |
| `/generate-mcq` | `job_description_url` or `jd_url`<br>`resume_url` | `job_description`<br>`resumes` |

---

## ✅ Supported Input Methods

### Method 1: URL Input (NEW)
- **Content-Type:** `application/json`
- **Body:** JSON with URL fields
- **Benefits:** No file upload, works with hosted files

### Method 2: File Upload (Existing)
- **Content-Type:** `multipart/form-data`
- **Body:** FormData with file fields
- **Benefits:** Direct upload from user device

---

## 🔧 JavaScript Examples

### JD Extraction
```javascript
// Method 1: URL Input
await fetch('http://localhost:3001/extract-jd-new', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    job_description_url: 'https://example.com/jd.pdf'
  })
});

// Method 2: File Upload
const formData = new FormData();
formData.append('job_description', fileBlob);
await fetch('http://localhost:3001/extract-jd-new', {
  method: 'POST',
  body: formData
});
```

### MCQ Generation
```javascript
// Method 1: URL Input
await fetch('http://localhost:3001/generate-mcq', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    job_description_url: 'https://example.com/jd.pdf',
    resume_url: 'https://example.com/resume.pdf'
  })
});

// Method 2: File Upload
const formData = new FormData();
formData.append('job_description', jdFile);
formData.append('resumes', resumeFile);
await fetch('http://localhost:3001/generate-mcq', {
  method: 'POST',
  body: formData
});
```

---

## ⚠️ Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "No job description URL provided" | Missing URL field | Add `job_description_url` or `jd_url` |
| "Invalid URL format" | URL doesn't start with http/https | Use proper URL format |
| "Failed to download file from URL" | URL not accessible | Ensure URL is publicly accessible |
| "Invalid content type" | Wrong Content-Type | Use `application/json` for URLs |

---

## 🎯 When to Use Each Method

### Use URL Input When:
- ✅ Files are already hosted (S3, Google Cloud, etc.)
- ✅ Integrating with document management systems
- ✅ Processing publicly available documents
- ✅ Batch processing from file servers

### Use File Upload When:
- ✅ Users uploading from their device
- ✅ Files not hosted anywhere
- ✅ Better privacy needed
- ✅ One-time processing

---

## 🔒 URL Requirements

### Valid URLs
- ✅ `https://example.com/document.pdf`
- ✅ `http://localhost:8000/file.pdf`
- ✅ `https://storage.googleapis.com/bucket/doc.pdf`

### Invalid URLs
- ❌ `ftp://example.com/file.pdf` (wrong protocol)
- ❌ `example.com/file.pdf` (missing protocol)
- ❌ `https://private-site.com/doc.pdf` (not accessible)

---

## 📝 Test Scripts

```bash
# Test JD extraction with URL
bun run testJdExtractUrl.ts

# Test MCQ generation with URLs
bun run testMcqUrl.ts
```

---

## 📚 Full Documentation

For complete details, see: [`URL_INPUT_UPDATE.md`](./URL_INPUT_UPDATE.md)
