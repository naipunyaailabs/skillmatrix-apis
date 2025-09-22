// Test the multiple job matching endpoint
import { multipleJobMatchHandler } from './routes/multipleJobMatch';

// Mock files for testing
function createMockFile(name, content) {
  const blob = new Blob([content], { type: 'application/pdf' });
  return new File([blob], name, { type: 'application/pdf' });
}

async function createMockFormData() {
  // Create mock JD files
  const jd1 = createMockFile('senior-dev.pdf', 'Mock JD content for Senior Developer');
  const jd2 = createMockFile('junior-dev.pdf', 'Mock JD content for Junior Developer');
  
  // Create mock resume files
  const resume1 = createMockFile('john-doe.pdf', 'Mock resume content for John Doe');
  const resume2 = createMockFile('jane-smith.pdf', 'Mock resume content for Jane Smith');
  
  // Create form data
  const formData = new FormData();
  formData.append('job_descriptions', jd1);
  formData.append('job_descriptions', jd2);
  formData.append('resumes', resume1);
  formData.append('resumes', resume2);
  
  return formData;
}

async function testMultipleJobMatchEndpoint() {
  console.log('Testing multiple job matching endpoint...');
  
  try {
    // Create mock request
    const formData = await createMockFormData();
    const request = new Request('http://localhost:3001/match-multiple', {
      method: 'POST',
      body: formData
    });
    
    // Test the handler
    const response = await multipleJobMatchHandler(request);
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Test passed - endpoint accepts the request format');
    } else {
      console.log('❌ Test failed - unexpected status code');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Test validation cases
async function testValidationCases() {
  console.log('\nTesting validation cases...');
  
  // Test 1: No JD files
  try {
    const formData = new FormData();
    formData.append('resumes', createMockFile('resume.pdf', 'content'));
    
    const request = new Request('http://localhost:3001/match-multiple', {
      method: 'POST',
      body: formData
    });
    
    const response = await multipleJobMatchHandler(request);
    const result = await response.json();
    
    console.log('Test 1 - No JDs:', response.status === 400 ? '✅ Passed' : '❌ Failed');
  } catch (error) {
    console.log('Test 1 error:', error.message);
  }
  
  // Test 2: No resume files
  try {
    const formData = new FormData();
    formData.append('job_descriptions', createMockFile('jd.pdf', 'content'));
    
    const request = new Request('http://localhost:3001/match-multiple', {
      method: 'POST',
      body: formData
    });
    
    const response = await multipleJobMatchHandler(request);
    const result = await response.json();
    
    console.log('Test 2 - No resumes:', response.status === 400 ? '✅ Passed' : '❌ Failed');
  } catch (error) {
    console.log('Test 2 error:', error.message);
  }
}

// Run tests
testMultipleJobMatchEndpoint().then(() => {
  return testValidationCases();
}).then(() => {
  console.log('\n✅ All tests completed');
}).catch(error => {
  console.error('❌ Test suite failed:', error);
});