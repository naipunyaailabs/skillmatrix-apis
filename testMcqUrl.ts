/**
 * Test MCQ Generator with URL input
 */

const MCQ_API_URL = 'http://localhost:3001';

async function testMcqGenerateUrl() {
  console.log('\n🧪 Testing MCQ Generator with URL Input\n');
  console.log('='.repeat(70));
  
  // Test with URL input
  console.log('\n✅ Test: MCQ Generation via URLs\n');
  
  const jdUrl = 'https://example.com/sample-jd.pdf'; // Replace with actual URL
  const resumeUrl = 'https://example.com/sample-resume.pdf'; // Replace with actual URL
  
  try {
    const response = await fetch(`${MCQ_API_URL}/generate-mcq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        job_description_url: jdUrl,
        resume_url: resumeUrl
      })
    });
    
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    
    if (response.status === 200 && data['POST Response']) {
      console.log('\n✅ MCQ generated successfully!');
      const mcqData = data['POST Response'][0]['MCQ with answers'];
      console.log('Total Questions:', mcqData.questions?.length || 0);
      
      if (mcqData.questions && mcqData.questions.length > 0) {
        console.log('\nFirst Question:');
        console.log('Q:', mcqData.questions[0].question);
        console.log('Options:', mcqData.questions[0].options);
        console.log('Answer:', mcqData.questions[0].answer);
      }
    } else {
      console.log('\n❌ MCQ generation failed');
      console.log('Error:', data.error);
      console.log('Details:', data.details);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📝 Note: Update URLs with real PDF URLs to test\n');
}

testMcqGenerateUrl().catch(console.error);
