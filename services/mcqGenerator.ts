import { groqChatCompletion } from '../utils/groqClient';
import { JobDescriptionData } from './jdExtractor';
import { ResumeData } from './resumeExtractor';
import { getLLMCache, setLLMCache } from '../utils/llmCache';
import { createHash } from 'crypto';

export interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const MCQ_GENERATION_PROMPT = `You are an expert assessment creator specializing in generating multiple-choice questions.
Based on the provided job description and resume, create 10 high-quality MCQ questions that test knowledge and skills relevant to the position.

MANDATORY REQUIREMENTS - You MUST include questions covering ALL of the following topics:
1. Whether the candidate has any special needs
2. Candidate's self-assessed strengths
3. Problem-solving ability
4. Assessment of emotional quotient (EQ)
5. Authorization to work in the country
6. Why should we hire you?

In addition to these mandatory questions, you may include questions about:
- Technical skills relevant to the position
- Experience and qualifications
- Behavioral competencies
- Company knowledge
- Role-specific scenarios

Return ONLY the JSON object in the following format:
{
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The correct option from the options array",
      "explanation": "Explanation of why this is the correct answer"
    }
  ]
}

Return only the JSON object. Do not include any other text, markdown formatting, or explanations.`;

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

export async function generateMCQQuestions(
  jobDescription: JobDescriptionData,
  resume: ResumeData
): Promise<MCQQuestion[]> {
  try {
    // Create a cache key based on the job description and resume data
    const cacheKey = `mcq_questions_${createHash('md5')
      .update(JSON.stringify({ job: jobDescription, resume: resume }))
      .digest('hex')}`;

    // Try to get result from cache first
    const cachedResult = await getLLMCache(cacheKey);
    if (cachedResult) {
      console.log('[MCQGenerator] Returning cached result');
      return cachedResult as MCQQuestion[];
    }

    // Create a comprehensive prompt with job description and resume data
    const prompt = `
Job Title: ${jobDescription.title}
Company: ${jobDescription.company}
Location: ${jobDescription.location}
Salary: ${jobDescription.salary}

Job Requirements:
${jobDescription.requirements.join('\n')}

Job Responsibilities:
${jobDescription.responsibilities.join('\n')}

Required Skills:
${jobDescription.skills.join('\n')}

Candidate Name: ${resume.name}
Candidate Email: ${resume.email}
Candidate Phone: ${resume.phone}

Candidate Skills:
${resume.skills.join('\n')}

Candidate Experience:
${resume.experience.join('\n')}

Candidate Education:
${resume.education.join('\n')}

Candidate Certifications:
${resume.certifications.join('\n')}
`;

    // Use Groq to generate MCQ questions with moderate temperature for creativity
    // and higher token limit as we're generating multiple questions
    const response = await groqChatCompletion(
      "You are an expert assessment creator specializing in generating multiple-choice questions.",
      `${MCQ_GENERATION_PROMPT}\n\nContext:\n${prompt}`,
      0.7, // Moderate temperature for creative question generation
      2048 // Higher token limit as we're generating multiple questions with explanations
    );

    // Parse the JSON response
    try {
      const result = extractJsonFromResponse(response);
      const questions = result.questions || [];
      
      // Cache the result for 24 hours
      await setLLMCache(cacheKey, questions, 1000 * 60 * 60 * 24);
      
      return questions;
    } catch (parseError) {
      console.error('[MCQGenerator] Error parsing JSON response:', parseError);
      console.error('[MCQGenerator] Raw response:', response);
      throw new Error('Failed to parse MCQ questions from AI response');
    }
  } catch (error) {
    console.error('[MCQGenerator] Error:', error);
    throw new Error(`Failed to generate MCQ questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}