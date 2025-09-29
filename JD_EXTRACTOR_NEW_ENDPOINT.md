# New JD Extractor Endpoint

This document explains how to use the new JD (Job Description) extractor endpoint that returns data in a job posting format.

## Endpoint

```
POST /extract-jd-new
```

## Request Format

The endpoint expects a multipart form data request with a `jobDescription` field containing a PDF file.

Example using curl:
```bash
curl -X POST http://localhost:3001/extract-jd-new \
  -F "jobDescription=@path/to/your/job-description.pdf" \
  -H "Content-Type: multipart/form-data"
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
- No file provided: "No job description file provided or invalid file"
- Processing error: "Failed to extract job description data: ..."
- JSON parsing error: "Failed to parse job description data from AI response"

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