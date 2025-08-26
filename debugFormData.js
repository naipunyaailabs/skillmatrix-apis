/**
 * Debug script to test form data handling for multiple resumes
 */

// Mock Request class for testing
class MockRequest {
  constructor(formData) {
    this.formData = formData;
  }
  
  async formData() {
    return this.formData;
  }
}

// Mock FormData class for testing
class MockFormData {
  constructor() {
    this.data = new Map();
  }
  
  append(key, value, filename) {
    if (key === 'resumes' || key === 'resume') {
      if (!this.data.has(key)) {
        this.data.set(key, []);
      }
      // For testing, we'll just store the filename
      this.data.get(key).push({ name: filename || 'test-file.pdf' });
    } else {
      this.data.set(key, value);
    }
  }
  
  get(key) {
    if (this.data.has(key)) {
      const value = this.data.get(key);
      if (Array.isArray(value)) {
        return value[0]; // Return first item for get()
      }
      return value;
    }
    return null;
  }
  
  getAll(key) {
    if (this.data.has(key)) {
      return this.data.get(key);
    }
    return [];
  }
}

// Test function to simulate the resume collection logic
async function testResumeCollection() {
  console.log('Testing resume collection logic...\n');
  
  // Create mock form data with 2 resumes
  const formData = new MockFormData();
  formData.append('jobDescription', 'job-desc-content', 'job-description.pdf');
  formData.append('resumes', 'resume1-content', 'resume1.pdf');
  formData.append('resumes', 'resume2-content', 'resume2.pdf');
  
  console.log('Form data created with 2 resumes\n');
  
  // Simulate the resume collection logic from jobMatchHandler
  const resumeFiles = [];
  
  // Check for single resume
  const singleResume = formData.get('resume');
  if (singleResume) {
    console.log('Found single resume:', singleResume.name);
    resumeFiles.push(singleResume);
  } else {
    console.log('No single resume found');
  }
  
  // Check for multiple resumes
  const multipleResumes = formData.getAll('resumes');
  console.log(`Found ${multipleResumes.length} items in 'resumes' field`);
  for (const resume of multipleResumes) {
    console.log(`Adding resume file: ${resume.name}`);
    resumeFiles.push(resume);
  }
  
  console.log(`\nTotal resume files to process: ${resumeFiles.length}`);
  
  if (resumeFiles.length === 2) {
    console.log('✅ SUCCESS: Both resumes were correctly collected');
  } else {
    console.log('❌ ERROR: Expected 2 resumes, but got', resumeFiles.length);
  }
  
  return resumeFiles.length === 2;
}

// Run the test
testResumeCollection().then(success => {
  if (success) {
    console.log('\n🎉 Resume collection logic is working correctly!');
  } else {
    console.log('\n💥 There may be an issue with resume collection logic.');
  }
});