import { matchMultipleJDsWithMultipleResumes, type MultipleMatchInput, type MultipleMatchResult } from '../services/multipleJobMatcher';
import { createLogger } from '../utils/logger';
import { validateFiles, validateBatchLimits } from '../utils/validators';

export async function multipleJobMatchHandler(req: Request): Promise<Response> {
  // Generate request ID for tracking
  const requestId = crypto.randomUUID();
  const logger = createLogger(requestId, 'MultipleJobMatchHandler');
  
  try {
    logger.info('Received multiple job match request');
    
    const formData = await req.formData();
    
    // Get all JD files
    const jdFiles: File[] = [];
    const jdItems = formData.getAll('job_descriptions');
    logger.debug('Processing job description files', { count: jdItems.length });
    
    jdItems.forEach((item, index) => {
      if (item instanceof File) {
        logger.debug('JD file received', { index, fileName: item.name, size: item.size });
        jdFiles.push(item);
      } else {
        logger.warn('Invalid JD item type', { index, type: typeof item });
      }
    });
    
    // Get all resume files
    const resumeFiles: File[] = [];
    const resumeItems = formData.getAll('resumes');
    logger.debug('Processing resume files', { count: resumeItems.length });
    
    resumeItems.forEach((item, index) => {
      if (item instanceof File) {
        logger.debug('Resume file received', { index, fileName: item.name, size: item.size });
        resumeFiles.push(item);
      } else {
        logger.warn('Invalid resume item type', { index, type: typeof item });
      }
    });
    
    // Validate file presence
    if (jdFiles.length === 0) {
      logger.error('No job description files provided');
      return new Response(
        JSON.stringify({ 
          success: false,
          requestId,
          error: 'No job description files provided. Use "job_descriptions" field for multiple JD files.' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (resumeFiles.length === 0) {
      logger.error('No resume files provided');
      return new Response(
        JSON.stringify({ 
          success: false,
          requestId,
          error: 'No resume files provided. Use "resumes" field for multiple resume files.' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validate files
    const jdValidation = validateFiles(jdFiles);
    if (!jdValidation.valid) {
      logger.error('JD file validation failed', undefined, { validationError: jdValidation.error });
      return new Response(
        JSON.stringify({ 
          success: false,
          requestId,
          error: `Job description file validation failed: ${jdValidation.error}` 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const resumeValidation = validateFiles(resumeFiles);
    if (!resumeValidation.valid) {
      logger.error('Resume file validation failed', undefined, { validationError: resumeValidation.error });
      return new Response(
        JSON.stringify({ 
          success: false,
          requestId,
          error: `Resume file validation failed: ${resumeValidation.error}` 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validate batch limits
    const batchValidation = validateBatchLimits(jdFiles.length, resumeFiles.length);
    if (!batchValidation.valid) {
      logger.error('Batch limit validation failed', undefined, { validationError: batchValidation.error });
      return new Response(
        JSON.stringify({ 
          success: false,
          requestId,
          error: batchValidation.error
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const totalCombinations = jdFiles.length * resumeFiles.length;
    logger.info('Starting batch processing', {
      jdCount: jdFiles.length,
      resumeCount: resumeFiles.length,
      totalCombinations
    });
    
    // Perform the matching
    const input: MultipleMatchInput = {
      jdFiles,
      resumeFiles
    };
    
    const matchResults = await matchMultipleJDsWithMultipleResumes(input, requestId);
    
    logger.info('Batch processing completed successfully', {
      totalMatches: matchResults.length
    });
    
    // Debug: Log first result structure if available
    if (matchResults.length > 0 && process.env.LOG_LEVEL === 'debug') {
      logger.debug('First match result structure', {
        hasMatchScore: matchResults[0].matchScore !== undefined,
        hasAnalysis: matchResults[0].analysis !== undefined,
        hasMatchedSkills: matchResults[0].matchedSkills !== undefined,
        matchScore: matchResults[0].matchScore,
        analysisKeys: matchResults[0].analysis ? Object.keys(matchResults[0].analysis) : []
      });
    }
    
    // Format the response in the expected format matching /match endpoint
    const formattedResults = matchResults.map(result => {
      const matchScore = result.matchScore || 0;
      const matchedSkills = result.matchedSkills || [];
      const unmatchedSkills = result.unmatchedSkills || [];
      const allSkills = [...matchedSkills, ...unmatchedSkills];
      
      return {
        Id: crypto.randomUUID(),
        "Resume Data": {
          "Job Title": result.jdTitle || '',
          "Matching Percentage": matchScore.toString(),
          college_name: null,
          company_names: [],
          degree: null,
          designation: null,
          email: result.analysis?.candidateEmail || '',
          experience: result.analysis?.candidateIndustrialExperienceYears || 0,
          mobile_number: result.analysis?.candidatePhone || '',
          name: result.candidateName || '',
          no_of_pages: null,
          skills: allSkills,
          certifications: result.analysis?.candidateCertifications || [],
          total_experience: result.analysis?.candidateExperience || []
        },
        "Analysis": {
          "Matching Score": matchScore,
          "Unmatched Skills": unmatchedSkills,
          "Matched Skills": matchedSkills,
          "Matched Skills Percentage": result.analysis?.skillsetMatch?.technicalSkillsMatch || 0,
          "Unmatched Skills Percentage": 100 - (result.analysis?.skillsetMatch?.technicalSkillsMatch || 0),
          "Strengths": result.strengths || [],
          "Recommendations": result.recommendations || [],
          "Required Industrial Experience": `${result.analysis?.requiredIndustrialExperienceYears || 0} years`,
          "Required Domain Experience": `${result.analysis?.requiredDomainExperienceYears || 0} years`,
          "Candidate Industrial Experience": `${result.analysis?.candidateIndustrialExperienceYears || 0} years`,
          "Candidate Domain Experience": `${result.analysis?.candidateDomainExperienceYears || 0} years`
        }
      };
    });
    
    const response = {
      "POST Response": formattedResults
    };
    
    if (matchResults.length === 0) {
      logger.warn('No matches found (possible extraction failures)', { totalCombinations });
    }
    
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const logger = createLogger(undefined, 'MultipleJobMatchHandler');
    logger.error('Multiple job match request failed', error instanceof Error ? error : new Error(String(error)), {
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name || typeof error
    });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}