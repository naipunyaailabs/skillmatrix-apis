# 🚀 Quick Start: Multiple Job Matching

## Overview

The improved `/match-multiple` endpoint processes multiple job descriptions against multiple resumes **3x faster** with production-ready features.

---

## ⚡ Quick Example

```javascript
// 1. Prepare files
const formData = new FormData();

// Add JD files
formData.append('job_descriptions', seniorDevJD);
formData.append('job_descriptions', dataScientistJD);

// Add resume files
formData.append('resumes', johnDoeResume);
formData.append('resumes', janeSmithResume);
formData.append('resumes', bobJohnsonResume);

// 2. Send request
const response = await fetch('http://localhost:3001/match-multiple', {
  method: 'POST',
  body: formData
});

// 3. Get results
const result = await response.json();

console.log(`Total Matches: ${result['POST Response'].length}`);
if (result['POST Response'].length > 0) {
  const bestMatch = result['POST Response'][0];
  console.log(`Best Match: ${bestMatch['Resume Data'].name} → ${bestMatch['Resume Data']['Job Title']}`);
  console.log(`Score: ${bestMatch['Analysis']['Matching Score']}`);
}
```

---

## 📊 What You Get

### **Response Structure**

```json
{
  "POST Response": [
    {
      "Id": "ca1c6189-15bc-46d9-adee-5f756c344b79",
      "Resume Data": {
        "Job Title": "Frontend Developer",
        "Matching Percentage": "92",
        "college_name": null,
        "company_names": [],
        "degree": null,
        "designation": null,
        "email": "john@example.com",
        "experience": 3,
        "mobile_number": "+1-234-567-8900",
        "name": "John Doe",
        "no_of_pages": null,
        "skills": ["JavaScript", "React", "Node.js"],
        "certifications": ["AWS Certified Developer"],
        "total_experience": [
          {
            "role": "Frontend Developer",
            "company": "Tech Corp",
            "duration": "2020 - Present",
            "responsibilities": ["Built React apps", "Optimized performance"]
          }
        ]
      },
      "Analysis": {
        "Matching Score": 92,
        "Unmatched Skills": [],
        "Matched Skills": ["JavaScript", "React", "Node.js"],
        "Matched Skills Percentage": 100,
        "Unmatched Skills Percentage": 0,
        "Strengths": ["3+ years experience", "Strong React skills"],
        "Recommendations": ["Learn TypeScript", "Get AWS certification"],
        "Required Industrial Experience": "2 years",
        "Required Domain Experience": "0 years",
        "Candidate Industrial Experience": "3 years",
        "Candidate Domain Experience": "3 years"
      }
    }
  ]
}
```

---

## 🎯 Key Features

### **1. Smart Filtering**

Only returns matches with score ≥ 60:
- ✅ 92/100 → Included (excellent match)
- ✅ 75/100 → Included (good match)
- ❌ 45/100 → Filtered out (irrelevant)

### **2. Request Tracking**

Each match gets a unique `Id` for tracking:
```json
{
  "Id": "ca1c6189-15bc-46d9-adee-5f756c344b79",
  "Resume Data": { ... }
}
```

### **3. Progress Tracking**

Server logs show real-time progress:
```
INFO: Matching progress - 3/6 (50%)
INFO: Matching progress - 6/6 (100%)
```

### **4. Parallel Processing**

Processes 3 matches simultaneously:
- 2 JDs × 3 resumes = 6 combinations
- Sequential: ~60 seconds
- Parallel (3x): ~20 seconds ⚡

---

## 🛡️ Validation

### **File Validation**
- Max size: 50MB per file
- Allowed types: `.pdf` only
- Min size: 100 bytes

### **Batch Limits**
- Max JD files: 10
- Max resume files: 10
- Max combinations: 50 (JDs × resumes)

### **Error Responses**

```json
{
  "success": false,
  "requestId": "abc-123-def-456",
  "error": "File too large. Maximum size: 50MB"
}
```

---

## ⚙️ Configuration

### **Default Settings**

| Setting | Default | Description |
|---------|---------|-------------|
| `MAX_JD_FILES` | 10 | Maximum JD files per request |
| `MAX_RESUME_FILES` | 10 | Maximum resume files per request |
| `MAX_COMBINATIONS` | 50 | Maximum JD×Resume combinations |
| `MATCH_CONCURRENCY` | 3 | Parallel processing count |
| `MINIMUM_MATCH_SCORE` | 60 | Minimum score to include |

### **Environment Variables**

Create a `.env` file:

```env
# Adjust limits
MAX_JD_FILES=10
MAX_RESUME_FILES=10
MAX_COMBINATIONS=50

# Processing speed
MATCH_CONCURRENCY=3  # Higher = faster, but watch API limits

# Matching criteria
MINIMUM_MATCH_SCORE=60

# Logging
LOG_LEVEL=info
ENABLE_PROGRESS_LOGGING=true
```

---

## 📝 Complete Example

```javascript
const fs = require('fs');

async function matchMultipleJobs() {
  try {
    // 1. Load files
    const jd1 = fs.readFileSync('senior-dev.pdf');
    const jd2 = fs.readFileSync('data-scientist.pdf');
    const resume1 = fs.readFileSync('john-doe.pdf');
    const resume2 = fs.readFileSync('jane-smith.pdf');
    const resume3 = fs.readFileSync('bob-johnson.pdf');
    
    // 2. Create form data
    const formData = new FormData();
    formData.append('job_descriptions', new File([jd1], 'senior-dev.pdf'));
    formData.append('job_descriptions', new File([jd2], 'data-scientist.pdf'));
    formData.append('resumes', new File([resume1], 'john-doe.pdf'));
    formData.append('resumes', new File([resume2], 'jane-smith.pdf'));
    formData.append('resumes', new File([resume3], 'bob-johnson.pdf'));
    
    // 3. Send request
    const response = await fetch('http://localhost:3001/match-multiple', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    // 4. Handle response
    if (result['POST Response']) {
      console.log(`✅ Total Matches: ${result['POST Response'].length}`);
      
      result['POST Response'].forEach((match, index) => {
        console.log(`\n${index + 1}. ${match['Resume Data'].name} → ${match['Resume Data']['Job Title']}`);
        console.log(`   Score: ${match['Analysis']['Matching Score']}`);
        console.log(`   Email: ${match['Resume Data'].email}`);
        console.log(`   Experience: ${match['Resume Data'].experience} years`);
        console.log(`   Matched: ${match['Analysis']['Matched Skills'].join(', ')}`);
        console.log(`   Missing: ${match['Analysis']['Unmatched Skills'].join(', ')}`);
      });
      
    } else {
      console.error(`❌ Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

matchMultipleJobs();
```

---

## 🐛 Debugging

### **1. Check Request ID**

Every response includes a `requestId`:
```json
{
  "requestId": "abc-123-def-456"
}
```

### **2. Search Server Logs**

```bash
# Find all logs for this request
grep "abc-123-def-456" server.log

# Or with JSON logs
cat server.log | jq 'select(.requestId == "abc-123-def-456")'
```

### **3. Enable Debug Logging**

```env
LOG_LEVEL=debug
```

Server will log:
- File extraction details
- Matching progress for each combination
- Cache hits/misses
- Performance metrics

---

## 📊 Performance Tips

### **1. Optimize Batch Size**

For best performance:
- Keep combinations under 30 (e.g., 5 JDs × 6 resumes)
- Use smaller batches for faster response
- Large batches benefit most from parallel processing

### **2. Leverage Caching**

Files are cached for 24 hours:
- Re-uploading same file uses cache (instant)
- Match results cached for 12 hours
- Saves API calls and time

### **3. Monitor Progress**

Watch server logs during processing:
```bash
tail -f server.log | grep "Matching progress"
```

---

## ⚠️ Common Issues

### **Issue: "Too many combinations"**

**Error:**
```json
{
  "error": "Too many combinations. Maximum: 50, requested: 100"
}
```

**Solution:**
- Reduce number of files
- Or increase `MAX_COMBINATIONS` env variable

### **Issue: "File too large"**

**Error:**
```json
{
  "error": "File too large. Maximum size: 50MB"
}
```

**Solution:**
- Compress PDF file
- Or increase `MAX_FILE_SIZE` env variable

### **Issue: No relevant matches**

**Response:**
```json
{
  "summary": {
    "relevantMatches": 0,
    "message": "No relevant matches found..."
  }
}
```

**Explanation:**
- All combinations scored < 60
- JDs and resumes don't align
- Try different combinations

---

## 🎯 Best Practices

1. **Validate files client-side** before upload
2. **Include request ID** when reporting issues
3. **Monitor server logs** for performance insights
4. **Use appropriate batch sizes** (< 50 combinations)
5. **Handle partial results** gracefully
6. **Cache results** on your end if needed

---

## 📚 Next Steps

- Read `IMPROVEMENTS_SUMMARY.md` for feature overview
- Read `MULTIPLE_JOB_MATCH_IMPROVEMENTS.md` for detailed docs
- Run `testMultipleJobMatchImproved.js` for examples
- Check `utils/multipleMatchConfig.ts` for configuration

---

## 🚀 Ready to Go!

You now have everything needed to use the improved multiple job matching endpoint. Start matching candidates to jobs **3x faster** with production-ready features! 🎉
