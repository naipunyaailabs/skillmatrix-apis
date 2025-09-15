// Example of how to use the audio evaluation endpoint
console.log(`
To test the audio evaluation endpoint, use the following curl command:

curl -X POST http://localhost:3001/evaluate-audio \\
  -F "audios=@path/to/audio1.wav" \\
  -F "audios=@path/to/audio2.wav" \\
  -F "audios=@path/to/audio3.wav"

Replace the paths with actual paths to your WAV files.
`);