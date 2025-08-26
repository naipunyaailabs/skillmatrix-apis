import { groqChatCompletion } from '../utils/groqClient';
import { JobDescriptionData } from './jdExtractor';
import { ResumeData } from './resumeExtractor';

export interface MatchResult {
  matchScore: number;
  matchedSkills: string[];
  unmatchedSkills: string[];
  recommendations: string[];
  summary: string;
  strengths?: string[]; // Adding optional strengths field
  industrialExperienceMatch?: number; // Adding industrial experience match score
  domainExperienceMatch?: number; // Adding domain experience match score
}

const JOB_MATCHING_PROMPT = `You are an expert HR consultant specializing in job-resume matching analysis.
Analyze the provided job description and resume to determine how well they match.

Return ONLY the JSON object in the following format:
{
  "matchScore": "Matching percentage as a number between 0 and 100",
  "matchedSkills": ["List of skills that match between job description and resume"],
  "unmatchedSkills": ["List of skills required in job description but missing in resume"],
  "recommendations": ["List of recommendations to improve the match"],
  "summary": "A brief summary of the match analysis",
  "strengths": ["List of strengths in the resume that match the job requirements"],
  "industrialExperienceMatch": "Matching percentage for industrial experience (0-100)",
  "domainExperienceMatch": "Matching percentage for domain experience (0-100)"
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

export async function matchJobWithResume(
  jobDescription: JobDescriptionData,
  resume: ResumeData
): Promise<MatchResult> {
  try {
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

Required Industrial Experience:
${(jobDescription.industrialExperience || []).join('\n')}

Required Domain Experience:
${(jobDescription.domainExperience || []).join('\n')}

Candidate Name: ${resume.name}
Candidate Email: ${resume.email}
Candidate Phone: ${resume.phone}

Candidate Skills:
${resume.skills.join('\n')}

Candidate Experience:
${resume.experience.join('\n')}

Candidate Industrial Experience:
${(resume.industrialExperience || []).join('\n')}

Candidate Domain Experience:
${(resume.domainExperience || []).join('\n')}

Candidate Education:
${resume.education.join('\n')}

Candidate Certifications:
${resume.certifications.join('\n')}
`;

    // Use Groq to analyze the match
    const response = await groqChatCompletion(
      "You are an expert HR consultant specializing in job-resume matching analysis.",
      `${JOB_MATCHING_PROMPT}\n\nContext:\n${prompt}`
    );

    // Parse the JSON response
    try {
      const matchResult: MatchResult = extractJsonFromResponse(response);
      return matchResult;
    } catch (parseError) {
      console.error('[JobMatcher] Error parsing JSON response:', parseError);
      console.error('[JobMatcher] Raw response:', response);
      throw new Error('Failed to parse match result from AI response');
    }
  } catch (error) {
    console.error('[JobMatcher] Error:', error);
    throw new Error(`Failed to match job with resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}