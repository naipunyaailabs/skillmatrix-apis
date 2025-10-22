/**
 * MCP MongoDB Query Service
 * Translates natural language queries to MongoDB queries using AI
 */

import { groqChatCompletion } from '../utils/groqClient';
import { executeMongoQuery, listCollections, getCollectionSample } from '../utils/mongoClient';

/**
 * Generate MongoDB query from natural language using AI
 */
export async function generateMongoQuery(
  naturalLanguageQuery: string,
  targetCollection?: string
): Promise<{
  collection: string;
  operation: string;
  query: any;
  explanation: string;
}> {
  try {
    // Get available collections
    const collections = await listCollections();
    
    // If target collection specified, validate it
    if (targetCollection && !collections.includes(targetCollection)) {
      throw new Error(`Collection '${targetCollection}' not found. Available collections: ${collections.join(', ')}`);
    }
    
    // Get collection samples for context
    const collectionSchemas: { [key: string]: any[] } = {};
    const collectionsToAnalyze = targetCollection ? [targetCollection] : collections.slice(0, 5);
    
    for (const collName of collectionsToAnalyze) {
      try {
        collectionSchemas[collName] = await getCollectionSample(collName, 2);
      } catch (error) {
        console.warn(`[MCP] Could not get sample for collection ${collName}:`, error);
      }
    }
    
    // Create AI prompt
    const systemPrompt = `You are an expert MongoDB query generator. Your task is to convert natural language queries into MongoDB queries.

Available Collections (${collections.length} total): ${collections.join(', ')}

Collection Schemas:
${Object.entries(collectionSchemas)
  .map(([name, samples]) => `
Collection: ${name}
Sample documents:
${JSON.stringify(samples, null, 2)}
`)
  .join('\n')}

Generate a MongoDB query based on the user's natural language request. Return ONLY a valid JSON object with this structure:
{
  "collection": "collection_name",
  "operation": "find|findOne|count|aggregate|distinct",
  "query": { /* MongoDB query object */ },
  "options": { /* optional: projection, sort, limit */ },
  "explanation": "Brief explanation of what the query does"
}

Important:
- Use proper MongoDB query syntax
- For 'find' operations, include appropriate filters
- For aggregation, return the pipeline array in "query"
- Be specific and accurate
- If the request is ambiguous, make reasonable assumptions based on available data
- If user asks about "how many collections" or "list collections", this is a METADATA question about the database itself, NOT a document query. In this case, you should respond with a note that this requires the /mongo-info endpoint instead.
- Focus on querying DOCUMENTS within collections, not database metadata
`;

    const userPrompt = `Convert this natural language query to MongoDB:

"${naturalLanguageQuery}"

${targetCollection ? `Target collection: ${targetCollection}` : 'Auto-detect the most relevant collection'}

Return ONLY the JSON response, no additional text.`;

    // Call AI to generate query
    const aiResponse = await groqChatCompletion(
      systemPrompt,
      userPrompt,
      0.3,
      2048
    );
    
    // Parse AI response
    let parsedResponse;
    try {
      // Clean up response
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.substring(7);
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.substring(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
      }
      
      parsedResponse = JSON.parse(cleanedResponse.trim());
    } catch (parseError) {
      console.error('[MCP] Failed to parse AI response:', aiResponse);
      throw new Error('Failed to generate valid MongoDB query from natural language');
    }
    
    // Validate response structure
    if (!parsedResponse.collection || !parsedResponse.operation) {
      throw new Error('Invalid query structure generated');
    }
    
    return {
      collection: parsedResponse.collection,
      operation: parsedResponse.operation,
      query: parsedResponse.query || {},
      explanation: parsedResponse.explanation || 'Query generated from natural language'
    };
    
  } catch (error) {
    console.error('[MCP] Error generating MongoDB query:', error);
    throw error;
  }
}

/**
 * Execute natural language query against MongoDB
 */
export async function executeNaturalLanguageQuery(
  naturalLanguageQuery: string,
  targetCollection?: string,
  options: {
    dryRun?: boolean;
    maxResults?: number;
  } = {}
): Promise<{
  success: boolean;
  query: {
    collection: string;
    operation: string;
    query: any;
    explanation: string;
  };
  results?: any;
  error?: string;
  resultCount?: number;
}> {
  try {
    // Generate MongoDB query from natural language
    const generatedQuery = await generateMongoQuery(naturalLanguageQuery, targetCollection);
    
    // If dry run, return query without executing
    if (options.dryRun) {
      return {
        success: true,
        query: generatedQuery,
        results: null,
        resultCount: 0
      };
    }
    
    // Execute the query
    const results = await executeMongoQuery(
      generatedQuery.collection,
      generatedQuery.operation,
      generatedQuery.query,
      {
        limit: options.maxResults || 100
      }
    );
    
    return {
      success: true,
      query: generatedQuery,
      results: results,
      resultCount: Array.isArray(results) ? results.length : 1
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[MCP] Natural language query execution failed:', error);
    
    return {
      success: false,
      query: {
        collection: '',
        operation: '',
        query: {},
        explanation: ''
      },
      error: errorMessage
    };
  }
}

/**
 * Get database statistics and available collections
 */
export async function getDatabaseInfo(): Promise<{
  collections: string[];
  schemas: { [key: string]: any[] };
}> {
  try {
    const collections = await listCollections();
    const schemas: { [key: string]: any[] } = {};
    
    for (const collName of collections) {
      try {
        schemas[collName] = await getCollectionSample(collName, 3);
      } catch (error) {
        console.warn(`[MCP] Could not get sample for ${collName}:`, error);
        schemas[collName] = [];
      }
    }
    
    return {
      collections,
      schemas
    };
  } catch (error) {
    console.error('[MCP] Failed to get database info:', error);
    throw error;
  }
}
