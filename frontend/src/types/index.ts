export type UserRole = 'admin' | 'recruiter'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}

export type JobStatus = 'active' | 'paused' | 'closed'
export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Remote'

export interface Job {
  id: string
  title: string
  department: string
  location: string
  type: JobType
  status: JobStatus
  description: string
  requirements: string[]
  niceToHave: string[]
  salaryMin?: number
  salaryMax?: number
  createdBy: string
  createdAt: string
  updatedAt: string
  applicationCount: number
  shortlistedCount?: number
  pendingCount?: number
}

export type ResumeStatus = 'pending' | 'shortlisted' | 'review' | 'rejected' | 'hired'
export type ScreeningStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Resume {
  id: string
  jobId: string
  filename: string
  fileSize: number
  mimeType: string
  candidateName: string
  status: ResumeStatus
  screeningStatus: ScreeningStatus
  uploadedAt: string
  updatedAt?: string
  uploadedBy: string
  notes?: string
  job?: { id: string; title: string; department: string }
  screeningResult?: ScreeningResultSummary | null
}

export interface ScreeningResultSummary {
  overallScore: number
  status: ResumeStatus
  summary: string
  scores: ScoreBreakdown
  screenedAt: string
}

export interface ScoreBreakdown {
  skillsMatch: number
  experienceMatch: number
  educationMatch: number
  cultureFit: number
  overall: number
}

export interface CandidateProfile {
  name: string
  email: string | null
  phone: string | null
  location: string | null
  currentTitle: string
  yearsOfExperience: number
  educationLevel: string
  topSkills: string[]
}

export interface FullScreeningResult {
  id: string
  resumeId: string
  jobId: string
  candidateProfile: CandidateProfile
  scores: ScoreBreakdown
  overallScore: number
  status: ResumeStatus
  strengths: string[]
  concerns: string[]
  missingRequirements: string[]
  matchedRequirements: string[]
  interviewQuestions: string[]
  summary: string
  recommendation: string
  screenedAt: string
  createdAt: string
  model: string
}

export interface AnalyticsOverview {
  summary: {
    totalJobs: number
    activeJobs: number
    totalResumes: number
    screened: number
    shortlisted: number
    rejected: number
  }
  scoreDistribution: Record<string, number>
  jobApplicationCounts: Array<{ jobTitle: string; count: number }>
  recentActivity: Array<{
    id: string
    candidateName: string
    jobTitle: string
    status: ResumeStatus
    uploadedAt: string
  }>
}

export interface UploadResult {
  filename: string
  success: boolean
  error?: string
  resume?: {
    id: string
    candidateName: string
    status: ResumeStatus
    uploadedAt: string
  }
}

export interface ApiError {
  error: string
  details?: unknown
}
