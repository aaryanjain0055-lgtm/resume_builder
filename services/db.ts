
import { User, ResumeData, ResumeVersion, SystemMetrics } from '../types';
import { SAMPLE_RESUME } from '../constants';

// SIMULATED DATABASE (LocalStorage)
// In a real app, these would be secure API endpoints.

const DB_KEYS = {
  USER: 'career_copilot_user',
  ALL_USERS: 'career_copilot_all_users', // Admin access
  RESUMES: 'career_copilot_resumes', // Store all resumes by ID
  METRICS: 'career_copilot_metrics'
};

// Seed Data for Demo
const SEED_USERS: User[] = [
  { id: 'admin-1', name: 'System Admin', email: 'admin@system.com', role: 'ADMIN', plan: 'pro', isVerified: true },
  { id: 'mediator-1', name: 'Sarah Reviewer', email: 'sarah@mediator.com', role: 'MEDIATOR', plan: 'pro', isVerified: true }
];

export const db = {
  // --- AUTH & USER MANAGEMENT ---
  
  saveUser: async (user: User): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Save current session
    localStorage.setItem(DB_KEYS.USER, JSON.stringify(user));

    // Save to "All Users" DB (for Admin view)
    const allUsersStr = localStorage.getItem(DB_KEYS.ALL_USERS);
    let allUsers: User[] = allUsersStr ? JSON.parse(allUsersStr) : [...SEED_USERS];
    
    const existingIndex = allUsers.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      allUsers[existingIndex] = user;
    } else {
      allUsers.push(user);
    }
    localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(allUsers));

    return user;
  },

  verifyUser: async (userId: string): Promise<User | null> => {
    // Simulate API verification
    const allUsersStr = localStorage.getItem(DB_KEYS.ALL_USERS);
    let allUsers: User[] = allUsersStr ? JSON.parse(allUsersStr) : [...SEED_USERS];
    
    const userIndex = allUsers.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
        allUsers[userIndex].isVerified = true;
        localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(allUsers));
        
        // Update current session if applicable
        const currentUserStr = localStorage.getItem(DB_KEYS.USER);
        if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            if (currentUser.id === userId) {
                currentUser.isVerified = true;
                localStorage.setItem(DB_KEYS.USER, JSON.stringify(currentUser));
                return currentUser;
            }
        }
        return allUsers[userIndex];
    }
    return null;
  },

  getUser: async (): Promise<User | null> => {
    const data = localStorage.getItem(DB_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  getAllUsers: async (): Promise<User[]> => {
    // ADMIN ONLY in real API
    const data = localStorage.getItem(DB_KEYS.ALL_USERS);
    return data ? JSON.parse(data) : [...SEED_USERS];
  },

  logout: async () => {
    localStorage.removeItem(DB_KEYS.USER);
  },

  updateUserPlan: async (plan: 'free' | 'pro'): Promise<User | null> => {
    const user = await db.getUser();
    if (user) {
      const updated = { ...user, plan };
      await db.saveUser(updated);
      return updated;
    }
    return null;
  },

  // --- RESUME MANAGEMENT ---

  // USER: Save their own resume
  saveResume: async (data: ResumeData): Promise<ResumeData> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Get current user to bind resume to ID
    const user = await db.getUser();
    if (!user) throw new Error("Unauthorized");

    const resumeToSave = {
        ...data,
        userId: user.id,
        id: data.id || `resume-${Date.now()}`,
        updatedAt: Date.now()
    };

    // Store in global resumes map
    const allResumesStr = localStorage.getItem(DB_KEYS.RESUMES);
    let allResumes: Record<string, ResumeData> = allResumesStr ? JSON.parse(allResumesStr) : {};
    
    allResumes[resumeToSave.userId] = resumeToSave; // Simplification: 1 resume per user for this demo
    
    localStorage.setItem(DB_KEYS.RESUMES, JSON.stringify(allResumes));
    return resumeToSave;
  },

  // USER: Get their own resume
  getResume: async (): Promise<ResumeData> => {
    const user = await db.getUser();
    if (!user) return SAMPLE_RESUME;

    const allResumesStr = localStorage.getItem(DB_KEYS.RESUMES);
    const allResumes: Record<string, ResumeData> = allResumesStr ? JSON.parse(allResumesStr) : {};
    
    // Return user's resume or sample if none exists
    const userResume = allResumes[user.id];
    return userResume ? userResume : { ...SAMPLE_RESUME, userId: user.id, status: 'draft' };
  },

  // MEDIATOR: Get all resumes pending review
  getResumesForMediator: async (): Promise<ResumeData[]> => {
    // Simulate API Security Check
    const currentUser = await db.getUser();
    if (currentUser?.role !== 'MEDIATOR' && currentUser?.role !== 'ADMIN') {
        throw new Error("Unauthorized Access: Mediator Role Required");
    }

    const allResumesStr = localStorage.getItem(DB_KEYS.RESUMES);
    const allResumes: Record<string, ResumeData> = allResumesStr ? JSON.parse(allResumesStr) : {};
    
    return Object.values(allResumes).filter(r => r.status === 'pending_review');
  },

  // MEDIATOR: Submit review/feedback
  reviewResume: async (resumeId: string, status: 'approved' | 'changes_requested', feedback: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const allResumesStr = localStorage.getItem(DB_KEYS.RESUMES);
    let allResumes: Record<string, ResumeData> = allResumesStr ? JSON.parse(allResumesStr) : {};
    
    // Find resume by ID (in this simplified structure, we might need to search values if key is userId)
    let targetUserId = Object.keys(allResumes).find(key => allResumes[key].id === resumeId || (allResumes[key] as any).id === resumeId);
    
    // Fallback if ID structure varies in demo
    if (!targetUserId) {
         // Attempt to find by value property
         const entry = Object.entries(allResumes).find(([_, r]) => r.id === resumeId);
         if(entry) targetUserId = entry[0];
    }

    if (targetUserId && allResumes[targetUserId]) {
        allResumes[targetUserId].status = status;
        allResumes[targetUserId].feedback = feedback;
        localStorage.setItem(DB_KEYS.RESUMES, JSON.stringify(allResumes));
    }
  },

  // --- SEEDING FOR DEMO ---
  seedPendingResume: async () => {
      const demoId = 'demo-candidate-pending';
      // Create user entry without logging in
      const allUsersStr = localStorage.getItem(DB_KEYS.ALL_USERS);
      let allUsers: User[] = allUsersStr ? JSON.parse(allUsersStr) : [...SEED_USERS];
      
      if (!allUsers.find(u => u.id === demoId)) {
          allUsers.push({
              id: demoId,
              name: "Jordan Lee (Demo)",
              email: "jordan.demo@example.com",
              role: 'USER',
              plan: 'free',
              isVerified: true
          });
          localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(allUsers));
      }

      // Create Pending Resume
      const allResumesStr = localStorage.getItem(DB_KEYS.RESUMES);
      let allResumes: Record<string, ResumeData> = allResumesStr ? JSON.parse(allResumesStr) : {};
      
      allResumes[demoId] = {
          ...SAMPLE_RESUME,
          id: `resume-${demoId}`,
          userId: demoId,
          fullName: "Jordan Lee",
          email: "jordan.demo@example.com",
          status: 'pending_review',
          summary: "Aspiring Product Designer with a background in graphic design. Looking for feedback on my transition resume.",
          updatedAt: Date.now()
      };
      
      localStorage.setItem(DB_KEYS.RESUMES, JSON.stringify(allResumes));
  },

  // --- VERSIONS ---
  saveResumeVersion: async (data: ResumeData, name: string): Promise<ResumeVersion> => {
    const versions = await db.getResumeVersions();
    const newVersion: ResumeVersion = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        name,
        data: { ...data }
    };
    versions.unshift(newVersion);
    const key = `versions_${data.userId}`;
    localStorage.setItem(key, JSON.stringify(versions));
    return newVersion;
  },

  getResumeVersions: async (): Promise<ResumeVersion[]> => {
    const user = await db.getUser();
    if (!user) return [];
    const key = `versions_${user.id}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  deleteResumeVersion: async (id: string): Promise<void> => {
    const user = await db.getUser();
    if (!user) return;
    const key = `versions_${user.id}`;
    const versions = await db.getResumeVersions();
    const filtered = versions.filter(v => v.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  },

  // --- ADMIN SYSTEM METRICS ---
  getSystemMetrics: async (): Promise<SystemMetrics> => {
    const allUsers = await db.getAllUsers();
    const allResumesStr = localStorage.getItem(DB_KEYS.RESUMES);
    const allResumes = allResumesStr ? JSON.parse(allResumesStr) : {};
    const resumeCount = Object.keys(allResumes).length;
    const pendingCount = Object.values(allResumes).filter((r: any) => r.status === 'pending_review').length;

    return {
        totalUsers: allUsers.length,
        resumesCreated: resumeCount,
        pendingReviews: pendingCount,
        aiApiCalls: Math.floor(Math.random() * 500) + 1200, // Mock data
        systemHealth: 'Healthy'
    };
  }
};
