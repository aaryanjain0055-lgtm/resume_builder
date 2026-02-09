

import React, { useState, useEffect } from 'react';
import { ResumeData, ResumeRankingResult, JobMatchResult } from '../types';
import { db } from '../services/db';
import { ResumePreview } from './ResumeForm';
import { rankCandidates, analyzeJobMatch } from '../services/geminiService';
import { Icons } from '../constants';

export const MediatorPanel: React.FC = () => {
    const [resumes, setResumes] = useState<ResumeData[]>([]);
    const [selectedResume, setSelectedResume] = useState<ResumeData | null>(null);
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // View Mode
    const [viewMode, setViewMode] = useState<'review' | 'matching'>('review');
    
    // Match/Search State
    const [matchJobDesc, setMatchJobDesc] = useState('');
    const [matchResults, setMatchResults] = useState<{resume: ResumeData, result: JobMatchResult}[]>([]);
    const [isMatching, setIsMatching] = useState(false);

    useEffect(() => {
        loadPendingResumes();
    }, []);

    const loadPendingResumes = async () => {
        try {
            const list = await db.getResumesForMediator();
            setResumes(list);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDecision = async (status: 'forwarded_to_admin' | 'changes_requested') => {
        if (!selectedResume?.id) return;
        setIsLoading(true);
        try {
            await db.reviewResume(selectedResume.id, status, feedback);
            alert(`Resume ${status === 'forwarded_to_admin' ? 'Forwarded to Admin' : 'Returned for Changes'}!`);
            setFeedback('');
            setSelectedResume(null);
            await loadPendingResumes();
        } catch (e) {
            alert("Error submitting review");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFindMatches = async () => {
        if (!matchJobDesc || resumes.length === 0) {
            alert("Please provide a Job Description and ensure there are pending candidates.");
            return;
        }
        setIsMatching(true);
        setMatchResults([]);
        try {
            // Process candidates in parallel (careful with rate limits in prod, but ok for demo)
            const results = await Promise.all(resumes.map(async (resume) => {
                const result = await analyzeJobMatch(resume, matchJobDesc);
                return { resume, result };
            }));
            
            // Sort by score descending
            results.sort((a, b) => b.result.matchScore - a.result.matchScore);
            setMatchResults(results);
        } catch (e) {
            alert("Matching failed. Please try again.");
            console.error(e);
        } finally {
            setIsMatching(false);
        }
    };

    // --- MATCHING VIEW ---
    if (viewMode === 'matching') {
        return (
            <div className="h-full flex flex-col animate-fade-in">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Icons.Sparkles /> Candidate Matcher
                    </h2>
                    <button onClick={() => setViewMode('review')} className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors">Back to Review Queue</button>
                </div>

                <div className="grid grid-cols-3 gap-6 h-full">
                    {/* INPUT PANEL */}
                    <div className="col-span-1 bg-[#0f0f2d] p-6 rounded-xl border border-white/10 flex flex-col h-fit">
                         <h3 className="font-bold text-white mb-4">Target Role</h3>
                         <textarea 
                            value={matchJobDesc}
                            onChange={(e) => setMatchJobDesc(e.target.value)}
                            placeholder="Paste the Job Description here (Responsibilities, Skills, etc.)..."
                            className="w-full h-64 bg-[#1a1a3a] border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none mb-4 resize-none"
                        />
                        <button 
                            onClick={handleFindMatches}
                            disabled={isMatching}
                            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-all"
                        >
                            {isMatching ? 'Analyzing Candidates...' : `Find Matches in Queue (${resumes.length})`}
                        </button>
                    </div>

                    {/* RESULTS PANEL */}
                    <div className="col-span-2 overflow-y-auto">
                        {matchResults.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-[#0f0f2d] min-h-[400px]">
                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <Icons.Briefcase />
                                </div>
                                <p className="text-lg font-medium">Ready to Match</p>
                                <p className="text-sm">Paste a JD to find the best candidates from the pending queue.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-white font-bold">Matching Candidates ({matchResults.length})</h3>
                                {matchResults.map(({ resume, result }) => (
                                    <div key={resume.id} className="bg-[#0f0f2d] border border-white/10 rounded-xl p-6 flex gap-6 items-center hover:border-cyan-500/50 transition-colors">
                                        {/* Score Bubble */}
                                        <div className="relative w-20 h-20 shrink-0">
                                             <svg className="w-full h-full" viewBox="0 0 36 36">
                                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3" />
                                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={result.matchScore > 75 ? '#22c55e' : result.matchScore > 50 ? '#f59e0b' : '#ef4444'} strokeWidth="3" strokeDasharray={`${result.matchScore}, 100`} />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-lg">
                                                {result.matchScore}%
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-white mb-1">{resume.fullName}</h4>
                                            <p className="text-sm text-slate-400 mb-2">{resume.experience[0]?.role || 'No Current Role'}</p>
                                            
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {result.missingSkills.length === 0 && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Perfect Match</span>}
                                                {result.missingSkills.slice(0, 3).map((skill, i) => (
                                                    <span key={i} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded">Missing: {skill}</span>
                                                ))}
                                                {result.missingSkills.length > 3 && <span className="text-xs text-slate-500 px-1 py-1">+{result.missingSkills.length - 3} more</span>}
                                            </div>
                                            
                                            <p className="text-xs text-slate-500 line-clamp-2">{result.analysis}</p>
                                        </div>

                                        <button 
                                            onClick={() => { setSelectedResume(resume); setViewMode('review'); }}
                                            className="px-4 py-2 bg-[#1a1a3a] border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500 hover:text-white transition-colors text-sm font-bold"
                                        >
                                            Review
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- REVIEW VIEW (Single Resume) ---
    if (selectedResume) {
        return (
            // Fixed grid-cols-3
            <div className="grid grid-cols-3 gap-6 h-full animate-fade-in">
                {/* Review Controls (Left Panel) */}
                <div className="col-span-1 bg-[#0f0f2d] p-6 border border-white/10 rounded-xl flex flex-col h-full overflow-y-auto">
                    <button 
                        onClick={() => setSelectedResume(null)}
                        className="mb-6 text-sm text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
                    >
                        ← Back to List
                    </button>
                    
                    <h2 className="text-xl font-bold text-white mb-1">Reviewing Resume</h2>
                    <p className="text-sm text-slate-500 mb-6">Candidate: <span className="text-cyan-400">{selectedResume.fullName}</span></p>
                    
                    <div className="bg-[#1a1a3a] p-4 rounded-lg border border-white/10 mb-6">
                        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Icons.Sparkles /> AI Instructions</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Check for ATS compatibility, clarity, and professionalism. 
                            Provide specific feedback below if requesting changes.
                        </p>
                    </div>

                    <div className="flex-1 flex flex-col">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Feedback & Comments</label>
                        <textarea 
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="w-full flex-1 bg-[#1a1a3a] border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none resize-none mb-6 min-h-[150px]"
                            placeholder="Enter detailed feedback for the candidate..."
                        />
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => handleDecision('changes_requested')}
                                disabled={isLoading || !feedback}
                                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Request Changes
                            </button>
                            <button 
                                onClick={() => handleDecision('forwarded_to_admin')}
                                disabled={isLoading}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Approve & Forward to Admin
                            </button>
                        </div>
                    </div>
                </div>

                {/* Resume Preview (Right Panel) */}
                <div className="col-span-2 bg-white rounded-xl shadow-xl overflow-hidden overflow-y-auto h-[calc(100vh-140px)]">
                     <ResumePreview data={selectedResume} />
                </div>
            </div>
        );
    }

    // --- LIST VIEW (Default) ---
    return (
        <div className="h-full flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Mediator Queue</h2>
                    <p className="text-slate-400 text-sm">Review pending resumes before they reach the Admin.</p>
                </div>
                <div className="flex gap-4">
                    <button 
                         onClick={loadPendingResumes} 
                         className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg" 
                         title="Refresh"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                    </button>
                    <button 
                        onClick={() => setViewMode('matching')}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-purple-500/20"
                    >
                        <Icons.Sparkles /> Match Candidates
                    </button>
                </div>
            </div>

            {resumes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-[#0f0f2d]">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Icons.CheckCircle />
                    </div>
                    <p className="text-lg font-medium">All caught up!</p>
                    <p className="text-sm">No pending resumes to review.</p>
                </div>
            ) : (
                // Fixed grid-cols-3
                <div className="grid grid-cols-3 gap-6">
                    {resumes.map(resume => (
                        <div key={resume.id} className="bg-[#0f0f2d] border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 transition-all hover:-translate-y-1 shadow-lg group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                    {resume.fullName.charAt(0)}
                                </div>
                                <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-1 rounded border border-amber-500/30">Pending</span>
                            </div>
                            
                            <h3 className="text-lg font-bold text-white mb-1">{resume.fullName}</h3>
                            <p className="text-sm text-slate-400 mb-4">{resume.experience[0]?.role || 'No Role Title'}</p>
                            
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Icons.FileText /> <span>{resume.templateId} Template</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Icons.Briefcase /> <span>{resume.experience.length} Experience Items</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setSelectedResume(resume)}
                                className="w-full bg-[#1a1a3a] hover:bg-cyan-900/40 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500 font-bold py-3 rounded-lg transition-all"
                            >
                                Review Resume
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Support / Complaints Footer for MEDIATOR */}
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
        </div>
    );
};
    