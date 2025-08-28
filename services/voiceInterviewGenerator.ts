import { groqChatCompletion } from '../utils/groqClient';
import { JobDescriptionData } from './jdExtractor';
import { ResumeData } from './resumeExtractor';

export interface VoiceQuestion {
  question: string;
}

const VOICE_QUESTIONS_PROMPT = `You are an expert technical interviewer.
Generate 5 concise voice interview questions tailored to the provided job description and candidate resume.

Return ONLY the JSON object in the following format:
{
  "questions": [
    { "question": "Question text" }
  ]
}

Do not include any extra commentary or markdown.`;

function extractJsonFromResponse(response: string): any {
  try {
    return JSON.parse(response);
  } catch (e) {
    let clean = response.trim();
    if (clean.startsWith('```json')) clean = clean.slice(7);
    if (clean.startsWith('```')) clean = clean.slice(3);
    if (clean.endsWith('```')) clean = clean.slice(0, clean.length - 3);
    clean = clean.trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}') + 1;
    if (start !== -1 && end > start) {
      const slice = clean.slice(start, end);
      try { return JSON.parse(slice); } catch {}
    }
    throw e;
  }
}

export async function generateVoiceInterviewQuestions(
  jobDescription: JobDescriptionData,
  resume: ResumeData
): Promise<VoiceQuestion[]> {
  const context = `
Job Title: ${jobDescription.title}
Company: ${jobDescription.company}
Location: ${jobDescription.location}

Requirements:\n${jobDescription.requirements.join('\n')}
Responsibilities:\n${jobDescription.responsibilities.join('\n')}
Skills:\n${jobDescription.skills.join('\n')}

Candidate: ${resume.name}
Candidate Skills:\n${resume.skills.join('\n')}
Experience:\n${Array.isArray(resume.experience) ? JSON.stringify(resume.experience, null, 2) : ''}
Certifications:\n${resume.certifications.join('\n')}
`;

  const response = await groqChatCompletion(
    'You are an expert technical interviewer creating voice interview questions.',
    `${VOICE_QUESTIONS_PROMPT}\n\nContext:\n${context}`,
    0.5,
    1024
  );

  const parsed = extractJsonFromResponse(response);
  return parsed?.questions || [];
}


