/**
 * Example script demonstrating how to test the MCQ generation endpoint
 */

// Example using cURL (command line)
const curlExample = `
# Generate MCQ questions based on a job description and resume
curl -X POST http://localhost:3001/generate-mcq \\
  -F "job_description=@./job-description.pdf" \\
  -F "resumes=@./resume.pdf"
`;

console.log('Example cURL command for MCQ generation:');
console.log(curlExample);

// Example using fetch API (Node.js or browser)
async function generateMCQs() {
  // Create FormData object
  const formData = new FormData();
  
  // For demonstration, we'll use mock PDF content
  // In practice, you would use actual PDF files
  formData.append('job_description', new Blob(['Job Description Content'], { type: 'application/pdf' }), 'job-description.pdf');
  formData.append('resumes', new Blob(['Resume Content'], { type: 'application/pdf' }), 'resume.pdf');
  
  try {
    const response = await fetch('http://localhost:3001/generate-mcq', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ MCQ Generation Results:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error:', data.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Uncomment the following line to run the fetch example
// generateMCQs();

console.log('\nTo test with actual files, replace the mock blobs with real PDF files:');
console.log(`
const jobDescriptionFile = fs.readFileSync('./path/to/job-description.pdf');
const resumeFile = fs.readFileSync('./path/to/resume.pdf');

formData.append('job_description', new Blob([jobDescriptionFile], { type: 'application/pdf' }), 'job-description.pdf');
formData.append('resumes', new Blob([resumeFile], { type: 'application/pdf' }), 'resume.pdf');
`);