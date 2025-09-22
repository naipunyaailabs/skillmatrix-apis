import { groqChatCompletion } from '../utils/groqClient';
import { getLLMCache, setLLMCache } from '../utils/llmCache';
import { createHash } from 'crypto';

export interface EvaluationScores {
  Authentic: number;
  Clarity: number;
  Fluency: number;
  Focused: number;
  NoFillers: number;
  Professionalism: number;
  Relevance: number;
  StructuredAnswers: number;
  UniqueQualities: number;
  total_average: number;
  total_overall_score: number;
}

export interface EvaluationInput {
  question: string;
  answer: string;
}

const EVALUATION_SYSTEM_PROMPT = `You are an expert HR professional and career coach who evaluates candidate responses to interview questions. 
Your task is to analyze the candidate's answer and provide scores for various aspects of their response on a scale of 1-10.

Scoring criteria:
1. Authenticity (Authentic): How genuine and honest the response appears
2. Clarity (Clarity): How clear and understandable the response is
3. Fluency (Fluency): How smoothly the response flows without awkward pauses or breaks
4. Focus (Focused): How well the response stays on topic and addresses the question
5. No Fillers: How few filler words (um, uh, like, you know, etc.) the response contains
6. Professionalism (Professionalism): How professional the tone and content are
7. Relevance (Relevance): How relevant the content is to the question asked
8. Structure (StructuredAnswers): How well-organized and structured the response is
9. Unique Qualities (UniqueQualities): How unique and distinctive the response is compared to typical answers

For each criterion, provide a score from 1-10 where:
1-3: Poor
4-6: Average
7-8: Good
9-10: Excellent

Return your response as a JSON object with the exact keys specified in the output format. Do not include any explanations or additional text, only the JSON object with these exact keys:
Authentic, Clarity, Fluency, Focused, NoFillers, Professionalism, Relevance, StructuredAnswers, UniqueQualities, total_average, total_overall_score`;

const EVALUATION_USER_PROMPT = `Question: {question}

Candidate's Answer: {answer}

Please evaluate this response according to the criteria provided and return ONLY a JSON object with the scores for each category. Remember to score each category from 1-10. Do not include any explanations or additional text, only the JSON object with these exact keys:
Authentic, Clarity, Fluency, Focused, NoFillers, Professionalism, Relevance, StructuredAnswers, UniqueQualities, total_average, total_overall_score`;

export async function evaluateAnswer(input: EvaluationInput): Promise<EvaluationScores> {
  try {
    // Create a cache key based on the input
    const cacheKey = `answer_eval_${createHash('md5')
      .update(`${input.question}_${input.answer}`)
      .digest('hex')}`;

    // Try to get result from cache first
    const cachedResult = await getLLMCache(cacheKey);
    if (cachedResult) {
      console.log('[AnswerEvaluator] Returning cached result');
      return cachedResult as EvaluationScores;
    }

    const userPrompt = EVALUATION_USER_PROMPT
      .replace('{question}', input.question)
      .replace('{answer}', input.answer);
    
    const response = await groqChatCompletion(
      EVALUATION_SYSTEM_PROMPT,
      userPrompt,
      0.3, // Low temperature for consistent scoring
      1024
    );
    
    // Try to parse the response as JSON
    try {
      // Clean up the response to extract JSON
      let cleanedResponse = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      // Try to find the JSON object in the response
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd);
      }
      
      // Parse the JSON
      let scores = JSON.parse(cleanedResponse) as Partial<EvaluationScores>;
      
      // Normalize field names if needed
      if ('Structure' in scores && !('StructuredAnswers' in scores)) {
        scores.StructuredAnswers = scores.Structure as number;
        delete scores.Structure;
      }
      
      if ('Focus' in scores && !('Focused' in scores)) {
        scores.Focused = scores.Focus as number;
        delete scores.Focus;
      }
      
      // Handle the old schema fields if present
      if ('Total' in scores && !('total_average' in scores)) {
        scores.total_average = scores.Total as number;
        delete scores.Total;
      }
      
      if ('overall Score(Total Sum)' in scores && !('total_overall_score' in scores)) {
        scores.total_overall_score = scores['overall Score(Total Sum)'] as number;
        delete scores['overall Score(Total Sum)'];
      }
      
      // Ensure all required fields are present
      const mainFields: (keyof EvaluationScores)[] = [
        'Authentic', 'Clarity', 'Fluency', 'Focused', 'NoFillers',
        'Professionalism', 'Relevance', 'StructuredAnswers', 'UniqueQualities'
      ];
      
      // Check if main fields are present
      for (const field of mainFields) {
        if (typeof scores[field] !== 'number') {
          throw new Error(`Missing or invalid field: ${field}`);
        }
      }
      
      // Calculate total_average if missing
      if (typeof scores.total_average !== 'number') {
        const sumOfScores = mainFields.reduce((sum, key) => sum + (scores[key] as number), 0);
        scores.total_average = Math.round((sumOfScores / mainFields.length) * 100) / 100;
      }
      
      // Calculate total_overall_score if missing
      if (typeof scores.total_overall_score !== 'number') {
        const sumOfScores = mainFields.reduce((sum, key) => sum + (scores[key] as number), 0);
        scores.total_overall_score = sumOfScores;
      }
      
      // Cast to full EvaluationScores type
      const fullScores = scores as EvaluationScores;
      
      // Cache the result for 12 hours
      await setLLMCache(cacheKey, fullScores, 1000 * 60 * 60 * 12);
      
      return fullScores;
    } catch (parseError) {
      console.error('[AnswerEvaluator] Failed to parse JSON response:', response);
      throw new Error('Failed to parse evaluation response from AI model');
    }
  } catch (error) {
    console.error('[AnswerEvaluator] Error evaluating answer:', error);
    throw new Error(`Failed to evaluate answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}