
import React, { useState } from 'react';
import { ResumeData } from '../types';
import { generateCoverLetter } from '../services/geminiService';
import { Icons } from '../constants';

interface Props {
  resume: ResumeData;
}

export const CoverLetterGenerator: React.FC<Props> = ({ resume }) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [motivation, setMotivation] = useState('');
  const [context, setContext] = useState('');
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!company || !role || !motivation) {
        alert("Please fill in the Company, Role, and Motivation fields.");
        return;
    }
    setLoading(true);
    try {
      const letter = await generateCoverLetter(resume, company, role, motivation, context);
      setGeneratedLetter(letter);
    } catch (error) {
      alert("Failed to generate cover letter. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter);
    alert("Copied to clipboard!");
  };

  return (
    <div className="grid grid-cols-2 gap-8 h-full animate-fade-in">
      {/* Input Section */}
      <div className="bg-[#0f0f2d] p-8 rounded-xl border border-white/10 flex flex-col h-fit">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Icons.Mail /> Cover Letter Writer
        </h2>
        <p className="text-slate-400 mb-8 text-sm">
            Generate a tailored cover letter that matches your resume's voice and the job's requirements.
        </p>

        <div className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Target Company <span className="text-red-400">*</span></label>
                <input 
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Google, Startup Inc."
                    className="w-full bg-[#1a1a3a] border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Target Role <span className="text-red-400">*</span></label>
                <input 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Product Manager"
                    className="w-full bg-[#1a1a3a] border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Why this role? (Motivation) <span className="text-red-400">*</span></label>
                <textarea 
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder="Briefly explain why you want this job. AI will expand on this."
                    rows={3}
                    className="w-full bg-[#1a1a3a] border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none resize-none"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Referral / Context (Optional)</label>
                <input 
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g. Referred by John Doe, Met at TechConf 2024"
                    className="w-full bg-[#1a1a3a] border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                />
            </div>

            <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-lg shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
                {loading ? (
                    'Writing...'
                ) : (
                    <>
                        <Icons.Wand /> Generate Letter
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Output Section */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Preview</h3>
            {generatedLetter && (
                <button onClick={copyToClipboard} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                    <Icons.FileText /> Copy Text
                </button>
            )}
        </div>
        
        <div className="flex-1 p-8 overflow-y-auto bg-white text-slate-800 font-serif leading-relaxed whitespace-pre-wrap">
            {generatedLetter ? (
                generatedLetter
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Icons.Mail />
                    </div>
                    <p>Enter details to generate your letter.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
