/**
 * Test JD Extractor New with URL input
 */

const JD_EXTRACT_API_URL = 'http://localhost:3001';

async function testJdExtractUrl() {
  console.log('\n🧪 Testing JD Extractor New with URL Input\n');
  console.log('='.repeat(70));
  
  // Test with URL input
  console.log('\n✅ Test: JD Extraction via URL\n');
  
  const testUrl = 'https://example.com/sample-jd.pdf'; // Replace with actual URL
  
  try {
    const response = await fetch(`${JD_EXTRACT_API_URL}/extract-jd-new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        job_description_url: testUrl
      })
    });
    
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Success:', data.success);
    
    if (data.success) {
      console.log('\n✅ JD extracted successfully!');
      console.log('Job Title:', data.data?.jobTitle);
      console.log('Company:', data.data?.company);
      console.log('Location:', data.data?.location);
      console.log('Skills Required:', data.data?.skillsRequired?.length || 0);
    } else {
      console.log('\n❌ Extraction failed');
      console.log('Error:', data.error);
      console.log('Details:', data.details);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📝 Note: Update testUrl with a real PDF URL to test\n');
}

testJdExtractUrl().catch(console.error);
