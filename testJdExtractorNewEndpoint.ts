// Test script for the new JD extractor endpoint
// This simulates a proper request to the endpoint

import { Buffer } from "buffer";

// Mock Request class for testing
class MockRequest {
  private _headers: Map<string, string>;
  private _body: Buffer | null;

  constructor(headers: Record<string, string>, body: Buffer | null = null) {
    this._headers = new Map(Object.entries(headers));
    this._body = body;
  }

  get headers() {
    return {
      get: (name: string) => this._headers.get(name) || null
    };
  }

  async formData(): Promise<FormData> {
    // In a real implementation, this would parse the multipart form data
    // For this test, we'll throw an error to simulate the issue
    throw new Error('ERR_FORMDATA_PARSE_ERROR: Can\'t decode form data from body because of incorrect MIME type/boundary');
  }
}

// Test the error handling
async function testErrorHandling() {
  // Import the handler
  const { jdExtractorNewHandler } = await import('./routes/jdExtractorNew');
  
  // Test with incorrect content type
  const req1 = new MockRequest({
    'content-type': 'application/json'
  });
  
  const response1 = await jdExtractorNewHandler(req1 as any);
  const result1 = await response1.json();
  console.log('Test 1 - Incorrect content type:', result1);
  
  // Test with missing content type
  const req2 = new MockRequest({});
  
  const response2 = await jdExtractorNewHandler(req2 as any);
  const result2 = await response2.json();
  console.log('Test 2 - Missing content type:', result2);
  
  // Test with form data parsing error
  const req3 = new MockRequest({
    'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
  });
  
  const response3 = await jdExtractorNewHandler(req3 as any);
  const result3 = await response3.json();
  console.log('Test 3 - Form data parsing error:', result3);
}

testErrorHandling().catch(console.error);