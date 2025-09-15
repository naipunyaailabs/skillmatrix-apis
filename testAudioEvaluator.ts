import { evaluateAudioFiles } from './services/audioEvaluator';

// Test the audio evaluation service directly
async function testAudioEvaluation() {
  try {
    // Create mock audio files with different content
    const testAudioFiles = [
      {
        buffer: Buffer.from('mock audio content 1'),
        filename: 'test1.wav'
      },
      {
        buffer: Buffer.from('mock audio content 2'),
        filename: 'test2.wav'
      },
      {
        buffer: Buffer.from('mock audio content 3'),
        filename: 'test3.wav'
      }
    ];

    console.log('Testing audio evaluation...');
    
    const result = await evaluateAudioFiles(testAudioFiles);
    console.log('Audio Evaluation Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testAudioEvaluation();