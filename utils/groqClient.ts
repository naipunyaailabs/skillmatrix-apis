import { Groq } from 'groq-sdk';

// Parse multiple API keys from environment variable
const apiKeys = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '').split(',').map(key => key.trim()).filter(key => key);
let currentKeyIndex = 0;

// Initialize Groq clients for each API key
const groqClients = apiKeys.map(apiKey => new Groq({ apiKey }));

// Simple in-memory cache for rate limiting
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // Adjust based on your API limits

// Get current Groq client
function getCurrentGroqClient(): Groq {
  if (groqClients.length === 0) {
    throw new Error('No Groq API keys configured');
  }
  const client = groqClients[currentKeyIndex];
  if (!client) {
    throw new Error('Groq client not found');
  }
  return client;
}

// Rotate to the next API key
function rotateApiKey(): void {
  if (groqClients.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % groqClients.length;
    console.log(`[GroqClient] Rotated to API key ${currentKeyIndex + 1}/${groqClients.length}`);
  }
}

// Check rate limit for current key
function checkRateLimit(): boolean {
  const key = apiKeys[currentKeyIndex];
  const now = Date.now();
  
  if (!rateLimitCache.has(key)) {
    rateLimitCache.set(key, { count: 0, resetTime: now + RATE_LIMIT_WINDOW });
  }
  
  const rateData = rateLimitCache.get(key)!;
  
  // Reset counter if window has passed
  if (now >= rateData.resetTime) {
    rateData.count = 0;
    rateData.resetTime = now + RATE_LIMIT_WINDOW;
  }
  
  // Check if we're within limits
  if (rateData.count < MAX_REQUESTS_PER_WINDOW) {
    rateData.count++;
    return true;
  }
  
  return false;
}

// Wait for rate limit reset
async function waitForRateLimitReset(): Promise<void> {
  const key = apiKeys[currentKeyIndex];
  const rateData = rateLimitCache.get(key);
  
  if (rateData) {
    const waitTime = Math.max(0, rateData.resetTime - Date.now());
    if (waitTime > 0) {
      console.log(`[GroqClient] Waiting ${waitTime}ms for rate limit reset`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

export async function groqChatCompletion(
  system: string,
  user: string,
  temperature: number = 0.3, // Lower temperature for more deterministic output
  max_tokens: number = 1024 // Limit tokens to reduce costs and improve speed
): Promise<string> {
  let attempts = 0;
  const maxAttempts = Math.max(groqClients.length * 2, 3); // Try each key twice, minimum 3 attempts
  
  while (attempts < maxAttempts) {
    try {
      // Check rate limit before making request
      if (!checkRateLimit()) {
        console.log(`[GroqClient] Rate limit exceeded for key ${currentKeyIndex + 1}, waiting...`);
        await waitForRateLimitReset();
        continue;
      }
      
      const groq = getCurrentGroqClient();
      
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        model: 'llama3-8b-8192',
        temperature: temperature,
        max_tokens: max_tokens,
      });

      return chatCompletion.choices[0]?.message?.content || '';
    } catch (error) {
      attempts++;
      console.error(`[GroqClient] Attempt ${attempts} failed:`, error);
      
      // If we have multiple keys and this might be a rate limit error, rotate and try again
      if (attempts < maxAttempts && error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        const isRateLimitError = errorMessage.includes('rate limit') || 
                                errorMessage.includes('quota') || 
                                errorMessage.includes('too many requests') ||
                                error.message.includes('429');
        
        if (isRateLimitError && groqClients.length > 1) {
          rotateApiKey();
          console.log(`[GroqClient] Rate limit error, rotating to API key ${currentKeyIndex + 1}/${groqClients.length}`);
          
          // Wait a bit before retrying with new key
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        // For other errors, wait before retrying
        if (attempts < maxAttempts - 1) {
          const waitTime = Math.min(1000 * Math.pow(2, attempts), 10000); // Exponential backoff, max 10 seconds
          console.log(`[GroqClient] Waiting ${waitTime}ms before retrying...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      // If we've exhausted all attempts, throw the error
      if (attempts >= maxAttempts) {
        throw new Error(`Failed to get response from Groq after ${maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
  
  throw new Error('Failed to get response from Groq after all attempts');
}