// Test script for HR Tools API
// Make sure the server is running before executing this script

async function testHRTools() {
  const baseUrl = 'http://localhost:3001';
  
  try {
    // Test route listing
    const response = await fetch(baseUrl);
    const data = await response.json();
    console.log('Available routes:', data.availableRoutes);
  } catch (error) {
    console.error('Error testing HR Tools:', error);
  }
}

// Run the test
testHRTools();