import { extractJobDescriptionData, transformToJobDescriptionResponse } from '../services/jdExtractor';
import { JobDescriptionResponse } from '../services/jdExtractor';

export async function jdExtractorNewHandler(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get('jobDescription');
    
    if (!file || !(file instanceof File)) {
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
    
    const buffer = await file.arrayBuffer();
    const jdData = await extractJobDescriptionData(Buffer.from(buffer));
    
    // Transform the data to match the new response format
    const transformedData: JobDescriptionResponse = transformToJobDescriptionResponse(jdData);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: transformedData 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[JDExtractorNewHandler] Error:', error);
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