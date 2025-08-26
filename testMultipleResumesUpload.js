/**
 * Test script to demonstrate proper multiple resume upload
 * This script shows the correct way to upload multiple resumes
 */

async function testMultipleResumeUpload() {
  console.log('Testing multiple resume upload...');
  
  // Example using FormData (browser or Node.js)
  const formData = new FormData();
  
  // Add job description
  // formData.append('jobDescription', jobDescriptionFile);
  
  // Add multiple resumes - this is the CORRECT way
  // formData.append('resumes', resumeFile1);  // First resume
  // formData.append('resumes', resumeFile2);  // Second resume
  
  // Example with mock data
  formData.append('jobDescription', new Blob(['Job Description Content'], { type: 'application/pdf' }), 'job-description.pdf');
  formData.append('resumes', new Blob(['Resume 1 Content'], { type: 'application/pdf' }), 'resume1.pdf');
  formData.append('resumes', new Blob(['Resume 2 Content'], { type: 'application/pdf' }), 'resume2.pdf');
  
  console.log('Form data prepared with 2 resumes using the "resumes" field (plural)');
  console.log('Field name for multiple resumes should be "resumes" (not "resume")');
  
  // To test with curl, use:
  const curlExample = `
  curl -X POST http://localhost:3001/match \\
    -F "jobDescription=@job-description.pdf" \\
    -F "resumes=@resume1.pdf" \\
    -F "resumes=@resume2.pdf"
  `;
  
  console.log('Example cURL command:');
  console.log(curlExample);
  
  console.log('\nKey points:');
  console.log('1. Use "resumes" (plural) as the field name for multiple files');
  console.log('2. Each resume file should be added with the same field name "resumes"');
  console.log('3. The job description should be in the "jobDescription" field');
}

testMultipleResumeUpload();