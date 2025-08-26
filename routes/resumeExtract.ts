import { extractResumeData } from '../services/resumeExtractor';

export async function resumeExtractHandler(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get('resume');
    
    if (!file || !(file instanceof File)) {
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
    
    const buffer = await file.arrayBuffer();
    const resumeData = await extractResumeData(Buffer.from(buffer));
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: resumeData 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[ResumeExtractHandler] Error:', error);
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