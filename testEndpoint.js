// Simple test to verify our answer evaluation endpoint logic
import { evaluateAnswer } from './services/answerEvaluator';

async function testEndpoint() {
  console.log('Testing answer evaluation service...');
  
  const testRequest = {
    question: "What is your greatest weakness?",
    answer: "I tend to be a perfectionist, which sometimes causes me to spend more time on projects than necessary. However, I've been working on this by setting specific time limits for tasks and focusing on completing them within those constraints."
  };
  
  try {
    const result = await evaluateAnswer(testRequest);
    console.log('Evaluation result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEndpoint();