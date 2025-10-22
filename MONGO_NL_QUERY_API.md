# MongoDB Natural Language Query API

## Overview
Query MongoDB databases using natural language powered by AI. The API translates your questions into MongoDB queries via Model Context Protocol (MCP) and executes them.

---

## Endpoints

### 1. Natural Language Query
```
POST /query-mongo
```

Execute natural language queries against MongoDB.

### 2. Database Information
```
GET /mongo-info
```

Get available collections and their schemas.

---

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=hr_tools
```

**Default Values:**
- `MONGODB_URL`: `mongodb://localhost:27017`
- `MONGODB_DB_NAME`: `hr_tools`

---

## API Usage

### Natural Language Query Endpoint

**Endpoint**: `POST /query-mongo`

**Request Body**:
```json
{
  "query": "Find all candidates with Python skills",
  "collection": "candidates",
  "dryRun": false,
  "maxResults": 100
}
```

**Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | - | Natural language query |
| `collection` | string | No | auto-detect | Target collection name |
| `dryRun` | boolean | No | false | Return generated query without executing |
| `maxResults` | number | No | 100 | Maximum results to return |

**Response**:
```json
{
  "success": true,
  "requestId": "uuid",
  "naturalLanguageQuery": "Find all candidates with Python skills",
  "generatedQuery": {
    "collection": "candidates",
    "operation": "find",
    "query": {
      "skills": "Python"
    },
    "explanation": "Find documents where skills field contains Python"
  },
  "results": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "skills": ["Python", "JavaScript", "React"],
      "experience": 5
    }
  ],
  "resultCount": 1,
  "dryRun": false
}
```

---

### Database Info Endpoint

**Endpoint**: `GET /mongo-info`

**Response**:
```json
{
  "success": true,
  "requestId": "uuid",
  "collections": ["candidates", "jobs", "applications"],
  "schemas": {
    "candidates": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "skills": ["Python", "JavaScript"],
        "experience": 5
      }
    ],
    "jobs": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Software Engineer",
        "requirements": ["Python", "AWS"]
      }
    ]
  },
  "totalCollections": 3
}
```

---

## Examples

### Example 1: Find Candidates

**Natural Language**:
```json
{
  "query": "Show me all senior developers with more than 5 years experience"
}
```

**Generated MongoDB Query**:
```javascript
{
  collection: "candidates",
  operation: "find",
  query: {
    role: "developer",
    level: "senior",
    experience: { $gt: 5 }
  }
}
```

---

### Example 2: Count Documents

**Natural Language**:
```json
{
  "query": "How many job openings are there for Python developers?"
}
```

**Generated MongoDB Query**:
```javascript
{
  collection: "jobs",
  operation: "count",
  query: {
    requirements: "Python"
  }
}
```

---

### Example 3: Aggregation

**Natural Language**:
```json
{
  "query": "Get average experience grouped by job role",
  "collection": "candidates"
}
```

**Generated MongoDB Query**:
```javascript
{
  collection: "candidates",
  operation: "aggregate",
  query: [
    {
      $group: {
        _id: "$role",
        avgExperience: { $avg: "$experience" }
      }
    }
  ]
}
```

---

### Example 4: Dry Run

**Request**:
```json
{
  "query": "Find candidates hired in 2024",
  "dryRun": true
}
```

**Response** (no execution):
```json
{
  "success": true,
  "generatedQuery": {
    "collection": "candidates",
    "operation": "find",
    "query": {
      "hireDate": {
        "$gte": "2024-01-01",
        "$lt": "2025-01-01"
      }
    },
    "explanation": "Find candidates with hire date in 2024"
  },
  "results": null,
  "dryRun": true
}
```

---

## JavaScript/TypeScript Examples

### Basic Query
```javascript
const response = await fetch('http://localhost:3001/query-mongo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Find all candidates with Python skills'
  })
});

const result = await response.json();
console.log('Results:', result.results);
console.log('Generated Query:', result.generatedQuery);
```

### Get Database Info
```javascript
const response = await fetch('http://localhost:3001/mongo-info');
const info = await response.json();

console.log('Available collections:', info.collections);
console.log('Schemas:', info.schemas);
```

### Dry Run (Preview Query)
```javascript
const response = await fetch('http://localhost:3001/query-mongo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Find experienced developers',
    dryRun: true
  })
});

const result = await response.json();
console.log('Would execute:', result.generatedQuery);
```

---

## Python Examples

### Basic Query
```python
import requests

response = requests.post(
    'http://localhost:3001/query-mongo',
    json={
        'query': 'Find all candidates with Python skills',
        'maxResults': 50
    }
)

result = response.json()
print(f"Found {result['resultCount']} results")
print(f"Query: {result['generatedQuery']}")
```

### Get Database Info
```python
import requests

response = requests.get('http://localhost:3001/mongo-info')
info = response.json()

print(f"Collections: {info['collections']}")
for collection, samples in info['schemas'].items():
    print(f"\n{collection}:")
    print(samples[0])
```

---

## cURL Examples

### Natural Language Query
```bash
curl -X POST http://localhost:3001/query-mongo \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Find all senior developers with Python experience",
    "maxResults": 10
  }'
```

### Get Database Info
```bash
curl http://localhost:3001/mongo-info
```

### Dry Run
```bash
curl -X POST http://localhost:3001/query-mongo \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Count all active job postings",
    "dryRun": true
  }'
```

---

## Supported Query Types

### ✅ Find Operations
- "Find all X"
- "Show me X where Y"
- "Get records with X"

### ✅ Count Operations
- "How many X are there?"
- "Count X"
- "Total number of X"

### ✅ Aggregations
- "Average X by Y"
- "Sum of X grouped by Y"
- "Top 10 X by Y"

### ✅ Distinct Values
- "List all unique X"
- "What are the different X values?"

---

## Error Handling

### Query Validation Error
```json
{
  "success": false,
  "error": "Query is required and must be a non-empty string",
  "requestId": "uuid"
}
```

### Collection Not Found
```json
{
  "success": false,
  "error": "Collection 'xyz' not found. Available collections: candidates, jobs",
  "requestId": "uuid"
}
```

### Query Generation Failed
```json
{
  "success": false,
  "error": "Failed to generate valid MongoDB query from natural language",
  "generatedQuery": { ... },
  "requestId": "uuid"
}
```

---

## Features

### 🤖 AI-Powered Translation
- Converts natural language to MongoDB queries
- Understands context and intent
- Generates optimized queries

### 🔍 Auto-Detection
- Automatically selects relevant collection
- Analyzes schemas for better queries
- Provides query explanations

### ✅ Dry Run Mode
- Preview queries before execution
- Validate query logic
- Learn MongoDB query syntax

### 📊 Schema Awareness
- Uses sample documents for context
- Generates accurate field references
- Handles complex data structures

### 🚀 Performance
- Limited results for safety
- Efficient query generation
- Fast response times

---

## Best Practices

### 1. Be Specific
❌ Bad: "Get data"  
✅ Good: "Get all candidates hired in 2024 with Python skills"

### 2. Use Dry Run for Complex Queries
```json
{
  "query": "Complex aggregation query here",
  "dryRun": true
}
```

### 3. Specify Collection When Known
```json
{
  "query": "Find senior developers",
  "collection": "candidates"
}
```

### 4. Limit Results
```json
{
  "query": "Find all records",
  "maxResults": 20
}
```

---

## Limitations

- **Read-Only**: Currently supports only read operations (find, count, aggregate)
- **Max Results**: Default limit of 100 documents
- **Query Complexity**: Very complex queries may need manual refinement
- **Schema Dependent**: Better results with well-structured schemas

---

## Use Cases

### 1. HR Analytics
```json
{
  "query": "Show me the distribution of candidates by experience level"
}
```

### 2. Recruitment Reports
```json
{
  "query": "How many candidates applied for each job posting?"
}
```

### 3. Skills Analysis
```json
{
  "query": "Find the top 10 most common skills among candidates"
}
```

### 4. Performance Metrics
```json
{
  "query": "What is the average time to fill a position?"
}
```

---

## Testing

### 1. Check Database Connection
```bash
curl http://localhost:3001/mongo-info
```

### 2. Test Simple Query
```bash
curl -X POST http://localhost:3001/query-mongo \
  -H "Content-Type: application/json" \
  -d '{"query": "Find all records", "dryRun": true}'
```

### 3. Verify Results
```javascript
const response = await fetch('http://localhost:3001/query-mongo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Count all documents',
    collection: 'candidates'
  })
});

const result = await response.json();
console.log('Success:', result.success);
console.log('Count:', result.results);
```

---

## Troubleshooting

### MongoDB Connection Failed
**Error**: "Failed to initialize MongoDB client"

**Solution**:
1. Verify MongoDB is running
2. Check `MONGODB_URL` in `.env`
3. Ensure network connectivity

### No Collections Found
**Error**: "No collections available"

**Solution**:
1. Check database name in `.env`
2. Verify database has collections
3. Check user permissions

### Query Generation Failed
**Error**: "Failed to generate valid MongoDB query"

**Solution**:
1. Make query more specific
2. Use dry run to see what was attempted
3. Specify target collection explicitly

---

## Security Considerations

⚠️ **Important**: This API is designed for internal use. For production:

1. **Add Authentication**: Implement API keys or JWT tokens
2. **Limit Operations**: Restrict to read-only operations
3. **Rate Limiting**: Already implemented (100 requests/minute)
4. **Input Validation**: Sanitize all inputs
5. **Access Control**: Implement role-based access

---

## Next Steps

1. ✅ Configure MongoDB connection in `.env`
2. ✅ Restart server: `bun run dev`
3. ✅ Test database info: `curl http://localhost:3001/mongo-info`
4. ✅ Run test query: See examples above
5. ✅ Integrate into your application

---

## Support

For issues or questions:
- Check server logs for detailed error messages
- Use dry run mode to debug query generation
- Verify MongoDB connection and permissions
- Ensure collections have proper schemas

**Enjoy querying MongoDB with natural language! 🚀**
