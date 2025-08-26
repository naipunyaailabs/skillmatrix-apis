import { generateMCQQuestions } from '../services/mcqGenerator';
import { extractJobDescriptionData } from '../services/jdExtractor';
import { extractResumeData } from '../services/resumeExtractor';

export async function mcqGenerateHandler(req: Request): Promise<Response> {
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
    
    // Generate MCQ questions
    const questions = await generateMCQQuestions(jdData, resumeData);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { questions } 
      }),
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