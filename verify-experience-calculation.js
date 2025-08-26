// Test script to verify experience calculation with actual data format
// This replicates the exact experience data structure from your response

// Copy of our key extraction function
function extractYearsFromText(text) {
  let totalYears = 0;
  
  // Handle "2016-2020" format specifically
  const yearRangePattern = /\b(20[0-2]\d)\s*[-–]\s*(?:(20[0-2]\d)|present|current)\b/gi;
  let match;
  while ((match = yearRangePattern.exec(text)) !== null) {
    const startYear = parseInt(match[1]);
    const endYearStr = match[2] ? match[2].toLowerCase() : 'present';
    
    let endYear;
    if (endYearStr === 'present' || endYearStr === 'current') {
      endYear = new Date().getFullYear();
    } else {
      endYear = parseInt(endYearStr);
    }
    
    if (!isNaN(startYear) && !isNaN(endYear) && startYear <= endYear && startYear >= 1900 && endYear <= 2030) {
      const years = endYear - startYear;
      totalYears = Math.max(totalYears, years); // Take maximum period
    }
  }
  
  // Handle "Aug 2024 - Sep 2024" format
  const monthYearPattern = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(20[0-2]\d)\s*[-–]\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(20[0-2]\d)|(present|current))/gi;
  while ((match = monthYearPattern.exec(text)) !== null) {
    const startYear = parseInt(match[1]);
    const endYearStr = match[2] || (match[3] ? match[3].toLowerCase() : 'present');
    
    let endYear;
    if (endYearStr === 'present' || endYearStr === 'current') {
      endYear = new Date().getFullYear();
    } else {
      endYear = parseInt(endYearStr);
    }
    
    if (!isNaN(startYear) && !isNaN(endYear) && startYear <= endYear && startYear >= 1900 && endYear <= 2030) {
      const years = endYear - startYear;
      // For month-level precision, we might have partial years
      if (years === 0) {
        // Same year, so less than 1 year
        totalYears = Math.max(totalYears, 0.1); // At least 1 month
      } else {
        totalYears = Math.max(totalYears, years);
      }
    }
  }
  
  // Handle "X years" or "X yrs" format
  const simpleYearPattern = /(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/gi;
  while ((match = simpleYearPattern.exec(text)) !== null) {
    const years = parseFloat(match[1]);
    if (!isNaN(years) && years > 0 && years <= 50) {
      totalYears = Math.max(totalYears, years);
    }
  }
  
  return Math.round(totalYears * 10) / 10; // Round to 1 decimal place
}

// Copy of our calculation function
function calculateTotalExperience(experience) {
  let totalYears = 0;
  let maxSingleExperience = 0;
  
  // Handle case where experience is an array of objects (new format)
  if (experience && Array.isArray(experience) && experience.length > 0) {
    // Check if it's an array of objects with duration properties
    if (typeof experience[0] === 'object' && experience[0] !== null) {
      // For each experience entry, try to calculate duration
      const validDurations = [];
      
      for (const exp of experience) {
        let expYears = 0;
        
        // Check duration field
        if (exp.duration) {
          expYears = extractYearsFromText(exp.duration);
        }
        
        // Only count valid durations (greater than 0)
        if (expYears > 0) {
          validDurations.push(expYears);
          maxSingleExperience = Math.max(maxSingleExperience, expYears);
        }
      }
      
      // Use the maximum duration as the total experience
      // This is more accurate for resumes where experience might overlap or be listed differently
      totalYears = maxSingleExperience;
      
      // If we still have 0, try to extract from all duration texts combined
      if (totalYears === 0) {
        // Extract all duration information from objects
        const durationTexts = [];
        for (const exp of experience) {
          if (exp.duration) {
            durationTexts.push(exp.duration);
          }
        }
        
        // Join all duration texts for pattern matching
        if (durationTexts.length > 0) {
          const experienceText = durationTexts.join(' ').toLowerCase();
          totalYears = extractYearsFromText(experienceText);
        }
      }
    } 
    // Handle case where experience is an array of strings (old format)
    else if (typeof experience[0] === 'string') {
      const experienceText = experience.join(' ').toLowerCase();
      totalYears = extractYearsFromText(experienceText);
    }
  }
  
  // Cap at reasonable maximum
  if (totalYears > 50) {
    totalYears = 0; // Reset if unreasonably high
  }
  
  return Math.round(totalYears * 10) / 10; // Round to 1 decimal place
}

// Test with your actual data
const testData = [
  {
    "company": "Purecode Software",
    "role": "Full stack Engineer",
    "duration": "Rvr and Jc college of Engineering"
  },
  {
    "company": "Servelots Pvt Ltd",
    "role": "Software Engineer",
    "duration": "2016-2020"
  },
  {
    "company": "Manipal Academy of Higher education",
    "role": "Guest Lecturer",
    "duration": "Aug 2024 - Sep 2024"
  }
];

console.log('Testing experience calculation with actual data:');
console.log('Input data:', JSON.stringify(testData, null, 2));

// Test each duration individually
testData.forEach((exp, index) => {
  if (exp.duration) {
    const years = extractYearsFromText(exp.duration);
    console.log(`Experience ${index + 1} duration "${exp.duration}" = ${years} years`);
  }
});

// Test total calculation
const totalExperience = calculateTotalExperience(testData);
console.log('\nTotal calculated experience:', totalExperience, 'years');

console.log('\nExpected result: 4 years (from "2016-2020")');