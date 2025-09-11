import { evaluateAnswer } from './services/answerEvaluator';

// Test the evaluation service directly
async function testEvaluation() {
  try {
    const testInput = {
      question: "Tell me about a time when you faced a challenging problem at work and how you solved it.",
      answer: "In my previous role, I encountered a situation where our team was falling behind on a critical project deadline due to unclear requirements. I took the initiative to organize a meeting with stakeholders to clarify expectations, created a detailed project plan with milestones, and implemented daily standups to track progress. As a result, we not only met the deadline but exceeded expectations by delivering additional features."
    };

    console.log('Testing answer evaluation...');
    console.log('Question:', testInput.question);
    console.log('Answer:', testInput.answer);
    
    const result = await evaluateAnswer(testInput);
    console.log('Evaluation Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testEvaluation();