# Streaming JD Extractor Endpoint

This document explains how to use the new streaming JD (Job Description) extractor endpoint that returns data using Server-Sent Events (SSE) for real-time updates during processing.

## Endpoint

```
POST /extract-jd-streaming
```

## Request Format

The endpoint expects a multipart form data request with a `job_description` field containing a PDF file.

### Using JavaScript (fetch):
```javascript
const formData = new FormData();
formData.append('job_description', fileInput.files[0]);

const response = await fetch('http://localhost:3001/extract-jd-streaming', {
  method: 'POST',
  body: formData
});

if (!response.ok) throw new Error(`HTTP ${response.status}`);

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value, { stream: true });
  chunk.split("\n\n").forEach(line => {
    if (line.startsWith("data: ")) {
      try {
        const event = JSON.parse(line.slice(6));
        handleAGUIEvent(event); // implement switch logic here
      } catch (err) {
        console.error("Failed to parse SSE chunk:", err);
      }
    }
  });
}
```

### Using EventSource (alternative approach):
```javascript
const formData = new FormData();
formData.append('job_description', fileInput.files[0]);

// First, send the file and get a session ID or token
const response = await fetch('http://localhost:3001/extract-jd-streaming', {
  method: 'POST',
  body: formData
});

// Then connect to the streaming endpoint
const eventSource = new EventSource('http://localhost:3001/extract-jd-streaming?token=SESSION_TOKEN');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  handleAGUIEvent(data);
};

eventSource.onerror = function(err) {
  console.error("EventSource failed:", err);
};
```

## Response Format

The endpoint returns Server-Sent Events with different event types:

### Event Types

1. **status** - Processing status updates
2. **result** - Final extraction result
3. **error** - Error messages

### Status Events
```json
{
  "event": "status",
  "data": {
    "status": "processing",
    "message": "Starting job description extraction..."
  }
}
```

### Result Events
```json
{
  "event": "result",
  "data": {
    "success": true,
    "data": {
      "title": "string",
      "companyName": "string",
      "location": "string",
      "type": "Full-Time" | "Part-Time" | "Contract" | "Internship",
      "experience": "string",
      "department": "string",
      "skills": "string",
      "salary": "string",
      "description": "string"
    }
  }
}
```

### Error Events
```json
{
  "event": "error",
  "data": {
    "success": false,
    "error": "Error message"
  }
}
```

## Client Implementation Example

Here's a complete example of how to implement the client-side code:

```javascript
async function extractJobDescriptionWithStreaming(file) {
  const formData = new FormData();
  formData.append('job_description', file);

  try {
    const response = await fetch('http://localhost:3001/extract-jd-streaming', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      chunk.split("\n\n").forEach(line => {
        if (line.startsWith("data: ")) {
          try {
            const event = JSON.parse(line.slice(6));
            
            // Handle different event types
            if (line.startsWith("event: status")) {
              console.log("Status:", event.message);
              // Update UI with processing status
              updateStatus(event.message);
            } else if (line.startsWith("event: result")) {
              console.log("Result:", event.data);
              // Display final result
              displayResult(event.data);
            } else if (line.startsWith("event: error")) {
              console.error("Error:", event.error);
              // Handle error
              handleError(event.error);
            }
          } catch (err) {
            console.error("Failed to parse SSE chunk:", err);
          }
        }
      });
    }
  } catch (error) {
    console.error("Failed to extract job description:", error);
    handleError(error.message);
  }
}

function updateStatus(message) {
  // Update your UI with the processing status
  document.getElementById('status').textContent = message;
}

function displayResult(data) {
  // Display the final extraction result
  document.getElementById('result').textContent = JSON.stringify(data, null, 2);
}

function handleError(error) {
  // Handle and display errors
  document.getElementById('error').textContent = error;
}
```

## Error Handling

The streaming endpoint provides detailed error information:

1. **Invalid content type**: "Invalid content type. Expected multipart/form-data"
2. **No file provided**: "No job description file provided"
3. **Invalid file**: "Invalid file provided. Expected a File object"
4. **Processing error**: Error messages from the extraction process
5. **Form data parsing error**: "Failed to parse form data. Ensure the request is sent with Content-Type: multipart/form-data"

## Implementation Details

The streaming endpoint provides real-time updates during the job description extraction process:

1. **File Upload**: Initial validation and file reception
2. **Text Extraction**: PDF parsing and text extraction
3. **AI Analysis**: Processing with Groq's Llama 3 model
4. **Data Transformation**: Converting to job posting format
5. **Result Delivery**: Final structured data delivery

Each step sends a status update to keep the client informed of progress.

## Benefits of Streaming

1. **Real-time Feedback**: Users get immediate updates on processing progress
2. **Better UX**: No more waiting for a single response
3. **Error Handling**: Immediate error reporting
4. **Resource Efficiency**: Streaming responses use less memory
5. **Perceived Performance**: Users feel the system is more responsive

## Troubleshooting

If you're experiencing issues with the streaming endpoint:

1. **CORS Issues**: Ensure the server is configured to allow SSE connections
2. **Firewall/Proxy**: Some proxies may interfere with streaming connections
3. **Browser Compatibility**: Ensure your browser supports ReadableStream and TextDecoder
4. **Connection Timeout**: Some servers may close idle connections

### Common Issues and Solutions:

**Issue**: No events received
**Solution**: Check browser console for CORS errors and ensure the server is sending proper headers

**Issue**: Connection closes immediately
**Solution**: Verify the file is being sent correctly and is a valid PDF

**Issue**: Only error events received
**Solution**: Check server logs for detailed error information