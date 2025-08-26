# Multiple Resume Feature Implementation

## Overview
This document describes the implementation of the multiple resume feature for the Docapture HR Tools API. The feature allows users to match a single job description with multiple resumes simultaneously.

## Changes Made

### 1. Enhanced Job Match Handler (`routes/jobMatch.ts`)
- Improved support for handling multiple resumes via the `resumes` form field
- Added better error handling for individual resume processing
- Maintained resume order in the response
- Enhanced response structure to clearly separate successful results from errors
- Kept the rate limiting queue system for API protection

### 2. Updated API Documentation (`index.ts`)
- Clarified that the `/match` endpoint supports both single and multiple resumes
- Updated the available routes documentation

### 3. Updated README Documentation (`README.md`)
- Added detailed documentation for the multiple resume feature
- Updated API endpoint examples with multiple resume usage
- Provided clear request/response format examples

### 4. Added Example Files
- `testMultipleResumes.js`: Test script demonstrating multiple resume usage
- `example-multiple-resumes.js`: Practical examples for both fetch API and cURL

## Usage

### API Endpoint
```
POST /match
```

### Request Format
Form data with:
- `jobDescription`: Job description PDF file
- `resumes`: Multiple resume PDF files (can be used multiple times)

### Response Format
```json
{
  "success": true,
  "results": [
    {
      "Id": "uuid-1",
      "Resume Data": {
        "Job Title": "Senior Software Engineer",
        "Matching Percentage": "85",
        "name": "John Doe",
        "email": "john@example.com",
        "skills": ["JavaScript", "React", "Node.js"]
      },
      "Analysis": {
        "Matching Score": 85,
        "Matched Skills": ["JavaScript", "React"],
        "Unmatched Skills": ["Python", "AWS"],
        "Strengths": ["5 years of relevant experience"],
        "Recommendations": ["Gain experience with Python", "Get AWS certification"]
      }
    }
  ],
  "errors": [] // Present only if there were errors processing any resumes
}
```

### Example Usage

#### Using cURL
```bash
curl -X POST http://localhost:3001/match \
  -F "jobDescription=@./job-description.pdf" \
  -F "resumes=@./resume1.pdf" \
  -F "resumes=@./resume2.pdf" \
  -F "resumes=@./resume3.pdf"
```

#### Using JavaScript Fetch API
```javascript
const formData = new FormData();
formData.append('jobDescription', jobDescriptionFile);
formData.append('resumes', resume1File);
formData.append('resumes', resume2File);
formData.append('resumes', resume3File);

const response = await fetch('http://localhost:3001/match', {
  method: 'POST',
  body: formData
});
```

## Benefits
1. **Efficiency**: Process multiple resumes in a single API call
2. **Rate Limiting**: Maintains API protection through queue system
3. **Error Handling**: Individual resume processing errors don't affect others
4. **Backward Compatibility**: Still supports single resume matching
5. **Clear Response Structure**: Easy to parse results and errors

## Technical Details
- The implementation maintains the existing rate limiting queue system to prevent API overload
- Resumes are processed concurrently but with controlled rate limiting
- Each resume is processed independently, so errors in one don't affect others
- The response maintains the order of resumes as submitted
- Full backward compatibility with single resume requests