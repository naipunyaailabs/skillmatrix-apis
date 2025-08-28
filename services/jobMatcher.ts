import { groqChatCompletion } from "../utils/groqClient";
import { JobDescriptionData } from "./jdExtractor";
import { ResumeData } from "./resumeExtractor";

const JOB_MATCHING_PROMPT = `You are an expert HR consultant specializing in job-resume matching analysis.
Analyze the provided job description and resume, and provide a comprehensive matching analysis in the following JSON format:
{
  "Id": "Unique identifier for this match analysis",
  "Resume Data": {
    "Job Title": "Job title from the job description",
    "Matching Percentage": "Overall matching percentage as a string (e.g., '85')",
    "college_name": null,
    "company_names": [],
    "degree": null,
    "designation": null,
    "email": "Candidate email",
    "experience": "Years of experience or experience details",
    "mobile_number": "Candidate phone number",
    "name": "Candidate name",
    "no_of_pages": null,
    "skills": ["List of candidate skills"],
    "certifications": ["List of candidate certifications"],
    "total_experience": ["List of work experiences"]
  },
  "Analysis": {
    "Matching Score": "Overall matching score as a number (e.g., 85)",
    "Unmatched Skills": ["List of skills required but not found in resume"],
    "Matched Skills": ["List of skills that match between job and resume"],
    "Strengths": ["List of candidate strengths relevant to the job"],
    "Recommendations": ["List of recommendations for improving match"],
    "Required Industrial Experience": "Required industrial experience description",
    "Required Domain Experience": "Required domain experience description",
    "Candidate Industrial Experience": "Candidate industrial experience description",
    "Candidate Domain Experience": "Candidate domain experience description"
  }
}

Provide a detailed analysis with specific examples from the resume that match or don't match the job requirements. Focus on skills, experience, and qualifications.`;

// Function to extract JSON from AI response
function extractJsonFromResponse(response: string): any {
  // First try to parse the entire response
  try {
    return JSON.parse(response);
  } catch (e) {
    // Clean the response by removing markdown code blocks and explanatory text if present
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
        let missingBrackets = openBraces - closeBraces;
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
          throw e;
        }
      }
    }
    // If no JSON-like structure found, throw the original error
    throw e;
  }
}

export interface MatchResult {
  Id: string;
  "Resume Data": {
    "Job Title": string;
    "Matching Percentage": string;
    college_name: null;
    company_names: any[];
    degree: null;
    designation: null;
    email: string;
    experience: number | any[];
    mobile_number: string;
    name: string;
    no_of_pages: null;
    skills: string[];
    certifications: string[];
    total_experience: any[];
  };
  Analysis: {
    "Matching Score": number;
    "Unmatched Skills": string[];
    "Matched Skills": string[];
    Strengths: string[];
    Recommendations: string[];
    "Required Industrial Experience": string;
    "Required Domain Experience": string;
    "Candidate Industrial Experience": string;
    "Candidate Domain Experience": string;
  };
  matchScore?: number;
  unmatchedSkills?: string[];
  matchedSkills?: string[];
  strengths?: string[];
  recommendations?: string[];
  requiredIndustrialExperienceYears?: number;
  requiredDomainExperienceYears?: number;
  candidateIndustrialExperienceYears?: number;
  candidateDomainExperienceYears?: number;
  industrialExperienceDetails?: string;
  domainExperienceDetails?: string;
  matchedSkillsPercentage?: number;
  unmatchedSkillsPercentage?: number;
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
${Array.isArray(jobDescription.industrialExperience) ? jobDescription.industrialExperience.join('\n') : 'Not specified'}

Required Domain Experience:
${Array.isArray(jobDescription.domainExperience) ? jobDescription.domainExperience.join('\n') : 'Not specified'}

Required Industrial Experience Years: ${jobDescription.requiredIndustrialExperienceYears || 0}

Required Domain Experience Years: ${jobDescription.requiredDomainExperienceYears || 0}

Candidate Name: ${resume.name}
Candidate Email: ${resume.email}
Candidate Phone: ${resume.phone}

Candidate Skills:
${resume.skills.join('\n')}

Candidate Experience:
${Array.isArray(resume.experience) ? JSON.stringify(resume.experience, null, 2) : 'Not specified'}

Candidate Industrial Experience:
${Array.isArray(resume.industrialExperience) ? resume.industrialExperience.join('\n') : 'Not specified'}

Candidate Domain Experience:
${Array.isArray(resume.domainExperience) ? resume.domainExperience.join('\n') : 'Not specified'}

Candidate Industrial Experience Years: ${resume.totalIndustrialExperienceYears || 0}

Candidate Domain Experience Years: ${resume.totalDomainExperienceYears || 0}

Candidate Education:
${resume.education.join('\n')}

Candidate Certifications:
${resume.certifications.join('\n')}
`;

    // Use Groq to analyze the match with moderate temperature for balanced analysis
    // and sufficient tokens for detailed response
    console.log('[JobMatcher] Sending request to Groq API');
    const response = await groqChatCompletion(
      "You are an expert HR consultant specializing in job-resume matching analysis.",
      `${JOB_MATCHING_PROMPT}\n\nContext:\n${prompt}`,
      0.5, // Moderate temperature for balanced analysis
      1536 // Sufficient tokens for detailed matching analysis
    );
    console.log('[JobMatcher] Received response from Groq API');

    // Parse the JSON response
    try {
      let matchResult: any = extractJsonFromResponse(response);
      
      // If the AI didn't provide a proper response in the required format, construct it manually
      if (!matchResult.Id || !matchResult["Resume Data"] || !matchResult.Analysis) {
        console.log('[JobMatcher] AI response format invalid, using fallback implementation');
        // Generate a UUID for the Id field
        const id = crypto.randomUUID();
        
        // Calculate matching score based on skill match percentage
        const totalSkills = jobDescription.skills.length;
        const matchedSkills = jobDescription.skills.filter(skill => resume.skills.includes(skill)).length;
        const matchingScore = totalSkills > 0 ? Math.round((matchedSkills / totalSkills) * 100) : 70;
        const matchedSkillsPercentage = totalSkills > 0 ? Math.round((matchedSkills / totalSkills) * 100) : 0;
        const unmatchedSkillsPercentage = totalSkills > 0 ? Math.round(((totalSkills - matchedSkills) / totalSkills) * 100) : 0;
        
        // Create the proper structure
        matchResult = {
          Id: id,
          "Resume Data": {
            "Job Title": jobDescription.title,
            "Matching Percentage": matchingScore.toString(),
            college_name: null,
            company_names: [],
            degree: null,
            designation: null,
            email: resume.email,
            experience: resume.totalIndustrialExperienceYears || 0,
            mobile_number: resume.phone,
            name: resume.name,
            no_of_pages: null,
            skills: resume.skills,
            certifications: resume.certifications,
            total_experience: Array.isArray(resume.experience) ? resume.experience : []
          },
          Analysis: {
            "Matching Score": matchingScore,
            "Unmatched Skills": jobDescription.skills.filter(skill => !resume.skills.includes(skill)),
            "Matched Skills": jobDescription.skills.filter(skill => resume.skills.includes(skill)),
            "Matched Skills Percentage": matchedSkillsPercentage,
            "Unmatched Skills Percentage": unmatchedSkillsPercentage,
            "Strengths": [`Candidate has ${resume.totalIndustrialExperienceYears || 0} years of relevant experience`],
            "Recommendations": [
              `Consider acquiring skills in: ${jobDescription.skills.filter(skill => !resume.skills.includes(skill)).join(', ') || 'N/A'}`,
              "Highlight relevant project experience in resume"
            ],
            "Required Industrial Experience": `${jobDescription.requiredIndustrialExperienceYears || 0} years`,
            "Required Domain Experience": `${jobDescription.requiredDomainExperienceYears || 0} years`,
            "Candidate Industrial Experience": `Candidate has ${resume.totalIndustrialExperienceYears || 0} years of industrial experience${jobDescription.requiredIndustrialExperienceYears && resume.totalIndustrialExperienceYears ? 
              (resume.totalIndustrialExperienceYears >= jobDescription.requiredIndustrialExperienceYears ? 
                `, which meets the required ${jobDescription.requiredIndustrialExperienceYears} years.` : 
                `, which falls short of the required ${jobDescription.requiredIndustrialExperienceYears} years.`) : 
              "."}`,
            "Candidate Domain Experience": `${resume.totalDomainExperienceYears || 0} years`
          },
          // Additional properties for direct access in jobMatch.ts
          matchScore: matchingScore,
          unmatchedSkills: jobDescription.skills.filter(skill => !resume.skills.includes(skill)),
          matchedSkills: jobDescription.skills.filter(skill => resume.skills.includes(skill)),
          strengths: [`Candidate has ${resume.totalIndustrialExperienceYears || 0} years of relevant experience`],
          recommendations: [
            `Consider acquiring skills in: ${jobDescription.skills.filter(skill => !resume.skills.includes(skill)).join(', ') || 'N/A'}`,
            "Highlight relevant project experience in resume"
          ],
          requiredIndustrialExperienceYears: jobDescription.requiredIndustrialExperienceYears || 0,
          requiredDomainExperienceYears: jobDescription.requiredDomainExperienceYears || 0,
          candidateIndustrialExperienceYears: resume.totalIndustrialExperienceYears || 0,
          candidateDomainExperienceYears: resume.totalDomainExperienceYears || 0,
          industrialExperienceDetails: `Candidate has ${resume.totalIndustrialExperienceYears || 0} years of industrial experience${jobDescription.requiredIndustrialExperienceYears && resume.totalIndustrialExperienceYears ? 
            (resume.totalIndustrialExperienceYears >= jobDescription.requiredIndustrialExperienceYears ? 
              `, which meets the required ${jobDescription.requiredIndustrialExperienceYears} years.` : 
              `, which falls short of the required ${jobDescription.requiredIndustrialExperienceYears} years.`) : 
            "."}`,
          domainExperienceDetails: `${resume.totalDomainExperienceYears || 0} years`,
          matchedSkillsPercentage,
          unmatchedSkillsPercentage
        };
      }
      
      // Ensure we have a proper UUID
      if (!matchResult.Id) {
        matchResult.Id = crypto.randomUUID();
      }
      
      // Ensure all required properties are present for direct access in jobMatch.ts
      matchResult.matchScore = matchResult.matchScore || matchResult.Analysis?.["Matching Score"] || 0;
      matchResult.unmatchedSkills = matchResult.unmatchedSkills || matchResult.Analysis?.["Unmatched Skills"] || [];
      matchResult.matchedSkills = matchResult.matchedSkills || matchResult.Analysis?.["Matched Skills"] || [];
      matchResult.strengths = matchResult.strengths || matchResult.Analysis?.Strengths || [];
      matchResult.recommendations = matchResult.recommendations || matchResult.Analysis?.Recommendations || [];
      matchResult.requiredIndustrialExperienceYears = matchResult.requiredIndustrialExperienceYears || jobDescription.requiredIndustrialExperienceYears || 0;
      matchResult.requiredDomainExperienceYears = matchResult.requiredDomainExperienceYears || jobDescription.requiredDomainExperienceYears || 0;
      matchResult.candidateIndustrialExperienceYears = matchResult.candidateIndustrialExperienceYears || resume.totalIndustrialExperienceYears || 0;
      matchResult.candidateDomainExperienceYears = matchResult.candidateDomainExperienceYears || resume.totalDomainExperienceYears || 0;
      if (matchResult.matchedSkillsPercentage === undefined || matchResult.unmatchedSkillsPercentage === undefined) {
        const totalSkills = jobDescription.skills.length;
        const matchedCount = (matchResult.matchedSkills || []).length;
        matchResult.matchedSkillsPercentage = totalSkills > 0 ? Math.round((matchedCount / totalSkills) * 100) : 0;
        matchResult.unmatchedSkillsPercentage = totalSkills > 0 ? Math.round(((totalSkills - matchedCount) / totalSkills) * 100) : 0;
      }
      
      console.log('[JobMatcher] Match result processed successfully');
      return matchResult;
    } catch (parseError) {
      console.error('[JobMatcher] Error parsing JSON response:', parseError);
      console.error('[JobMatcher] Raw response:', response);
      
      // Fallback: construct a basic response if AI parsing fails
      const id = crypto.randomUUID();
      // Calculate matching score based on skill match percentage
      const totalSkills = jobDescription.skills.length;
      const matchedSkills = jobDescription.skills.filter(skill => resume.skills.includes(skill)).length;
      const matchingScore = totalSkills > 0 ? Math.round((matchedSkills / totalSkills) * 100) : 70;
      const matchedSkillsPercentage = totalSkills > 0 ? Math.round((matchedSkills / totalSkills) * 100) : 0;
      const unmatchedSkillsPercentage = totalSkills > 0 ? Math.round(((totalSkills - matchedSkills) / totalSkills) * 100) : 0;
      
      const matchResult: MatchResult = {
        Id: id,
        "Resume Data": {
          "Job Title": jobDescription.title,
          "Matching Percentage": matchingScore.toString(),
          college_name: null,
          company_names: [],
          degree: null,
          designation: null,
          email: resume.email,
          experience: resume.totalIndustrialExperienceYears || 0,
          mobile_number: resume.phone,
          name: resume.name,
          no_of_pages: null,
          skills: resume.skills,
          certifications: resume.certifications,
          total_experience: Array.isArray(resume.experience) ? resume.experience : []
        },
        Analysis: {
          "Matching Score": matchingScore,
          "Unmatched Skills": jobDescription.skills.filter(skill => !resume.skills.includes(skill)),
          "Matched Skills": jobDescription.skills.filter(skill => resume.skills.includes(skill)),
          "Matched Skills Percentage": matchedSkillsPercentage,
          "Unmatched Skills Percentage": unmatchedSkillsPercentage,
          "Strengths": [`Candidate has ${resume.totalIndustrialExperienceYears || 0} years of relevant experience`],
          "Recommendations": [
            `Consider acquiring skills in: ${jobDescription.skills.filter(skill => !resume.skills.includes(skill)).join(', ') || 'N/A'}`,
            "Highlight relevant project experience in resume"
          ],
          "Required Industrial Experience": `${jobDescription.requiredIndustrialExperienceYears || 0} years`,
          "Required Domain Experience": `${jobDescription.requiredDomainExperienceYears || 0} years`,
          "Candidate Industrial Experience": `Candidate has ${resume.totalIndustrialExperienceYears || 0} years of industrial experience${jobDescription.requiredIndustrialExperienceYears && resume.totalIndustrialExperienceYears ? 
            (resume.totalIndustrialExperienceYears >= jobDescription.requiredIndustrialExperienceYears ? 
              `, which meets the required ${jobDescription.requiredIndustrialExperienceYears} years.` : 
              `, which falls short of the required ${jobDescription.requiredIndustrialExperienceYears} years.`) : 
            "."}`,
          "Candidate Domain Experience": `${resume.totalDomainExperienceYears || 0} years`
        },
        // Additional properties for direct access in jobMatch.ts
        matchScore: matchingScore,
        unmatchedSkills: jobDescription.skills.filter(skill => !resume.skills.includes(skill)),
        matchedSkills: jobDescription.skills.filter(skill => resume.skills.includes(skill)),
        strengths: [`Candidate has ${resume.totalIndustrialExperienceYears || 0} years of relevant experience`],
        recommendations: [
          `Consider acquiring skills in: ${jobDescription.skills.filter(skill => !resume.skills.includes(skill)).join(', ') || 'N/A'}`,
          "Highlight relevant project experience in resume"
        ],
        requiredIndustrialExperienceYears: jobDescription.requiredIndustrialExperienceYears || 0,
        requiredDomainExperienceYears: jobDescription.requiredDomainExperienceYears || 0,
        candidateIndustrialExperienceYears: resume.totalIndustrialExperienceYears || 0,
        candidateDomainExperienceYears: resume.totalDomainExperienceYears || 0,
        industrialExperienceDetails: `Candidate has ${resume.totalIndustrialExperienceYears || 0} years of industrial experience${jobDescription.requiredIndustrialExperienceYears && resume.totalIndustrialExperienceYears ? 
          (resume.totalIndustrialExperienceYears >= jobDescription.requiredIndustrialExperienceYears ? 
            `, which meets the required ${jobDescription.requiredIndustrialExperienceYears} years.` : 
            `, which falls short of the required ${jobDescription.requiredIndustrialExperienceYears} years.`) : 
          "."}`,
        domainExperienceDetails: `${resume.totalDomainExperienceYears || 0} years`
      };
      
      console.log('[JobMatcher] Using fallback implementation due to parsing error');
      return matchResult;
    }
  } catch (error) {
    console.error('[JobMatcher] Error:', error);
    throw new Error(`Failed to match job with resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}