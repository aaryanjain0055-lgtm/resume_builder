
import React, { useState } from 'react';
import { ResumeData, CareerDNA, InterviewPrep } from '../types';
import { analyzeCareerDNA, generateInterviewPrep } from '../services/geminiService';
import { Icons } from '../constants';

interface Props {
  resume: ResumeData;
}

export const CareerIntelligence: React.FC<Props> = ({ resume }) => {
  const [activeTab, setActiveTab] = useState<'dna' | 'interview'>('dna');
  const [dnaResult, setDnaResult] = useState<CareerDNA | null>(null);
  const [interviewResult, setInterviewResult] = useState<InterviewPrep | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetRole, setTargetRole] = useState(resume.experience[0]?.role || '');

  const handleAnalyzeDNA = async () => {
    setLoading(true);
    try {
      const result = await analyzeCareerDNA(resume);
      setDnaResult(result);
    } catch (e) {
      alert("Failed to analyze Career DNA.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInterview = async () => {
    if (!targetRole) return alert("Please enter a target role.");
    setLoading(true);
    try {
      const result = await generateInterviewPrep(targetRole, resume);
      setInterviewResult(result);
    } catch (e) {
      alert("Failed to generate interview prep.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      {/* Sidebar Controls */}
      <div className="lg:col-span-1 bg-[#0f0f2d] p-6 rounded-xl border border-white/10 h-fit">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Icons.Sparkles /> Intelligence
        </h2>
        
        <div className="space-y-3">
          <button
            onClick={() => setActiveTab('dna')}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              activeTab === 'dna' 
                ? 'bg-purple-900/20 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                : 'bg-[#1a1a3a] border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <div className="font-bold mb-1">Career DNA</div>
            <div className="text-xs opacity-70">Psychometric analysis & trajectory</div>
          </button>

          <button
            onClick={() => setActiveTab('interview')}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              activeTab === 'interview' 
                ? 'bg-cyan-900/20 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                : 'bg-[#1a1a3a] border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <div className="font-bold mb-1">Interview Coach</div>
            <div className="text-xs opacity-70">Role-specific Q&A prep</div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* DNA View */}
        {activeTab === 'dna' && (
          <div className="bg-[#0f0f2d] p-8 rounded-xl border border-white/10 min-h-[500px] animate-fade-in">
            {!dnaResult ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-400">
                  <Icons.Sparkles />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Discover Your Career DNA</h3>
                <p className="text-slate-400 max-w-md mx-auto mb-8">
                  Our AI analyzes your experience, skills, and writing style to uncover your professional archetype, strengths, and ideal career path.
                </p>
                <button
                  onClick={handleAnalyzeDNA}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all transform hover:scale-105"
                >
                  {loading ? 'Analyzing...' : 'Analyze My DNA'}
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/30">
                  <div className="flex-1">
                    <h3 className="text-purple-400 text-sm font-bold uppercase tracking-wider mb-2">Executive Summary</h3>
                    <p className="text-lg text-white leading-relaxed">{dnaResult.summary}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-[#1a1a3a] rounded-xl border border-white/10">
                    <h4 className="text-cyan-400 font-bold mb-4 flex items-center gap-2"><Icons.Award /> Primary Strengths</h4>
                    <div className="flex flex-wrap gap-2">
                      {dnaResult.careerDNA.primaryStrengths.map((s, i) => (
                        <span key={i} className="px-3 py-1 bg-cyan-900/30 text-cyan-200 text-sm rounded-full border border-cyan-500/20">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-[#1a1a3a] rounded-xl border border-white/10">
                    <h4 className="text-green-400 font-bold mb-4 flex items-center gap-2"><Icons.Map /> Recommended Roles</h4>
                    <ul className="space-y-2">
                      {dnaResult.careerDNA.recommendedRoles.map((r, i) => (
                        <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                          <Icons.ArrowUp /> {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 bg-[#1a1a3a] rounded-xl border border-white/10">
                    <h4 className="text-amber-400 font-bold mb-4 flex items-center gap-2"><Icons.AlertCircle /> Risk Areas</h4>
                    <ul className="space-y-2">
                      {dnaResult.careerDNA.riskAreas.map((r, i) => (
                        <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                          <span className="text-amber-500 mt-1">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 bg-[#1a1a3a] rounded-xl border border-white/10 space-y-4">
                    <div>
                      <span className="text-slate-500 text-xs uppercase">Working Style</span>
                      <p className="text-white font-medium">{dnaResult.careerDNA.workingStyle}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs uppercase">Trajectory</span>
                      <p className="text-white font-medium">{dnaResult.careerDNA.careerTrajectory}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Interview View */}
        {activeTab === 'interview' && (
          <div className="bg-[#0f0f2d] p-8 rounded-xl border border-white/10 min-h-[500px] animate-fade-in">
            {!interviewResult ? (
              <div className="text-center py-20 max-w-md mx-auto">
                 <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-cyan-400">
                  <Icons.CheckCircle />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Interview Coach</h3>
                <p className="text-slate-400 mb-6">Generate a tailored interview guide based on your specific resume and the job you want.</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Enter Target Role (e.g. Senior Dev)"
                    className="flex-1 bg-[#1a1a3a] border border-white/10 rounded-lg px-4 text-white focus:border-cyan-500 outline-none"
                  />
                  <button
                    onClick={handleGenerateInterview}
                    disabled={loading}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    {loading ? 'Generating...' : 'Start Prep'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                   <h3 className="text-xl font-bold text-white">Prep Guide: <span className="text-cyan-400">{interviewResult.role}</span></h3>
                   <button onClick={() => setInterviewResult(null)} className="text-sm text-slate-500 hover:text-white">Reset</button>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#1a1a3a] p-6 rounded-xl border border-white/10">
                    <h4 className="text-cyan-400 font-bold mb-4">Technical Questions</h4>
                    <ul className="space-y-3">
                      {interviewResult.technicalQuestions.map((q, i) => (
                        <li key={i} className="text-slate-300 text-sm flex gap-3">
                          <span className="text-cyan-500/50 font-mono">0{i+1}</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#1a1a3a] p-6 rounded-xl border border-white/10">
                    <h4 className="text-purple-400 font-bold mb-4">Resume-Specific Probes</h4>
                    <ul className="space-y-3">
                      {interviewResult.resumeSpecificQuestions.map((q, i) => (
                        <li key={i} className="text-slate-300 text-sm flex gap-3">
                           <span className="text-purple-500/50 font-mono">0{i+1}</span>
                           {q}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#1a1a3a] p-6 rounded-xl border border-white/10">
                     <h4 className="text-amber-400 font-bold mb-4">Behavioral & Soft Skills</h4>
                     <ul className="space-y-3">
                      {interviewResult.behavioralQuestions.map((q, i) => (
                        <li key={i} className="text-slate-300 text-sm flex gap-3">
                           <span className="text-amber-500/50 font-mono">0{i+1}</span>
                           {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
