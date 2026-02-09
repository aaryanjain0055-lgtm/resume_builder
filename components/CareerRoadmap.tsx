import React, { useState } from 'react';
import { ResumeData, CareerRoadmap as ICareerRoadmap } from '../types';
import { generateCareerRoadmap } from '../services/geminiService';
import { Icons } from '../constants';

interface RoadmapProps {
  resume: ResumeData;
}

export const CareerRoadmap: React.FC<RoadmapProps> = ({ resume }) => {
  const [role, setRole] = useState('');
  const [roadmap, setRoadmap] = useState<ICareerRoadmap | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!role) return;
    setLoading(true);
    try {
      const data = await generateCareerRoadmap(resume, role);
      setRoadmap(data);
    } catch (e) {
      alert("Failed to generate roadmap.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!roadmap && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icons.Map />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Where do you want to go?</h2>
          <p className="text-slate-500 mb-8">Enter your dream job title, and our AI will build a personalized 3-month learning path based on your current skills.</p>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Senior Full Stack Engineer"
              className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !role}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Planning...' : 'Generate Roadmap'}
            </button>
          </div>
        </div>
      )}

      {roadmap && (
        <div className="animate-fade-in space-y-8 pb-20">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">Roadmap to {roadmap.targetRole}</h2>
                        <p className="text-slate-500">{roadmap.overview}</p>
                    </div>
                    <button onClick={() => setRoadmap(null)} className="text-sm text-slate-400 hover:text-blue-600 underline">Start Over</button>
                </div>
            </div>

            <div className="relative border-l-2 border-blue-200 ml-4 md:ml-8 space-y-12 pb-12">
                {roadmap.weeks.map((week, index) => (
                    <div key={index} className="relative pl-8 md:pl-12">
                        {/* Dot */}
                        <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-4 border-blue-500 rounded-full"></div>
                        
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 block">Week {week.week}</span>
                            <h3 className="text-lg font-bold text-slate-800 mb-4">{week.focus}</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                        <Icons.CheckCircle /> Action Items
                                    </h4>
                                    <ul className="space-y-2">
                                        {week.tasks.map((task, i) => (
                                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                                <span className="block w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 shrink-0"></span>
                                                {task}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                        <Icons.Download /> Resources
                                    </h4>
                                    <ul className="space-y-2">
                                        {week.resources.map((res, i) => (
                                            <li key={i} className="text-sm text-blue-600 hover:underline cursor-pointer flex items-start gap-2">
                                                 <span className="block w-1.5 h-1.5 bg-blue-300 rounded-full mt-1.5 shrink-0"></span>
                                                {res}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};