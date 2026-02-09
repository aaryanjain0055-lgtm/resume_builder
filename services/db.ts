
import { User, ResumeData, ResumeVersion, SystemMetrics, AccessLog } from '../types';
import { SAMPLE_RESUME } from '../constants';

// SIMULATED DATABASE (LocalStorage)
const DB_KEYS = {
  USER: 'career_copilot_user',
  ALL_USERS: 'career_copilot_all_users',
  RESUMES: 'career_copilot_resumes',
  METRICS: 'career_copilot_metrics',
  CREDS: 'career_copilot_creds',
  LOGS: 'career_copilot_logs' // New key for logs
};

const SEED_USERS: User[] = [
  { id: 'admin-1', name: 'System Admin', email: 'admin@system.com', role: 'ADMIN', plan: 'pro', isVerified: true, lastLogin: Date.now() },
  { id: 'mediator-1', name: 'Sarah Reviewer', email: 'sarah@mediator.com', role: 'MEDIATOR', plan: 'pro', isVerified: true, lastLogin: Date.now() - 86400000 },
  { id: 'demo-123', name: 'Alex Candidate', email: 'alex@example.com', role: 'USER', plan: 'free', isVerified: true, lastLogin: Date.now() - 3600000 }
];

export const db = {
  // --- AUTH ---
  login: async (email: string, password: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const credsStr = localStorage.getItem(DB_KEYS.CREDS);
    const creds = credsStr ? JSON.parse(credsStr) : {};
    
    const isSeed = SEED_USERS.find(u => u.email === email);
    if (isSeed && password === 'password') {
        const updatedUser = { ...isSeed, lastLogin: Date.now() };
        await db.saveUserSession(updatedUser);
        await db.logAccess(updatedUser.id, updatedUser.name, 'Login');
        return updatedUser;
    }

    if (creds[email] && creds[email] === password) {
        const allUsers = await db.getAllUsers();
        const user = allUsers.find(u => u.email === email);
        if (user) {
            const updatedUser = { ...user, lastLogin: Date.now() };
            // Update user in DB with new login time
            const userIndex = allUsers.findIndex(u => u.id === user.id);
            allUsers[userIndex] = updatedUser;
            localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(allUsers));
            
            await db.saveUserSession(updatedUser);
            await db.logAccess(updatedUser.id, updatedUser.name, 'Login');
            return updatedUser;
        }
    }
    return null;
  },

  register: async (user: User, password: string): Promise<User> => {
      await new Promise(resolve => setTimeout(resolve, 800));
      const allUsers = await db.getAllUsers();
      if (allUsers.find(u => u.email === user.email)) {
          throw new Error("User already exists");
      }
      const newUser = { ...user, lastLogin: Date.now() };
      allUsers.push(newUser);
      localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(allUsers));

      const credsStr = localStorage.getItem(DB_KEYS.CREDS);
      const creds = credsStr ? JSON.parse(credsStr) : {};
      creds[user.email] = password;
      localStorage.setItem(DB_KEYS.CREDS, JSON.stringify(creds));
      
      await db.logAccess(user.id, user.name, 'Register');
      return newUser;
  },

  saveUserSession: async (user: User) => {
      localStorage.setItem(DB_KEYS.USER, JSON.stringify(user));
  },

  saveUser: async (user: User): Promise<User> => {
    localStorage.setItem(DB_KEYS.USER, JSON.stringify(user));
    const allUsersStr = localStorage.getItem(DB_KEYS.ALL_USERS);
    let allUsers: User[] = allUsersStr ? JSON.parse(allUsersStr) : [...SEED_USERS];
    const existingIndex = allUsers.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) allUsers[existingIndex] = user;
    else allUsers.push(user);
    localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(allUsers));
    return user;
  },

  getUser: async (): Promise<User | null> => {
    const data = localStorage.getItem(DB_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  getAllUsers: async (): Promise<User[]> => {
    const data = localStorage.getItem(DB_KEYS.ALL_USERS);
    return data ? JSON.parse(data) : [...SEED_USERS];
  },

  logout: async () => {
    const user = await db.getUser();
    if (user) await db.logAccess(user.id, user.name, 'Logout');
    localStorage.removeItem(DB_KEYS.USER);
  },

  // --- ACCESS LOGS ---
  logAccess: async (userId: string, userName: string, action: string) => {
      const logsStr = localStorage.getItem(DB_KEYS.LOGS);
      const logs: AccessLog[] = logsStr ? JSON.parse(logsStr) : [];
      logs.unshift({
          id: Date.now().toString(),
          userId,
          userName,
          timestamp: Date.now(),
          action
      });
      // Keep only last 50 logs
      if (logs.length > 50) logs.length = 50;
      localStorage.setItem(DB_KEYS.LOGS, JSON.stringify(logs));
  },

  getAccessLogs: async (): Promise<AccessLog[]> => {
      const logsStr = localStorage.getItem(DB_KEYS.LOGS);
      return logsStr ? JSON.parse(logsStr) : [];
  },

  // --- RESUME MANAGEMENT ---
  saveResume: async (data: ResumeData): Promise<ResumeData> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const user = await db.getUser();
    if (!user) throw new Error("Unauthorized");

    const resumeToSave = {
        ...data,
        userId: user.id,
        id: data.id || `resume-${Date.now()}`,
        updatedAt: Date.now()
    };

    const allResumesStr = localStorage.getItem(DB_KEYS.RESUMES);
    let allResumes: Record<string, ResumeData> = allResumesStr ? JSON.parse(allResumesStr) : {};
    allResumes[resumeToSave.userId] = resumeToSave;
    localStorage.setItem(DB_KEYS.RESUMES, JSON.stringify(allResumes));
    return resumeToSave;
  },

  getResume: async (): Promise<ResumeData> => {
    const user = await db.getUser();
    if (!user) return SAMPLE_RESUME;
    const allResumesStr = localStorage.getItem(DB_KEYS.RESUMES);
    const allResumes: Record<string, ResumeData> = allResumesStr ? JSON.parse(allResumesStr) : {};
    return allResumes[user.id] || { ...SAMPLE_RESUME, userId: user.id, status: 'draft' };
  },

  getResumesForMediator: async (): Promise<ResumeData[]> => {
    const currentUser = await db.getUser();
    if (currentUser?.role !== 'MEDIATOR' && currentUser?.role !== 'ADMIN') throw new Error("Unauthorized");
    const allResumesStr = localStorage.getItem(DB_KEYS.RESUMES);
    const allResumes: Record<string, ResumeData> = allResumesStr ? JSON.parse(allResumesStr) : {};
    return Object.values(allResumes).filter(r => r.status === 'pending_review');
  },

  // New: Get ALL Resumes for Admin
  getAllResumes: async (): Promise<ResumeData[]> => {
    const currentUser = await db.getUser();
    if (currentUser?.role !== 'ADMIN') throw new Error("Unauthorized");
    const allResumesStr = localStorage.getItem(DB_KEYS.RESUMES);
    const allResumes: Record<string, ResumeData> = allResumesStr ? JSON.parse(allResumesStr) : {};
    return Object.values(allResumes);
  },

  reviewResume: async (resumeId: string, status: string, feedback: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const allResumesStr = localStorage.getItem(DB_KEYS.RESUMES);
    let allResumes: Record<string, ResumeData> = allResumesStr ? JSON.parse(allResumesStr) : {};
    
    // Find resume by ID (handling different structures if needed)
    let targetUserId = Object.keys(allResumes).find(key => allResumes[key].id === resumeId);
    
    // Fallback: search values if key isn't userId
    if (!targetUserId) {
        const entry = Object.entries(allResumes).find(([_, r]) => r.id === resumeId);
        if(entry) targetUserId = entry[0];
    }

    if (targetUserId && allResumes[targetUserId]) {
        allResumes[targetUserId].status = status as any;
        allResumes[targetUserId].feedback = feedback;
        localStorage.setItem(DB_KEYS.RESUMES, JSON.stringify(allResumes));
    }
  },

  seedPendingResume: async () => {
      const demoId = 'demo-candidate-pending';
      const allUsers = await db.getAllUsers();
      if (!allUsers.find(u => u.id === demoId)) {
          allUsers.push({ id: demoId, name: "Jordan Lee (Demo)", email: "jordan.demo@example.com", role: 'USER', plan: 'free', isVerified: true, lastLogin: Date.now() });
          localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(allUsers));
      }
      const allResumesStr = localStorage.getItem(DB_KEYS.RESUMES);
      let allResumes: Record<string, ResumeData> = allResumesStr ? JSON.parse(allResumesStr) : {};
      allResumes[demoId] = { ...SAMPLE_RESUME, id: `resume-${demoId}`, userId: demoId, fullName: "Jordan Lee", email: "jordan.demo@example.com", status: 'pending_review', summary: "Aspiring Product Designer...", updatedAt: Date.now() };
      localStorage.setItem(DB_KEYS.RESUMES, JSON.stringify(allResumes));
  },

  // --- VERSIONS ---
  saveResumeVersion: async (data: ResumeData, name: string): Promise<ResumeVersion> => {
    const versions = await db.getResumeVersions();
    const newVersion: ResumeVersion = { id: Date.now().toString(), timestamp: Date.now(), name, data: { ...data } };
    versions.unshift(newVersion);
    localStorage.setItem(`versions_${data.userId}`, JSON.stringify(versions));
    return newVersion;
  },

  getResumeVersions: async (): Promise<ResumeVersion[]> => {
    const user = await db.getUser();
    if (!user) return [];
    const data = localStorage.getItem(`versions_${user.id}`);
    return data ? JSON.parse(data) : [];
  },

  deleteResumeVersion: async (id: string): Promise<void> => {
    const user = await db.getUser();
    if (!user) return;
    const key = `versions_${user.id}`;
    const versions = await db.getResumeVersions();
    localStorage.setItem(key, JSON.stringify(versions.filter(v => v.id !== id)));
  },

  // --- METRICS ---
  getSystemMetrics: async (): Promise<SystemMetrics> => {
    const allUsers = await db.getAllUsers();
    const allResumesStr = localStorage.getItem(DB_KEYS.RESUMES);
    const allResumes = allResumesStr ? JSON.parse(allResumesStr) : {};
    const pendingCount = Object.values(allResumes).filter((r: any) => r.status === 'pending_review').length;

    return {
        totalUsers: allUsers.length,
        resumesCreated: Object.keys(allResumes).length,
        pendingReviews: pendingCount,
        aiApiCalls: Math.floor(Math.random() * 500) + 1200,
        systemHealth: 'Healthy'
    };
  }
};
