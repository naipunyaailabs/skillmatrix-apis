import { groqChatCompletion } from '../utils/groqClient';
import { parsePDF } from '../utils/pdfParser';

export interface JobDescriptionData {
  title: string;
  company: string;
  location: string;
  salary: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  industrialExperience?: string[]; // Adding industrial experience requirements
  domainExperience?: string[];    // Adding domain experience requirements
}

const JD_EXTRACTION_PROMPT = `You are an expert HR assistant specializing in extracting information from job descriptions.
Extract the following information from the job description text and return it in JSON format:

{
  "title": "Job title",
  "company": "Company name",
  "location": "Job location",
  "salary": "Salary range or compensation details",
  "requirements": ["List of job requirements"],
  "responsibilities": ["List of job responsibilities"],
  "skills": ["List of required skills"],
  "industrialExperience": ["List of required industrial experiences (e.g., manufacturing, finance, healthcare, etc.)"],
  "domainExperience": ["List of required domain-specific experiences (e.g., machine learning, cloud computing, data analysis, etc.)"]
}

Return ONLY the JSON object. Do not include any other text, markdown formatting, or explanations.`;

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

export async function extractJobDescriptionData(buffer: Buffer): Promise<JobDescriptionData> {
  try {
    // Parse PDF to extract text
    const text = await parsePDF(buffer);
    
    // Use Groq to extract structured data
    const response = await groqChatCompletion(
      "You are an expert HR assistant specializing in extracting information from job descriptions.",
      `${JD_EXTRACTION_PROMPT}\n\nJob description text:\n${text.substring(0, 10000)}`
    );
    
    // Parse the JSON response
    try {
      const jdData: JobDescriptionData = extractJsonFromResponse(response);
      return jdData;
    } catch (parseError) {
      console.error('[JDExtractor] Error parsing JSON response:', parseError);
      console.error('[JDExtractor] Raw response:', response);
      throw new Error('Failed to parse job description data from AI response');
    }
  } catch (error) {
    console.error('[JDExtractor] Error:', error);
    throw new Error(`Failed to extract job description data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}