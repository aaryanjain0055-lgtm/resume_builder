

export interface Experience {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  school: string;
  year: string;
}

export interface Skill {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Expert';
  category?: 'Technical' | 'Soft' | 'Tool';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export type TemplateId = 'executive' | 'modern' | 'classic';

export type ResumeStatus = 'draft' | 'pending_review' | 'changes_requested' | 'forwarded_to_admin' | 'hired' | 'rejected';
export type UserRole = 'USER' | 'MEDIATOR' | 'ADMIN';

export interface ResumeData {
  id?: string;
  userId?: string;
  templateId?: TemplateId;
  status: ResumeStatus;
  feedback?: string;
  fullName: string;
  email: string;
  phone: string;
  summary: string;
  location?: string;
  website?: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  updatedAt?: number;
}

export interface ResumeVersion {
  id: string;
  timestamp: number;
  name: string;
  data: ResumeData;
}

export interface JobMatchResult {
  matchScore: number;
  missingSkills: string[];
  keywordGaps: string[];
  analysis: string;
  role: string;
  skillGapAnalysis: {
    category: string;
    current: number;
    required: number;
  }[];
}

export interface ResumeAuditResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  missingCriticalSkills: string[];
}

export interface WeeklyPlan {
  week: number;
  focus: string;
  tasks: string[];
  resources: string[];
}

export interface CareerRoadmap {
  targetRole: string;
  duration: string;
  overview: string;
  weeks: WeeklyPlan[];
}

export interface ResumeRankingResult {
  jobRole: string;
  rankedCandidates: {
    candidateId: string;
    rank: number;
    shortlistDecision: 'Strong Yes' | 'Maybe' | 'Reject';
    reason: string;
    topStrengths: string[];
    redFlags: string[];
  }[];
  recruiterInsights: string;
}

export interface ResumeComparisonResult {
  versionA_score: number;
  versionB_score: number;
  improvements: string[];
  regressions: string[];
  netImpact: 'Positive' | 'Neutral' | 'Negative';
  finalRecommendation: string;
}

export interface InterviewPrep {
  role: string;
  technicalQuestions: string[];
  behavioralQuestions: string[];
  resumeSpecificQuestions: string[];
  focusAreas: string[];
}

export interface CareerDNA {
  careerDNA: {
    primaryStrengths: string[];
    workingStyle: string;
    learningSpeed: 'Fast' | 'Medium' | 'Slow';
    careerTrajectory: 'Specialist' | 'Generalist' | 'Leadership';
    recommendedRoles: string[];
    riskAreas: string[];
  };
  summary: string;
}

export interface AIConfidence {
  confidenceScore: number;
  confidenceReasoning: string;
  assumptionsMade: string[];
  dataGaps: string[];
  recommendedHumanReview: boolean;
}

export enum ViewState {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  RESUME_BUILDER = 'RESUME_BUILDER',
  JOB_MATCH = 'JOB_MATCH',
  ROADMAP = 'ROADMAP',
  CAREER_INTEL = 'CAREER_INTEL',
  COVER_LETTER = 'COVER_LETTER',
  MEDIATOR_PANEL = 'MEDIATOR_PANEL',
  ADMIN_PANEL = 'ADMIN_PANEL'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: 'free' | 'pro';
  isVerified?: boolean;
  lastLogin?: number; // Added to track access
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export interface SystemMetrics {
  totalUsers: number;
  resumesCreated: number;
  pendingReviews: number;
  aiApiCalls: number;
  systemHealth: 'Healthy' | 'Degraded';
}

export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  timestamp: number;
  action: string;
}
