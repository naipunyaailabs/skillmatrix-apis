/**
 * Test script for matching a job description with multiple resumes
 * This script demonstrates how to use the /match endpoint with multiple resumes
 */

// Import required modules
import fs from 'fs';

// Function to create a mock file for testing
function createMockFile(name, content = 'PDF content') {
  // In a real scenario, you would use actual PDF files
  // For this test, we're just creating a mock Blob
  return new Blob([content], { type: 'application/pdf' });
}

// Test function for multiple resume matching
async function testMultipleResumeMatching() {
  console.log('Testing multiple resume matching...');
  
  // In a real implementation, you would read actual PDF files
  // const jobDescriptionFile = fs.readFileSync('./sample-job-description.pdf');
  // const resume1File = fs.readFileSync('./sample-resume-1.pdf');
  // const resume2File = fs.readFileSync('./sample-resume-2.pdf');
  
  // Create mock files for demonstration
  const jobDescriptionFile = createMockFile('job-description.pdf', 'Job description content');
  const resume1File = createMockFile('resume-1.pdf', 'Resume 1 content');
  const resume2File = createMockFile('resume-2.pdf', 'Resume 2 content');
  const resume3File = createMockFile('resume-3.pdf', 'Resume 3 content');
  
  // Create FormData object
  const formData = new FormData();
  formData.append('jobDescription', jobDescriptionFile, 'job-description.pdf');
  
  // Add multiple resumes using the 'resumes' field
  formData.append('resumes', resume1File, 'resume-1.pdf');
  formData.append('resumes', resume2File, 'resume-2.pdf');
  formData.append('resumes', resume3File, 'resume-3.pdf');
  
  try {
    // Make the API request
    const response = await fetch('http://localhost:3001/match', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Successfully matched job description with multiple resumes');
      console.log(`📊 Results: ${result.results.length} successful matches`);
      
      if (result.errors && result.errors.length > 0) {
        console.log(`⚠️  Errors: ${result.errors.length} failed matches`);
        result.errors.forEach((error, index) => {
          console.log(`  Error ${index + 1}: Resume ${error.resumeIndex} - ${error.error}`);
        });
      }
      
      // Display matching scores
      result.results.forEach((match, index) => {
        console.log(`\n📄 Resume ${index + 1}: ${match["Resume Data"].name || 'Unknown'}`);
        console.log(`   Matching Score: ${match.Analysis["Matching Score"]}%`);
      });
    } else {
      console.log('❌ Error:', result.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Run the test
testMultipleResumeMatching();