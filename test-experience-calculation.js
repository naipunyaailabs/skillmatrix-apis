// Test script for experience calculation logic
// This script tests the calculateTotalExperience function logic

// Import the calculation function (simplified version for testing)
function extractYearsFromText(text) {
  let totalYears = 0;
  
  // Pattern to match various experience formats
  const patterns = [
    /(\d+(?:\.\d+)?)\s*years?/g,  // Matches "5 years", "2.5 years"
    /(\d+(?:\.\d+)?)\s*yrs?/g,    // Matches "3 yrs", "1.5 yr"
    /(\d+(?:\.\d+)?)\s*\+/g,      // Matches "5+ years"
    /(\d+(?:\.\d+)?)\s*-\s*\d+/g  // Matches "2-5 years" (takes the minimum)
  ];
  
  // Check each pattern
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const years = parseFloat(match[1]);
      if (!isNaN(years) && years > 0) {
        totalYears = Math.max(totalYears, years); // Take the maximum found value
      }
    }
  }
  
  // If we still have 0, try to find any numbers that might represent years
  if (totalYears === 0) {
    const numberPattern = /\b(\d+(?:\.\d+)?)\b/g;
    let match;
    while ((match = numberPattern.exec(text)) !== null) {
      const number = parseFloat(match[1]);
      // Assume numbers between 0 and 40 are likely years of experience
      if (number > 0 && number <= 40) {
        totalYears = Math.max(totalYears, number);
      }
    }
  }
  
  return totalYears;
}

function calculateTotalExperience(experience) {
  let totalYears = 0;
  
  // Handle case where experience is an array of objects (new format)
  if (experience && Array.isArray(experience) && experience.length > 0) {
    // Check if it's an array of objects with duration properties
    if (typeof experience[0] === 'object' && experience[0] !== null) {
      // Extract duration information from objects
      const durationTexts = [];
      for (const exp of experience) {
        if (exp.duration) {
          durationTexts.push(exp.duration);
        }
        // Also check for other possible duration fields
        if (exp.period) {
          durationTexts.push(exp.period);
        }
        if (exp.years) {
          durationTexts.push(exp.years);
        }
      }
      
      // Join all duration texts for pattern matching
      const experienceText = durationTexts.join(' ').toLowerCase();
      totalYears = extractYearsFromText(experienceText);
    } 
    // Handle case where experience is an array of strings (old format)
    else if (typeof experience[0] === 'string') {
      const experienceText = experience.join(' ').toLowerCase();
      totalYears = extractYearsFromText(experienceText);
    }
  }
  
  return totalYears;
}

// Test cases
console.log('Testing experience calculation logic...\n');

// Test case 1: Object format with duration
const testCase1 = [
  {
    "role": "Data Engineer Intern",
    "company": "TECHNOMOLD IT Solutions Pvt Ltd",
    "duration": "Jan 2022 - Jun 2022",
    "responsibilities": ["Handled data cleansing and preparation tasks using Excel"]
  },
  {
    "role": "Azure Data Engineer",
    "company": "TECHNOMOLD IT Solutions Pvt Ltd",
    "duration": "2022 - 2025",
    "responsibilities": ["Design, implement, and manage data solutions using Azure Data Factory"]
  }
];

console.log('Test case 1 (object format with duration):');
console.log('Input:', JSON.stringify(testCase1, null, 2));
console.log('Calculated experience:', calculateTotalExperience(testCase1), 'years\n');

// Test case 2: String format
const testCase2 = [
  "Worked at Company A from Jan 2020 to Jun 2022 (2.5 years)",
  "Worked at Company B from 2022 to 2025 (3 years)"
];

console.log('Test case 2 (string format):');
console.log('Input:', JSON.stringify(testCase2, null, 2));
console.log('Calculated experience:', calculateTotalExperience(testCase2), 'years\n');

// Test case 3: Direct years mention
const testCase3 = [
  {
    "role": "Developer",
    "company": "Tech Corp",
    "duration": "3 years",
    "responsibilities": ["Developed web applications"]
  }
];

console.log('Test case 3 (direct years mention):');
console.log('Input:', JSON.stringify(testCase3, null, 2));
console.log('Calculated experience:', calculateTotalExperience(testCase3), 'years\n');

console.log('Experience calculation tests completed.');