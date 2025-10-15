import { groqChatCompletion } from "../utils/groqClient";
import { parsePDF } from "../utils/pdfParser";
import { getLLMCache, setLLMCache } from "../utils/llmCache";
import { createHash } from "crypto";

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
  "experience": [
    {
      "role": "Job title",
      "company": "Company name",
      "duration": "Employment duration in readable format (e.g., 'Jan 2022 - Jun 2022' or '2022 - 2025')",
      "responsibilities": ["List of key responsibilities and achievements"]
    }
  ],
  "education": ["List of educational qualifications"],
  "certifications": ["List of certifications"],
  "industrialExperience": ["List of industrial experience"],
  "domainExperience": ["List of domain experience"],
  "totalIndustrialExperienceYears": "Total years of industrial experience as a number (sum all work experiences, e.g., if worked at Company A for 2 years and Company B for 3 years, this should be 5)",
  "totalDomainExperienceYears": "Total years of domain experience as a number"
}

IMPORTANT INSTRUCTIONS FOR CALCULATING EXPERIENCE:
1. To calculate totalIndustrialExperienceYears:
   - Look at each work experience entry in the experience array
   - For each entry, examine the duration field to determine length of employment
   - Convert time periods to years:
     * "Jan 2022 - Jun 2022" = 0.5 years (6 months)
     * "2022 - 2025" = 3 years
     * "2020 to present" = Current year (2024) - 2020 = 4 years
     * "3 years" = 3 years
     * "18 months" = 1.5 years
   - Sum all the years of experience from each job
   - Return ONLY the final sum as a NUMBER (not a string)

2. Examples of correct calculation:
   - Experience 1: "Jan 2020 - Jun 2022" (2.5 years) + Experience 2: "2022 - 2025" (3 years) = 5.5 years
   - Experience 1: "2020-2022" (2 years) + Experience 2: "2022-2024" (2 years) = 4 years

3. Common mistakes to avoid:
   - Do NOT return the duration of a single job
   - Do NOT return a string value like "5 years" - return the number 5
   - Do NOT return null or undefined - calculate and return a number
   - Do NOT guess - if you cannot calculate, use your best estimate based on the provided dates

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
    
    // Look for JSON in the response by finding the first opening brace
    const jsonStart = cleanResponse.indexOf("{");
    
    if (jsonStart !== -1) {
      // Extract everything from the first opening brace to the last closing brace
      const jsonEnd = cleanResponse.lastIndexOf("}") + 1;
      if (jsonEnd > jsonStart) {
        let jsonString = cleanResponse.substring(jsonStart, jsonEnd);
        
        // Try to parse the extracted JSON
        try {
          return JSON.parse(jsonString);
        } catch (e2) {
          // If parsing fails, try to fix common issues
          
          // Count opening and closing braces to see if we're missing any
          const openBraces = (jsonString.match(/\{/g) || []).length;
          const closeBraces = (jsonString.match(/\}/g) || []).length;
          const openBrackets = (jsonString.match(/\[/g) || []).length;
          const closeBrackets = (jsonString.match(/\]/g) || []).length;
          
          // Add missing closing brackets first
          let missingBrackets = openBrackets - closeBrackets;
          while (missingBrackets > 0) {
            jsonString += "]";
            missingBrackets--;
          }
          
          // Then add missing closing braces
          let missingBraces = openBraces - closeBraces;
          while (missingBraces > 0) {
            jsonString += "}";
            missingBraces--;
          }
          
          try {
            return JSON.parse(jsonString);
          } catch (e3) {
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
            } catch (e4) {
              // If we still can't parse, throw the original error
              throw e;
            }
          }
        }
      } else {
        // If we can't find a proper closing brace, try to construct a valid JSON
        // by finding the last complete object or array and closing it properly
        let jsonString = cleanResponse.substring(jsonStart);
        
        // Try to fix common JSON issues
        // Add missing closing brackets/braces
        const openBraces = (jsonString.match(/\{/g) || []).length;
        const closeBraces = (jsonString.match(/\}/g) || []).length;
        const openBrackets = (jsonString.match(/\[/g) || []).length;
        const closeBrackets = (jsonString.match(/\]/g) || []).length;
        
        // Add missing closing brackets first
        let missingBrackets = openBrackets - closeBrackets;
        while (missingBrackets > 0) {
          jsonString += "]";
          missingBrackets--;
        }
        
        // Then add missing closing braces
        let missingBraces = openBraces - closeBraces;
        while (missingBraces > 0) {
          jsonString += "}";
          missingBraces--;
        }
        
        try {
          return JSON.parse(jsonString);
        } catch (e2) {
          // If we still can't parse, throw the original error
          // FINAL AGGRESSIVE RECOVERY: Patch incomplete arrays/objects wherever detected
          let patched = jsonString;
          let openSq = [];
          let openCurl = [];
          for (let i = 0; i < patched.length; i++) {
            if (patched[i] === '[') openSq.push(i as never);
            else if (patched[i] === ']') openSq.pop();
            if (patched[i] === '{') openCurl.push(i as never);
            else if (patched[i] === '}') openCurl.pop();
          }
          // Close any unfinished arrays inside objects or array fields
          while (openSq.length) {
            const startIdx = openSq.pop();
            // Find next non-whitespace after the array start
            let closeIdx = startIdx !== undefined ? (startIdx as number) + 1 : 1;
            while (closeIdx < patched.length && (patched[closeIdx] === ' ' || patched[closeIdx] === '\n' || patched[closeIdx] === '\t')) closeIdx++;
            // If right after is a closing curly brace or end, insert before it; otherwise, insert at closeIdx
            if (patched[closeIdx] === '}') {
              patched = patched.slice(0, closeIdx) + ']' + patched.slice(closeIdx);
            } else {
              patched = patched.slice(0, closeIdx) + ']' + patched.slice(closeIdx);
            }
          }
          while (openCurl.length) {
            const startIdx = openCurl.pop();
            let closeIdx = startIdx !== undefined ? startIdx + 1 : 1;
            while (closeIdx < patched.length && (patched[closeIdx] === ' ' || patched[closeIdx] === '\n' || patched[closeIdx] === '\t')) closeIdx++;
            if (patched[closeIdx] === ']') {
              patched = patched.slice(0, closeIdx) + '}' + patched.slice(closeIdx);
            } else {
              patched = patched.slice(0, closeIdx) + '}' + patched.slice(closeIdx);
            }
          }
          try {
            return JSON.parse(patched);
          } catch (finalPatchErr) {}
          // If we still can't parse, throw the original error
          const opens = [cleanResponse.split('{').length-1, cleanResponse.split('[').length-1];
          const closes = [cleanResponse.split('}').length-1, cleanResponse.split(']').length-1];
          let fixed = cleanResponse;
          while(closes[1] < opens[1]) { fixed += ']'; closes[1]++; }
          while(closes[0] < opens[0]) { fixed += '}'; closes[0]++; }
          try {
            return JSON.parse(fixed);
          } catch(_) {
            throw e;
          }
        }
      }
    }
    // If no JSON-like structure found, throw the original error
    throw e;
  }
}

// Helper function to calculate years between dates
function calculateYearsBetweenDates(startDate: string, endDate: string): number {
  // Handle "present" or "current" as end date
  if (endDate.toLowerCase().includes('present') || endDate.toLowerCase().includes('current')) {
    endDate = new Date().getFullYear().toString();
  }
  
  // Try to parse different date formats
  const startYear = extractYear(startDate);
  const endYear = extractYear(endDate);
  
  if (startYear && endYear && startYear <= endYear) {
    // Calculate fractional years for partial years
    let years = endYear - startYear;
    
    // Handle month-level precision if available
    const startMonth = extractMonth(startDate);
    const endMonth = extractMonth(endDate);
    
    if (startMonth && endMonth) {
      const monthDiff = endMonth - startMonth;
      years += monthDiff / 12;
    }
    
    return Math.max(0, years);
  }
  
  return 0;
}

// Helper function to extract year from date string
function extractYear(dateStr: string): number | null {
  // Pattern to match 4-digit years
  const yearPattern = /\b(19|20)\d{2}\b/;
  const match = dateStr.match(yearPattern);
  return match ? parseInt(match[0]) : null;
}

// Helper function to extract month from date string
function extractMonth(dateStr: string): number | null {
  // Pattern to match month names or numbers
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthPattern = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|0?[1-9]|1[0-2])\b/i;
  const match = dateStr.match(monthPattern);
  
  if (match) {
    const month = match[0].toLowerCase();
    if (isNaN(parseInt(month))) {
      // Month name
      return monthNames.indexOf(month.substring(0, 3)) + 1;
    } else {
      // Month number
      return parseInt(month);
    }
  }
  
  return null;
}

// Helper function to extract years from text using regex patterns
function extractYearsFromText(text: string): number {
  let totalYears = 0;
  
  // Handle "2016-2020" format specifically
  const yearRangePattern = /\b(20[0-2]\d)\s*[-–]\s*(?:(20[0-2]\d)|present|current)\b/gi;
  let match;
  while ((match = yearRangePattern.exec(text)) !== null) {
    const startYear = parseInt(match[1]);
    const endYearStr = match[2] ? match[2].toLowerCase() : 'present';
    
    let endYear: number;
    if (endYearStr === 'present' || endYearStr === 'current') {
      endYear = new Date().getFullYear();
    } else {
      endYear = parseInt(endYearStr);
    }
    
    if (!isNaN(startYear) && !isNaN(endYear) && startYear <= endYear && startYear >= 1900 && endYear <= 2030) {
      const years = endYear - startYear;
      totalYears = Math.max(totalYears, years); // Take maximum period
    }
  }
  
  // Handle "Aug 2024 - Sep 2024" format
  const monthYearPattern = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(20[0-2]\d)\s*[-–]\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(20[0-2]\d)|(present|current))/gi;
  while ((match = monthYearPattern.exec(text)) !== null) {
    const startYear = parseInt(match[1]);
    const endYearStr = match[2] || (match[3] ? match[3].toLowerCase() : 'present');
    
    let endYear: number;
    if (endYearStr === 'present' || endYearStr === 'current') {
      endYear = new Date().getFullYear();
    } else {
      endYear = parseInt(endYearStr);
    }
    
    if (!isNaN(startYear) && !isNaN(endYear) && startYear <= endYear && startYear >= 1900 && endYear <= 2030) {
      const years = endYear - startYear;
      // For month-level precision, we might have partial years
      if (years === 0) {
        // Same year, so less than 1 year
        totalYears = Math.max(totalYears, 0.1); // At least 1 month
      } else {
        totalYears = Math.max(totalYears, years);
      }
    }
  }
  
  // Handle "X years" or "X yrs" format
  const simpleYearPattern = /(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/gi;
  while ((match = simpleYearPattern.exec(text)) !== null) {
    const years = parseFloat(match[1]);
    if (!isNaN(years) && years > 0 && years <= 50) {
      totalYears = Math.max(totalYears, years);
    }
  }
  
  return Math.round(totalYears * 10) / 10; // Round to 1 decimal place
}

// Function to calculate total experience from experience text
function calculateTotalExperience(experience: any[]): number {
  let totalYears = 0;
  
  // Handle case where experience is an array of objects (new format)
  if (experience && Array.isArray(experience) && experience.length > 0) {
    // Check if it's an array of objects with duration properties
    if (typeof experience[0] === 'object' && experience[0] !== null) {
      // For each experience entry, try to calculate duration and sum them up
      const validDurations: number[] = [];
      
      for (const exp of experience) {
        let expYears = 0;
        
        // Check duration field
        if (exp.duration) {
          expYears = extractYearsFromText(exp.duration);
        }
        
        // Only count valid durations (greater than 0)
        if (expYears > 0) {
          validDurations.push(expYears);
          totalYears += expYears; // Sum up all valid durations
        }
      }
      
      // If we still have 0, try to extract from all duration texts combined
      if (totalYears === 0) {
        // Extract all duration information from objects
        const durationTexts: string[] = [];
        for (const exp of experience) {
          if (exp.duration) {
            durationTexts.push(exp.duration);
          }
        }
        
        // Join all duration texts for pattern matching
        if (durationTexts.length > 0) {
          const experienceText = durationTexts.join(' ').toLowerCase();
          totalYears = extractYearsFromText(experienceText);
        }
      }
    } 
    // Handle case where experience is an array of strings (old format)
    else if (typeof experience[0] === 'string') {
      const experienceText = experience.join(' ').toLowerCase();
      totalYears = extractYearsFromText(experienceText);
    }
  }
  
  // Cap at reasonable maximum
  if (totalYears > 50) {
    totalYears = 0; // Reset if unreasonably high
  }
  
  return Math.round(totalYears * 10) / 10; // Round to 1 decimal place
}

export async function extractResumeData(buffer: Buffer): Promise<ResumeData> {
  try {
    // Create a cache key based on the buffer content
    const cacheKey = `resume_extract_${createHash('md5')
      .update(buffer)
      .digest('hex')}`;

    console.log('[ResumeExtractor] Starting extraction, cache key:', cacheKey);

    // Try to get result from cache first
    const cachedResult = await getLLMCache(cacheKey);
    if (cachedResult) {
      console.log('[ResumeExtractor] Returning cached result');
      console.log('[ResumeExtractor] Cached data preview:', JSON.stringify({
        name: cachedResult.name,
        email: cachedResult.email,
        skillsCount: cachedResult.skills?.length || 0,
        experienceCount: cachedResult.experience?.length || 0
      }));
      return cachedResult as ResumeData;
    }

    // Parse PDF to extract text
    console.log('[ResumeExtractor] Parsing PDF...');
    const text = await parsePDF(buffer);
    console.log(`[ResumeExtractor] PDF parsed - Text length: ${text.length} characters`);
    
    if (text.length === 0) {
      console.error('[ResumeExtractor] ERROR: PDF text extraction returned EMPTY string!');
      console.error('[ResumeExtractor] This usually means:');
      console.error('[ResumeExtractor]   1. PDF is a scanned image (not text-based)');
      console.error('[ResumeExtractor]   2. PDF is corrupted or invalid');
      console.error('[ResumeExtractor]   3. PDF format is not supported by unpdf');
      console.error('[ResumeExtractor] Solution: Use text-based PDFs or implement OCR');
      
      // Return empty but valid structure instead of throwing
      return {
        name: '',
        email: '',
        phone: '',
        skills: [],
        experience: [],
        education: [],
        certifications: [],
        industrialExperience: [],
        domainExperience: [],
        totalIndustrialExperienceYears: 0,
        totalDomainExperienceYears: 0
      };
    }
    
    console.log(`[ResumeExtractor] First 300 chars of extracted text: ${text.substring(0, 300)}...`);
    
    // Use Groq to extract structured data with lower temperature for more deterministic output
    // and limited tokens to reduce costs and improve speed
    console.log('[ResumeExtractor] Calling Groq API...');
    const response = await groqChatCompletion(
      "You are an expert HR assistant specializing in extracting information from resumes.",
      `${RESUME_EXTRACTION_PROMPT}\n\nResume text:\n${text.substring(0, 10000)}`,
      0.3, // Lower temperature for more focused extraction
      1024 // Limit tokens as we're extracting structured data
    );
    
    console.log(`[ResumeExtractor] Groq API response length: ${response.length} characters`);
    console.log(`[ResumeExtractor] Groq API response preview: ${response.substring(0, 500)}...`);
    
    if (!response || response.length === 0) {
      console.error('[ResumeExtractor] ERROR: Groq API returned EMPTY response!');
      throw new Error('Groq API returned empty response');
    }
    
    // Parse the JSON response
    try {
      console.log('[ResumeExtractor] Attempting to parse JSON response...');
      let resumeData: any = extractJsonFromResponse(response);
      
      console.log('[ResumeExtractor] JSON parsed successfully');
      console.log('[ResumeExtractor] Parsed data keys:', Object.keys(resumeData));
      console.log('[ResumeExtractor] Raw AI response:', JSON.stringify(resumeData, null, 2));
      
      // Check for empty critical fields
      if (!resumeData.name || resumeData.name === '') {
        console.warn('[ResumeExtractor] WARNING: name is empty!');
      }
      if (!resumeData.email || resumeData.email === '') {
        console.warn('[ResumeExtractor] WARNING: email is empty!');
      }
      if (!resumeData.skills || resumeData.skills.length === 0) {
        console.warn('[ResumeExtractor] WARNING: skills array is empty!');
      }
      
      // Ensure proper data types
      if (resumeData.industrialExperience && !Array.isArray(resumeData.industrialExperience)) {
        resumeData.industrialExperience = [String(resumeData.industrialExperience)];
      }
      
      if (resumeData.domainExperience && !Array.isArray(resumeData.domainExperience)) {
        resumeData.domainExperience = [String(resumeData.domainExperience)];
      }
      
      // Debug: Log experience data
      console.log('[ResumeExtractor] Experience data:', JSON.stringify(resumeData.experience, null, 2));
      console.log('[ResumeExtractor] AI provided totalIndustrialExperienceYears:', resumeData.totalIndustrialExperienceYears);
      
      // Ensure we have a valid number for total industrial experience
      if (resumeData.totalIndustrialExperienceYears === undefined || 
          resumeData.totalIndustrialExperienceYears === null || 
          isNaN(Number(resumeData.totalIndustrialExperienceYears))) {
        // Fallback: calculate from experience text if AI didn't provide it
        console.log('[ResumeExtractor] Using fallback calculation for total experience');
        resumeData.totalIndustrialExperienceYears = calculateTotalExperience(resumeData.experience || []);
        console.log('[ResumeExtractor] Fallback calculation result:', resumeData.totalIndustrialExperienceYears);
      } else {
        resumeData.totalIndustrialExperienceYears = Number(resumeData.totalIndustrialExperienceYears) || 0;
        console.log('[ResumeExtractor] Using AI provided total experience:', resumeData.totalIndustrialExperienceYears);
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
      
      console.log('[ResumeExtractor] Final totalIndustrialExperienceYears:', resumeData.totalIndustrialExperienceYears);
      
      // Final validation of critical fields
      const criticalFields = ['name', 'email', 'skills', 'experience'];
      const emptyFields = criticalFields.filter(field => {
        if (Array.isArray(resumeData[field])) {
          return resumeData[field].length === 0;
        }
        return !resumeData[field] || resumeData[field] === '';
      });
      
      if (emptyFields.length > 0) {
        console.warn(`[ResumeExtractor] WARNING: The following fields are empty: ${emptyFields.join(', ')}`);
      }
      
      console.log('[ResumeExtractor] Final data summary:', {
        name: resumeData.name || 'EMPTY',
        email: resumeData.email || 'EMPTY',
        phone: resumeData.phone || 'EMPTY',
        skillsCount: resumeData.skills?.length || 0,
        experienceCount: resumeData.experience?.length || 0,
        totalYears: resumeData.totalIndustrialExperienceYears
      });
      
      // Cache the result for 24 hours
      await setLLMCache(cacheKey, resumeData, 1000 * 60 * 60 * 24);
      
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