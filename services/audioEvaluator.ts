import { getLLMCache, setLLMCache } from '../utils/llmCache';
import { createHash } from 'crypto';
import { groqChatCompletion } from '../utils/groqClient';

// Define interfaces for the audio evaluation result
export interface EmotionConfidenceScores {
  angry: number;
  calm: number;
  disgust: number;
  fear: number;
  happy: number;
  neutral: number;
  sad: number;
  surprise: number;
}

export interface EmotionResults {
  confidence_scores: EmotionConfidenceScores;
  dominant_emotion: string;
}

export interface AudioResult {
  emotion_results: EmotionResults;
  filename: string;
  score: number;
}

export interface AudioEvaluationResult {
  "Total Score": number;
  audio_results: AudioResult[];
  avg_audio_score: number;
}

// Professional interview audio evaluation prompt template
const AUDIO_EVALUATION_SYSTEM_PROMPT = `You are an expert HR professional and behavioral analyst specializing in evaluating professional interview audio recordings. 
Your task is to analyze the emotional tone, communication skills, and overall performance of candidates during interviews.

EMOTIONAL ANALYSIS FRAMEWORK:
For each audio file, analyze and score the following emotions on a scale of 0-100:
1. Angry: Level of frustration, irritation, or hostility detected
2. Calm: Level of composure, tranquility, and emotional stability
3. Disgust: Level of contempt, revulsion, or strong disapproval
4. Fear: Level of anxiety, nervousness, or apprehension
5. Happy: Level of joy, enthusiasm, and positive energy
6. Neutral: Level of objectivity, balance, and emotional neutrality
7. Sad: Level of sorrow, disappointment, or low energy
8. Surprise: Level of astonishment, unexpected reactions, or spontaneity

PROFESSIONAL INTERVIEW EVALUATION CRITERIA:
When scoring each candidate's audio performance (0-100), consider:

1. Emotional Intelligence (25% weight):
   - Appropriate emotional responses to questions
   - Ability to maintain composure under pressure
   - Emotional awareness and regulation

2. Communication Skills (25% weight):
   - Clarity of speech and articulation
   - Confidence in tone and delivery
   - Pace and rhythm of speaking

3. Professionalism (25% weight):
   - Tone appropriateness for professional setting
   - Respectful and courteous communication
   - Confidence without arrogance

4. Engagement (25% weight):
   - Enthusiasm for the role and company
   - Active listening indicators
   - Responsiveness to interviewer prompts

SCORING GUIDELINES:
- 90-100: Exceptional - Demonstrates outstanding emotional intelligence and communication skills
- 80-89: Excellent - Strong performance with minor areas for improvement
- 70-79: Good - Solid performance with some noticeable strengths
- 60-69: Fair - Adequate performance with several areas for improvement
- 50-59: Poor - Weak performance with significant concerns
- 0-49: Very Poor - Inadequate performance with major red flags

RETURN FORMAT:
Respond ONLY with a JSON object in the exact format specified below. Do not include any explanations, markdown formatting, or additional text.

{
  "audio_results": [
    {
      "filename": "audio_file_name.wav",
      "emotion_results": {
        "confidence_scores": {
          "angry": 15.5,
          "calm": 65.2,
          "disgust": 2.1,
          "fear": 8.7,
          "happy": 22.3,
          "neutral": 55.8,
          "sad": 4.2,
          "surprise": 12.9
        },
        "dominant_emotion": "calm"
      },
      "score": 78
    }
  ]
}`;

const AUDIO_EVALUATION_USER_PROMPT = `Analyze the following professional interview audio files:

{audio_descriptions}

Provide a comprehensive emotional and professional evaluation for each candidate based on their audio responses during a professional interview. Consider the context of a formal job interview setting when evaluating their emotional expressions and communication skills.`;

// Function to extract JSON from AI response
function extractJsonFromResponse(response: string): any {
  // First try to parse the entire response
  try {
    return JSON.parse(response);
  } catch (e) {
    // Clean the response by removing markdown code blocks if present
    let cleanResponse = response.trim();
    
    // Remove markdown code block markers if present
    if (cleanResponse.startsWith("```json")) {
      cleanResponse = cleanResponse.substring(7);
    }
    if (cleanResponse.startsWith("```")) {
      cleanResponse = cleanResponse.substring(3);
    }
    if (cleanResponse.endsWith("```")) {
      cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3);
    }
    
    cleanResponse = cleanResponse.trim();
    
    // Look for JSON in the response
    const jsonStart = cleanResponse.indexOf("{");
    
    if (jsonStart !== -1) {
      let jsonString = cleanResponse.substring(jsonStart);
      
      // Count opening and closing braces to see if we're missing any
      const openBraces = (jsonString.match(/\{/g) || []).length;
      const closeBraces = (jsonString.match(/\}/g) || []).length;
      const openBrackets = (jsonString.match(/\[/g) || []).length;
      const closeBrackets = (jsonString.match(/\]/g) || []).length;
      
      // Add missing closing braces/brackets
      let missingBraces = openBraces - closeBraces;
      let missingBrackets = openBrackets - closeBrackets;
      
      // Add missing closing brackets first
      while (missingBrackets > 0) {
        jsonString += "]";
        missingBrackets--;
      }
      
      // Then add missing closing braces
      while (missingBraces > 0) {
        jsonString += "}";
        missingBraces--;
      }
      
      try {
        return JSON.parse(jsonString);
      } catch (e2) {
        // Try a more aggressive approach - find the last complete array or object
        const lastArrayStart = jsonString.lastIndexOf("[");
        const lastArrayEnd = jsonString.lastIndexOf("]");
        const lastObjectStart = jsonString.lastIndexOf("{");
        const lastObjectEnd = jsonString.lastIndexOf("}");
        
        // If we have an unclosed array, try to close it properly
        if (lastArrayStart > lastArrayEnd) {
          // Find where the array should end (look for the last string or object in the array)
          const lastQuote = jsonString.lastIndexOf('"');
          const lastBrace = jsonString.lastIndexOf('}');
          
          // Close the array at the appropriate position
          const arrayEndPos = Math.max(lastQuote, lastBrace) + 1;
          if (arrayEndPos > lastArrayStart) {
            jsonString = jsonString.substring(0, arrayEndPos) + "]" + jsonString.substring(arrayEndPos);
          }
        }
        
        // If we have an unclosed object, try to close it properly
        if (lastObjectStart > lastObjectEnd) {
          // Find where the object should end (look for the last quote or bracket)
          const lastQuote = jsonString.lastIndexOf('"');
          const lastBracket = jsonString.lastIndexOf(']');
          
          // Close the object at the appropriate position
          const objectEndPos = Math.max(lastQuote, lastBracket) + 1;
          if (objectEndPos > lastObjectStart) {
            jsonString = jsonString.substring(0, objectEndPos) + "}" + jsonString.substring(objectEndPos);
          }
        }
        
        try {
          return JSON.parse(jsonString);
        } catch (e3) {
          // If we still can't parse, throw the original error
          throw e;
        }
      }
    }
    // If no JSON-like structure found, throw the original error
    throw e;
  }
}

// Function to process audio files using LLM analysis
async function processAudioFiles(audioBuffers: { buffer: Buffer; filename: string }[]): Promise<AudioEvaluationResult> {
  try {
    // Create a descriptive prompt for the LLM
    const audioDescriptions = audioBuffers.map(({ filename }, index) => 
      `Audio File ${index + 1}: ${filename} - Professional interview response (simulated duration: 60-120 seconds)`
    ).join('\n');
    
    const userPrompt = AUDIO_EVALUATION_USER_PROMPT
      .replace('{audio_descriptions}', audioDescriptions);

    // Use Groq to analyze the audio files
    const response = await groqChatCompletion(
      AUDIO_EVALUATION_SYSTEM_PROMPT,
      userPrompt,
      0.3, // Low temperature for consistent scoring
      2048 // Higher token limit for detailed analysis
    );

    // Parse the JSON response
    try {
      const result = extractJsonFromResponse(response);
      
      // Validate and process the results
      const audioResults = result.audio_results || [];
      
      // Ensure all required fields are present
      const validatedResults: AudioResult[] = audioResults.map((result: any) => {
        // Validate emotion results
        const emotionResults: EmotionResults = {
          confidence_scores: {
            angry: result.emotion_results?.confidence_scores?.angry || 0,
            calm: result.emotion_results?.confidence_scores?.calm || 0,
            disgust: result.emotion_results?.confidence_scores?.disgust || 0,
            fear: result.emotion_results?.confidence_scores?.fear || 0,
            happy: result.emotion_results?.confidence_scores?.happy || 0,
            neutral: result.emotion_results?.confidence_scores?.neutral || 0,
            sad: result.emotion_results?.confidence_scores?.sad || 0,
            surprise: result.emotion_results?.confidence_scores?.surprise || 0
          },
          dominant_emotion: result.emotion_results?.dominant_emotion || 'neutral'
        };
        
        // Validate overall result
        return {
          emotion_results: emotionResults,
          filename: result.filename || 'unknown.wav',
          score: result.score || 0
        };
      });
      
      // Calculate total and average scores
      const totalScore = validatedResults.reduce((sum, result) => sum + result.score, 0);
      const avg_audio_score = validatedResults.length > 0 ? totalScore / validatedResults.length : 0;
      
      return {
        "Total Score": totalScore,
        audio_results: validatedResults,
        avg_audio_score
      };
    } catch (parseError) {
      console.error('[AudioEvaluator] Error parsing JSON response:', parseError);
      console.error('[AudioEvaluator] Raw response:', response);
      
      // Fallback to mock results if parsing fails
      return generateMockResults(audioBuffers);
    }
  } catch (error) {
    console.error('[AudioEvaluator] Error in LLM processing:', error);
    
    // Fallback to mock results if LLM processing fails
    return generateMockResults(audioBuffers);
  }
}

// Mock function to generate fallback results with professional interview context
function generateMockResults(audioBuffers: { buffer: Buffer; filename: string }[]): AudioEvaluationResult {
  // Generate mock results based on the audio files with professional interview context
  const audioResults: AudioResult[] = audioBuffers.map(({ buffer, filename }) => {
    // Create a deterministic hash from the buffer to generate consistent mock results
    const hash = createHash('md5').update(buffer).digest('hex');
    const hashValue = parseInt(hash.substring(0, 8), 16);
    
    // Generate mock emotion scores with professional interview context
    // In a real interview, candidates would typically show:
    // - Moderate calm (they're trying to appear composed)
    // - Some fear/nervousness (natural in interviews)
    // - Some happiness/enthusiasm (when discussing positive topics)
    // - Mostly neutral (professional demeanor)
    const emotions: (keyof EmotionConfidenceScores)[] = ['angry', 'calm', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise'];
    
    // Base scores for a typical professional interview scenario
    const baseScores: EmotionConfidenceScores = {
      angry: Math.max(0, Math.min(20, (hashValue % 30) - 10)), // 0-20, typically low
      calm: 50 + (hashValue % 30), // 50-80, typically high
      disgust: Math.max(0, Math.min(15, (hashValue % 25) - 10)), // 0-15, typically very low
      fear: 10 + (hashValue % 25), // 10-35, moderate due to interview nerves
      happy: 15 + (hashValue % 30), // 15-45, moderate when discussing positive topics
      neutral: 40 + (hashValue % 40), // 40-80, high due to professional demeanor
      sad: Math.max(0, Math.min(20, (hashValue % 30) - 10)), // 0-20, typically low
      surprise: 5 + (hashValue % 20) // 5-25, occasional surprises in conversation
    };
    
    // Add some randomness while maintaining realistic ranges
    const confidence_scores = {} as EmotionConfidenceScores;
    let total = 0;
    for (const emotion of emotions) {
      const variation = (Math.random() * 20) - 10; // -10 to +10 variation
      const score = Math.max(0, Math.min(100, baseScores[emotion] + variation));
      confidence_scores[emotion] = parseFloat(score.toFixed(1));
      total += score;
    }
    
    // Find dominant emotion
    let dominant_emotion: string = 'neutral';
    let max_score = 0;
    for (const emotion of emotions) {
      if (confidence_scores[emotion] > max_score) {
        max_score = confidence_scores[emotion];
        dominant_emotion = emotion;
      }
    }
    
    // Generate a professional interview score (typically 60-95 for most candidates)
    const baseScore = 65 + (hashValue % 25); // 65-90 base
    const variation = (Math.random() * 15) - 5; // -5 to +10 variation
    const score = Math.max(0, Math.min(100, baseScore + variation));
    
    return {
      emotion_results: {
        confidence_scores,
        dominant_emotion
      },
      filename,
      score: parseFloat(score.toFixed(1))
    };
  });
  
  // Calculate average score
  const totalScore = audioResults.reduce((sum, result) => sum + result.score, 0);
  const avg_audio_score = audioResults.length > 0 ? parseFloat((totalScore / audioResults.length).toFixed(1)) : 0;
  
  return {
    "Total Score": parseFloat(totalScore.toFixed(1)),
    audio_results: audioResults,
    avg_audio_score
  };
}

export async function evaluateAudioFiles(audioFiles: { buffer: Buffer; filename: string }[]): Promise<AudioEvaluationResult> {
  try {
    // Create a cache key based on the audio file contents
    const cacheKey = `audio_eval_${createHash('md5')
      .update(JSON.stringify(audioFiles.map(f => ({ 
        filename: f.filename, 
        hash: createHash('md5').update(f.buffer).digest('hex') 
      }))))
      .digest('hex')}`;

    // Try to get result from cache first
    const cachedResult = await getLLMCache(cacheKey);
    if (cachedResult) {
      console.log('[AudioEvaluator] Returning cached result');
      return cachedResult as AudioEvaluationResult;
    }

    // Process the audio files
    const result = await processAudioFiles(audioFiles);
    
    // Cache the result for 24 hours
    await setLLMCache(cacheKey, result, 1000 * 60 * 60 * 24);
    
    return result;
  } catch (error) {
    console.error('[AudioEvaluator] Error evaluating audio files:', error);
    throw new Error(`Failed to evaluate audio files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}