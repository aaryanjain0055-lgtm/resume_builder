
import React, { useState, useEffect } from 'react';
import { ViewState, ResumeData, JobMatchResult, User, UserRole } from './types';
import { SAMPLE_RESUME, Icons } from './constants';
import { ResumeForm } from './components/ResumeForm';
import { JobAnalyzer } from './components/JobAnalyzer';
import { CareerRoadmap } from './components/CareerRoadmap';
import { ChatAssistant } from './components/ChatAssistant';
import { MediatorPanel } from './components/MediatorPanel';
import { AdminPanel } from './components/AdminPanel';
import { CareerIntelligence } from './components/CareerIntelligence';
import { db } from './services/db';

type AuthMode = 'login' | 'register' | 'verify';

function App() {
  const [view, setView] = useState<ViewState>(ViewState.AUTH);
  const [user, setUser] = useState<User | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData>(SAMPLE_RESUME);
  const [matchHistory, setMatchHistory] = useState<JobMatchResult[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Auth State
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);

  // Load Session
  useEffect(() => {
    const init = async () => {
      const savedUser = await db.getUser();
      if (savedUser) {
        if (savedUser.isVerified) {
            handleRoleLoginSuccess(savedUser);
        } else {
            // If session exists but not verified, clear it or show verify screen
            // For simplicity, let's clear it and force re-login/verify
             await db.logout();
        }
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
          setView(ViewState.DASHBOARD);
          const savedResume = await db.getResume();
          setResumeData(savedResume);
      }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setIsLoading(true);
    try {
        let demoUser: User;

        if (role === 'ADMIN') {
            demoUser = { id: 'admin-1', name: 'System Admin', email: 'admin@system.com', role: 'ADMIN', plan: 'pro', isVerified: true };
        } else if (role === 'MEDIATOR') {
            demoUser = { id: 'mediator-1', name: 'Sarah Reviewer', email: 'sarah@mediator.com', role: 'MEDIATOR', plan: 'pro', isVerified: true };
        } else {
            demoUser = { id: 'demo-123', name: 'Alex Candidate', email: 'alex@example.com', role: 'USER', plan: 'free', isVerified: true };
        }

        await db.saveUser(demoUser);
        handleRoleLoginSuccess(demoUser);
    } catch (err) {
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!regName || !regEmail) return;
      setIsLoading(true);
      
      try {
          const newUser: User = {
              id: `user-${Date.now()}`,
              name: regName,
              email: regEmail,
              role: 'USER',
              plan: 'free',
              isVerified: false // Needs verification
          };
          
          await db.saveUser(newUser);
          setTempUserId(newUser.id);
          setAuthMode('verify');
      } catch (e) {
          alert("Registration failed");
      } finally {
          setIsLoading(false);
      }
  };

  const handleVerifyEmail = async () => {
      if (!tempUserId) return;
      setIsLoading(true);
      try {
          // Simulate clicking email link
          const verifiedUser = await db.verifyUser(tempUserId);
          if (verifiedUser) {
              alert("Email verified successfully! You are now logged in.");
              handleRoleLoginSuccess(verifiedUser);
          }
      } catch (e) {
          alert("Verification failed");
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
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setAuthMode('login');
    setView(ViewState.AUTH);
    setIsMobileMenuOpen(false);
  };

  const handleResumeChange = async (newData: ResumeData) => {
    setResumeData(newData);
    await db.saveResume(newData); // User saves their own resume
  };

  const handleAnalysisComplete = (result: JobMatchResult) => {
    setMatchHistory(prev => [result, ...prev]);
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
    <nav className="fixed top-0 w-full z-40 bg-[#05051e]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                
                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    {/* USER MENU */}
                    {user?.role === 'USER' && [
                        { id: ViewState.DASHBOARD, label: 'Dashboard' },
                        { id: ViewState.RESUME_BUILDER, label: 'Resume' },
                        { id: ViewState.JOB_MATCH, label: 'Match' },
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

                <div className="hidden md:flex items-center gap-4">
                    <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-white">{user?.name}</p>
                            <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
                        </div>
                        <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors">
                            <Icons.LogOut />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex md:hidden">
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="text-gray-400 hover:text-white p-2"
                    >
                        {isMobileMenuOpen ? <Icons.X /> : <Icons.Menu />}
                    </button>
                </div>
            </div>
        </div>
    </nav>
  );

  // AUTH VIEW (Neon Theme)
  if (view === ViewState.AUTH) {
    return (
      <div className="min-h-screen bg-[#05051e] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
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
             {authMode === 'login' && 'Role-Based Access Demo System'}
             {authMode === 'register' && 'Create Your Candidate Profile'}
             {authMode === 'verify' && 'Verify Your Email'}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="bg-[#0f0f2d]/80 backdrop-blur-xl py-8 px-4 shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:rounded-xl sm:px-10 border border-white/10">
            
            {/* LOGIN MODE */}
            {authMode === 'login' && (
                <>
                    <p className="text-center text-white font-bold mb-4">Select Role to Login</p>
                    <div className="space-y-4">
                        <button 
                            onClick={() => handleDemoLogin('USER')} 
                            disabled={isLoading}
                            className="w-full flex items-center justify-between py-4 px-4 border border-cyan-500/30 rounded-lg text-sm font-medium text-white bg-cyan-900/20 hover:bg-cyan-900/40 transition-all hover:scale-[1.02] group"
                        >
                            <span className="flex flex-col text-left">
                                <span className="font-bold text-cyan-400">Candidate (User)</span>
                                <span className="text-xs text-slate-400">Build resume, analyze jobs</span>
                            </span>
                            <Icons.ChevronRight />
                        </button>

                        <button 
                            onClick={() => handleDemoLogin('MEDIATOR')} 
                            disabled={isLoading}
                            className="w-full flex items-center justify-between py-4 px-4 border border-purple-500/30 rounded-lg text-sm font-medium text-white bg-purple-900/20 hover:bg-purple-900/40 transition-all hover:scale-[1.02] group"
                        >
                            <span className="flex flex-col text-left">
                                <span className="font-bold text-purple-400">Mediator</span>
                                <span className="text-xs text-slate-400">Review resumes, give feedback</span>
                            </span>
                            <Icons.ChevronRight />
                        </button>

                        <button 
                            onClick={() => handleDemoLogin('ADMIN')} 
                            disabled={isLoading}
                            className="w-full flex items-center justify-between py-4 px-4 border border-red-500/30 rounded-lg text-sm font-medium text-white bg-red-900/20 hover:bg-red-900/40 transition-all hover:scale-[1.02] group"
                        >
                            <span className="flex flex-col text-left">
                                <span className="font-bold text-red-400">System Admin</span>
                                <span className="text-xs text-slate-400">Manage users & metrics</span>
                            </span>
                            <Icons.ChevronRight />
                        </button>
                    </div>

                    <div className="mt-6 border-t border-white/10 pt-6">
                        <button 
                            onClick={() => setAuthMode('register')}
                            className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            New Candidate? <span className="text-cyan-400 underline">Create Account</span>
                        </button>
                    </div>
                </>
            )}

            {/* REGISTER MODE */}
            {authMode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                        <input 
                            type="text" required 
                            value={regName} onChange={(e) => setRegName(e.target.value)}
                            className="w-full bg-[#1a1a3a] border border-white/10 rounded p-2 text-white focus:border-cyan-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                        <input 
                            type="email" required 
                            value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full bg-[#1a1a3a] border border-white/10 rounded p-2 text-white focus:border-cyan-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                        <input 
                            type="password" required 
                            value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full bg-[#1a1a3a] border border-white/10 rounded p-2 text-white focus:border-cyan-500 outline-none"
                        />
                    </div>
                    
                    <button 
                        type="submit" disabled={isLoading}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-colors mt-2"
                    >
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>

                    <button 
                        type="button"
                        onClick={() => setAuthMode('login')}
                        className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Back to Login
                    </button>
                </form>
            )}

            {/* VERIFY MODE */}
            {authMode === 'verify' && (
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icons.Sparkles />
                    </div>
                    <h3 className="text-lg font-bold text-white">Check Your Email</h3>
                    <p className="text-sm text-slate-400">
                        We sent a verification link to <span className="text-white">{regEmail}</span>.
                    </p>
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
                        <strong>Demo Note:</strong> Since this is a simulation, click the button below to verify your email instantly.
                    </div>
                    
                    <button 
                        onClick={handleVerifyEmail}
                        disabled={isLoading}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-colors"
                    >
                        {isLoading ? 'Verifying...' : '⚡ Simulate Email Click'}
                    </button>

                    <button 
                         onClick={() => setAuthMode('login')}
                         className="text-xs text-slate-500 hover:text-white"
                    >
                        Cancel
                    </button>
                </div>
            )}
            
            {/* Demo Utilities */}
            {authMode === 'login' && (
                <div className="mt-8 pt-4 border-t border-white/5 text-center">
                    <button 
                        onClick={handleSeedResume}
                        className="text-[10px] text-slate-600 hover:text-cyan-400 transition-colors uppercase tracking-widest"
                    >
                        ⚡ Developer: Seed Pending Resume
                    </button>
                </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // MAIN APP VIEW
  return (
    <div className="flex flex-col h-screen bg-[#05051e] text-slate-200 font-sans selection:bg-cyan-500/30">
      <Navbar />

      <main className="flex-1 overflow-auto pt-20 px-4 pb-4">
        <div className="max-w-7xl mx-auto h-full">
          
          {/* USER VIEWS */}
          {user?.role === 'USER' && (
              <>
                <div className="mb-8 flex flex-col md:flex-row justify-between items-end border-b border-white/5 pb-6">
                    <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        {view === ViewState.DASHBOARD && <><span className="text-cyan-400">Dashboard</span></>}
                        {view === ViewState.RESUME_BUILDER && <><span className="text-purple-400">Resume Builder</span></>}
                        {view === ViewState.JOB_MATCH && <><span className="text-green-400">Job Match</span></>}
                        {view === ViewState.ROADMAP && <><span className="text-amber-400">Career Roadmap</span></>}
                        {view === ViewState.CAREER_INTEL && <><span className="text-pink-400">Career Intelligence</span></>}
                    </h1>
                    </div>
                </div>

                {view === ViewState.DASHBOARD && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                    {/* Status Card - Shows Review Status */}
                    <div className="bg-[#0f0f2d] p-6 rounded-xl border border-white/10 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-bl-full group-hover:bg-cyan-500/20 transition-colors"></div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Resume Status</p>
                        <div className="flex items-center gap-2 mt-2">
                             {resumeData.status === 'draft' && <span className="text-slate-400 text-lg font-bold">Draft</span>}
                             {resumeData.status === 'pending_review' && <span className="text-amber-400 text-lg font-bold flex items-center gap-2"><Icons.AlertCircle /> In Review</span>}
                             {resumeData.status === 'approved' && <span className="text-green-400 text-lg font-bold flex items-center gap-2"><Icons.CheckCircle /> Approved</span>}
                             {resumeData.status === 'changes_requested' && <span className="text-red-400 text-lg font-bold flex items-center gap-2">Action Required</span>}
                        </div>
                        {resumeData.feedback && (
                            <p className="text-xs text-slate-500 mt-2 bg-white/5 p-2 rounded">New Feedback Available</p>
                        )}
                    </div>
                    
                    <div className="bg-[#0f0f2d] p-6 rounded-xl border border-white/10 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-bl-full group-hover:bg-purple-500/20 transition-colors"></div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Resume Strength</p>
                        <p className="text-3xl font-bold text-white">{strength}%</p>
                    </div>

                    <div className="bg-[#0f0f2d] p-6 rounded-xl border border-white/10 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-bl-full group-hover:bg-amber-500/20 transition-colors"></div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Matches Run</p>
                        <p className="text-3xl font-bold text-white">{matchHistory.length}</p>
                    </div>

                    <div className="md:col-span-2 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 p-8 rounded-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold text-white mb-2">Targeting a new role?</h3>
                            <p className="text-cyan-100 mb-6 max-w-md">Use our upgraded Gemini 2.5 Flash model to analyze job descriptions against your resume instantly.</p>
                            <button 
                                onClick={() => setView(ViewState.JOB_MATCH)}
                                className="bg-cyan-500 text-black px-6 py-2 rounded-lg font-bold hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                            >
                                Analyze Now
                            </button>
                        </div>
                    </div>

                    <div onClick={() => setView(ViewState.CAREER_INTEL)} className="md:col-span-1 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 p-6 rounded-2xl relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform">
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Icons.Sparkles /> Career DNA</h3>
                                <p className="text-purple-200 text-sm">Discover your professional archetype and prepare for interviews with AI.</p>
                            </div>
                            <div className="mt-4 text-right">
                                <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded text-white">Try Intelligence</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="md:col-span-1 bg-[#0f0f2d] p-6 rounded-xl border border-white/10">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Icons.FileText /> Recent Matches</h3>
                        <div className="space-y-4">
                            {matchHistory.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-8 italic">No matches yet. Start analyzing!</p>
                            ) : (
                                matchHistory.slice(0, 3).map((match, i) => (
                                    <div key={i} className="flex items-center justify-between pb-3 border-b border-white/5 last:border-0">
                                        <div>
                                            <p className="text-sm font-medium text-slate-200 truncate max-w-[120px]">{match.role}</p>
                                            <p className="text-xs text-slate-500">Just now</p>
                                        </div>
                                        <span className={`text-sm font-bold ${match.matchScore > 75 ? 'text-green-400' : 'text-amber-400'}`}>
                                            {match.matchScore}%
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    </div>
                )}

                {view === ViewState.RESUME_BUILDER && (
                    <div className="bg-[#0f0f2d] rounded-xl border border-white/10 shadow-xl overflow-hidden min-h-[600px]">
                        <ResumeForm data={resumeData} onChange={handleResumeChange} />
                    </div>
                )}

                {view === ViewState.JOB_MATCH && (
                    <JobAnalyzer resume={resumeData} onAnalysisComplete={handleAnalysisComplete} />
                )}

                {view === ViewState.ROADMAP && (
                    <CareerRoadmap resume={resumeData} />
                )}

                {view === ViewState.CAREER_INTEL && (
                    <CareerIntelligence resume={resumeData} />
                )}
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
