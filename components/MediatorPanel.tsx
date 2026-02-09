
import React, { useState, useEffect } from 'react';
import { ResumeData, ResumeRankingResult } from '../types';
import { db } from '../services/db';
import { ResumePreview } from './ResumeForm';
import { rankCandidates } from '../services/geminiService';
import { Icons } from '../constants';

export const MediatorPanel: React.FC = () => {
    const [resumes, setResumes] = useState<ResumeData[]>([]);
    const [selectedResume, setSelectedResume] = useState<ResumeData | null>(null);
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Ranking State
    const [viewMode, setViewMode] = useState<'review' | 'ranking'>('review');
    const [rankingJobDesc, setRankingJobDesc] = useState('');
    const [rankingResult, setRankingResult] = useState<ResumeRankingResult | null>(null);

    useEffect(() => {
        loadPendingResumes();
    }, []);

    const loadPendingResumes = async () => {
        try {
            const list = await db.getResumesForMediator();
            setResumes(list);
        } catch (e) {
            console.error(e);
            alert("Error loading resumes. Are you logged in as Mediator?");
        }
    };

    const handleDecision = async (status: 'approved' | 'changes_requested') => {
        if (!selectedResume?.id) return;
        setIsLoading(true);
        try {
            await db.reviewResume(selectedResume.id, status, feedback);
            alert(`Resume ${status === 'approved' ? 'Approved' : 'Returned for Changes'}!`);
            setFeedback('');
            setSelectedResume(null);
            await loadPendingResumes();
        } catch (e) {
            alert("Error submitting review");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRankCandidates = async () => {
        if (!rankingJobDesc || resumes.length < 2) {
            alert("Please provide a Job Description and ensure there are at least 2 candidates to rank.");
            return;
        }
        setIsLoading(true);
        try {
            const result = await rankCandidates(rankingJobDesc, resumes);
            setRankingResult(result);
        } catch (e) {
            alert("Ranking failed.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- RANKING VIEW ---
    if (viewMode === 'ranking') {
        return (
            <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Icons.Briefcase /> Candidate Ranking AI
                    </h2>
                    <button onClick={() => setViewMode('review')} className="text-sm text-slate-400 hover:text-white">Back to Review List</button>
                </div>

                {!rankingResult ? (
                    <div className="bg-[#0f0f2d] p-8 rounded-xl border border-white/10 max-w-2xl mx-auto w-full">
                        <p className="text-slate-300 mb-4">Paste the Job Description to rank the {resumes.length} pending candidates.</p>
                        <textarea 
                            value={rankingJobDesc}
                            onChange={(e) => setRankingJobDesc(e.target.value)}
                            placeholder="Paste JD here..."
                            className="w-full h-40 bg-[#1a1a3a] border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none mb-4"
                        />
                        <button 
                            onClick={handleRankCandidates}
                            disabled={isLoading}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2"
                        >
                            {isLoading ? 'AI is Ranking...' : `Rank ${resumes.length} Candidates`}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 overflow-y-auto">
                        <div className="bg-[#1a1a3a] p-6 rounded-xl border border-white/10">
                            <h3 className="text-xl font-bold text-cyan-400 mb-2">Recruiter Insights</h3>
                            <p className="text-slate-300">{rankingResult.recruiterInsights}</p>
                        </div>
                        <div className="grid gap-4">
                            {rankingResult.rankedCandidates.map((cand) => {
                                const resume = resumes.find(r => (r.id === cand.candidateId || r.userId === cand.candidateId));
                                return (
                                    <div key={cand.candidateId} className="bg-[#0f0f2d] p-6 rounded-xl border border-white/10 flex gap-6 items-start">
                                        <div className="text-4xl font-black text-white/10">#{cand.rank}</div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-lg font-bold text-white">{resume?.fullName || 'Unknown Candidate'}</h4>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    cand.shortlistDecision === 'Strong Yes' ? 'bg-green-500/20 text-green-400' :
                                                    cand.shortlistDecision === 'Maybe' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>{cand.shortlistDecision}</span>
                                            </div>
                                            <p className="text-slate-300 text-sm mb-3">{cand.reason}</p>
                                            <div className="flex gap-4">
                                                <div className="flex-1 bg-green-900/10 p-3 rounded">
                                                    <span className="text-green-400 text-xs font-bold block mb-1">Strengths</span>
                                                    <p className="text-xs text-slate-400">{cand.topStrengths.join(', ')}</p>
                                                </div>
                                                {cand.redFlags.length > 0 && (
                                                    <div className="flex-1 bg-red-900/10 p-3 rounded">
                                                        <span className="text-red-400 text-xs font-bold block mb-1">Flags</span>
                                                        <p className="text-xs text-slate-400">{cand.redFlags.join(', ')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <button onClick={() => setRankingResult(null)} className="w-full py-4 text-slate-500 hover:text-white">Start New Ranking</button>
                    </div>
                )}
            </div>
        );
    }

    // --- REVIEW VIEW ---
    if (selectedResume) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Review Controls (Left Panel) */}
                <div className="lg:col-span-1 bg-[#0f0f2d] p-6 border-r border-white/10 flex flex-col h-full overflow-y-auto">
                    <button 
                        onClick={() => setSelectedResume(null)}
                        className="mb-6 text-sm text-slate-400 hover:text-white flex items-center gap-2"
                    >
                        ← Back to List
                    </button>
                    
                    <h2 className="text-xl font-bold text-white mb-1">Reviewing Resume</h2>
                    <p className="text-sm text-slate-500 mb-6">Candidate: {selectedResume.fullName}</p>
                    
                    <div className="bg-[#1a1a3a] p-4 rounded-lg border border-white/10 mb-6">
                        <h3 className="text-sm font-bold text-white mb-2">Instructions</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Check for ATS compatibility, clarity, and professionalism. 
                            Provide specific feedback if requesting changes.
                        </p>
                    </div>

                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Feedback & Comments</label>
                        <textarea 
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="w-full h-40 bg-[#05051e] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-cyan-500 outline-none resize-none"
                            placeholder="e.g. 'Strong experience section, but the summary is too vague. Add more metrics.'"
                        />
                    </div>

                    <div className="mt-6 space-y-3">
                        <button 
                            onClick={() => handleDecision('approved')}
                            disabled={isLoading}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <Icons.CheckCircle /> Approve Resume
                        </button>
                        <button 
                            onClick={() => handleDecision('changes_requested')}
                            disabled={isLoading || !feedback}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <Icons.AlertCircle /> Request Changes
                        </button>
                    </div>
                </div>

                {/* Resume Preview (Right Panel) */}
                <div className="lg:col-span-2 bg-slate-900 p-8 overflow-y-auto flex justify-center">
                    <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl origin-top transform scale-[0.85] lg:scale-100">
                         {/* Reusing the Preview Logic from Form */}
                        <ResumePreview data={selectedResume} />
                    </div>
                </div>
            </div>
        );
    }

    // List View
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Pending Reviews</h2>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setViewMode('ranking')} 
                        disabled={resumes.length < 2}
                        className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Icons.Sparkles /> AI Rank Candidates
                    </button>
                    <div className="flex gap-2 text-sm text-slate-400">
                        <span className="px-3 py-1 bg-cyan-900/30 text-cyan-400 rounded-full border border-cyan-500/20">{resumes.length} Pending</span>
                    </div>
                </div>
            </div>

            {resumes.length === 0 ? (
                <div className="text-center py-20 bg-[#0f0f2d] rounded-xl border border-white/5">
                    <div className="text-slate-600 mb-4 scale-150"><Icons.CheckCircle /></div>
                    <p className="text-slate-400 text-lg">All caught up! No resumes to review.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resumes.map((resume) => (
                        <div 
                            key={resume.id || resume.userId}
                            onClick={() => setSelectedResume(resume)}
                            className="bg-[#0f0f2d] p-6 rounded-xl border border-white/10 hover:border-cyan-500/50 cursor-pointer transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-bl-full group-hover:from-cyan-500/30"></div>
                            
                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{resume.fullName}</h3>
                            <p className="text-sm text-slate-500 mb-4">{resume.experience[0]?.role || 'No role defined'}</p>
                            
                            <div className="flex justify-between items-center text-xs text-slate-400">
                                <span>{resume.experience.length} Positions</span>
                                <span>{new Date(resume.updatedAt || Date.now()).toLocaleDateString()}</span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded">Needs Review</span>
                                <span className="text-cyan-400 text-sm font-medium group-hover:underline">Review Now →</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
