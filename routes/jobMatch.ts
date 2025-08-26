import { matchJobWithResume } from '../services/jobMatcher';
import { extractJobDescriptionData } from '../services/jdExtractor';
import { extractResumeData } from '../services/resumeExtractor';
import { MatchResult } from '../services/jobMatcher';

export async function jobMatchHandler(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    const jdFile = formData.get('jobDescription');
    const resumeFile = formData.get('resume');
    
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
    
    if (!resumeFile || !(resumeFile instanceof File)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No resume file provided or invalid file' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Extract data from both files
    const jdBuffer = await jdFile.arrayBuffer();
    const resumeBuffer = await resumeFile.arrayBuffer();
    
    const jdData = await extractJobDescriptionData(Buffer.from(jdBuffer));
    const resumeData = await extractResumeData(Buffer.from(resumeBuffer));
    
    // Match job with resume
    const matchResult: MatchResult = await matchJobWithResume(jdData, resumeData);
    
    // Generate a unique ID for this match analysis
    const jobId = crypto.randomUUID();
    
    return new Response(
      JSON.stringify({ 
        "POST Response": [
          {
            Id: jobId,
            "Resume Data": {
              "Job Title": jdData.title,
              "Matching Percentage": matchResult.matchScore.toString(),
              "college_name": null,
              "company_names": [],
              "degree": null,
              "designation": null,
              "email": resumeData.email,
              "experience": resumeData.experience,
              "mobile_number": resumeData.phone,
              "name": resumeData.name,
              "no_of_pages": null,
              "skills": resumeData.skills,
              "certifications": resumeData.certifications,
              "total_experience": 0
            },
            "Analysis": {
              "Matching Score": matchResult.matchScore,
              "Unmatched Skills": matchResult.unmatchedSkills,
              "Matched Skills": matchResult.matchedSkills,
              "Strengths": matchResult.strengths || [],
              "Recommendations": matchResult.recommendations,
              // Replacing match scores with experience details
              "Required Industrial Experience": `${matchResult.requiredIndustrialExperienceYears || 0} years`,
              "Required Domain Experience": `${matchResult.requiredDomainExperienceYears || 0} years`,
              "Candidate Industrial Experience": matchResult.industrialExperienceDetails || `${matchResult.candidateIndustrialExperienceYears || 0} years`,
              "Candidate Domain Experience": matchResult.domainExperienceDetails || `${matchResult.candidateDomainExperienceYears || 0} years`
            }
          }
        ]
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