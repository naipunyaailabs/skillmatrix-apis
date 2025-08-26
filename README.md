# Docapture HR Tools

AI-powered HR tools for resume parsing, job description analysis, and candidate matching.

## Features

- **Resume Extraction**: Extract structured data from resume PDFs
- **Job Description Extraction**: Extract structured data from job description PDFs
- **MCQ Generation**: Generate multiple-choice questions based on job descriptions and resumes
- **Job Matching**: Match job descriptions with resumes to determine compatibility

## Installation

1. Navigate to the hr-tools directory:
   ```bash
   cd hr-tools
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Copy the .env.example file to .env and fill in your API keys:
   ```bash
   cp .env.example .env
   ```

## Configuration

Create a `.env` file with the following variables:

```
GROQ_API_KEY=your_groq_api_key_here
# Or for multiple API keys:
# GROQ_API_KEYS=your_groq_api_key_1,your_groq_api_key_2,your_groq_api_key_3
OLLAMA_BASE_URL=http://localhost:11434
HR_TOOLS_PORT=3001
```

## Running the Server

To start the HR tools server:

```bash
bun run start
```

Or for development with auto-reload:

```bash
bun run dev
```

## API Endpoints

### Resume Extraction
```
POST /extract-resume
```
Extract structured data from a resume PDF.

**Request:**
- Form data with a `resume` field containing the PDF file

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "skills": ["JavaScript", "TypeScript", "React"],
    "experience": ["Software Engineer at Company A", "Developer at Company B"],
    "education": ["B.S. Computer Science"],
    "certifications": ["AWS Certified Developer"]
  }
}
```

### Job Description Extraction
```
POST /extract-jd
```
Extract structured data from a job description PDF.

**Request:**
- Form data with a `jobDescription` field containing the PDF file

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "salary": "$120,000 - $150,000",
    "requirements": ["5+ years experience", "BS in Computer Science"],
    "responsibilities": ["Develop web applications", "Collaborate with team"],
    "skills": ["JavaScript", "React", "Node.js"]
  }
}
```

### MCQ Generation
```
POST /generate-mcq
```
Generate multiple-choice questions based on a job description and resume.

**Request:**
- Form data with `jobDescription` and `resume` fields containing the PDF files

**Response:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "question": "What is the correct way to declare a variable in JavaScript?",
        "options": ["var myVar;", "variable myVar;", "v myVar;", "declare myVar;"],
        "correctAnswer": "var myVar;",
        "explanation": "In JavaScript, variables are declared using the 'var', 'let', or 'const' keywords."
      }
    ]
  }
}
```

### Job Matching
```
POST /match
```
Match a job description with a resume to determine compatibility.

**Request:**
- Form data with `jobDescription` and `resume` fields containing the PDF files

**Response:**
```json
{
  "success": true,
  "data": {
    "matchScore": 85,
    "matchedSkills": ["JavaScript", "React"],
    "unmatchedSkills": ["Node.js", "Python"],
    "recommendations": ["Gain experience with Node.js", "Learn Python"],
    "summary": "The candidate is a good match for this position with some skill gaps."
  }
}
```

## Technology Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **AI Models**: Groq (Llama 3), Ollama
- **PDF Processing**: pdf-parse, pdfjs-dist

## License

MIT