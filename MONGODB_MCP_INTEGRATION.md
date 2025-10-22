# MongoDB MCP Server Integration Guide

## Overview

You have the **official MongoDB MCP Server** running in Docker. This is a professional, production-ready solution from MongoDB that provides:

✅ **Native MCP Protocol Support**  
✅ **18+ Database Tools** (find, aggregate, count, insert, update, delete, etc.)  
✅ **Atlas Integration** (cluster management, performance advisor)  
✅ **Security Features** (read-only mode, credential isolation)  
✅ **Export Capabilities** (save query results to files)

## Current Implementation vs MCP Server

### What We Built (Custom Implementation)
- ❌ Custom AI-based query translation (using Groq)
- ❌ Limited operations (find, count, distinct)
- ❌ Semantic interpretation issues (as you discovered)
- ❌ No MCP protocol compliance
- ✅ Works, but reinventing the wheel

### What You Have (Official MCP Server)
- ✅ Official MongoDB solution
- ✅ Full MCP protocol implementation
- ✅ 18+ database operations
- ✅ Battle-tested and maintained
- ✅ Direct MongoDB native operations
- ✅ No AI interpretation needed (direct tool calls)

## Recommended Architecture

```
┌─────────────────┐
│   Your API      │
│  (Bun Server)   │
└────────┬────────┘
         │
         │ HTTP/MCP Protocol
         │
┌────────▼────────┐
│  MongoDB MCP    │
│  Server (Docker)│
└────────┬────────┘
         │
         │ MongoDB Protocol
         │
┌────────▼────────┐
│    MongoDB      │
│    Database     │
└─────────────────┘
```

## Integration Options

### Option 1: Direct MCP Client Integration (Recommended)
Use the MCP SDK to connect your API to the MCP server as a client.

**Benefits:**
- Native MCP protocol
- Access to all 18+ tools
- No AI interpretation layer
- Direct, reliable operations

**Implementation:**
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Connect to MCP server
const transport = new StdioClientTransport({
  command: 'docker',
  args: [
    'exec',
    '-i',
    'your-mcp-container-name',
    'node',
    '/app/index.js'
  ]
});

const client = new Client({
  name: 'skillmatrix-api',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);

// Use MCP tools
const result = await client.callTool({
  name: 'find',
  arguments: {
    database: 'hr_tools',
    collection: 'users',
    query: { role: 'admin' },
    limit: 10
  }
});
```

### Option 2: HTTP Transport (If MCP Server runs with --transport http)
If you configured your MCP server with HTTP transport:

```typescript
// Connect via HTTP
const response = await fetch('http://localhost:3000/tools/find', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    database: 'hr_tools',
    collection: 'users',
    query: { role: 'admin' }
  })
});
```

### Option 3: Hybrid Approach (Current + MCP)
Keep your current implementation for simple queries, but add MCP integration for complex operations:

```typescript
// Simple queries -> Your AI implementation (quick responses)
if (isSimpleQuery(query)) {
  return await executeNaturalLanguageQuery(query);
}

// Complex queries -> MCP server (reliable operations)
else {
  return await mcpClient.callTool({
    name: detectOperation(query),
    arguments: parseArguments(query)
  });
}
```

## Available MCP Tools

### Database Tools (18 tools)
1. **connect** - Connect to cluster
2. **find** - Run database query
3. **aggregate** - Run aggregation pipeline
4. **count** - Count documents
5. **insert-one** - Add single document
6. **insert-many** - Add multiple documents
7. **create-index** - Create index
8. **update-one** - Update single document
9. **update-many** - Update multiple documents
10. **rename-collection** - Rename collection
11. **delete-one** - Delete single document
12. **delete-many** - Delete multiple documents
13. **drop-collection** - Drop collection
14. **drop-database** - Drop database
15. **list-databases** - List all databases
16. **list-collections** - List collections
17. **collection-indexes** - Get index info
18. **collection-schema** - Get schema info
19. **collection-storage-size** - Get storage size
20. **db-stats** - Database statistics
21. **export** - Export query results to file

### Atlas Tools (13 tools)
- atlas-list-orgs
- atlas-list-projects
- atlas-create-project
- atlas-list-clusters
- atlas-inspect-cluster
- atlas-create-free-cluster
- atlas-connect-cluster
- atlas-inspect-access-list
- atlas-create-access-list
- atlas-list-db-users
- atlas-create-db-user
- atlas-list-alerts
- atlas-list-performance-advisor

## Your Docker Setup

Since you mentioned your MCP server is running in Docker, you need to:

### 1. Get Container Name/ID
```bash
docker ps | grep mongodb-mcp-server
```

### 2. Check MCP Server Configuration
```bash
docker inspect your-mcp-container-name
```

### 3. Verify Environment Variables
```bash
docker exec your-mcp-container-name env | grep MDB_MCP
```

Expected variables:
- `MDB_MCP_CONNECTION_STRING` or
- `MDB_MCP_API_CLIENT_ID` + `MDB_MCP_API_CLIENT_SECRET`
- `MDB_MCP_READ_ONLY` (true/false)

## Recommended Implementation Strategy

### Phase 1: Direct MCP Integration
Replace our custom implementation with MCP client:

1. Install MCP SDK (already installed: `@modelcontextprotocol/sdk`)
2. Create MCP client wrapper service
3. Implement tool mapping (natural language → MCP tool calls)
4. Test with Docker container

### Phase 2: Enhanced API Layer
Build API endpoints that leverage MCP tools:

```typescript
// POST /mongo/find
async function mongoFindHandler(req: Request) {
  const { database, collection, query, limit } = await req.json();
  
  const result = await mcpClient.callTool({
    name: 'find',
    arguments: { database, collection, query, limit }
  });
  
  return new Response(JSON.stringify(result));
}

// POST /mongo/aggregate  
async function mongoAggregateHandler(req: Request) {
  const { database, collection, pipeline } = await req.json();
  
  const result = await mcpClient.callTool({
    name: 'aggregate',
    arguments: { database, collection, pipeline }
  });
  
  return new Response(JSON.stringify(result));
}
```

### Phase 3: Natural Language Layer (Optional)
Add AI on top of MCP for natural language queries:

```typescript
async function naturalLanguageToMCP(query: string) {
  // Use AI to determine which MCP tool to call
  const { tool, arguments } = await aiDetermineToolCall(query);
  
  // Call the appropriate MCP tool
  return await mcpClient.callTool({
    name: tool,
    arguments
  });
}
```

## Migration Path

### Step 1: Keep Current Implementation
Don't break what works. Your current endpoints stay operational.

### Step 2: Add MCP Integration Alongside
Create new endpoints that use MCP:
- `/mongo/mcp/find`
- `/mongo/mcp/aggregate`
- `/mongo/mcp/count`

### Step 3: Test Both in Parallel
Compare results between custom implementation and MCP.

### Step 4: Gradual Migration
Once MCP integration is proven, migrate endpoints one by one.

### Step 5: Deprecate Custom Code
Remove the custom MongoDB query generation code.

## Security Considerations

### Read-Only Mode
Your MCP server should be configured with:
```bash
-e MDB_MCP_READ_ONLY=true
```

This ensures:
- ✅ No insert/update/delete operations
- ✅ Safe for AI agents to query
- ✅ No accidental data modification

### Network Isolation
Since MCP server is in Docker:
```bash
# Option 1: Same Docker network
docker network create skillmatrix-network
docker network connect skillmatrix-network your-mcp-container

# Option 2: Expose MCP via Unix socket
# Option 3: Use docker exec (current approach)
```

## Example: Converting Your Query

### What You Asked:
```
"how many collections are there in database"
```

### Our Implementation (Wrong):
```typescript
// Generated incorrect MongoDB query
{
  collection: "scheduledtests",
  operation: "count",
  query: {}
}
// Result: 5 (wrong - counts documents)
```

### Correct MCP Approach:
```typescript
// Use the right tool
await mcpClient.callTool({
  name: 'list-collections',
  arguments: {
    database: 'hr_tools'
  }
});
// Result: Array of 16 collection names (correct!)
```

## Benefits of MCP Integration

1. **Reliability**: No AI misinterpretation
2. **Performance**: Direct database operations
3. **Feature Complete**: Access to all MongoDB operations
4. **Maintainability**: Official MongoDB support
5. **Security**: Built-in read-only mode
6. **Scalability**: Battle-tested implementation
7. **Standards Compliant**: Full MCP protocol support

## Next Steps

Would you like me to:

1. ✅ Create MCP client integration service
2. ✅ Replace current MongoDB query endpoints with MCP tools
3. ✅ Add natural language mapping to MCP tools
4. ✅ Test with your Docker container
5. ✅ Update documentation

Let me know your Docker container details and I'll create the integration!

## Questions to Answer

1. **Container Name**: What's your MCP server container name?
2. **Transport Method**: stdio or HTTP?
3. **Configuration**: Connection string or Atlas API?
4. **Read-Only**: Is it configured with --readOnly?
5. **Network**: Is your API and MCP container on same network?

---

**TL;DR**: You have a professional MongoDB MCP server. We should integrate with it instead of using our custom AI-based query translation. This will be more reliable, feature-complete, and aligned with MCP standards.
