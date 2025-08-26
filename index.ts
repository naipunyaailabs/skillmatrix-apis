import { serve } from "bun";
import { config } from "dotenv";
import { resumeExtractHandler } from "./routes/resumeExtract";
import { jdExtractHandler } from "./routes/jdExtract";
import { mcqGenerateHandler } from "./routes/mcqGenerate";
import { jobMatchHandler } from "./routes/jobMatch";

// Load environment variables
config();

const PORT = process.env.HR_TOOLS_PORT || 3001;

const server = serve({
  fetch: async (req) => {
    const url = new URL(req.url);
    
    // Handle CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    
    // Route handling
    if (req.method === "POST" && url.pathname === "/extract-resume") {
      return await resumeExtractHandler(req);
    }
    
    if (req.method === "POST" && url.pathname === "/extract-jd") {
      return await jdExtractHandler(req);
    }
    
    if (req.method === "POST" && url.pathname === "/generate-mcq") {
      return await mcqGenerateHandler(req);
    }
    
    if (req.method === "POST" && url.pathname === "/match") {
      return await jobMatchHandler(req);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Route not found",
        availableRoutes: [
          "POST /extract-resume - Extract data from a resume PDF",
          "POST /extract-jd - Extract data from a job description PDF",
          "POST /generate-mcq - Generate MCQ questions based on a job description and resume",
          "POST /match - Match a job description with a resume"
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
  },
  port: Number(PORT),
});

console.log(`HR Tools server running at http://localhost:${server.port}`);