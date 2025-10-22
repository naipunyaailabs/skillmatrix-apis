import { extractJobDescriptionData } from '../services/jdExtractor';
import { generateVoiceInterviewQuestions } from '../services/voiceInterviewGenerator';
import { downloadFileFromUrl, isValidUrl } from '../utils/fileDownloader';

export async function voiceInterviewHandler(req: Request): Promise<Response> {
  try {
    const contentType = req.headers.get('content-type') || '';
    let jdBuffer: Buffer;
    
    // Check if request is JSON (URL-based input)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const jdUrl = body.job_description_url || body.jd_url;
      
      if (!jdUrl) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No job description URL provided. Expected field: job_description_url or jd_url' 
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Validate URL
      if (!isValidUrl(jdUrl)) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid URL format. URL must start with http:// or https://' 
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Download file from URL
      try {
        const file = await downloadFileFromUrl(jdUrl);
        jdBuffer = Buffer.from(await file.arrayBuffer());
      } catch (downloadError) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to download file from URL',
            details: downloadError instanceof Error ? downloadError.message : String(downloadError)
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }
    // Handle multipart/form-data (file upload)
    else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();

      // Prefer new keys
      const jdFile = (formData.get('job_description') || formData.get('jobDescription')) as unknown;

      if (!jdFile || !(jdFile instanceof File)) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No job description file provided or invalid file (expected key: job_description)'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      jdBuffer = Buffer.from(await jdFile.arrayBuffer());
    }
    // Invalid content type
    else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid content type. Expected application/json (for URL) or multipart/form-data (for file upload)'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Extract JD data and generate questions
    const jdData = await extractJobDescriptionData(jdBuffer);
    const questions = await generateVoiceInterviewQuestions(jdData);

    const payload = {
      "POST Response": [
        {
          Id: crypto.randomUUID(),
          "Questions": {
            questions: (questions || []).map(q => ({ question: q.question }))
          }
        }
      ]
    };

    return new Response(
      JSON.stringify(payload),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[VoiceInterviewHandler] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


