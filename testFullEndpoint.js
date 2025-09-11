// Test the full endpoint implementation
import { serve } from "bun";
import { answerEvaluateHandler } from './routes/answerEvaluate';

// Create a mock request object for testing
async function createMockRequest(question, answer) {
  return new Request('http://localhost:3001/evaluate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question, answer }),
  });
}

async function testEndpoint() {
  console.log('Testing answer evaluation endpoint...');
  
  // Test case 1: Valid request
  const request1 = await createMockRequest(
    "What is your greatest weakness?",
    "I tend to be a perfectionist, which sometimes causes me to spend more time on projects than necessary. However, I've been working on this by setting specific time limits for tasks and focusing on completing them within those constraints."
  );
  
  try {
    const response1 = await answerEvaluateHandler(request1);
    const result1 = await response1.json();
    console.log('Test 1 - Valid request:');
    console.log(JSON.stringify(result1, null, 2));
  } catch (error) {
    console.error('Test 1 failed:', error.message);
  }
  
  // Test case 2: Missing fields
  const request2 = await createMockRequest(
    "What is your greatest weakness?",
    "" // Empty answer
  );
  
  try {
    const response2 = await answerEvaluateHandler(request2);
    const result2 = await response2.json();
    console.log('\nTest 2 - Empty answer:');
    console.log(JSON.stringify(result2, null, 2));
  } catch (error) {
    console.error('Test 2 failed:', error.message);
  }
  
  // Test case 3: Invalid content type
  const request3 = new Request('http://localhost:3001/evaluate', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: 'plain text',
  });
  
  try {
    const response3 = await answerEvaluateHandler(request3);
    const result3 = await response3.json();
    console.log('\nTest 3 - Invalid content type:');
    console.log(JSON.stringify(result3, null, 2));
  } catch (error) {
    console.error('Test 3 failed:', error.message);
  }
}

testEndpoint();