
import React, { useState } from 'react';
import { ResumeData, JobMatchResult } from '../types';
import { analyzeJobMatch } from '../services/geminiService';
import { Icons } from '../constants';
import { SkillChart } from './SkillChart';
import {
  RadialBarChart, RadialBar, ResponsiveContainer
} from 'recharts';

interface JobAnalyzerProps {
  resume: ResumeData;
  onAnalysisComplete: (result: JobMatchResult) => void;
}

export const JobAnalyzer: React.FC<JobAnalyzerProps> = ({ resume, onAnalysisComplete }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JobMatchResult | null>(null);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) return;
    setLoading(true);
    try {
      const data = await analyzeJobMatch(resume, jobDescription);
      setResult(data);
      onAnalysisComplete(data);
    } catch (error) {
      alert("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
      setJobDescription(`We are looking for a Senior Frontend Engineer to lead our React team.
      
Responsibilities:
- Build scalable web apps using React, TypeScript, and Node.js.
- Optimize performance and ensure cross-browser compatibility.
- Mentor junior developers.

Requirements:
- 5+ years of experience with JavaScript/ES6+.
- Deep knowledge of React.js and state management (Redux/Context).
- Experience with AWS and CI/CD pipelines.
- Strong communication skills.`);
  };

  const scoreData = result ? [{ name: 'Match', uv: result.matchScore, fill: result.matchScore > 75 ? '#22c55e' : '#f59e0b' }] : [];

  return (
    // Fixed grid-cols-2 instead of responsive
    <div className="grid grid-cols-2 gap-8 h-full">
      {/* Input Section */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Icons.Briefcase /> Job Description
              </h2>
              <button onClick={loadExample} className="text-sm text-blue-600 font-medium hover:underline">Load Example</button>
          </div>
          <p className="text-sm text-slate-500 mb-4">Paste the JD here to check your ATS compatibility.</p>
          <textarea
            className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm leading-relaxed resize-none text-black"
            placeholder="Paste Job Description here (e.g., 'We are looking for a Senior React Engineer...')"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !jobDescription}
            className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>Analyzing...</>
            ) : (
              <>
                <Icons.Sparkles /> Analyze Match
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        {result ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full animate-fade-in overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800">Match Report</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-full tracking-wide truncate max-w-[200px]">
                    {result.role}
                </span>
            </div>

            {/* Score & Chart Row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="h-40 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={15} data={scoreData} startAngle={180} endAngle={0}>
                            <RadialBar background dataKey="uv" cornerRadius={10} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                        <span className="text-3xl font-bold text-slate-800">{result.matchScore}%</span>
                        <span className="text-xs text-slate-400">ATS Score</span>
                    </div>
                </div>
                <div className="flex items-center justify-center">
                    {result.skillGapAnalysis && <SkillChart data={result.skillGapAnalysis} />}
                </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <h3 className="text-red-700 font-bold text-sm mb-2 flex items-center gap-2">
                    <Icons.AlertCircle /> Missing Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.missingSkills.map((skill, i) => (
                    <span key={i} className="text-xs bg-white text-red-600 px-2 py-1 rounded border border-red-200 font-medium">
                      {skill}
                    </span>
                  ))}
                  {result.missingSkills.length === 0 && <span className="text-xs text-slate-500">None detected! Good job.</span>}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-slate-700 font-bold text-sm mb-2">AI Analysis</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {result.analysis}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 min-h-[400px]">
            <div className="mb-4 opacity-50 p-4 bg-slate-100 rounded-full"><Icons.FileText /></div>
            <p className="font-medium">Enter a Job Description</p>
            <p className="text-sm opacity-70">See your match score and skill gaps.</p>
          </div>
        )}
      </div>
    </div>
  );
};
