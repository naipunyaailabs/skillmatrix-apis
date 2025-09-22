# Docapture HR Tools

AI-powered HR tools for resume parsing, job description analysis, and candidate matching.

## Features

- **Resume Extraction**: Extract structured data from resume PDFs
- **Job Description Extraction**: Extract structured data from job description PDFs
- **MCQ Generation**: Generate multiple-choice questions based on job descriptions and resumes
- **Job Matching**: Match job descriptions with one or more resumes to determine compatibility
- **Answer Evaluation**: Evaluate text answers for career-related questions

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

### Using Bun (Native)

To start the HR tools server:

```bash
bun run start
```

Or for development with auto-reload:

```bash
bun run dev
```

### Using Docker

1. Build the Docker image:
   ```bash
   docker build -t docapture-hr-tools .
   ```

2. Run the container:
   ```bash
   docker run -p 3001:3001 --env-file .env docapture-hr-tools
   ```

### Using Docker Compose

1. Build and run with docker-compose:
   ```bash
   docker-compose up --build
   ```

The server will be available at `http://localhost:3001`

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
Match a job description with one or more resumes to determine compatibility.

**Request:**
- Form data with:
  - `jobDescription` field containing the job description PDF file
  - Either:
    - `resume` field for a single resume (backward compatibility)
    - `resumes` field for multiple resumes (can be used multiple times)

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "Id": "uuid-1",
      "Resume Data": {
        "Job Title": "Senior Software Engineer",
        "Matching Percentage": "85",
        "name": "John Doe",
        "email": "john@example.com",
        "skills": ["JavaScript", "React", "Node.js"]
      },
      "Analysis": {
        "Matching Score": 85,
        "Matched Skills": ["JavaScript", "React"],
        "Unmatched Skills": ["Python", "AWS"],
        "Strengths": ["5 years of relevant experience"],
        "Recommendations": ["Gain experience with Python", "Get AWS certification"]
      }
    },
    {
      "Id": "uuid-2",
      "Resume Data": {
        "Job Title": "Senior Software Engineer",
        "Matching Percentage": "72",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "skills": ["Python", "Django", "PostgreSQL"]
      },
      "Analysis": {
        "Matching Score": 72,
        "Matched Skills": ["Python"],
        "Unmatched Skills": ["JavaScript", "React", "Node.js"],
        "Strengths": ["3 years of backend development experience"],
        "Recommendations": ["Learn JavaScript and React", "Gain frontend experience"]
      }
    }
  ],
  "errors": [] // Present only if there were errors processing any resumes
}
```

### Answer Evaluation
```
POST /evaluate
```
Evaluate a text answer for career-related questions.

**Request:**
- JSON body with `question` and `answer` fields:
```json
{
  "question": "Tell me about a time when you faced a challenging problem at work and how you solved it.",
  "answer": "In my previous role, I encountered a situation where our team was falling behind on a critical project deadline due to unclear requirements..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "Authentic": 8,
    "Clarity": 9,
    "Fluency": 7,
    "Focused": 8,
    "NoFillers": 9,
    "Professionalism": 8,
    "Relevance": 9,
    "StructuredAnswers": 8,
    "total_average": 8.22,
    "UniqueQualities": 7,
    "total_overall_score": 74
  }
}
```

### Multiple Job Matching
```
POST /match-multiple
```
Match multiple job descriptions with multiple resumes with intelligent caching and relevance filtering.

**Features:**
- Supports multiple JD files and multiple resume files
- **Intelligent Relevance Filtering**: Only returns matches with score ≥ 60
- **Role & Skillset Focus**: Prioritizes role alignment and technical skill matching
- Automatic caching of extracted data (24-hour TTL)
- Reuses previously extracted JDs and resumes if uploaded again
- Smart matching result caching (12-hour TTL)
- Reasonable limits to prevent system overload

**Matching Criteria:**
- **Minimum Score**: 60/100 (below 60 = irrelevant, filtered out)
- **Role Relevance**: Candidate background alignment with job role
- **Technical Skills**: Percentage match of required technical skills
- **Experience Level**: Appropriate experience for role level
- **Domain Expertise**: Relevant industry/domain experience

**Request:**
- Form data with:
  - `job_descriptions` field for multiple JD PDF files (can be used multiple times)
  - `resumes` field for multiple resume PDF files (can be used multiple times)

**Limits:**
- Maximum 10 JD files
- Maximum 10 resume files  
- Maximum 50 total combinations (JDs × resumes)

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalJDs": 2,
    "totalResumes": 3,
    "totalCombinations": 6,
    "relevantMatches": 3,
    "filteredOut": 3,
    "bestMatch": {
      "jdTitle": "Senior Software Engineer",
      "candidateName": "John Doe",
      "matchScore": 92
    },
    "matchingCriteria": {
      "minimumScore": 60,
      "focusAreas": ["Role Relevance", "Skillset Matching", "Experience Alignment"],
      "filteringEnabled": true
    }
  },
  "matches": [
    {
      "jdIndex": 0,
      "resumeIndex": 0,
      "jdTitle": "Senior Software Engineer",
      "candidateName": "John Doe",
      "matchScore": 92,
      "matchedSkills": ["JavaScript", "React", "Node.js"],
      "unmatchedSkills": ["Python", "AWS"],
      "strengths": ["5+ years experience", "Strong technical skills"],
      "recommendations": ["Learn Python", "Get AWS certification"],
      "detailedAnalysis": {
        "relevantMatch": true,
        "roleAlignment": {
          "score": 90,
          "assessment": "Excellent alignment with senior developer role"
        },
        "skillsetMatch": {
          "technicalSkillsMatch": 85,
          "matchedSkills": ["JavaScript", "React", "Node.js"],
          "criticalMissingSkills": ["Python"],
          "skillGapSeverity": "low"
        },
        "experienceAlignment": {
          "levelMatch": "senior",
          "yearsMatch": "6 years meets 5+ requirement",
          "relevantExperience": "Strong full-stack development background"
        }
      }
    }
  ]
}
```

**Key Benefits:**
- **Quality over Quantity**: Only returns genuinely relevant matches
- **Reduced Noise**: Filters out irrelevant combinations automatically
- **Role-Focused**: Prioritizes role alignment over generic matching
- **Skill-Centric**: Emphasizes technical skill compatibility
- **Actionable Insights**: Provides specific recommendations for skill gaps

**Filtering Examples:**
- ✅ **Included**: Frontend Developer JD + Frontend Developer Resume (Score: 85)
- ❌ **Filtered**: Data Scientist JD + Marketing Manager Resume (Score: 25)
- ✅ **Included**: Senior Developer JD + Mid-level Developer Resume (Score: 72)
- ❌ **Filtered**: Technical Writer JD + Software Engineer Resume (Score: 45)

## Technology Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **AI Models**: Groq (Llama 3), Ollama
- **PDF Processing**: pdf-parse, pdfjs-dist

## License

MIT