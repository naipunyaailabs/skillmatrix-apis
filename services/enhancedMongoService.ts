/**
 * Enhanced MongoDB Query Service
 * Standalone implementation without external MCP server
 * Provides robust natural language to MongoDB query translation
 */

import { groqChatCompletion } from '../utils/groqClient';
import { executeMongoQuery, listCollections, getCollectionSample, getMongoDb } from '../utils/mongoClient';

/**
 * Supported MongoDB operations
 */
export const SUPPORTED_OPERATIONS = [
  'find',
  'findOne',
  'count',
  'aggregate',
  'distinct',
  'insertOne',
  'insertMany',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany'
] as const;

export type MongoOperation = typeof SUPPORTED_OPERATIONS[number];

/**
 * Query generation result
 */
export interface MongoQueryResult {
  collection: string;
  operation: MongoOperation;
  query: any;
  options?: any;
  explanation: string;
}

/**
 * Enhanced query generation with better AI prompting
 */
export async function generateEnhancedMongoQuery(
  naturalLanguageQuery: string,
  targetCollection?: string,
  allowedOperations: MongoOperation[] = ['find', 'count', 'aggregate', 'distinct']
): Promise<MongoQueryResult> {
  try {
    // Get available collections
    const collections = await listCollections();
    
    if (collections.length === 0) {
      throw new Error('No collections found in database');
    }
    
    // If target collection specified, validate it
    if (targetCollection && !collections.includes(targetCollection)) {
      throw new Error(`Collection '${targetCollection}' not found. Available collections: ${collections.join(', ')}`);
    }
    
    // Get collection samples for context
    const collectionSchemas: { [key: string]: any[] } = {};
    const collectionsToAnalyze = targetCollection ? [targetCollection] : collections.slice(0, 8);
    
    for (const collName of collectionsToAnalyze) {
      try {
        collectionSchemas[collName] = await getCollectionSample(collName, 3);
      } catch (error) {
        console.warn(`[EnhancedMongo] Could not get sample for collection ${collName}:`, error);
      }
    }
    
    // Build detailed schema information
    const schemaInfo = Object.entries(collectionSchemas)
      .map(([name, samples]) => {
        if (samples.length === 0) return `Collection: ${name} (empty)`;
        
        // Extract field names from samples
        const fields = new Set<string>();
        samples.forEach(doc => {
          Object.keys(doc).forEach(key => fields.add(key));
        });
        
        return `Collection: ${name}
Fields: ${Array.from(fields).join(', ')}
Sample document:
${JSON.stringify(samples[0], null, 2)}`;
      })
      .join('\n\n');
    
    // Create enhanced AI prompt
    const systemPrompt = `You are an expert MongoDB query generator. Convert natural language queries into precise MongoDB queries.

DATABASE INFORMATION:
Total Collections: ${collections.length}
Available Collections: ${collections.join(', ')}

COLLECTION SCHEMAS:
${schemaInfo}

ALLOWED OPERATIONS: ${allowedOperations.join(', ')}

IMPORTANT RULES:
1. Return ONLY valid JSON - no markdown, no comments, no extra text
2. Match collection names exactly (case-sensitive)
3. Use proper MongoDB query syntax
4. For "count" operations: use count operation, NOT find with a filter
5. For "aggregate": pipeline must be an array of stages
6. For "distinct": specify the field in options
7. For "find": include filters, projection, sort, limit in appropriate places
8. Use the MOST RELEVANT collection based on the query context

OUTPUT FORMAT (strict JSON):
{
  "collection": "exact_collection_name",
  "operation": "find|count|aggregate|distinct|etc",
  "query": {},
  "options": {"projection": {}, "sort": {}, "limit": 10, "field": "fieldName"},
  "explanation": "Clear explanation of what this query does"
}

EXAMPLES:
Query: "Find all users"
Response: {"collection": "users", "operation": "find", "query": {}, "options": {"limit": 100}, "explanation": "Retrieves all documents from users collection"}

Query: "Count how many users exist"
Response: {"collection": "users", "operation": "count", "query": {}, "explanation": "Counts total number of documents in users collection"}

Query: "Show me distinct user roles"
Response: {"collection": "users", "operation": "distinct", "query": {}, "options": {"field": "role"}, "explanation": "Returns unique values of role field"}`;

    const userPrompt = `Convert this to MongoDB query:
"${naturalLanguageQuery}"

${targetCollection ? `REQUIRED: Use collection "${targetCollection}"` : 'Auto-detect the best collection'}

Return ONLY the JSON object, nothing else.`;

    // Call AI
    const aiResponse = await groqChatCompletion(
      systemPrompt,
      userPrompt,
      0.2, // Lower temperature for more deterministic output
      2048
    );
    
    // Parse and validate response
    const parsedResponse = parseAIResponse(aiResponse);
    
    // Validate the response
    validateQueryResponse(parsedResponse, collections, allowedOperations);
    
    return {
      collection: parsedResponse.collection,
      operation: parsedResponse.operation as MongoOperation,
      query: parsedResponse.query || {},
      options: parsedResponse.options || {},
      explanation: parsedResponse.explanation || 'Query generated from natural language'
    };
    
  } catch (error) {
    console.error('[EnhancedMongo] Error generating query:', error);
    throw error;
  }
}

/**
 * Parse AI response with robust JSON extraction
 */
function parseAIResponse(aiResponse: string): any {
  try {
    let cleanedResponse = aiResponse.trim();
    
    // Remove markdown code blocks
    cleanedResponse = cleanedResponse
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    
    // Extract JSON if wrapped in text
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }
    
    // Parse JSON
    const parsed = JSON.parse(cleanedResponse);
    
    return parsed;
  } catch (error) {
    console.error('[EnhancedMongo] Failed to parse AI response:', aiResponse);
    throw new Error('Failed to parse AI response as valid JSON');
  }
}

/**
 * Validate query response
 */
function validateQueryResponse(
  response: any,
  availableCollections: string[],
  allowedOperations: MongoOperation[]
): void {
  // Check required fields
  if (!response.collection) {
    throw new Error('Query response missing "collection" field');
  }
  
  if (!response.operation) {
    throw new Error('Query response missing "operation" field');
  }
  
  // Validate collection exists
  if (!availableCollections.includes(response.collection)) {
    throw new Error(`Collection "${response.collection}" not found. Available: ${availableCollections.join(', ')}`);
  }
  
  // Validate operation is allowed
  if (!allowedOperations.includes(response.operation)) {
    throw new Error(`Operation "${response.operation}" not allowed. Allowed: ${allowedOperations.join(', ')}`);
  }
}

/**
 * Execute natural language query with enhanced error handling
 */
export async function executeEnhancedNLQuery(
  naturalLanguageQuery: string,
  options: {
    targetCollection?: string;
    dryRun?: boolean;
    maxResults?: number;
    allowedOperations?: MongoOperation[];
    readOnly?: boolean;
  } = {}
): Promise<{
  success: boolean;
  query: MongoQueryResult;
  results?: any;
  resultCount?: number;
  executionTime?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Determine allowed operations based on readOnly flag
    let allowedOps = options.allowedOperations || ['find', 'count', 'aggregate', 'distinct'];
    
    if (options.readOnly) {
      allowedOps = allowedOps.filter(op => 
        ['find', 'findOne', 'count', 'aggregate', 'distinct'].includes(op)
      );
    }
    
    // Generate query
    const generatedQuery = await generateEnhancedMongoQuery(
      naturalLanguageQuery,
      options.targetCollection,
      allowedOps
    );
    
    // If dry run, return query without executing
    if (options.dryRun) {
      return {
        success: true,
        query: generatedQuery,
        results: null,
        resultCount: 0,
        executionTime: Date.now() - startTime
      };
    }
    
    // Prepare execution options
    const execOptions: any = { ...generatedQuery.options };
    if (options.maxResults && !execOptions.limit) {
      execOptions.limit = options.maxResults;
    }
    
    // Execute the query
    const results = await executeMongoQuery(
      generatedQuery.collection,
      generatedQuery.operation,
      generatedQuery.query,
      execOptions
    );
    
    // Calculate result count
    let resultCount = 0;
    if (Array.isArray(results)) {
      resultCount = results.length;
    } else if (typeof results === 'number') {
      resultCount = 1;
    } else if (results && typeof results === 'object') {
      resultCount = 1;
    }
    
    return {
      success: true,
      query: generatedQuery,
      results: results,
      resultCount,
      executionTime: Date.now() - startTime
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[EnhancedMongo] Query execution failed:', error);
    
    return {
      success: false,
      query: {
        collection: '',
        operation: 'find',
        query: {},
        explanation: ''
      },
      error: errorMessage,
      executionTime: Date.now() - startTime
    };
  }
}

/**
 * Get comprehensive database information
 */
export async function getEnhancedDatabaseInfo(): Promise<{
  collections: string[];
  totalCollections: number;
  schemas: { [key: string]: any };
  statistics: {
    totalDocuments: number;
    collectionSizes: { [key: string]: number };
  };
}> {
  try {
    const collections = await listCollections();
    const schemas: { [key: string]: any } = {};
    const collectionSizes: { [key: string]: number } = {};
    let totalDocuments = 0;
    
    for (const collName of collections) {
      try {
        // Get sample documents
        schemas[collName] = await getCollectionSample(collName, 3);
        
        // Get collection count
        const db = getMongoDb();
        const count = await db.collection(collName).countDocuments();
        collectionSizes[collName] = count;
        totalDocuments += count;
      } catch (error) {
        console.warn(`[EnhancedMongo] Could not get info for ${collName}:`, error);
        schemas[collName] = [];
        collectionSizes[collName] = 0;
      }
    }
    
    return {
      collections,
      totalCollections: collections.length,
      schemas,
      statistics: {
        totalDocuments,
        collectionSizes
      }
    };
  } catch (error) {
    console.error('[EnhancedMongo] Failed to get database info:', error);
    throw error;
  }
}

/**
 * Execute multiple queries in batch
 */
export async function executeBatchQueries(
  queries: Array<{ query: string; collection?: string }>,
  options: { readOnly?: boolean; maxResults?: number } = {}
): Promise<Array<{
  query: string;
  success: boolean;
  results?: any;
  error?: string;
}>> {
  const results: Array<{
    query: string;
    success: boolean;
    results?: any;
    error?: string;
  }> = [];
  
  for (const q of queries) {
    try {
      const result = await executeEnhancedNLQuery(q.query, {
        targetCollection: q.collection,
        readOnly: options.readOnly,
        maxResults: options.maxResults
      });
      
      results.push({
        query: q.query,
        success: result.success,
        results: result.results,
        error: result.error
      });
    } catch (error) {
      results.push({
        query: q.query,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return results;
}
