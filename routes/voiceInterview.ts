import { extractJobDescriptionData } from '../services/jdExtractor';
import { generateVoiceInterviewQuestions } from '../services/voiceInterviewGenerator';

export async function voiceInterviewHandler(req: Request): Promise<Response> {
  try {
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

    const jdBuffer = await jdFile.arrayBuffer();
    const jdData = await extractJobDescriptionData(Buffer.from(jdBuffer));
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


