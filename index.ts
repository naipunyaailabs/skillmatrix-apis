import { serve } from "bun";
import { config } from "dotenv";
import { resumeExtractHandler } from "./routes/resumeExtract";
import { jdExtractHandler } from "./routes/jdExtract";
import { mcqGenerateHandler } from "./routes/mcqGenerate";
import { jobMatchHandler } from "./routes/jobMatch";
import { voiceInterviewHandler } from "./routes/voiceInterview";
import { answerEvaluateHandler } from "./routes/answerEvaluate";
import { audioEvaluateHandler } from "./routes/audioEvaluate";
import { multipleJobMatchHandler } from "./routes/multipleJobMatch";
import { jdExtractorNewHandler } from "./routes/jdExtractorNew";
import { jdExtractorStreamingHandler } from "./routes/jdExtractorStreaming";
import { initializeRedisClient } from "./utils/redisClient";

// Load environment variables
config();

const PORT = process.env.HR_TOOLS_PORT || 3001;

// Initialize Redis client
initializeRedisClient().catch(error => {
  console.error('[Index] Failed to initialize Redis client:', error);
});

// Simple request logging
function logRequest(req: Request, startTime: number, status: number) {
  const duration = Date.now() - startTime;
  const url = new URL(req.url);
  console.log(`[${new Date().toISOString()}] ${req.method} ${url.pathname} ${status} ${duration}ms`);
}

// Rate limiting middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // Adjust as needed

function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 0, resetTime: now + RATE_LIMIT_WINDOW });
  }
  
  const rateData = rateLimitMap.get(ip)!;
  
  // Reset counter if window has passed
  if (now >= rateData.resetTime) {
    rateData.count = 0;
    rateData.resetTime = now + RATE_LIMIT_WINDOW;
  }
  
  // Check if we're within limits
  if (rateData.count < MAX_REQUESTS_PER_WINDOW) {
    rateData.count++;
    return { allowed: true };
  }
  
  return { allowed: false, resetTime: rateData.resetTime };
}

const server = serve({
  fetch: async (req) => {
    const startTime = Date.now();
    const url = new URL(req.url);
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Handle CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    
    // Apply rate limiting
    const rateLimitResult = checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000);
      logRequest(req, startTime, 429);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Rate limit exceeded",
          retryAfter: `${retryAfter} seconds`
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfter.toString(),
            ...corsHeaders
          }
        }
      );
    }
    
    if (req.method === "OPTIONS") {
      logRequest(req, startTime, 204);
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    
    try {
      // Route handling
      if (req.method === "POST" && url.pathname === "/extract-resume") {
        const response = await resumeExtractHandler(req);
        logRequest(req, startTime, response.status);
        return response;
      }
      
      if (req.method === "POST" && url.pathname === "/extract-jd") {
        const response = await jdExtractHandler(req);
        logRequest(req, startTime, response.status);
        return response;
      }
      
      if (req.method === "POST" && url.pathname === "/extract-jd-new") {
        const response = await jdExtractorNewHandler(req);
        logRequest(req, startTime, response.status);
        return response;
      }

      if (req.method === "POST" && url.pathname === "/generate-mcq") {
        const response = await mcqGenerateHandler(req);
        logRequest(req, startTime, response.status);
        return response;
      }
      
      if (req.method === "POST" && url.pathname === "/generate-voice-questions") {
        const response = await voiceInterviewHandler(req);
        logRequest(req, startTime, response.status);
        return response;
      }
      
      if (req.method === "POST" && url.pathname === "/match") {
        const response = await jobMatchHandler(req);
        logRequest(req, startTime, response.status);
        return response;
      }
      
      if (req.method === "POST" && url.pathname === "/evaluate") {
        const response = await answerEvaluateHandler(req);
        logRequest(req, startTime, response.status);
        return response;
      }
      
      if (req.method === "POST" && url.pathname === "/evaluate-audio") {
        const response = await audioEvaluateHandler(req);
        logRequest(req, startTime, response.status);
        return response;
      }
      
      if (req.method === "POST" && url.pathname === "/match-multiple") {
        const response = await multipleJobMatchHandler(req);
        logRequest(req, startTime, response.status);
        return response;
      }

      if (req.method === "POST" && url.pathname === "/extract-jd-streaming") {
        const response = await jdExtractorStreamingHandler(req);
        logRequest(req, startTime, response.status);
        return response;
      }

      const notFoundResponse = new Response(
        JSON.stringify({ 
          success: false, 
          error: "Route not found",
          availableRoutes: [
            "POST /extract-resume - Extract data from a resume PDF",
            "POST /extract-jd - Extract data from a job description PDF",
            "POST /extract-jd-new - Extract job description data in job posting format",
            "POST /extract-jd-streaming - Extract job description data with streaming responses",
            "POST /generate-mcq - Generate MCQ questions based on a job description and resume",
            "POST /generate-voice-questions - Generate voice interview questions based on a job description (JD-only)",
            "POST /match - Match a job description with one or more resumes (supports both 'resume' for single file and 'resumes' for multiple files)",
            "POST /evaluate - Evaluate a text answer for career-related questions",
            "POST /evaluate-audio - Evaluate audio files for emotion and tone analysis",
            "POST /match-multiple - Match multiple job descriptions with multiple resumes with caching support"
          ]
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
      
      logRequest(req, startTime, 404);
      return notFoundResponse;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Unhandled error for ${req.method} ${url.pathname}:`, error);
      
      const errorResponse = new Response(
        JSON.stringify({ 
          success: false, 
          error: "Internal server error"
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
      
      logRequest(req, startTime, 500);
      return errorResponse;
    }
  },
  port: Number(PORT),
});

console.log(`HR Tools server running at http://localhost:${server.port}`);