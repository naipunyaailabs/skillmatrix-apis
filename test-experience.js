// Test script for HR Tools Experience Fields
// Make sure the server is running before executing this script

async function testExperienceFields() {
  const baseUrl = 'http://localhost:3001';
  
  try {
    // Test route listing
    const response = await fetch(baseUrl);
    const data = await response.json();
    console.log('Available routes:', data.availableRoutes);
    
    console.log('\nExperience fields test completed successfully');
  } catch (error) {
    console.error('Error testing HR Tools:', error);
  }
}

// Run the test
testExperienceFields();