import { groqChatCompletion } from "../utils/groqClient";
import { JobDescriptionData, extractJobDescriptionData } from "./jdExtractor";
import { ResumeData, extractResumeData } from "./resumeExtractor";
import { getLLMCache, setLLMCache } from "../utils/llmCache";
import { createHash } from "crypto";
import { createLogger } from "../utils/logger";
import { processMatrix } from "../utils/batchProcessor";

export interface MultipleMatchInput {
  jdFiles: File[];
  resumeFiles: File[];
}

export interface MultipleMatchResult {
  jdIndex: number;
  resumeIndex: number;
  jdTitle: string;
  candidateName: string;
  matchScore: number;
  matchedSkills: string[];
  unmatchedSkills: string[];
  strengths: string[];
  recommendations: string[];
  analysis: {
    relevantMatch: boolean;
    roleAlignment?: {
      score: number;
      assessment: string;
    };
    skillsetMatch?: {
      technicalSkillsMatch: number;
      matchedSkills: string[];
      criticalMissingSkills: string[];
      skillGapSeverity: string;
    };
    experienceAlignment?: {
      levelMatch: string;
      yearsMatch: string;
      relevantExperience: string;
    };
    rejectionReason?: string;
    // Additional fields for output formatting
    candidateEmail?: string;
    candidatePhone?: string;
    candidateCertifications?: string[];
    candidateExperience?: any[];
    candidateIndustrialExperienceYears?: number;
    candidateDomainExperienceYears?: number;
    requiredIndustrialExperienceYears?: number;
    requiredDomainExperienceYears?: number;
    [key: string]: any;
  };
}

export interface CachedExtraction {
  data: JobDescriptionData | ResumeData;
  fileName: string;
  extractedAt: number;
}

// Cache for extracted JDs and resumes to avoid re-extraction
const EXTRACTION_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

async function getCachedExtraction(fileBuffer: Buffer, fileName: string, type: 'jd' | 'resume'): Promise<JobDescriptionData | ResumeData | null> {
  try {
    // Create a hash of the file content for cache key
    const fileHash = createHash('md5').update(fileBuffer).digest('hex');
    const cacheKey = `${type}_extract_${fileHash}_${fileName}`;
    
    const cached = await getLLMCache(cacheKey);
    if (cached) {
      console.log(`[MultipleJobMatcher] Using cached ${type} extraction for ${fileName}`);
      return cached as JobDescriptionData | ResumeData;
    }
    
    return null;
  } catch (error) {
    console.error(`[MultipleJobMatcher] Error getting cached extraction:`, error);
    return null;
  }
}

async function setCachedExtraction(fileBuffer: Buffer, fileName: string, type: 'jd' | 'resume', data: JobDescriptionData | ResumeData): Promise<void> {
  try {
    const fileHash = createHash('md5').update(fileBuffer).digest('hex');
    const cacheKey = `${type}_extract_${fileHash}_${fileName}`;
    
    await setLLMCache(cacheKey, data, EXTRACTION_CACHE_TTL);
    console.log(`[MultipleJobMatcher] Cached ${type} extraction for ${fileName}`);
  } catch (error) {
    console.error(`[MultipleJobMatcher] Error caching extraction:`, error);
  }
}

async function extractWithCache(fileBuffer: Buffer, fileName: string, type: 'jd' | 'resume'): Promise<JobDescriptionData | ResumeData> {
  // Try to get from cache first
  const cached = await getCachedExtraction(fileBuffer, fileName, type);
  if (cached) {
    return cached;
  }
  
  // Extract data
  let extractedData: JobDescriptionData | ResumeData;
  if (type === 'jd') {
    extractedData = await extractJobDescriptionData(fileBuffer);
  } else {
    extractedData = await extractResumeData(fileBuffer);
  }
  
  // Cache the extracted data
  await setCachedExtraction(fileBuffer, fileName, type, extractedData);
  
  return extractedData;
}

const MULTIPLE_MATCHING_PROMPT = `You are an expert HR consultant specializing in job-resume matching analysis.
Analyze the provided job description and resume, focusing specifically on ROLE RELEVANCE and SKILLSET MATCHING.

CRITICAL EVALUATION CRITERIA:
1. Role Relevance: How well does the candidate's background align with the job role?
2. Technical Skills Match: What percentage of required technical skills does the candidate possess?
3. Experience Level Alignment: Does the candidate have appropriate experience for the role level?
4. Domain Expertise: Does the candidate have relevant industry/domain experience?

SCORING GUIDELINES:
- Only provide matches with score >= 60 (below 60 = irrelevant)
- Score 60-70: Basic relevance with some skill gaps
- Score 70-85: Good match with minor gaps
- Score 85-100: Excellent match, highly relevant

Return a JSON response with this structure:
{
  "matchScore": <number between 0-100>,
  "relevantMatch": <boolean - true only if score >= 60>,
  "roleAlignment": {
    "score": <number 0-100>,
    "assessment": "<detailed role relevance assessment>"
  },
  "skillsetMatch": {
    "technicalSkillsMatch": <percentage 0-100>,
    "matchedSkills": ["skill1", "skill2"],
    "criticalMissingSkills": ["skill3", "skill4"],
    "skillGapSeverity": "<low/medium/high>"
  },
  "experienceAlignment": {
    "levelMatch": "<junior/mid/senior>",
    "yearsMatch": "<assessment>",
    "relevantExperience": "<assessment>"
  },
  "strengths": ["specific strength1", "specific strength2"],
  "recommendations": ["specific recommendation1", "specific recommendation2"],
  "rejectionReason": "<reason if not relevant, null if relevant>"
}

BE STRICT: Only flag as relevantMatch=true if the candidate genuinely fits the role and has meaningful skill overlap.`;

async function performSingleMatch(jdData: JobDescriptionData, resumeData: ResumeData): Promise<any> {
  try {
    // Create cache key for this specific match
    const jdHash = createHash('md5').update(JSON.stringify(jdData)).digest('hex');
    const resumeHash = createHash('md5').update(JSON.stringify(resumeData)).digest('hex');
    const cacheKey = `match_${jdHash}_${resumeHash}`;
    
    // Try to get cached match result
    const cached = await getLLMCache(cacheKey);
    if (cached) {
      console.log('[MultipleJobMatcher] Using cached match result');
      return cached;
    }
    
    const prompt = `
Job Description:
Title: ${jdData.title}
Company: ${jdData.company}
Required Skills: ${jdData.skills?.join(', ') || 'Not specified'}
Requirements: ${jdData.requirements?.join(', ') || 'Not specified'}
Industrial Experience Required: ${jdData.requiredIndustrialExperienceYears || 0} years
Domain Experience Required: ${jdData.requiredDomainExperienceYears || 0} years
Industrial Experience Details: ${jdData.industrialExperience?.join(', ') || 'Not specified'}
Domain Experience Details: ${jdData.domainExperience?.join(', ') || 'Not specified'}
Location: ${jdData.location || 'Not specified'}

Resume:
Name: ${resumeData.name}
Current Skills: ${resumeData.skills?.join(', ') || 'Not specified'}
Work Experience: ${resumeData.experience?.join(', ') || 'Not specified'}
Education: ${resumeData.education?.join(', ') || 'Not specified'}
Total Experience: ${resumeData.totalIndustrialExperienceYears || 0} years
Certifications: ${resumeData.certifications?.join(', ') || 'Not specified'}

ANALYZE CAREFULLY:
1. Does this candidate's background align with the job role and requirements?
2. What percentage of required technical skills does the candidate possess?
3. Is the experience level appropriate for this role?
4. Are there any deal-breaker skill gaps?

Be strict in evaluation - only mark as relevant if there's genuine role and skill alignment.
`;
    
    const response = await groqChatCompletion(
      MULTIPLE_MATCHING_PROMPT,
      prompt,
      0.3,
      1024
    );
    
    // Parse the response
    let result;
    try {
      // Clean up the response
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.substring(7);
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.substring(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
      }
      
      // Find JSON object
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd);
      }
      
      result = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('[MultipleJobMatcher] Failed to parse AI response:', response);
      // Fallback result - mark as irrelevant to be filtered out
      result = {
        matchScore: 0,
        relevantMatch: false,
        roleAlignment: { score: 0, assessment: "Unable to analyze due to parsing error" },
        skillsetMatch: {
          technicalSkillsMatch: 0,
          matchedSkills: [],
          criticalMissingSkills: [],
          skillGapSeverity: "high"
        },
        experienceAlignment: { levelMatch: "unknown", yearsMatch: "unknown", relevantExperience: "unknown" },
        strengths: [],
        recommendations: ["Unable to analyze - please check data quality"],
        rejectionReason: "AI response parsing failed"
      };
    }
    
    // Cache the result
    await setLLMCache(cacheKey, result, 1000 * 60 * 60 * 12); // 12 hours
    
    return result;
  } catch (error) {
    console.error('[MultipleJobMatcher] Error in performSingleMatch:', error);
    throw error;
  }
}

export async function matchMultipleJDsWithMultipleResumes(
  input: MultipleMatchInput,
  requestId?: string
): Promise<MultipleMatchResult[]> {
  const logger = createLogger(requestId, 'MultipleJobMatcher');
  
  try {
    const totalCombinations = input.jdFiles.length * input.resumeFiles.length;
    logger.info('Starting multiple job matching', {
      jdCount: input.jdFiles.length,
      resumeCount: input.resumeFiles.length,
      totalCombinations
    });
    
    // Extract all JDs with caching
    const extractionLogger = logger.child('Extraction');
    extractionLogger.info('Extracting job descriptions', { count: input.jdFiles.length });
    
    const jdExtractions = await Promise.all(
      input.jdFiles.map(async (file, index) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await extractWithCache(buffer, file.name, 'jd') as JobDescriptionData;
        extractionLogger.debug('JD extracted', { index, fileName: file.name, title: data.title });
        return { index, data, fileName: file.name };
      })
    );
    
    // Extract all resumes with caching
    extractionLogger.info('Extracting resumes', { count: input.resumeFiles.length });
    
    const resumeExtractions = await Promise.all(
      input.resumeFiles.map(async (file, index) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await extractWithCache(buffer, file.name, 'resume') as ResumeData;
        extractionLogger.debug('Resume extracted', { index, fileName: file.name, name: data.name });
        return { index, data, fileName: file.name };
      })
    );
    
    extractionLogger.info('Extraction completed', {
      jdCount: jdExtractions.length,
      resumeCount: resumeExtractions.length
    });
    
    // Perform matching for all combinations with controlled concurrency
    const matchLogger = logger.child('Matching');
    let processedCount = 0;
    
    const matchProcessor = async (
      jdExtraction: typeof jdExtractions[0],
      resumeExtraction: typeof resumeExtractions[0],
      jdIndex: number,
      resumeIndex: number
    ) => {
      matchLogger.debug('Matching combination', {
        jdTitle: jdExtraction.data.title,
        candidateName: resumeExtraction.data.name,
        jdIndex,
        resumeIndex
      });
      
      const matchAnalysis = await performSingleMatch(jdExtraction.data, resumeExtraction.data);
      
      // Check if this is a relevant match
      const isRelevant = matchAnalysis.relevantMatch === true && matchAnalysis.matchScore >= 60;
      
      if (isRelevant) {
        const matchResult: MultipleMatchResult = {
          jdIndex: jdExtraction.index,
          resumeIndex: resumeExtraction.index,
          jdTitle: jdExtraction.data.title || `JD ${jdExtraction.index + 1}`,
          candidateName: resumeExtraction.data.name || `Candidate ${resumeExtraction.index + 1}`,
          matchScore: matchAnalysis.matchScore || 0,
          matchedSkills: matchAnalysis.skillsetMatch?.matchedSkills || [],
          unmatchedSkills: matchAnalysis.skillsetMatch?.criticalMissingSkills || [],
          strengths: matchAnalysis.strengths || [],
          recommendations: matchAnalysis.recommendations || [],
          analysis: {
            ...matchAnalysis,
            // Add resume data for output formatting
            candidateEmail: resumeExtraction.data.email,
            candidatePhone: resumeExtraction.data.phone,
            candidateCertifications: resumeExtraction.data.certifications || [],
            candidateExperience: resumeExtraction.data.experience || [],
            candidateIndustrialExperienceYears: resumeExtraction.data.totalIndustrialExperienceYears || 0,
            candidateDomainExperienceYears: resumeExtraction.data.totalDomainExperienceYears || 0,
            requiredIndustrialExperienceYears: jdExtraction.data.requiredIndustrialExperienceYears || 0,
            requiredDomainExperienceYears: jdExtraction.data.requiredDomainExperienceYears || 0
          }
        };
        
        matchLogger.info('Relevant match found', {
          candidateName: matchResult.candidateName,
          jdTitle: matchResult.jdTitle,
          matchScore: matchResult.matchScore
        });
        
        return matchResult;
      } else {
        matchLogger.debug('Match filtered out (low relevance)', {
          candidateName: resumeExtraction.data.name,
          jdTitle: jdExtraction.data.title,
          matchScore: matchAnalysis.matchScore || 0,
          rejectionReason: matchAnalysis.rejectionReason
        });
        
        return null;
      }
    };
    
    // Process matrix with controlled concurrency (3 parallel operations)
    const batchResult = await processMatrix(
      jdExtractions,
      resumeExtractions,
      matchProcessor,
      {
        concurrency: 3,
        onProgress: (processed, total) => {
          if (processed % 5 === 0 || processed === total) {
            matchLogger.info('Matching progress', {
              processed,
              total,
              percentage: Math.round((processed / total) * 100)
            });
          }
        },
        onError: (error, item, index) => {
          matchLogger.error('Match processing failed', error, {
            index,
            item: item ? { jd: item.row?.data?.title, resume: item.col?.data?.name } : null
          });
        }
      }
    );
    
    // Filter out null results (filtered matches) and remove row/col index metadata
    const allMatchResults = batchResult.success
      .filter((result): result is MultipleMatchResult & { rowIndex: number; colIndex: number } => result !== null)
      .map(({ rowIndex, colIndex, ...matchResult }) => matchResult);
    
    logger.info('Matching completed', {
      totalProcessed: batchResult.totalProcessed,
      relevantMatches: allMatchResults.length,
      filteredOut: totalCombinations - allMatchResults.length,
      errors: batchResult.totalErrors
    });
    
    // Sort results by match score (highest first)
    allMatchResults.sort((a, b) => b.matchScore - a.matchScore);
    
    return allMatchResults;
  } catch (error) {
    logger.error('Multiple job matching failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}