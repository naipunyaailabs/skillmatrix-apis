import { matchJobWithResume } from './services/jobMatcher';
import { JobDescriptionData } from './services/jdExtractor';
import { ResumeData } from './services/resumeExtractor';

// Sample job description data
const sampleJobDescription: JobDescriptionData = {
  title: "Data Engineer",
  company: "Tech Solutions Inc.",
  location: "San Francisco, CA",
  salary: "$120,000 - $150,000",
  requirements: [
    "Bachelor's degree in Computer Science or related field",
    "3+ years of experience in data engineering",
    "Proficiency in SQL and Python",
    "Experience with cloud platforms (AWS, GCP, or Azure)"
  ],
  responsibilities: [
    "Design and implement data pipelines",
    "Develop and maintain data warehouses",
    "Collaborate with data scientists and analysts"
  ],
  skills: [
    "SQL",
    "Python",
    "AWS",
    "Data Warehousing"
  ],
  industrialExperience: [
    "Data engineering in cloud environments"
  ],
  domainExperience: [
    "Data analytics and business intelligence"
  ],
  requiredIndustrialExperienceYears: 3,
  requiredDomainExperienceYears: 2
};

// Sample resume data
const sampleResume: ResumeData = {
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+1 (555) 123-4567",
  skills: [
    "SQL",
    "Python",
    "Azure Data Factory",
    "Data Warehousing"
  ],
  experience: [
    {
      role: "Data Engineer Intern",
      company: "TECHNOMOLD IT Solutions Pvt Ltd",
      duration: "Jan 2022 - Jun 2022",
      responsibilities: [
        "Handled data cleansing and preparation tasks using Excel",
        "Wrote and executed SQL queries for data extraction and transformation"
      ]
    },
    {
      role: "Azure Data Engineer",
      company: "TECHNOMOLD IT Solutions Pvt Ltd",
      duration: "2022 - 2025",
      responsibilities: [
        "Design, implement, and manage data solutions using Azure Data Factory",
        "Work closely with data science and data analytics teams"
      ]
    }
  ],
  education: [
    "B.S. in Computer Science, University of Technology"
  ],
  certifications: [
    "Azure Data Engineer Associate"
  ],
  industrialExperience: [
    "2.5 years of data engineering experience"
  ],
  domainExperience: [
    "1 year of data analytics experience"
  ],
  totalIndustrialExperienceYears: 2.5,
  totalDomainExperienceYears: 1
};

// Test the job matching function
async function testJobMatching() {
  try {
    const result = await matchJobWithResume(sampleJobDescription, sampleResume);
    console.log('Job Matching Result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error in job matching:', error);
  }
}

testJobMatching();