/**
 * In-memory data store - replace with PostgreSQL/MongoDB in production
 * This simulates a database for demonstration purposes
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Seed data
const seedAdmin = {
  id: 'admin-001',
  email: 'admin@company.com',
  passwordHash: bcrypt.hashSync('Admin@1234', 10),
  name: 'Admin User',
  role: 'admin',
  createdAt: new Date('2024-01-01').toISOString(),
};

const seedRecruiter = {
  id: 'recruiter-001',
  email: 'recruiter@company.com',
  passwordHash: bcrypt.hashSync('Recruiter@1234', 10),
  name: 'Jane Smith',
  role: 'recruiter',
  createdAt: new Date('2024-01-15').toISOString(),
};

const store = {
  users: [seedAdmin, seedRecruiter],
  jobs: [
    {
      id: 'job-001',
      title: 'Senior Full Stack Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      status: 'active',
      description: 'We are looking for a Senior Full Stack Engineer with 5+ years of experience building scalable web applications.',
      requirements: [
        '5+ years of experience with React and Node.js',
        'Strong understanding of RESTful APIs and GraphQL',
        'Experience with cloud platforms (AWS/GCP/Azure)',
        'Proficiency in TypeScript',
        'Experience with PostgreSQL and MongoDB',
        'Excellent problem-solving skills',
      ],
      niceToHave: [
        'Experience with microservices architecture',
        'Knowledge of Docker and Kubernetes',
        'Open source contributions',
      ],
      salaryMin: 120000,
      salaryMax: 180000,
      createdBy: 'admin-001',
      createdAt: new Date('2024-06-01').toISOString(),
      updatedAt: new Date('2024-06-01').toISOString(),
      applicationCount: 0,
    },
    {
      id: 'job-002',
      title: 'Product Manager',
      department: 'Product',
      location: 'New York, NY',
      type: 'Full-time',
      status: 'active',
      description: 'Seeking an experienced Product Manager to lead our core product initiatives.',
      requirements: [
        '4+ years of product management experience',
        'Strong analytical and data-driven mindset',
        'Experience with Agile/Scrum methodologies',
        'Excellent stakeholder management skills',
        'Track record of launching successful products',
      ],
      niceToHave: [
        'Technical background or computer science degree',
        'Experience with B2B SaaS products',
        'MBA or equivalent',
      ],
      salaryMin: 110000,
      salaryMax: 160000,
      createdBy: 'recruiter-001',
      createdAt: new Date('2024-06-10').toISOString(),
      updatedAt: new Date('2024-06-10').toISOString(),
      applicationCount: 0,
    },
    {
      id: 'job-003',
      title: 'UX/UI Designer',
      department: 'Design',
      location: 'San Francisco, CA',
      type: 'Full-time',
      status: 'active',
      description: 'Join our design team to craft beautiful, user-centered experiences.',
      requirements: [
        '3+ years of UX/UI design experience',
        'Proficiency in Figma and prototyping tools',
        'Strong portfolio demonstrating end-to-end design process',
        'Experience conducting user research',
        'Knowledge of accessibility standards',
      ],
      niceToHave: [
        'Experience with design systems',
        'Basic knowledge of HTML/CSS',
        'Motion design skills',
      ],
      salaryMin: 90000,
      salaryMax: 140000,
      createdBy: 'admin-001',
      createdAt: new Date('2024-06-15').toISOString(),
      updatedAt: new Date('2024-06-15').toISOString(),
      applicationCount: 0,
    },
  ],
  resumes: [],
  screeningResults: [],
};

// Helper CRUD functions
const db = {
  // Users
  findUserById: (id) => store.users.find(u => u.id === id),
  findUserByEmail: (email) => store.users.find(u => u.email === email.toLowerCase()),
  createUser: (data) => {
    const user = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    store.users.push(user);
    return user;
  },

  // Jobs
  getAllJobs: (filters = {}) => {
    let jobs = [...store.jobs];
    if (filters.status) jobs = jobs.filter(j => j.status === filters.status);
    if (filters.department) jobs = jobs.filter(j => j.department === filters.department);
    return jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  findJobById: (id) => store.jobs.find(j => j.id === id),
  createJob: (data) => {
    const job = {
      ...data,
      id: uuidv4(),
      applicationCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.jobs.push(job);
    return job;
  },
  updateJob: (id, data) => {
    const idx = store.jobs.findIndex(j => j.id === id);
    if (idx === -1) return null;
    store.jobs[idx] = { ...store.jobs[idx], ...data, updatedAt: new Date().toISOString() };
    return store.jobs[idx];
  },
  deleteJob: (id) => {
    const idx = store.jobs.findIndex(j => j.id === id);
    if (idx === -1) return false;
    store.jobs.splice(idx, 1);
    return true;
  },

  // Resumes
  getAllResumes: (filters = {}) => {
    let resumes = [...store.resumes];
    if (filters.jobId) resumes = resumes.filter(r => r.jobId === filters.jobId);
    if (filters.status) resumes = resumes.filter(r => r.status === filters.status);
    return resumes.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  },
  findResumeById: (id) => store.resumes.find(r => r.id === id),
  createResume: (data) => {
    const resume = { ...data, id: uuidv4(), uploadedAt: new Date().toISOString() };
    store.resumes.push(resume);
    // Increment job application count
    const job = store.jobs.find(j => j.id === data.jobId);
    if (job) job.applicationCount = (job.applicationCount || 0) + 1;
    return resume;
  },
  updateResume: (id, data) => {
    const idx = store.resumes.findIndex(r => r.id === id);
    if (idx === -1) return null;
    store.resumes[idx] = { ...store.resumes[idx], ...data, updatedAt: new Date().toISOString() };
    return store.resumes[idx];
  },
  deleteResume: (id) => {
    const idx = store.resumes.findIndex(r => r.id === id);
    if (idx === -1) return false;
    const resume = store.resumes[idx];
    store.resumes.splice(idx, 1);
    // Decrement job application count
    const job = store.jobs.find(j => j.id === resume.jobId);
    if (job && job.applicationCount > 0) job.applicationCount--;
    return true;
  },

  // Screening Results
  findScreeningByResumeId: (resumeId) => store.screeningResults.find(s => s.resumeId === resumeId),
  createScreeningResult: (data) => {
    const result = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    // Remove old result if exists
    const existingIdx = store.screeningResults.findIndex(s => s.resumeId === data.resumeId);
    if (existingIdx !== -1) store.screeningResults.splice(existingIdx, 1);
    store.screeningResults.push(result);
    return result;
  },

  // Analytics
  getAnalytics: () => {
    const totalJobs = store.jobs.length;
    const activeJobs = store.jobs.filter(j => j.status === 'active').length;
    const totalResumes = store.resumes.length;
    const screened = store.resumes.filter(r => r.screeningStatus === 'completed').length;
    const shortlisted = store.resumes.filter(r => r.status === 'shortlisted').length;
    const rejected = store.resumes.filter(r => r.status === 'rejected').length;

    const scoreDistribution = store.screeningResults.reduce((acc, s) => {
      const bucket = Math.floor(s.overallScore / 20) * 20;
      const key = `${bucket}-${bucket + 19}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const jobApplicationCounts = store.jobs.map(j => ({
      jobTitle: j.title,
      count: store.resumes.filter(r => r.jobId === j.id).length,
    }));

    return {
      summary: { totalJobs, activeJobs, totalResumes, screened, shortlisted, rejected },
      scoreDistribution,
      jobApplicationCounts,
      recentActivity: store.resumes.slice(-10).map(r => ({
        id: r.id,
        candidateName: r.candidateName,
        jobTitle: store.jobs.find(j => j.id === r.jobId)?.title || 'Unknown',
        status: r.status,
        uploadedAt: r.uploadedAt,
      })),
    };
  },
};

module.exports = db;
