import { generateMCQQuestions } from '../services/mcqGenerator';
import { extractJobDescriptionData } from '../services/jdExtractor';
import { extractResumeData } from '../services/resumeExtractor';

export async function mcqGenerateHandler(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    // Prefer new keys: job_description and resumes (fallback to legacy keys)
    const jdFile = (formData.get('job_description') || formData.get('jobDescription')) as unknown;
    
    // Use 'resumes' for single or multiple; take the first file if multiple
    let resumeFile: File | null = null;
    const resumesList = formData.getAll('resumes');
    if (resumesList && resumesList.length > 0) {
      const first = resumesList.find((i) => i instanceof File);
      if (first && first instanceof File) {
        resumeFile = first;
      }
    }
    // Backward compatibility: fall back to 'resume'
    if (!resumeFile) {
      const legacy = formData.getAll('resume');
      const firstLegacy = legacy.find((i) => i instanceof File);
      if (firstLegacy && firstLegacy instanceof File) {
        resumeFile = firstLegacy;
      }
    }
    
    if (!jdFile || !(jdFile instanceof File)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No job description file provided or invalid file (expected key: job_description)' 
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
          error: 'No resume file provided or invalid file (expected key: resumes)' 
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
    
    // Generate MCQ questions
    const questions = await generateMCQQuestions(jdData, resumeData);
    
    // Transform to required response shape
    const transformedQuestions = (questions || []).map(q => ({
      question: q.question,
      options: q.options,
      answer: (q as any).answer ?? q.correctAnswer
    }));
    
    const payload = {
      "POST Response": [
        {
          Id: crypto.randomUUID(),
          "MCQ with answers": {
            questions: transformedQuestions
          }
        }
      ]
    };
    
    return new Response(
      JSON.stringify(payload),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[MCQGenerateHandler] Error:', error);
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