import { generateMCQQuestions } from './services/mcqGenerator';
import { JobDescriptionData } from './services/jdExtractor';
import { ResumeData } from './services/resumeExtractor';

// Test the MCQ generation service with mandatory requirements
async function testMandatoryMCQs() {
  try {
    // Mock job description data
    const mockJobDescription: JobDescriptionData = {
      title: "Software Engineer",
      company: "Tech Corp",
      location: "San Francisco, CA",
      salary: "$120,000 - $150,000",
      requirements: [
        "Bachelor's degree in Computer Science or related field",
        "3+ years of experience in software development",
        "Proficiency in JavaScript, Python, or Java"
      ],
      responsibilities: [
        "Develop and maintain web applications",
        "Collaborate with cross-functional teams",
        "Write clean, scalable code"
      ],
      skills: [
        "JavaScript",
        "React",
        "Node.js",
        "Problem Solving",
        "Team Collaboration"
      ],
      industrialExperience: [
        "Software Development",
        "Web Technologies"
      ],
      domainExperience: [
        "Frontend Development",
        "Backend Development"
      ],
      requiredIndustrialExperienceYears: 3,
      requiredDomainExperienceYears: 2
    };

    // Mock resume data
    const mockResume: ResumeData = {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      skills: [
        "JavaScript",
        "React",
        "Node.js",
        "Problem Solving",
        "Communication"
      ],
      experience: [
        "Software Engineer at Previous Company (2020-2023)",
        "Intern at Startup (2019-2020)"
      ],
      education: [
        "Bachelor of Science in Computer Science, University of California (2017-2021)"
      ],
      certifications: [
        "AWS Certified Developer",
        "Google Cloud Professional"
      ],
      industrialExperience: [
        "Web Development",
        "Software Engineering"
      ],
      domainExperience: [
        "Frontend Development",
        "Backend Development"
      ],
      totalIndustrialExperienceYears: 3,
      totalDomainExperienceYears: 2
    };

    console.log('Testing MCQ generation with mandatory requirements...');
    
    const result = await generateMCQQuestions(mockJobDescription, mockResume);
    console.log('Generated MCQs:', JSON.stringify(result, null, 2));
    
    // Check if we have questions
    if (result && result.length > 0) {
      console.log(`Generated ${result.length} questions`);
      
      // Check for mandatory topics
      const mandatoryTopics = [
        "special needs",
        "strengths",
        "problem-solving",
        "emotional quotient",
        "EQ",
        "authorization",
        "hire you"
      ];
      
      let foundMandatory = 0;
      result.forEach((question, index) => {
        const lowerQuestion = question.question.toLowerCase();
        console.log(`\nQuestion ${index + 1}: ${question.question}`);
        
        mandatoryTopics.forEach(topic => {
          if (lowerQuestion.includes(topic)) {
            console.log(`  ✓ Covers mandatory topic: ${topic}`);
            foundMandatory++;
          }
        });
      });
      
      console.log(`\nFound ${foundMandatory} references to mandatory topics across ${result.length} questions`);
    } else {
      console.log('No questions were generated');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testMandatoryMCQs();