import { Groq } from 'groq-sdk';

// Parse multiple API keys from environment variable
const apiKeys = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '').split(',').map(key => key.trim()).filter(key => key);
let currentKeyIndex = 0;

// Initialize Groq clients for each API key
const groqClients = apiKeys.map(apiKey => new Groq({ apiKey }));

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

export async function groqChatCompletion(
  system: string,
  user: string
): Promise<string> {
  let attempts = 0;
  const maxAttempts = groqClients.length || 1;

  while (attempts < maxAttempts) {
    try {
      const groq = getCurrentGroqClient();
      
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        model: 'llama3-8b-8192',
        temperature: 0.7,
        max_tokens: 2048,
      });

      return chatCompletion.choices[0]?.message?.content || '';
    } catch (error) {
      attempts++;
      console.error(`[GroqClient] Attempt ${attempts} failed:`, error);
      
      // If we have multiple keys and this is a rate limit error, rotate and try again
      if (attempts < maxAttempts && error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if ((errorMessage.includes('rate limit') || errorMessage.includes('quota')) && groqClients.length > 1) {
          rotateApiKey();
          console.log(`[GroqClient] Retrying with API key ${currentKeyIndex + 1}/${groqClients.length}`);
          continue;
        }
      }
      
      // If we've exhausted all attempts or this isn't a rate limit error, throw the error
      throw new Error(`Failed to get response from Groq: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  throw new Error('Failed to get response from Groq after all API key attempts');
}