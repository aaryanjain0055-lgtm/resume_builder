

import React, { useState, useEffect } from 'react';
import { ViewState, ResumeData, JobMatchResult, User, UserRole } from './types';
import { SAMPLE_RESUME, Icons } from './constants';
import { ResumeForm } from './components/ResumeForm';
import { CareerRoadmap } from './components/CareerRoadmap';
import { ChatAssistant } from './components/ChatAssistant';
import { MediatorPanel } from './components/MediatorPanel';
import { AdminPanel } from './components/AdminPanel';
import { CareerIntelligence } from './components/CareerIntelligence';
import { CoverLetterGenerator } from './components/CoverLetterGenerator';
import { db } from './services/db';

function App() {
  const [view, setView] = useState<ViewState>(ViewState.AUTH);
  const [user, setUser] = useState<User | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData>(SAMPLE_RESUME);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Auth State
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load Session
  useEffect(() => {
    const init = async () => {
      const savedUser = await db.getUser();
      if (savedUser) {
          handleRoleLoginSuccess(savedUser);
      }
    };
    init();
  }, []);

  const handleRoleLoginSuccess = async (loggedInUser: User) => {
      setUser(loggedInUser);
      
      // Route based on role
      if (loggedInUser.role === 'ADMIN') {
          setView(ViewState.ADMIN_PANEL);
      } else if (loggedInUser.role === 'MEDIATOR') {
          setView(ViewState.MEDIATOR_PANEL);
      } else {
          // Default to Resume Builder for Users as requested
          setView(ViewState.RESUME_BUILDER);
          const savedResume = await db.getResume();
          setResumeData(savedResume);
      }
  };

  const handleRoleSelect = (role: UserRole) => {
      setSelectedRole(role);
      setAuthMode('login');
      setEmail('');
      setPassword('');
      setFullName('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || !password || !selectedRole) return;
      setIsLoading(true);

      try {
          const user = await db.login(email, password);
          if (user && user.role === selectedRole) {
              handleRoleLoginSuccess(user);
          } else if (user) {
              alert(`Incorrect role. This account is a ${user.role}, but you are trying to login as ${selectedRole}.`);
          } else {
              alert("Invalid credentials. For demo: admin@system.com / password");
          }
      } catch (err) {
          console.error(err);
          alert("Login failed.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || !password || !fullName || !selectedRole) return;
      setIsLoading(true);

      try {
          const newUser: User = {
              id: `user-${Date.now()}`,
              name: fullName,
              email: email,
              role: selectedRole,
              plan: 'free',
              isVerified: true // Auto-verify for demo
          };
          
          await db.register(newUser, password);
          alert("Account created successfully! Please Sign In.");
          setAuthMode('login');
      } catch (e: any) {
          alert(e.message || "Registration failed. Email might be taken.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleSeedResume = async () => {
      if(confirm("Generate a demo resume in 'Pending Review' status? (Useful for Mediator Demo)")) {
          await db.seedPendingResume();
          alert("Demo resume submitted! Log in as Mediator to review it.");
      }
  };

  const handleLogout = async () => {
    await db.logout();
    setUser(null);
    setSelectedRole(null);
    setAuthMode('login');
    setView(ViewState.AUTH);
    setIsMobileMenuOpen(false);
  };

  const handleResumeChange = async (newData: ResumeData) => {
    setResumeData(newData);
    await db.saveResume(newData); // User saves their own resume
  };

  const calculateStrength = (data: ResumeData) => {
    let score = 0;
    if (data.fullName) score += 10;
    if (data.email) score += 10;
    if (data.phone) score += 5;
    if (data.summary && data.summary.length > 20) score += 15;
    if (data.experience.length > 0) score += 20;
    if (data.education.length > 0) score += 15;
    if (data.skills.length >= 3) score += 15;
    if (data.projects.length > 0) score += 10;
    return Math.min(100, score);
  };

  const strength = calculateStrength(resumeData);

  // Neon Navbar Component
  const Navbar = () => (
    <nav className="fixed top-0 w-full z-40 bg-[#05051e]/90 backdrop-blur-md border-b border-white/10 min-w-[1200px]">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => user?.role === 'USER' ? setView(ViewState.DASHBOARD) : null}>
                    <div className="p-1.5 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                        <Icons.Sparkles />
                    </div>
                    <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                        Career<span className="text-white">AI</span>
                    </span>
                    {user?.role === 'MEDIATOR' && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded border border-purple-500/30 ml-2">MEDIATOR</span>}
                    {user?.role === 'ADMIN' && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 ml-2">ADMIN</span>}
                </div>
                
                {/* Desktop Menu - Always Visible */}
                <div className="flex items-center gap-8">
                    {/* USER MENU */}
                    {user?.role === 'USER' && [
                        { id: ViewState.RESUME_BUILDER, label: 'Resume' },
                        { id: ViewState.DASHBOARD, label: 'Dashboard' },
                        { id: ViewState.COVER_LETTER, label: 'Cover Letter' },
                        { id: ViewState.ROADMAP, label: 'Roadmap' },
                        { id: ViewState.CAREER_INTEL, label: 'Intelligence' }, // New Item
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`text-sm font-medium transition-colors ${
                                view === item.id 
                                ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]' 
                                : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}

                    {/* MEDIATOR MENU */}
                    {user?.role === 'MEDIATOR' && (
                        <span className="text-slate-400 text-sm">Review Panel Active</span>
                    )}

                    {/* ADMIN MENU */}
                    {user?.role === 'ADMIN' && (
                         <span className="text-slate-400 text-sm">System Control Active</span>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                        <div className="text-right">
                            <p className="text-sm font-medium text-white">{user?.name}</p>
                            <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
                        </div>
                        <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors">
                            <Icons.LogOut />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </nav>
  );

  // AUTH VIEW (Neon Theme) - KEEP CENTERED FLEX
  if (view === ViewState.AUTH) {
    return (
      <div className="min-h-screen bg-[#05051e] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[100px]"></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
           <div className="flex justify-center mb-6">
             <div className="p-3 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.4)]">
                <div className="text-white scale-125"><Icons.Sparkles /></div>
             </div>
           </div>
          <h2 className="text-center text-4xl font-extrabold text-white tracking-tight">
            Career<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Copilot</span>
          </h2>
          <p className="mt-2 text-center text-sm text-cyan-200/60">
             Next-Gen AI Career Management
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="bg-[#0f0f2d]/80 backdrop-blur-xl py-8 px-4 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-xl sm:px-10 border border-white/10">
            {/* Role Selection */}
            {!selectedRole && (
                <div className="animate-fade-in">
                    <p className="text-center text-white font-bold mb-6">Choose your role to continue</p>
                    <div className="space-y-4">
                        <button onClick={() => handleRoleSelect('USER')} className="w-full flex items-center justify-between py-4 px-4 border border-cyan-500/30 rounded-lg text-sm font-medium text-white bg-cyan-900/20 hover:bg-cyan-900/40 transition-all hover:scale-[1.02] group">
                            <span className="flex flex-col text-left"><span className="font-bold text-cyan-400 text-lg">Candidate</span><span className="text-xs text-slate-400">Build resume, analyze jobs & interviews</span></span><Icons.ChevronRight />
                        </button>
                        <button onClick={() => handleRoleSelect('MEDIATOR')} className="w-full flex items-center justify-between py-4 px-4 border border-purple-500/30 rounded-lg text-sm font-medium text-white bg-purple-900/20 hover:bg-purple-900/40 transition-all hover:scale-[1.02] group">
                            <span className="flex flex-col text-left"><span className="font-bold text-purple-400 text-lg">Mediator</span><span className="text-xs text-slate-400">Review resumes, rank candidates</span></span><Icons.ChevronRight />
                        </button>
                        <button onClick={() => handleRoleSelect('ADMIN')} className="w-full flex items-center justify-between py-4 px-4 border border-red-500/30 rounded-lg text-sm font-medium text-white bg-red-900/20 hover:bg-red-900/40 transition-all hover:scale-[1.02] group">
                            <span className="flex flex-col text-left"><span className="font-bold text-red-400 text-lg">System Admin</span><span className="text-xs text-slate-400">Manage users & system metrics</span></span><Icons.ChevronRight />
                        </button>
                    </div>
                </div>
            )}
            
            {/* Login Form */}
            {selectedRole && (
                <div className="animate-fade-in">
                    <button onClick={() => setSelectedRole(null)} className="mb-6 text-xs text-slate-500 hover:text-white flex items-center gap-1">← Back to Roles</button>
                    <h3 className="text-xl font-bold text-white mb-2">{authMode === 'login' ? 'Sign In' : 'Create Account'}</h3>
                    <p className="text-sm text-slate-400 mb-6">As <span className={`font-bold ${selectedRole === 'USER' ? 'text-cyan-400' : selectedRole === 'MEDIATOR' ? 'text-purple-400' : 'text-red-400'}`}>{selectedRole}</span></p>
                    <form onSubmit={authMode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4">
                        {authMode === 'register' && <div><label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label><input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#1a1a3a] border border-white/10 rounded p-2 text-white focus:border-cyan-500 outline-none" /></div>}
                        <div><label className="block text-xs font-medium text-slate-400 mb-1">Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#1a1a3a] border border-white/10 rounded p-2 text-white focus:border-cyan-500 outline-none" /></div>
                        <div><label className="block text-xs font-medium text-slate-400 mb-1">Password</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#1a1a3a] border border-white/10 rounded p-2 text-white focus:border-cyan-500 outline-none" /></div>
                        <button type="submit" disabled={isLoading} className={`w-full font-bold py-3 rounded-lg transition-colors mt-2 ${selectedRole === 'USER' ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : selectedRole === 'MEDIATOR' ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}>{isLoading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Sign Up')}</button>
                    </form>
                    <div className="mt-6 text-center"><p className="text-sm text-slate-500">{authMode === 'login' ? "Don't have an account?" : "Already have an account?"}<button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="ml-2 text-white hover:underline font-medium">{authMode === 'login' ? 'Register Now' : 'Sign In'}</button></p></div>
                    {authMode === 'login' && <div className="mt-6 p-4 bg-white/5 rounded border border-white/10 text-xs text-slate-400"><p className="font-bold text-white mb-1">Demo Credentials:</p>{selectedRole === 'USER' && <p>alex@example.com / password</p>}{selectedRole === 'MEDIATOR' && <p>sarah@mediator.com / password</p>}{selectedRole === 'ADMIN' && <p>admin@system.com / password</p>}</div>}
                </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // MAIN APP VIEW - FORCE DESKTOP WIDTH
  return (
    <div className="flex flex-col h-screen bg-[#05051e] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-auto">
      <Navbar />

      <main className="flex-1 pt-20 px-6 pb-4 min-w-[1300px]">
        <div className="max-w-7xl mx-auto h-full"> 
          
          {/* USER VIEWS */}
          {user?.role === 'USER' && (
              <>
                <div className="mb-6 flex flex-row justify-between items-end border-b border-white/5 pb-4">
                    <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        {view === ViewState.DASHBOARD && <><span className="text-cyan-400">Dashboard</span></>}
                        {view === ViewState.RESUME_BUILDER && <><span className="text-purple-400">Resume Builder</span></>}
                        {view === ViewState.COVER_LETTER && <><span className="text-blue-400">Cover Letter</span></>}
                        {view === ViewState.ROADMAP && <><span className="text-amber-400">Career Roadmap</span></>}
                        {view === ViewState.CAREER_INTEL && <><span className="text-pink-400">Career Intelligence</span></>}
                    </h1>
                    </div>
                </div>

                {view === ViewState.DASHBOARD && (
                    <div className="grid grid-cols-3 gap-6 animate-fade-in">
                    
                    <div className="bg-[#0f0f2d] p-6 rounded-xl border border-white/10 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-bl-full group-hover:bg-purple-500/20 transition-colors"></div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Resume Strength</p>
                        <p className="text-3xl font-bold text-white">{strength}%</p>
                    </div>

                    <div className="bg-[#0f0f2d] p-6 rounded-xl border border-white/10 shadow-lg relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-bl-full group-hover:bg-green-500/20 transition-colors"></div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Status</p>
                        <p className="text-xl font-bold text-white capitalize">{resumeData.status.replace('_', ' ')}</p>
                    </div>

                    <div className="col-span-1 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 p-8 rounded-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold text-white mb-2">Resume Ready?</h3>
                            <p className="text-cyan-100 mb-6 max-w-md">Edit your resume and submit it to a mediator for review.</p>
                            <button 
                                onClick={() => setView(ViewState.RESUME_BUILDER)}
                                className="bg-cyan-500 text-black px-6 py-2 rounded-lg font-bold hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                            >
                                Edit Resume
                            </button>
                        </div>
                    </div>
                    </div>
                )}

                {view === ViewState.RESUME_BUILDER && (
                    <div className="bg-[#0f0f2d] rounded-xl border border-white/10 shadow-xl overflow-hidden min-h-[600px]">
                        <ResumeForm data={resumeData} onChange={handleResumeChange} />
                    </div>
                )}

                {view === ViewState.COVER_LETTER && (
                    <CoverLetterGenerator resume={resumeData} />
                )}

                {view === ViewState.ROADMAP && (
                    <CareerRoadmap resume={resumeData} />
                )}

                {view === ViewState.CAREER_INTEL && (
                    <CareerIntelligence resume={resumeData} />
                )}

                {/* Support / Complaints Footer for USER */}
                <div className="mt-8 border-t border-white/10 pt-6 pb-6">
                    <div className="bg-[#0f0f2d] p-6 rounded-xl border border-white/10 flex justify-between items-center shadow-lg">
                        <div>
                            <h3 className="text-white font-bold text-lg mb-1">Support & Complaints</h3>
                            <p className="text-slate-400 text-sm">Facing issues? Contact system administration directly.</p>
                        </div>
                        <div className="flex gap-4">
                             <a href="mailto:admin@system.com" className="flex items-center gap-2 bg-[#1a1a3a] hover:bg-[#252550] border border-white/10 px-4 py-2 rounded-lg text-white transition-colors">
                                <Icons.Mail /> <span className="text-sm">admin@system.com</span>
                             </a>
                             <a href="tel:+15550000000" className="flex items-center gap-2 bg-[#1a1a3a] hover:bg-[#252550] border border-white/10 px-4 py-2 rounded-lg text-white transition-colors">
                                <Icons.Phone /> <span className="text-sm">+1 (555) 000-0000</span>
                             </a>
                        </div>
                    </div>
                </div>
              </>
          )}

          {/* MEDIATOR VIEW */}
          {user?.role === 'MEDIATOR' && view === ViewState.MEDIATOR_PANEL && (
              <MediatorPanel />
          )}

          {/* ADMIN VIEW */}
          {user?.role === 'ADMIN' && view === ViewState.ADMIN_PANEL && (
              <AdminPanel />
          )}

        </div>
      </main>

      {/* Floating Chat Assistant (Only for Users) */}
      {user?.role === 'USER' && <ChatAssistant />}
    </div>
  );
}

export default App;
    