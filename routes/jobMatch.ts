import { matchJobWithResume } from '../services/jobMatcher';
import { extractJobDescriptionData } from '../services/jdExtractor';
import { extractResumeData } from '../services/resumeExtractor';
import { MatchResult } from '../services/jobMatcher';

// Simple in-memory queue for processing requests
const requestQueue: Array<() => Promise<any>> = [];
let isProcessing = false;

// Process the queue
async function processQueue() {
  if (isProcessing || requestQueue.length === 0) {
    return;
  }

  isProcessing = true;

  while (requestQueue.length > 0) {
    const task = requestQueue.shift();
    if (task) {
      try {
        await task();
      } catch (error) {
        console.error('[JobMatchHandler] Queue task error:', error);
      }
      // Add a small delay between requests to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  isProcessing = false;
}

// Add task to queue
function addToQueue(task: () => Promise<any>) {
  requestQueue.push(task);
  processQueue();
}

export async function jobMatchHandler(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    const jdFile = formData.get('jobDescription');
    
    // Handle both single resume and multiple resumes
    const resumeFiles: File[] = [];
    
    // Check for single resume
    const singleResume = formData.get('resume');
    if (singleResume && singleResume instanceof File) {
      resumeFiles.push(singleResume);
    }
    
    // Check for multiple resumes
    const multipleResumes = formData.getAll('resumes');
    for (const resume of multipleResumes) {
      if (resume instanceof File) {
        resumeFiles.push(resume);
      }
    }
    
    if (!jdFile || !(jdFile instanceof File)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No job description file provided or invalid file' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (resumeFiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No resume file(s) provided or invalid file(s)' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Extract job description data
    const jdBuffer = await jdFile.arrayBuffer();
    const jdData = await extractJobDescriptionData(Buffer.from(jdBuffer));
    
    // Process resumes with rate limiting
    const results: any[] = [];
    
    for (const resumeFile of resumeFiles) {
      // Create a promise for this resume processing
      const processResume = async () => {
        const resumeBuffer = await resumeFile.arrayBuffer();
        const resumeData = await extractResumeData(Buffer.from(resumeBuffer));
        const matchResult: MatchResult = await matchJobWithResume(jdData, resumeData);
        
        // Generate a unique ID for this match analysis
        const jobId = crypto.randomUUID();
        
        // Ensure we have a valid total experience value
        let totalExperience = 0;
        
        // First, try to use the resume data value
        if (resumeData.totalIndustrialExperienceYears !== undefined && 
            resumeData.totalIndustrialExperienceYears !== null && 
            !isNaN(resumeData.totalIndustrialExperienceYears) &&
            resumeData.totalIndustrialExperienceYears > 0) {
          totalExperience = resumeData.totalIndustrialExperienceYears;
        }
        // If not available, try to get from match result
        else if (matchResult.candidateIndustrialExperienceYears && 
                 matchResult.candidateIndustrialExperienceYears > 0) {
          totalExperience = matchResult.candidateIndustrialExperienceYears;
        }
        
        return {
          Id: jobId,
          "Resume Data": {
            "Job Title": jdData.title,
            "Matching Percentage": (matchResult.matchScore || 0).toString(),
            "college_name": null,
            "company_names": [],
            "degree": null,
            "designation": null,
            "email": resumeData.email,
            "experience": resumeData.totalIndustrialExperienceYears || 0,
            "mobile_number": resumeData.phone,
            "name": resumeData.name,
            "no_of_pages": null,
            "skills": resumeData.skills,
            "certifications": resumeData.certifications,
            "total_experience": resumeData.experience || []
          },
          "Analysis": {
            "Matching Score": matchResult.matchScore || 0,
            "Unmatched Skills": matchResult.unmatchedSkills || [],
            "Matched Skills": matchResult.matchedSkills || [],
            "Strengths": matchResult.strengths || [],
            "Recommendations": matchResult.recommendations || [],
            "Required Industrial Experience": `${matchResult.requiredIndustrialExperienceYears || 0} years`,
            "Required Domain Experience": `${matchResult.requiredDomainExperienceYears || 0} years`,
            "Candidate Industrial Experience": matchResult.industrialExperienceDetails || `${matchResult.candidateIndustrialExperienceYears || totalExperience || 0} years`,
            "Candidate Domain Experience": matchResult.domainExperienceDetails || `${matchResult.candidateDomainExperienceYears || 0} years`
          }
        };
      };
      
      // Add to processing queue
      const result = await new Promise((resolve, reject) => {
        addToQueue(async () => {
          try {
            const res = await processResume();
            resolve(res);
          } catch (error) {
            reject(error);
          }
        });
      });
      
      results.push(result);
    }
    
    return new Response(
      JSON.stringify({ 
        "POST Response": results
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[JobMatchHandler] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}