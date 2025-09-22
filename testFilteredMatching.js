// Test the updated multiple job matching with role and skillset filtering
import { multipleJobMatchHandler } from './routes/multipleJobMatch';

// Mock files for testing
function createMockFile(name, content) {
  const blob = new Blob([content], { type: 'application/pdf' });
  return new File([blob], name, { type: 'application/pdf' });
}

async function testFilteredMatching() {
  console.log('Testing filtered multiple job matching...');
  
  try {
    // Create mock files that should produce different relevance levels
    const jdFiles = [
      createMockFile('senior-js-dev.pdf', 'Senior JavaScript Developer with React and Node.js'),
      createMockFile('data-scientist.pdf', 'Data Scientist with Python and Machine Learning'),
    ];
    
    const resumeFiles = [
      createMockFile('js-developer.pdf', 'JavaScript developer with 5 years React experience'),
      createMockFile('designer.pdf', 'UI/UX Designer with Figma and Photoshop skills'),
      createMockFile('python-dev.pdf', 'Python developer with ML and data analysis background'),
    ];
    
    const formData = new FormData();
    jdFiles.forEach(file => formData.append('job_descriptions', file));
    resumeFiles.forEach(file => formData.append('resumes', file));
    
    const request = new Request('http://localhost:3001/match-multiple', {
      method: 'POST',
      body: formData
    });
    
    const response = await multipleJobMatchHandler(request);
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response summary:', JSON.stringify(result.summary, null, 2));
    
    if (result.success) {
      console.log(`\n📊 Matching Summary:`);
      console.log(`Total combinations: ${result.summary.totalCombinations}`);
      console.log(`Relevant matches: ${result.summary.relevantMatches}`);
      console.log(`Filtered out: ${result.summary.filteredOut}`);
      
      if (result.matches && result.matches.length > 0) {
        console.log(`\n✅ Relevant matches found:`);
        result.matches.forEach((match, index) => {
          console.log(`${index + 1}. ${match.candidateName} → ${match.jdTitle} (Score: ${match.matchScore})`);
          console.log(`   Matched Skills: ${match.matchedSkills.join(', ')}`);
          console.log(`   Missing Skills: ${match.unmatchedSkills.join(', ')}`);
        });
      } else {
        console.log(`\n❌ No relevant matches found - all combinations filtered out`);
      }
      
      console.log('\n✅ Test completed successfully');
    } else {
      console.log('❌ Test failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Test with minimal files to check validation
async function testValidation() {
  console.log('\nTesting validation with relevant/irrelevant combinations...');
  
  try {
    const formData = new FormData();
    formData.append('job_descriptions', createMockFile('frontend-dev.pdf', 'Frontend Developer React Vue.js'));
    formData.append('resumes', createMockFile('backend-dev.pdf', 'Backend Developer Java Spring Boot'));
    
    const request = new Request('http://localhost:3001/match-multiple', {
      method: 'POST',
      body: formData
    });
    
    const response = await multipleJobMatchHandler(request);
    const result = await response.json();
    
    console.log('Validation test result:');
    console.log(`- Total combinations: ${result.summary?.totalCombinations}`);
    console.log(`- Relevant matches: ${result.summary?.relevantMatches}`);
    console.log(`- Filtered out: ${result.summary?.filteredOut}`);
    
    if (result.summary?.relevantMatches === 0) {
      console.log('✅ Filtering working correctly - irrelevant match filtered out');
    } else {
      console.log('⚠️  Expected no relevant matches for this test case');
    }
    
  } catch (error) {
    console.error('Validation test error:', error.message);
  }
}

// Run tests
testFilteredMatching().then(() => {
  return testValidation();
}).then(() => {
  console.log('\n🎉 All filtering tests completed');
}).catch(error => {
  console.error('❌ Test suite failed:', error);
});