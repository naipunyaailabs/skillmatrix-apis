/**
 * Test Voice Interview Generator with URL input
 */

const VOICE_API_URL = 'http://localhost:3001';

async function testVoiceInterviewUrl() {
  console.log('\n🧪 Testing Voice Interview Generator with URL Input\n');
  console.log('='.repeat(70));
  
  // Test with URL input
  console.log('\n✅ Test: Voice Interview Questions via URL\n');
  
  const jdUrl = 'https://example.com/sample-jd.pdf'; // Replace with actual URL
  
  try {
    const response = await fetch(`${VOICE_API_URL}/generate-voice-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        job_description_url: jdUrl
      })
    });
    
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    
    if (response.status === 200 && data['POST Response']) {
      console.log('\n✅ Voice interview questions generated successfully!');
      const questionsData = data['POST Response'][0]['Questions'];
      console.log('Total Questions:', questionsData.questions?.length || 0);
      
      if (questionsData.questions && questionsData.questions.length > 0) {
        console.log('\nFirst 3 Questions:');
        questionsData.questions.slice(0, 3).forEach((q: any, idx: number) => {
          console.log(`${idx + 1}. ${q.question}`);
        });
      }
    } else {
      console.log('\n❌ Voice interview generation failed');
      console.log('Error:', data.error);
      console.log('Details:', data.details);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📝 Note: Update jdUrl with a real PDF URL to test\n');
}

testVoiceInterviewUrl().catch(console.error);
