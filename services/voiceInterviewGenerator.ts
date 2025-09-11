import { groqChatCompletion } from '../utils/groqClient';
import { JobDescriptionData } from './jdExtractor';
import { getLLMCache, setLLMCache } from '../utils/llmCache';
import { createHash } from 'crypto';

export interface VoiceQuestion {
  question: string;
}

const VOICE_QUESTIONS_PROMPT = `You are an expert technical interviewer.
Generate 5 concise voice interview questions tailored to the provided job description and candidate resume.

Return ONLY the JSON object in the following format:
{
  "questions": [
    { "question": "Question text" }
  ]
}

Do not include any extra commentary or markdown.`;

function extractJsonFromResponse(response: string): any {
  try {
    return JSON.parse(response);
  } catch (e) {
    let clean = response.trim();
    if (clean.startsWith('```json')) clean = clean.slice(7);
    if (clean.startsWith('```')) clean = clean.slice(3);
    if (clean.endsWith('```')) clean = clean.slice(0, clean.length - 3);
    clean = clean.trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}') + 1;
    if (start !== -1 && end > start) {
      const slice = clean.slice(start, end);
      try { return JSON.parse(slice); } catch {}
    }
    throw e;
  }
}

export async function generateVoiceInterviewQuestions(
  jobDescription: JobDescriptionData
): Promise<VoiceQuestion[]> {
  try {
    // Create a cache key based on the job description
    const cacheKey = `voice_questions_${createHash('md5')
      .update(JSON.stringify(jobDescription))
      .digest('hex')}`;

    // Try to get result from cache first
    const cachedResult = await getLLMCache(cacheKey);
    if (cachedResult) {
      console.log('[VoiceInterviewGenerator] Returning cached result');
      return cachedResult as VoiceQuestion[];
    }

    const context = `
Job Title: ${jobDescription.title}
Company: ${jobDescription.company}
Location: ${jobDescription.location}

Requirements:\n${jobDescription.requirements.join('\n')}
Responsibilities:\n${jobDescription.responsibilities.join('\n')}
Skills:\n${jobDescription.skills.join('\n')}
`;

    const response = await groqChatCompletion(
      'You are an expert technical interviewer creating voice interview questions.',
      `${VOICE_QUESTIONS_PROMPT}\n\nContext:\n${context}`,
      0.5,
      1024
    );

    const parsed = extractJsonFromResponse(response);
    const questions = parsed?.questions || [];
    
    // Cache the result for 24 hours
    await setLLMCache(cacheKey, questions, 1000 * 60 * 60 * 24);
    
    return questions;
  } catch (error) {
    console.error('[VoiceInterviewGenerator] Error:', error);
    throw new Error(`Failed to generate voice interview questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


