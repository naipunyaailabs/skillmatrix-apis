import { matchMultipleJDsWithMultipleResumes, type MultipleMatchInput, type MultipleMatchResult } from '../services/multipleJobMatcher';

export async function multipleJobMatchHandler(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    
    // Get all JD files
    const jdFiles: File[] = [];
    const jdItems = formData.getAll('job_descriptions');
    console.log(`[MultipleJobMatchHandler] Found ${jdItems.length} items in 'job_descriptions' field`);
    
    jdItems.forEach((item, index) => {
      if (item instanceof File) {
        console.log(`[MultipleJobMatchHandler] JD[${index}]: ${item.name} (${item.size} bytes)`);
        jdFiles.push(item);
      } else {
        console.log(`[MultipleJobMatchHandler] JD item ${index} is not a File:`, typeof item);
      }
    });
    
    // Get all resume files
    const resumeFiles: File[] = [];
    const resumeItems = formData.getAll('resumes');
    console.log(`[MultipleJobMatchHandler] Found ${resumeItems.length} items in 'resumes' field`);
    
    resumeItems.forEach((item, index) => {
      if (item instanceof File) {
        console.log(`[MultipleJobMatchHandler] Resume[${index}]: ${item.name} (${item.size} bytes)`);
        resumeFiles.push(item);
      } else {
        console.log(`[MultipleJobMatchHandler] Resume item ${index} is not a File:`, typeof item);
      }
    });
    
    // Validate inputs
    if (jdFiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No job description files provided. Use "job_descriptions" field for multiple JD files.' 
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
          error: 'No resume files provided. Use "resumes" field for multiple resume files.' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Check reasonable limits to prevent overload
    const maxFiles = 10; // Reasonable limit
    if (jdFiles.length > maxFiles) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Too many job description files. Maximum allowed: ${maxFiles}, provided: ${jdFiles.length}` 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (resumeFiles.length > maxFiles) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Too many resume files. Maximum allowed: ${maxFiles}, provided: ${resumeFiles.length}` 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const totalCombinations = jdFiles.length * resumeFiles.length;
    const maxCombinations = 50; // Reasonable limit for combinations
    
    if (totalCombinations > maxCombinations) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Too many combinations to process. Maximum allowed: ${maxCombinations}, requested: ${totalCombinations} (${jdFiles.length} JDs × ${resumeFiles.length} resumes)` 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`[MultipleJobMatchHandler] Processing ${jdFiles.length} JDs against ${resumeFiles.length} resumes (${totalCombinations} combinations)`);
    
    // Perform the matching
    const input: MultipleMatchInput = {
      jdFiles,
      resumeFiles
    };
    
    const matchResults = await matchMultipleJDsWithMultipleResumes(input);
    
    // Format the response
    const response = {
      success: true,
      summary: {
        totalJDs: jdFiles.length,
        totalResumes: resumeFiles.length,
        totalCombinations: totalCombinations,
        relevantMatches: matchResults.length,
        filteredOut: totalCombinations - matchResults.length,
        bestMatch: matchResults.length > 0 ? {
          jdTitle: matchResults[0].jdTitle,
          candidateName: matchResults[0].candidateName,
          matchScore: matchResults[0].matchScore
        } : null,
        matchingCriteria: {
          minimumScore: 60,
          focusAreas: ["Role Relevance", "Skillset Matching", "Experience Alignment"],
          filteringEnabled: true
        }
      },
      matches: matchResults.map(result => ({
        jdIndex: result.jdIndex,
        resumeIndex: result.resumeIndex,
        jdTitle: result.jdTitle,
        candidateName: result.candidateName,
        matchScore: result.matchScore,
        matchedSkills: result.matchedSkills,
        unmatchedSkills: result.unmatchedSkills,
        strengths: result.strengths,
        recommendations: result.recommendations,
        detailedAnalysis: result.analysis
      }))
    };
    
    if (matchResults.length === 0) {
      response.summary['message'] = `No relevant matches found. All ${totalCombinations} combinations were filtered out due to insufficient role/skill alignment (minimum score: 60).`;
    }
    
    console.log(`[MultipleJobMatchHandler] Successfully processed ${totalCombinations} combinations, found ${matchResults.length} relevant matches`);
    
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('[MultipleJobMatchHandler] Error:', error);
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