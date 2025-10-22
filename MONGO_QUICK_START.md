# MongoDB Natural Language Query - Quick Start

## 🚀 Setup (5 minutes)

### 1. Install Dependencies
Already done! ✅ (`mongodb` and `@modelcontextprotocol/sdk` installed)

### 2. Configure MongoDB
Edit `.env` file:
```bash
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=hr_tools
```

**For MongoDB Atlas:**
```bash
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=your_database_name
```

### 3. Start Server
```bash
bun run dev
```

Look for:
```
[MongoDB] Connecting to MongoDB...
[MongoDB] Connected to MongoDB successfully
HR Tools server running at http://localhost:3001
```

---

## ✅ Quick Test

### Test 1: Check Database Connection
```bash
curl http://localhost:3001/mongo-info
```

**Expected**: List of collections and schemas

### Test 2: Run Natural Language Query
```bash
curl -X POST http://localhost:3001/query-mongo \
  -H "Content-Type: application/json" \
  -d '{"query": "Find all documents", "dryRun": true}'
```

**Expected**: Generated MongoDB query (not executed)

### Test 3: Run Full Test Suite
```bash
bun run test-mongo-nl
```

---

## 📝 Example Queries

### Find Documents
```bash
curl -X POST http://localhost:3001/query-mongo \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Find all candidates with Python skills"
  }'
```

### Count Documents
```bash
curl -X POST http://localhost:3001/query-mongo \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How many candidates are there?"
  }'
```

### Aggregation
```bash
curl -X POST http://localhost:3001/query-mongo \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Get average experience by department"
  }'
```

---

## 🎯 Common Use Cases

### 1. HR Analytics Dashboard
```javascript
// Get candidate distribution
const response = await fetch('http://localhost:3001/query-mongo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Show me the count of candidates grouped by experience level'
  })
});
```

### 2. Job Search
```javascript
// Find matching positions
const response = await fetch('http://localhost:3001/query-mongo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Find all open positions for Python developers in New York'
  })
});
```

### 3. Recruitment Reports
```javascript
// Get hiring statistics
const response = await fetch('http://localhost:3001/query-mongo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'How many candidates were hired in the last 6 months?'
  })
});
```

---

## 🔧 Troubleshooting

### MongoDB Connection Failed
**Error**: "Failed to initialize MongoDB client"

**Fix**:
1. Check if MongoDB is running: `mongod --version`
2. Verify MONGODB_URL in `.env`
3. Test connection: `mongosh <your-connection-string>`

### No Collections Found
**Error**: "No collections available"

**Fix**:
1. Check database name is correct
2. Verify database has data
3. Check user permissions

### Query Generation Failed
**Error**: "Failed to generate valid MongoDB query"

**Fix**:
1. Make query more specific
2. Use dry run to debug: `"dryRun": true`
3. Specify target collection: `"collection": "candidates"`

---

## 📚 Full Documentation

See [`MONGO_NL_QUERY_API.md`](./MONGO_NL_QUERY_API.md) for:
- Complete API reference
- Advanced examples
- Python and JavaScript code samples
- Error handling
- Best practices

---

## 🎉 You're Ready!

Now you can query MongoDB using natural language! Try asking questions like:

- "Find all senior developers"
- "How many applications were submitted this month?"
- "Show me the top 10 skills mentioned in resumes"
- "What is the average salary for data scientists?"

**Happy querying! 🚀**
