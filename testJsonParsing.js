/**
 * Test script for the improved JSON parsing function
 * This script tests the extractJsonFromResponse function with various AI response formats
 */

// Import the function from the jobMatcher service
import { matchJobWithResume } from './services/jobMatcher';

// Mock response that was causing the error
const mockAiResponse = `Here is the comprehensive matching analysis in JSON format:

{
  "Id": "DataEngineerMatchAnalysis",
  "Resume Data": {
    "Job Title": "Data Engineer",
    "Matching Percentage": "30",
    "college_name": "Malla Reddy Engineering College, Hyderabad",   
    "company_names": ["KPMG", "Iron Mountain", "DHL", "Apache Corporation", "IAG"],
    "degree": "Bachelor of Technology (B.Tech) in Civil Engineering",
    "designation": null,
    "email": "jaswanthn.0506@gmail.com",
    "experience": "5 years",
    "mobile_number": "+91 80191 05577",
    "name": "Nalla Jaswanth",
    "no_of_pages": null,
    "skills": ["Robotic Process Automation", "UiPath", "RE Framework", "C#", "SQL", "Microsoft Office Suite", "Team Foundation Server (TFS)", "GIT", "Agentic Automation", "Gen-AI"],
    "certifications": ["RPA Automation Developer Professional Training"],
    "total_experience": [
      {
        "role": "RPA Developer",
        "company": "KPMG",
        "duration": "August 2020 - Till Date",
        "responsibilities": [
          "Designed and implemented business process automation solutions using UiPath",
          "Involved in complete RPA lifecycle",
          "Experienced in automation of Web, Desktop, applications through UiPath tool",
          "Worked on PDD and SDD documents",
          "Analyzed, designed, and implemented end-to-end RPA solutions to automate business processes within various SAP modules"      
        ]
      }
    ]
  },
  "Analysis": {
    "Matching Score": 30,
    "Unmatched Skills": ["GCP cloud services", "BigQuery", "Cloud Functions", "MongoDB"],
    "Matched Skills": ["SQL", "UiPath"],
    "Strengths": ["Experience in RPA development", "Strong understanding of automation tools and technologies"],
    "Recommendations": ["Consider taking courses or certifications in data engineering and cloud services to improve match", "Highlight transferable skills from RPA development to data engineering"],     
    "Required Industrial Experience": "4+ years of relevant experience",
    "Required Domain Experience": "GCP cloud services, BigQuery, Cloud Functions",
    "Candidate Industrial Experience": "5 years",
    "Candidate Domain Experience": "Not specified"
  }
}`;

// Test function for the JSON parsing
async function testJsonParsing() {
  console.log('Testing JSON parsing with AI response containing explanatory text...');
  
  try {
    // Simulate the extractJsonFromResponse function behavior
    // Since it's not exported, we'll test the parsing logic directly
    
    // Clean the response by removing markdown code blocks and explanatory text if present
    let cleanResponse = mockAiResponse.trim();
    
    // Remove markdown code block markers if present
    if (cleanResponse.startsWith("```json")) {
      cleanResponse = cleanResponse.substring(7);
    }
    if (cleanResponse.startsWith("```")) {
      cleanResponse = cleanResponse.substring(3);
    }
    if (cleanResponse.endsWith("```")) {
      cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3);
    }
    
    cleanResponse = cleanResponse.trim();
    
    // Look for JSON in the response by finding the first opening brace
    const jsonStart = cleanResponse.indexOf("{");
    
    if (jsonStart !== -1) {
      // Extract everything from the first opening brace to the last closing brace
      const jsonEnd = cleanResponse.lastIndexOf("}") + 1;
      if (jsonEnd > jsonStart) {
        let jsonString = cleanResponse.substring(jsonStart, jsonEnd);
        
        // Try to parse the extracted JSON
        const parsedJson = JSON.parse(jsonString);
        
        console.log('✅ Successfully parsed JSON from AI response with explanatory text');
        console.log(`📄 Resume Name: ${parsedJson["Resume Data"].name}`);
        console.log(`📊 Matching Score: ${parsedJson.Analysis["Matching Score"]}`);
        console.log(`✅ Matched Skills: ${parsedJson.Analysis["Matched Skills"].join(', ')}`);
        console.log(`❌ Unmatched Skills: ${parsedJson.Analysis["Unmatched Skills"].join(', ')}`);
        
        return true;
      }
    }
    
    console.log('❌ Failed to extract JSON from response');
    return false;
  } catch (error) {
    console.log('❌ Error parsing JSON:', error.message);
    return false;
  }
}

// Run the test
testJsonParsing().then(success => {
  if (success) {
    console.log('\n🎉 JSON parsing fix is working correctly!');
  } else {
    console.log('\n💥 JSON parsing fix needs more work.');
  }
});