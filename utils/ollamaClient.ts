import { Ollama } from 'ollama';

// Initialize Ollama client
const ollama = new Ollama({
  host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
});

export async function ollamaChatCompletion(
  model: string,
  system: string,
  user: string
): Promise<string> {
  try {
    const response = await ollama.chat({
      model: model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    });

    return response.message.content;
  } catch (error) {
    console.error('[OllamaClient] Error:', error);
    throw new Error(`Failed to get response from Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}