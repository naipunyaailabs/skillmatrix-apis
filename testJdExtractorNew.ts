import { transformToJobDescriptionResponse, JobDescriptionData } from './services/jdExtractor';

// Test data
const testData: JobDescriptionData = {
  title: "Software Engineer",
  company: "Tech Corp",
  location: "San Francisco, CA",
  salary: "$100,000 - $120,000",
  requirements: ["Bachelor's degree in Computer Science", "3+ years of experience"],
  responsibilities: ["Develop software solutions", "Collaborate with team members"],
  skills: ["JavaScript", "TypeScript", "React", "Node.js"],
  industrialExperience: ["Software development"],
  domainExperience: ["Web applications"],
  requiredIndustrialExperienceYears: 3,
  requiredDomainExperienceYears: 2,
  employmentType: "Full-Time",
  department: "Engineering",
  description: "We are looking for a skilled Software Engineer to join our team."
};

// Transform the data
const result = transformToJobDescriptionResponse(testData);

console.log("Transformed Job Description Response:");
console.log(JSON.stringify(result, null, 2));