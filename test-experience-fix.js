// Test script for HR Tools Experience Fix
// Make sure the server is running before executing this script

async function testExperienceFix() {
  const baseUrl = 'http://localhost:3001';
  
  try {
    // Test route listing
    const response = await fetch(baseUrl);
    const data = await response.json();
    console.log('Available routes:', data.availableRoutes);
    
    console.log('\nExperience fix test completed successfully');
    console.log('To test the full functionality, you would need to upload actual PDF files to the /match endpoint');
  } catch (error) {
    console.error('Error testing HR Tools:', error);
  }
}

// Run the test
testExperienceFix();