/**
 * Example script demonstrating how to use the multiple resume feature
 * 
 * This script shows how to make API calls to match a job description with multiple resumes
 */

// Example using fetch API (Node.js or browser)
async function matchMultipleResumes() {
  // Create FormData object
  const formData = new FormData();
  
  // Append job description file (replace with actual file path)
  // formData.append('jobDescription', fs.createReadStream('./job-description.pdf'));
  
  // For browser usage with file inputs:
  // const jobDescriptionFile = document.getElementById('jobDescription').files[0];
  // const resumeFiles = document.getElementById('resumes').files;
  
  // formData.append('jobDescription', jobDescriptionFile);
  
  // Append multiple resume files
  // for (let i = 0; i < resumeFiles.length; i++) {
  //   formData.append('resumes', resumeFiles[i]);
  // }
  
  // Example with mock data for demonstration
  formData.append('jobDescription', new Blob(['Job Description Content'], { type: 'application/pdf' }), 'job-description.pdf');
  formData.append('resumes', new Blob(['Resume 1 Content'], { type: 'application/pdf' }), 'resume1.pdf');
  formData.append('resumes', new Blob(['Resume 2 Content'], { type: 'application/pdf' }), 'resume2.pdf');
  formData.append('resumes', new Blob(['Resume 3 Content'], { type: 'application/pdf' }), 'resume3.pdf');
  
  try {
    const response = await fetch('http://localhost:3001/match', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Match Results:');
      data.results.forEach((result, index) => {
        console.log(`\n📄 Resume ${index + 1}:`);
        console.log(`  Name: ${result["Resume Data"].name || 'N/A'}`);
        console.log(`  Email: ${result["Resume Data"].email || 'N/A'}`);
        console.log(`  Matching Score: ${result.Analysis["Matching Score"]}%`);
        console.log(`  Matched Skills: ${result.Analysis["Matched Skills"].join(', ')}`);
        console.log(`  Unmatched Skills: ${result.Analysis["Unmatched Skills"].join(', ')}`);
      });
      
      if (data.errors && data.errors.length > 0) {
        console.log('\n❌ Errors:');
        data.errors.forEach((error, index) => {
          console.log(`  Error ${index + 1} (Resume ${error.resumeIndex}): ${error.error}`);
        });
      }
    } else {
      console.log('❌ Error:', data.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Example using cURL (command line)
const curlExample = `
# Match job description with multiple resumes
curl -X POST http://localhost:3001/match \\
  -F "jobDescription=@./job-description.pdf" \\
  -F "resumes=@./resume1.pdf" \\
  -F "resumes=@./resume2.pdf" \\
  -F "resumes=@./resume3.pdf"
`;

console.log('Example cURL command:');
console.log(curlExample);

// Uncomment the following line to run the fetch example
// matchMultipleResumes();