import { groqChatCompletion } from "../utils/groqClient";
import { parsePDF } from "../utils/pdfParser";

// Interface for resume data
export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string[];
  education: string[];
  certifications: string[];
  industrialExperience: string[];
  domainExperience: string[];
  totalIndustrialExperienceYears: number;
  totalDomainExperienceYears: number;
}

const RESUME_EXTRACTION_PROMPT = `You are an expert HR assistant specializing in extracting information from resumes.
Extract the key information from the resume and return ONLY the JSON object in the following format:
{
  "name": "Candidate name",
  "email": "Email address",
  "phone": "Phone number",
  "skills": ["List of skills"],
  "experience": ["List of work experiences"],
  "education": ["List of educational qualifications"],
  "certifications": ["List of certifications"],
  "industrialExperience": ["List of industrial experience"],
  "domainExperience": ["List of domain experience"],
  "totalIndustrialExperienceYears": "Total years of industrial experience as a number",
  "totalDomainExperienceYears": "Total years of domain experience as a number"
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

export async function extractResumeData(buffer: Buffer): Promise<ResumeData> {
  try {
    // Parse PDF to extract text
    const text = await parsePDF(buffer);
    
    // Use Groq to extract structured data
    const response = await groqChatCompletion(
      "You are an expert HR assistant specializing in extracting information from resumes.",
      `${RESUME_EXTRACTION_PROMPT}\n\nResume text:\n${text.substring(0, 10000)}`
    );
    
    // Parse the JSON response
    try {
      let resumeData: any = extractJsonFromResponse(response);
      
      // Ensure proper data types
      if (resumeData.industrialExperience && !Array.isArray(resumeData.industrialExperience)) {
        resumeData.industrialExperience = [String(resumeData.industrialExperience)];
      }
      
      if (resumeData.domainExperience && !Array.isArray(resumeData.domainExperience)) {
        resumeData.domainExperience = [String(resumeData.domainExperience)];
      }
      
      if (resumeData.totalIndustrialExperienceYears && typeof resumeData.totalIndustrialExperienceYears !== 'number') {
        resumeData.totalIndustrialExperienceYears = Number(resumeData.totalIndustrialExperienceYears) || 0;
      }
      
      if (resumeData.totalDomainExperienceYears && typeof resumeData.totalDomainExperienceYears !== 'number') {
        resumeData.totalDomainExperienceYears = Number(resumeData.totalDomainExperienceYears) || 0;
      }
      
      // Ensure all array fields are actually arrays
      const arrayFields = ['skills', 'experience', 'education', 'certifications'];
      arrayFields.forEach(field => {
        if (resumeData[field] && !Array.isArray(resumeData[field])) {
          resumeData[field] = [String(resumeData[field])];
        } else if (!resumeData[field]) {
          resumeData[field] = [];
        }
      });
      
      return resumeData as ResumeData;
    } catch (parseError) {
      console.error('[ResumeExtractor] Error parsing JSON response:', parseError);
      console.error('[ResumeExtractor] Raw response:', response);
      throw new Error('Failed to parse resume data from AI response');
    }
  } catch (error) {
    console.error('[ResumeExtractor] Error:', error);
    throw new Error(`Failed to extract resume data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}