# Multiple JD vs Multiple Resume Matching Feature

## Overview
This feature allows matching multiple job descriptions (JDs) against multiple resumes with intelligent caching to reduce LLM load and improve performance.

## Key Features

### 1. Multiple File Processing
- **Endpoint**: `POST /match-multiple`
- **Input**: Multiple JD files and multiple resume files via form data
- **Output**: All possible combinations of JD-resume matches with detailed analysis

### 2. Intelligent Caching System
#### Extraction Caching
- **File Content Hashing**: Uses MD5 hash of file content to identify identical files
- **Cache Duration**: 24 hours for extracted data
- **Benefit**: Previously uploaded files are automatically recognized and their extracted data is reused

#### Match Result Caching  
- **Match Combination Hashing**: Uses MD5 hash of JD+resume combination
- **Cache Duration**: 12 hours for match results
- **Benefit**: Identical JD-resume combinations return cached results instantly

### 3. Performance Optimization
- **Reduced API Calls**: Significant reduction in LLM API usage for repeated files
- **Cost Efficiency**: Lower costs due to cached extractions and match results
- **Faster Response**: Instant results for cached combinations

### 4. Safety Limits
- **File Limits**: Maximum 10 JD files and 10 resume files
- **Combination Limits**: Maximum 50 total combinations (JDs × resumes)
- **Prevents Overload**: Reasonable limits to prevent system overload

## API Usage

### Request Format
```bash
POST /match-multiple
Content-Type: multipart/form-data

Form fields:
- job_descriptions: (multiple PDF files)
- resumes: (multiple PDF files)
```

### Response Format
```json
{
  "success": true,
  "summary": {
    "totalJDs": 2,
    "totalResumes": 3,
    "totalMatches": 6,
    "bestMatch": {
      "jdTitle": "Senior Software Engineer",
      "candidateName": "John Doe", 
      "matchScore": 92
    }
  },
  "matches": [
    {
      "jdIndex": 0,
      "resumeIndex": 0,
      "jdTitle": "Senior Software Engineer",
      "candidateName": "John Doe",
      "matchScore": 92,
      "matchedSkills": ["JavaScript", "React"],
      "unmatchedSkills": ["Python", "AWS"],
      "strengths": ["5+ years experience"],
      "recommendations": ["Learn Python"],
      "detailedAnalysis": {
        "experienceMatch": { "required": "5+ years", "candidate": "6 years", "match": "Exceeds requirement" },
        "educationMatch": { "required": "Bachelor's", "candidate": "B.S. CS", "match": "Perfect match" },
        "domainMatch": { "required": "Web dev", "candidate": "Full-stack", "match": "Strong match" }
      }
    }
  ]
}
```

## Implementation Details

### Files Created
1. **`services/multipleJobMatcher.ts`**: Core matching logic with caching
2. **`routes/multipleJobMatch.ts`**: HTTP route handler
3. **Updated `index.ts`**: Route registration
4. **Updated `README.md`**: API documentation

### Caching Strategy
1. **Content-based Caching**: Files are identified by their content hash, not filename
2. **Layered Caching**: Separate caches for extractions and match results
3. **TTL Management**: Different cache durations for different data types
4. **Cache Keys**: Structured naming convention for easy management

### Error Handling
- **Validation**: Comprehensive input validation
- **Graceful Degradation**: Failed matches don't stop other combinations
- **Detailed Errors**: Clear error messages for debugging

## Benefits

### For Development
- **Reduced Testing Time**: Cached extractions speed up development testing
- **Lower API Costs**: Significant reduction in LLM API usage
- **Better Debugging**: Consistent results for same inputs

### For Production
- **Improved Performance**: Faster response times for repeated files
- **Cost Optimization**: Lower operational costs
- **Scalability**: Better handling of bulk operations

### For Users
- **Faster Processing**: Instant results for previously processed files
- **Bulk Operations**: Efficient processing of multiple file combinations
- **Consistent Results**: Same inputs always produce same outputs

## Usage Examples

### Small Scale (2 JDs × 3 Resumes = 6 combinations)
- First run: All combinations processed via LLM
- Subsequent runs with same files: Instant cached results

### Medium Scale (5 JDs × 8 Resumes = 40 combinations)
- Mixed scenario: Some cached, some new
- Significant time and cost savings for cached combinations

### Cache Efficiency Scenarios
1. **Repeated Uploads**: Same file uploaded multiple times = instant extraction
2. **Partial Overlaps**: Some files same, some new = mixed caching
3. **Batch Processing**: Multiple sessions with overlapping files = cumulative savings