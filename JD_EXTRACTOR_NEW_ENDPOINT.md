# New JD Extractor Endpoint

This document explains how to use the new JD (Job Description) extractor endpoint that returns data in a job posting format.

## Endpoint

```
POST /extract-jd-new
```

## Request Format

The endpoint expects a multipart form data request with a `job_description` field containing a PDF file.

### Using curl:
```bash
curl -X POST http://localhost:3001/extract-jd-new \
  -F "job_description=@path/to/your/job-description.pdf" \
  -H "Content-Type: multipart/form-data"
```

### Using JavaScript (fetch):
```javascript
const formData = new FormData();
formData.append('job_description', fileInput.files[0]);

fetch('http://localhost:3001/extract-jd-new', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

### Using Python (requests):
```python
import requests

with open('job-description.pdf', 'rb') as f:
    files = {'job_description': f}
    response = requests.post('http://localhost:3001/extract-jd-new', files=files)
    print(response.json())
```

## Response Format

The endpoint returns a JSON response with the following structure:

```json
{
  "success": true,
  "data": {
    "title": "string",
    "companyName": "string",
    "location": "string",
    "type": "Full-Time" | "Part-Time" | "Contract" | "Internship",
    "experience": "string",
    "department": "string",
    "skills": "string",
    "salary": "string",
    "description": "string"
  }
}
```

### Response Fields

| Field | Description | Example |
|-------|-------------|---------|
| title | Job title | "Software Engineer" |
| companyName | Company name | "Tech Corp" |
| location | Job location | "San Francisco, CA" |
| type | Employment type | "Full-Time" |
| experience | Required experience | "3+ years" |
| department | Department name | "Engineering" |
| skills | Required skills (comma-separated) | "JavaScript, React, Node.js" |
| salary | Salary range | "$100,000 - $120,000" |
| description | Job description | "We are looking for..." |

## Error Responses

In case of an error, the endpoint will return a JSON response with the following structure:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common error cases:
- Invalid content type: "Invalid content type. Expected multipart/form-data"
- No file provided: "No job description file provided"
- Invalid file: "Invalid file provided. Expected a File object"
- Processing error: "Failed to extract job description data: ..."
- JSON parsing error: "Failed to parse job description data from AI response"
- Form data parsing error: "Failed to parse form data. Ensure the request is sent with Content-Type: multipart/form-data"

## Implementation Details

The new endpoint builds upon the existing JD extraction service but transforms the data into a more job-posting-friendly format. It uses the same AI-powered extraction logic but maps the extracted fields to the new response format.

The transformation logic:
1. Maps `title` directly from the extracted data
2. Maps `company` to `companyName`
3. Maps `location` directly
4. Determines `type` from the extracted employment type or defaults to "Full-Time"
5. Formats experience as "{years}+ years" based on requiredIndustrialExperienceYears
6. Maps department directly if available
7. Joins skills array with commas
8. Maps salary directly
9. Uses the full description if available, otherwise joins requirements

## Troubleshooting

If you're getting a "Can't decode form data from body because of incorrect MIME type/boundary" error:

1. Ensure you're sending the request with `Content-Type: multipart/form-data` header
2. Make sure you're using form data (not JSON) for the request body
3. Verify that the file is being attached correctly to the `job_description` field (note the underscore)
4. Check that the file is a valid PDF

### Correct usage examples:

**Correct curl command:**
```bash
curl -X POST http://localhost:3001/extract-jd-new \
  -F "job_description=@job-description.pdf"
```

**Incorrect curl command (will cause the error):**
```bash
# Don't do this - sending JSON instead of form data
curl -X POST http://localhost:3001/extract-jd-new \
  -H "Content-Type: application/json" \
  -d '{"job_description": "file-content"}'
```

**Also incorrect - using wrong field name:**
```bash
# Don't do this - using camelCase instead of underscore
curl -X POST http://localhost:3001/extract-jd-new \
  -F "jobDescription=@job-description.pdf"
```