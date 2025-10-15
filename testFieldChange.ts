// Test to verify the field name change from 'jobDescription' to 'job_description'
import { Buffer } from "buffer";

// Mock FormData class for testing
class MockFormData {
  private data: Map<string, any>;

  constructor() {
    this.data = new Map();
  }

  append(name: string, value: any) {
    this.data.set(name, value);
  }

  get(name: string) {
    return this.data.get(name);
  }
}

// Test function
async function testFieldNames() {
  const formData = new MockFormData();
  
  // Test with the old field name (should return null)
  const oldField = formData.get('jobDescription');
  console.log('Old field name (jobDescription):', oldField); // Should be undefined
  
  // Test with the new field name (should also be null since we haven't set it)
  const newField = formData.get('job_description');
  console.log('New field name (job_description):', newField); // Should be undefined
  
  // Set a value with the new field name
  formData.append('job_description', 'test-file');
  
  // Now the new field should have a value
  const newFieldWithValue = formData.get('job_description');
  console.log('New field name with value:', newFieldWithValue); // Should be 'test-file'
  
  // The old field should still be undefined
  const oldFieldStillUndefined = formData.get('jobDescription');
  console.log('Old field name still undefined:', oldFieldStillUndefined); // Should be undefined
}

testFieldNames().catch(console.error);