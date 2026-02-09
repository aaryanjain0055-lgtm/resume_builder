
import React, { useState, useEffect, useRef } from 'react';
import { ResumeData, ResumeAuditResult, TemplateId, ResumeVersion } from '../types';
import { Icons } from '../constants';
import { generateTailoredResume, auditResume, generateExperienceContent, getSkillResources } from '../services/geminiService';
import { db } from '../services/db';

interface ResumeFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  readOnly?: boolean; // New Prop for Mediator View
}

type Tab = 'personal' | 'experience' | 'education' | 'skills' | 'projects' | 'history';
type Step = 'template' | 'edit' | 'preview';

// Internal Component: Rich Text Toolbar
const RichTextEditor = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder: string }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertBullet = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        
        // Insert bullet at current position or start of line
        const before = text.substring(0, start);
        const after = text.substring(end);
        
        // Simple insertion
        const newValue = before + "• " + after;
        onChange(newValue);
        
        // Restore focus and cursor
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + 2, start + 2);
        }, 0);
    };

    return (
        <div className="border border-white/10 rounded bg-[#1a1a3a] focus-within:border-cyan-500 transition-colors">
            <div className="flex items-center gap-2 p-1 border-b border-white/5 bg-[#1f1f45] rounded-t">
                <button 
                    type="button"
                    onClick={insertBullet}
                    className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white"
                    title="Add Bullet Point"
                >
                    <Icons.List />
                </button>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider ml-1">Description Editor</span>
            </div>
            <textarea
                ref={textareaRef}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className="w-full text-sm text-slate-300 bg-transparent p-2 focus:outline-none"
            />
        </div>
    );
};

// Internal Component: Mini Resume Preview for Template Selection
const MiniResumePreview = ({ type }: { type: 'neon' | 'professional' | 'minimalist' }) => {
    if (type === 'neon') {
        return (
            <div className="w-full h-full bg-[#0a0a1a] p-4 flex flex-col gap-2 overflow-hidden select-none pointer-events-none">
                <div className="w-1/2 h-4 bg-cyan-500/80 rounded animate-pulse"></div>
                <div className="w-1/3 h-2 bg-slate-600 rounded"></div>
                <div className="flex gap-3 mt-2 h-full">
                    <div className="w-2/3 flex flex-col gap-2">
                         <div className="w-full h-2 bg-slate-800 rounded"></div>
                         <div className="w-full h-2 bg-slate-800 rounded"></div>
                         <div className="w-3/4 h-2 bg-slate-800 rounded"></div>
                         
                         <div className="w-1/3 h-3 bg-cyan-900/50 rounded mt-2"></div>
                         <div className="w-full h-2 bg-slate-800 rounded"></div>
                         <div className="w-full h-2 bg-slate-800 rounded"></div>
                    </div>
                    <div className="w-1/3 flex flex-col gap-2 border-l border-white/10 pl-2">
                        <div className="w-full h-2 bg-cyan-900/30 rounded"></div>
                        <div className="w-full h-2 bg-cyan-900/30 rounded"></div>
                        <div className="w-full h-2 bg-cyan-900/30 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }
    if (type === 'professional') {
        return (
             <div className="w-full h-full bg-white p-4 flex flex-col gap-2 overflow-hidden select-none pointer-events-none border-t-4 border-slate-800">
                <div className="flex justify-between items-end border-b border-slate-200 pb-2">
                    <div className="w-1/2 h-4 bg-slate-800 rounded"></div>
                </div>
                <div className="flex gap-3 mt-1 h-full">
                     <div className="w-2/3 flex flex-col gap-2">
                         <div className="w-1/4 h-2 bg-slate-400 rounded mt-1"></div>
                         <div className="w-full h-1.5 bg-slate-200 rounded"></div>
                         <div className="w-full h-1.5 bg-slate-200 rounded"></div>
                         
                         <div className="w-1/4 h-2 bg-slate-400 rounded mt-2"></div>
                         <div className="w-full h-1.5 bg-slate-200 rounded"></div>
                         <div className="w-full h-1.5 bg-slate-200 rounded"></div>
                     </div>
                     <div className="w-1/3 flex flex-col gap-2">
                        <div className="w-full h-1.5 bg-slate-100 rounded"></div>
                        <div className="w-full h-1.5 bg-slate-100 rounded"></div>
                        <div className="w-full h-1.5 bg-slate-100 rounded"></div>
                     </div>
                </div>
            </div>
        );
    }
    // Minimalist
    return (
        <div className="w-full h-full bg-slate-50 p-4 flex flex-col gap-2 overflow-hidden select-none pointer-events-none">
             <div className="w-full flex flex-col items-center mb-2">
                 <div className="w-1/2 h-4 bg-black rounded-sm mb-1"></div>
                 <div className="w-1/3 h-1.5 bg-gray-400 rounded-sm"></div>
             </div>
             <div className="w-full h-px bg-black mb-1"></div>
             <div className="grid grid-cols-2 gap-4 h-full">
                 <div className="flex flex-col gap-2">
                     <div className="w-1/3 h-2 bg-black rounded-sm"></div>
                     <div className="w-full h-1.5 bg-gray-300 rounded-sm"></div>
                     <div className="w-full h-1.5 bg-gray-300 rounded-sm"></div>
                     <div className="w-3/4 h-1.5 bg-gray-300 rounded-sm"></div>
                 </div>
                 <div className="flex flex-col gap-2">
                     <div className="w-1/3 h-2 bg-black rounded-sm"></div>
                     <div className="w-full h-1.5 bg-gray-300 rounded-sm"></div>
                     <div className="w-full h-1.5 bg-gray-300 rounded-sm"></div>
                 </div>
             </div>
        </div>
    );
}

export const ResumeForm: React.FC<ResumeFormProps> = ({ data, onChange, readOnly = false }) => {
  const [step, setStep] = useState<Step>('template');
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [auditResult, setAuditResult] = useState<ResumeAuditResult | null>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ index: number, type: string } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'submitting'>('idle');
  
  // Skill Audit Advice State
  const [activeSkillAdvice, setActiveSkillAdvice] = useState<{ skill: string, advice: string } | null>(null);
  const [loadingSkill, setLoadingSkill] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
    if(readOnly) setStep('preview');
  }, [readOnly]);

  const loadVersions = async () => {
    const v = await db.getResumeVersions();
    setVersions(v);
  };

  const calculateCompleteness = () => {
      let filled = 0;
      let total = 6;
      if (data.fullName) filled++;
      if (data.email) filled++;
      if (data.summary) filled++;
      if (data.experience.length > 0) filled++;
      if (data.education.length > 0) filled++;
      if (data.skills.length > 0) filled++;
      return Math.round((filled / total) * 100);
  };
  
  const getCompletedSectionsCount = () => {
      let filled = 0;
      if (isSectionComplete('personal')) filled++;
      if (isSectionComplete('experience')) filled++;
      if (isSectionComplete('education')) filled++;
      if (isSectionComplete('skills')) filled++;
      if (isSectionComplete('projects')) filled++;
      return filled;
  };

  const isSectionComplete = (tab: Tab): boolean => {
      switch (tab) {
          case 'personal': return !!(data.fullName && data.email && data.phone);
          case 'experience': return data.experience.length > 0;
          case 'education': return data.education.length > 0;
          case 'skills': return data.skills.length > 0;
          case 'projects': return data.projects.length > 0;
          default: return false;
      }
  };
  
  const getSectionCount = (tab: Tab): number => {
      switch (tab) {
          case 'experience': return data.experience.length;
          case 'education': return data.education.length;
          case 'skills': return data.skills.length;
          case 'projects': return data.projects.length;
          default: return 0;
      }
  };

  const handleManualSave = async () => {
      setSaveStatus('saving');
      try {
          await db.saveResume(data);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
          alert("Error saving draft.");
          setSaveStatus('idle');
      }
  };

  const handleSubmitForReview = async () => {
      // 1. Validation Logic
      if (!data.fullName || !data.email) {
          alert("Submission Error: Full Name and Email are required. Please check 'Personal Info'.");
          setActiveTab('personal');
          return;
      }
      if (data.experience.length === 0) {
           alert("Submission Error: Please add at least one work experience.");
           setActiveTab('experience');
           return;
      }

      // 2. Completeness Check
      const completeness = calculateCompleteness();
      if (completeness < 50) {
          if (!confirm(`Your resume is only ${completeness}% complete. Are you sure you want to submit? It is recommended to add more sections.`)) return;
      } else {
          if(!confirm("Submit this resume to a Human Mediator for review? You will be unable to edit until the review is complete.")) return;
      }
      
      setSaveStatus('submitting');
      try {
          const updatedResume: ResumeData = { 
              ...data, 
              status: 'pending_review',
              updatedAt: Date.now() 
          };
          
          // 3. Robust Save
          await db.saveResume(updatedResume); // Persist first
          onChange(updatedResume); // Then update UI state
          
          alert("Success! Your resume has been submitted for review. You can track status on the Dashboard.");
      } catch(e) {
          console.error(e);
          alert("Submission failed. Please try again or check your connection.");
      } finally {
          setSaveStatus('idle');
      }
  };

  const handleTemplateSelect = (id: TemplateId) => {
    onChange({ ...data, templateId: id });
    setStep('edit');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAudit = async () => {
    setIsAuditing(true);
    setActiveSkillAdvice(null);
    try {
        const res = await auditResume(data);
        setAuditResult(res);
    } catch (e) {
        alert("Audit failed. Please try again.");
    } finally {
        setIsAuditing(false);
    }
  };

  const handleSkillClick = async (skill: string) => {
      if (activeSkillAdvice?.skill === skill) {
          setActiveSkillAdvice(null);
          return;
      }
      setLoadingSkill(skill);
      try {
          const advice = await getSkillResources(skill);
          setActiveSkillAdvice({ skill, advice });
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingSkill(null);
      }
  };

  const handleSaveVersion = async () => {
    const name = prompt("Name this version (e.g., 'Before AI edits'):", `Draft ${new Date().toLocaleTimeString()}`);
    if (name) {
        await db.saveResumeVersion(data, name);
        await loadVersions();
        alert("Version saved successfully!");
    }
  };

  const handleLoadVersion = (version: ResumeVersion) => {
    if (confirm(`Load version "${version.name}"? This will overwrite your current changes.`)) {
        onChange(version.data);
        alert(`Restored version: ${version.name}`);
    }
  };

  const handleDeleteVersion = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this version?")) {
        await db.deleteResumeVersion(id);
        await loadVersions();
    }
  };

  const handleGenerateDescription = async (index: number, role: string, company: string) => {
      if (!role) {
          alert("Please enter a Job Title first.");
          return;
      }
      setLoadingItem(`exp-${index}`);
      try {
          const desc = await generateExperienceContent(role, company);
          const newExp = [...data.experience];
          newExp[index].description = desc;
          onChange({ ...data, experience: newExp });
      } catch(e) {
          alert("AI generation failed.");
      } finally {
          setLoadingItem(null);
      }
  };
  
  const handleAITailor = async () => {
    if (!targetRole) {
        alert("Please enter a target role (e.g., 'Senior Product Manager') to tailor your resume.");
        return;
    }
    setIsGenerating(true);
    try {
      await db.saveResumeVersion(data, `Auto-save: Before ${targetRole} optimization`);
      loadVersions();
      const tailoredResume = await generateTailoredResume(data, targetRole);
      onChange(tailoredResume);
      alert("Resume tailored successfully! A backup of your previous version has been saved.");
    } catch (e) {
      alert("Failed to tailor resume. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ ...data, [e.target.name]: e.target.value });
  };

  // Drag and Drop Logic
  const onDragStart = (e: React.DragEvent, index: number, type: string) => {
    setDraggedItem({ index, type });
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, index: number, type: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== type || draggedItem.index === index) return;
  };

  const onDrop = (e: React.DragEvent, dropIndex: number, type: string, list: any[], field: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== type) return;

    const dragIndex = draggedItem.index;
    if (dragIndex === dropIndex) return;

    const newList = [...list];
    const [removed] = newList.splice(dragIndex, 1);
    newList.splice(dropIndex, 0, removed);
    
    onChange({ ...data, [field]: newList });
    setDraggedItem(null);
  };

  // --- Step 1: Template Selector ---
  if (step === 'template' && !readOnly) {
    return (
        <div className="animate-fade-in p-6">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Select Your Resume Template</h2>
            <p className="text-slate-400 text-center mb-8">Choose a style that fits your industry and personality.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {/* Modern Neon */}
                <div onClick={() => handleTemplateSelect('modern-neon')} className="group cursor-pointer bg-[#0f0f2d] border border-cyan-500/30 rounded-xl overflow-hidden hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-1 relative">
                    <div className="h-48 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                        <MiniResumePreview type="neon" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f2d] to-transparent opacity-30"></div>
                    </div>
                    <div className="p-4">
                        <h3 className="text-white font-bold flex items-center gap-2"><span className="w-2 h-2 bg-cyan-400 rounded-full"></span> Modern Neon</h3>
                        <p className="text-xs text-slate-400 mt-1">Best for Tech, Startups, and Creative roles. High impact, dark-mode aesthetic.</p>
                    </div>
                </div>
                {/* Professional */}
                <div onClick={() => handleTemplateSelect('professional')} className="group cursor-pointer bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div className="h-48 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                        <MiniResumePreview type="professional" />
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                        <h3 className="text-slate-900 font-bold flex items-center gap-2"><span className="w-2 h-2 bg-slate-600 rounded-full"></span> Professional</h3>
                        <p className="text-xs text-slate-500 mt-1">Best for Corporate, Enterprise, and Traditional industries. Clean and ATS-friendly.</p>
                    </div>
                </div>
                {/* Minimalist */}
                <div onClick={() => handleTemplateSelect('minimalist')} className="group cursor-pointer bg-slate-50 border border-slate-200 rounded-xl overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div className="h-48 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                        <MiniResumePreview type="minimalist" />
                    </div>
                    <div className="p-4 bg-white border-t border-slate-100">
                        <h3 className="text-slate-900 font-bold flex items-center gap-2"><span className="w-2 h-2 bg-black rounded-full"></span> Minimalist</h3>
                        <p className="text-xs text-slate-500 mt-1">Best for Academic, Legal, or Executive roles. Focuses purely on content and readability.</p>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  // --- Step 2: Edit Form ---
  if (step === 'edit' && !readOnly) {
      const TabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => {
        const complete = isSectionComplete(id);
        const count = getSectionCount(id);

        return (
            <button onClick={() => setActiveTab(id)} className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all w-full text-left ${activeTab === id ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}`}>
                <Icon /> {label}
                <div className="ml-auto flex items-center gap-2">
                    {count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === id ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-slate-400'}`}>
                            {count}
                        </span>
                    )}
                    <div className={`w-2 h-2 rounded-full ${complete ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]' : 'bg-slate-700'}`}></div>
                </div>
            </button>
        );
      };

      return (
        <div className="grid grid-cols-1 lg:grid-cols-4 h-full">
          {/* Sidebar */}
          <div className="lg:col-span-1 bg-[#0f0f2d] p-4 border-r border-white/10 flex flex-col h-full">
            <button onClick={() => setStep('template')} className="mb-6 text-xs text-slate-500 hover:text-white flex items-center gap-1">← Change Template</button>
            
            {/* Progress Header */}
            <div className="mb-6 p-4 bg-[#1a1a3a] rounded-xl border border-white/5">
                <div className="flex justify-between items-end mb-2">
                     <div>
                        <span className="text-xs text-slate-400 block mb-1">Resume Progress</span>
                        <span className="text-lg font-bold text-white">{calculateCompleteness()}% <span className="text-xs font-normal text-slate-500">Complete</span></span>
                     </div>
                     <span className="text-xs text-cyan-400 font-medium bg-cyan-900/20 px-2 py-1 rounded">{getCompletedSectionsCount()}/5 Sections</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${calculateCompleteness()}%` }}></div>
                </div>
            </div>

            {/* Save Actions */}
            <div className="mb-6 space-y-3">
                <button 
                    onClick={handleManualSave}
                    disabled={saveStatus !== 'idle' && saveStatus !== 'saved'}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 transform active:scale-95 ${
                        saveStatus === 'saved' 
                        ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] border border-green-500' 
                        : 'bg-white text-slate-900 hover:bg-slate-200 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                    }`}
                >
                    {saveStatus === 'saving' ? (
                         <>
                            <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                            Saving Draft...
                         </>
                    ) : saveStatus === 'saved' ? (
                        <>
                            <Icons.CheckCircle /> Saved Successfully!
                        </>
                    ) : (
                        <>
                            <Icons.Save /> Save Draft
                        </>
                    )}
                </button>
                
                {data.status !== 'pending_review' && data.status !== 'approved' && (
                    <button 
                        onClick={handleSubmitForReview}
                        disabled={saveStatus === 'submitting'}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 transition-all border border-cyan-500/30"
                    >
                         {saveStatus === 'submitting' ? 'Submitting...' : 'Submit for Review'}
                    </button>
                )}
            </div>
            
            {data.feedback && (
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <h4 className="text-amber-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                        <Icons.AlertCircle /> Mediator Feedback
                    </h4>
                    <p className="text-sm text-slate-300 italic">"{data.feedback}"</p>
                </div>
            )}

            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {/* ... existing TabButtons ... */}
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-2">Sections</p>
                <TabButton id="personal" label="Personal Info" icon={Icons.FileText} />
                <TabButton id="experience" label="Experience" icon={Icons.Briefcase} />
                <TabButton id="education" label="Education" icon={Icons.GraduationCap} />
                <TabButton id="projects" label="Projects" icon={Icons.Code} />
                <TabButton id="skills" label="Skills" icon={Icons.Sparkles} />
                
                <div className="h-px bg-white/10 my-4"></div>
                
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-2">Tools</p>
                <button onClick={() => setActiveTab('history')} className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all w-full text-left ${activeTab === 'history' ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
                    Version History
                </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10">
                <div className="p-4 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full"></div>
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2 relative z-10"><Icons.Sparkles /> AI Tailor</h4>
                    <p className="text-[10px] text-slate-400 mb-2 leading-tight relative z-10">Optimize for a specific job title.</p>
                    <input type="text" placeholder="e.g. Product Manager" className="w-full text-xs p-2 bg-[#05051e]/80 border border-white/10 rounded mb-2 text-white focus:border-cyan-500 outline-none relative z-10" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
                    <button onClick={handleAITailor} disabled={isGenerating} className="w-full bg-cyan-600 text-white text-xs font-bold py-2 rounded hover:bg-cyan-500 transition-colors disabled:opacity-50 relative z-10">{isGenerating ? 'Optimizing...' : 'Tailor Content'}</button>
                </div>
                <button onClick={() => setStep('preview')} className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/20 flex justify-center items-center gap-2 transition-transform transform active:scale-95">Next: Preview & Download <Icons.ChevronRight /></button>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-3 bg-[#05051e] p-6 overflow-y-auto">
             {/* ... (Existing form content - omitting for brevity as no logic change here, just wrapped in !readOnly check at top) ... */}
             {/* Note: I am not omitting the content in the final file to ensure it works, but re-pasting the existing large form logic would exceed tokens unnecessarily if I only need to return the whole file. I will return the WHOLE file with the updates. */}
            {activeTab === 'personal' && (
                <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
                    <h2 className="text-xl font-bold text-white mb-4">Personal Details</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label><input name="fullName" value={data.fullName} onChange={handleBasicInfoChange} className="w-full p-2 bg-[#1a1a3a] border border-white/10 rounded-md text-white focus:border-cyan-500 outline-none" /></div>
                        <div><label className="block text-xs font-medium text-slate-400 mb-1">Email</label><input name="email" value={data.email} onChange={handleBasicInfoChange} className="w-full p-2 bg-[#1a1a3a] border border-white/10 rounded-md text-white focus:border-cyan-500 outline-none" /></div>
                        <div><label className="block text-xs font-medium text-slate-400 mb-1">Phone</label><input name="phone" value={data.phone} onChange={handleBasicInfoChange} className="w-full p-2 bg-[#1a1a3a] border border-white/10 rounded-md text-white focus:border-cyan-500 outline-none" /></div>
                        <div><label className="block text-xs font-medium text-slate-400 mb-1">Location</label><input name="location" value={data.location || ''} onChange={handleBasicInfoChange} className="w-full p-2 bg-[#1a1a3a] border border-white/10 rounded-md text-white focus:border-cyan-500 outline-none" /></div>
                        <div className="col-span-2"><label className="block text-xs font-medium text-slate-400 mb-1">Professional Summary</label><textarea name="summary" rows={6} value={data.summary} onChange={handleBasicInfoChange} className="w-full p-2 bg-[#1a1a3a] border border-white/10 rounded-md text-white focus:border-cyan-500 outline-none" /></div>
                    </div>
                </div>
            )}

            {/* ... Other tabs (experience, education, etc) remain identical to previous version, just ensuring they render ... */}
            {/* For brevity in this diff, assume the other tabs (experience, education, projects, skills, history) are preserved exactly as they were in the previous step. */
            /* In a real deployment I would output them all. I will output them all here to be safe. */
            }
            {activeTab === 'experience' && (
                <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Experience</h2>
                        <button onClick={() => onChange({...data, experience: [...data.experience, { id: Date.now().toString(), role: '', company: '', duration: '', description: '' }]})} className="text-sm text-cyan-400 font-medium hover:text-cyan-300">+ Add Position</button>
                    </div>
                    <div className="space-y-4">
                        {data.experience.map((exp, idx) => (
                            <div 
                                key={exp.id} 
                                draggable 
                                onDragStart={(e) => onDragStart(e, idx, 'experience')}
                                onDragOver={(e) => onDragOver(e, idx, 'experience')}
                                onDrop={(e) => onDrop(e, idx, 'experience', data.experience, 'experience')}
                                className={`p-4 border rounded-lg bg-[#0f0f2d] relative group transition-colors ${draggedItem?.type === 'experience' && draggedItem.index === idx ? 'border-cyan-500 opacity-50' : 'border-white/10 hover:border-white/20'}`}
                            >
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                                    <div className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-white p-1" title="Drag to reorder">
                                        <Icons.GripVertical />
                                    </div>
                                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                                    <button onClick={() => { const newExp = data.experience.filter((_, i) => i !== idx); onChange({ ...data, experience: newExp }); }} className="text-slate-500 hover:text-red-500 p-1"><Icons.Trash /></button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-3 pr-16">
                                    <input placeholder="Job Title" value={exp.role} onChange={(e) => { const newExp = [...data.experience]; newExp[idx].role = e.target.value; onChange({ ...data, experience: newExp }); }} className="font-semibold bg-transparent border-b border-white/10 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none" />
                                    <input placeholder="Company" value={exp.company} onChange={(e) => { const newExp = [...data.experience]; newExp[idx].company = e.target.value; onChange({ ...data, experience: newExp }); }} className="text-right bg-transparent border-b border-white/10 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none" />
                                </div>
                                <div className="relative">
                                    <RichTextEditor 
                                        placeholder="Key responsibilities and achievements..." 
                                        value={exp.description} 
                                        onChange={(val) => { const newExp = [...data.experience]; newExp[idx].description = val; onChange({ ...data, experience: newExp }); }}
                                    />
                                    <button onClick={() => handleGenerateDescription(idx, exp.role, exp.company)} className="absolute bottom-2 right-2 text-xs bg-purple-600/80 hover:bg-purple-600 text-white px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm transition-colors" disabled={!!loadingItem}>
                                        {loadingItem === `exp-${idx}` ? 'Generating...' : <><Icons.Wand /> AI Write</>}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeTab === 'education' && (
                 <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Education</h2>
                        <button onClick={() => onChange({...data, education: [...data.education, { id: Date.now().toString(), degree: '', school: '', year: '' }]})} className="text-sm text-cyan-400 font-medium hover:text-cyan-300">+ Add Education</button>
                    </div>
                    {data.education.map((edu, idx) => (
                        <div 
                            key={edu.id} 
                            draggable 
                            onDragStart={(e) => onDragStart(e, idx, 'education')}
                            onDragOver={(e) => onDragOver(e, idx, 'education')}
                            onDrop={(e) => onDrop(e, idx, 'education', data.education, 'education')}
                            className={`p-4 border rounded-lg bg-[#0f0f2d] flex gap-4 items-center justify-between group transition-colors ${draggedItem?.type === 'education' && draggedItem.index === idx ? 'border-cyan-500 opacity-50' : 'border-white/10 hover:border-white/20'}`}
                        >
                             <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing text-slate-500 hover:text-white p-2">
                                <Icons.GripVertical />
                             </div>
                             <div className="flex-1 grid grid-cols-3 gap-4">
                                <input placeholder="Degree" value={edu.degree} className="font-medium bg-transparent border-b border-white/10 text-white focus:border-cyan-500 focus:outline-none" onChange={(e) => { const newEdu = [...data.education]; newEdu[idx].degree = e.target.value; onChange({ ...data, education: newEdu }); }} />
                                <input placeholder="School" value={edu.school} className="bg-transparent border-b border-white/10 text-white focus:border-cyan-500 focus:outline-none" onChange={(e) => { const newEdu = [...data.education]; newEdu[idx].school = e.target.value; onChange({ ...data, education: newEdu }); }} />
                                <input placeholder="Year" value={edu.year} className="bg-transparent border-b border-white/10 text-white focus:border-cyan-500 focus:outline-none" onChange={(e) => { const newEdu = [...data.education]; newEdu[idx].year = e.target.value; onChange({ ...data, education: newEdu }); }} />
                             </div>
                             <button onClick={() => { const newEdu = data.education.filter((_, i) => i !== idx); onChange({ ...data, education: newEdu }); }} className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100"><Icons.Trash /></button>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'projects' && (
                 <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Projects</h2>
                        <button onClick={() => onChange({...data, projects: [...data.projects, { id: Date.now().toString(), name: '', description: '', technologies: [] }]})} className="text-sm text-cyan-400 font-medium hover:text-cyan-300">+ Add Project</button>
                    </div>
                    {data.projects.map((proj, idx) => (
                        <div 
                            key={proj.id} 
                            draggable 
                            onDragStart={(e) => onDragStart(e, idx, 'projects')}
                            onDragOver={(e) => onDragOver(e, idx, 'projects')}
                            onDrop={(e) => onDrop(e, idx, 'projects', data.projects, 'projects')}
                            className={`p-4 border rounded-lg bg-[#0f0f2d] group relative transition-colors ${draggedItem?.type === 'projects' && draggedItem.index === idx ? 'border-cyan-500 opacity-50' : 'border-white/10 hover:border-white/20'}`}
                        >
                             <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                                <div className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-white p-1">
                                    <Icons.GripVertical />
                                </div>
                                <div className="w-px h-4 bg-white/10 mx-1"></div>
                                <button onClick={() => { const newProj = data.projects.filter((_, i) => i !== idx); onChange({ ...data, projects: newProj }); }} className="text-slate-500 hover:text-red-500 p-1"><Icons.Trash /></button>
                             </div>
                            <div className="mb-2 pr-12">
                                 <input placeholder="Project Name" value={proj.name} className="font-bold bg-transparent border-b border-white/10 text-white focus:border-cyan-500 focus:outline-none block w-full mb-1" onChange={(e) => { const newProj = [...data.projects]; newProj[idx].name = e.target.value; onChange({ ...data, projects: newProj }); }} />
                                <div className="mt-2">
                                    <RichTextEditor 
                                        placeholder="Description" 
                                        value={proj.description} 
                                        onChange={(val) => { const newProj = [...data.projects]; newProj[idx].description = val; onChange({ ...data, projects: newProj }); }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'skills' && (
                 <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                     <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Skills</h2>
                        <button onClick={() => onChange({...data, skills: [...data.skills, { id: Date.now().toString(), name: '', level: 'Intermediate', category: 'Technical' }]})} className="text-sm text-cyan-400 font-medium hover:text-cyan-300">+ Add Skill</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {data.skills.map((skill, idx) => (
                            <div key={skill.id} className="relative group bg-[#0f0f2d] border border-white/10 rounded-lg p-2 flex items-center justify-between">
                                 <input value={skill.name} className="bg-transparent text-sm w-full focus:outline-none font-medium text-white" placeholder="Skill" onChange={(e) => { const newSkills = [...data.skills]; newSkills[idx].name = e.target.value; onChange({ ...data, skills: newSkills }); }} />
                                 <button onClick={() => { const newSkills = data.skills.filter((_, i) => i !== idx); onChange({ ...data, skills: newSkills }); }} className="text-slate-500 hover:text-red-500 ml-2"><Icons.Trash /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeTab === 'history' && (
                <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                    <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-white">Version History</h2><button onClick={handleSaveVersion} className="text-sm bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded transition-colors">Save Current Version</button></div>
                    <p className="text-sm text-slate-400">Save drafts of your resume to revert later. AI optimizations are automatically saved.</p>
                    <div className="space-y-3 mt-4">
                        {versions.length === 0 ? <p className="text-center text-slate-600 italic py-8">No saved versions yet.</p> : versions.map((version) => (
                            <div key={version.id} className="bg-[#1a1a3a] border border-white/10 rounded-lg p-4 flex items-center justify-between hover:border-cyan-500/50 transition-colors cursor-pointer" onClick={() => handleLoadVersion(version)}>
                                <div><h4 className="font-bold text-white">{version.name}</h4><p className="text-xs text-slate-500">{new Date(version.timestamp).toLocaleString()}</p></div>
                                <div className="flex items-center gap-3"><button className="text-cyan-400 text-xs font-bold hover:underline">Restore</button><button onClick={(e) => handleDeleteVersion(version.id, e)} className="text-slate-500 hover:text-red-500 p-1"><Icons.Trash /></button></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>
      );
  }

  // --- Step 3: Preview & Audit ---
  if (step === 'preview') {
    return (
        <div className="flex flex-col h-full">
            <div className="bg-[#0f0f2d] p-4 border-b border-white/10 flex justify-between items-center">
                {!readOnly && (
                    <button onClick={() => setStep('edit')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1">← Back to Edit</button>
                )}
                {readOnly && <span></span>} {/* Spacer */}
                <div className="flex gap-3">
                    {!readOnly && (
                         <button onClick={handleAudit} disabled={isAuditing} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-purple-500/20">{isAuditing ? 'Auditing...' : <><Icons.Sparkles /> AI Audit</>}</button>
                    )}
                    <button onClick={handlePrint} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-cyan-500/20"><Icons.Download /> Download PDF</button>
                </div>
            </div>
            <div className="flex-1 overflow-auto bg-slate-900 p-8 flex gap-6 justify-center">
                <div id="resume-preview" className={`w-[210mm] min-h-[297mm] shadow-2xl overflow-hidden print:shadow-none print:w-full print:absolute print:top-0 print:left-0 ${data.templateId === 'modern-neon' ? 'bg-[#0a0a1a] text-gray-200' : data.templateId === 'minimalist' ? 'bg-white text-black' : 'bg-white text-slate-800'}`}>
                    <ResumePreview data={data} />
                </div>
                {auditResult && !readOnly && (
                    <div className="w-80 bg-[#0f0f2d] border border-white/10 rounded-xl p-4 h-fit animate-fade-in print:hidden sticky top-0">
                        <h3 className="text-lg font-bold text-white mb-4">AI Audit Report</h3>
                        <div className="flex items-center gap-3 mb-6"><div className={`text-3xl font-bold ${auditResult.score > 70 ? 'text-green-400' : 'text-amber-400'}`}>{auditResult.score}</div><div className="text-xs text-slate-400">Resume<br/>Strength</div></div>
                        <div className="space-y-4">
                            {auditResult.strengths && auditResult.strengths.length > 0 && (
                                <div><h4 className="text-xs font-bold text-green-400 uppercase tracking-wide mb-2">Key Strengths</h4><ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">{auditResult.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
                            )}
                            <div><h4 className="text-xs font-bold text-red-400 uppercase tracking-wide mb-2">Lagging Stages</h4><ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">{auditResult.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul></div>
                            <div><h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wide mb-2">Development Areas</h4><ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">{auditResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
                            {auditResult.missingCriticalSkills.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-2">Missing Skills (Tap for Tips)</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {auditResult.missingCriticalSkills.map((s, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => handleSkillClick(s)}
                                                disabled={loadingSkill !== null && loadingSkill !== s}
                                                className={`text-[10px] px-2 py-1 rounded-full border transition-all text-left ${
                                                    activeSkillAdvice?.skill === s 
                                                    ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40'
                                                }`}
                                            >
                                                {loadingSkill === s ? <span className="animate-pulse">Loading...</span> : s}
                                            </button>
                                        ))}
                                    </div>
                                    {activeSkillAdvice && (
                                        <div className="mt-3 p-3 bg-[#1a1a3a] border border-amber-500/30 rounded-lg animate-fade-in relative">
                                            <div className="absolute top-[-6px] left-4 w-3 h-3 bg-[#1a1a3a] border-t border-l border-amber-500/30 transform rotate-45"></div>
                                            <h5 className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1">
                                                <Icons.Sparkles /> Quick Tip: {activeSkillAdvice.skill}
                                            </h5>
                                            <p className="text-xs text-slate-300 leading-relaxed">
                                                {activeSkillAdvice.advice}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
  }
  return null;
};

// --- Internal Component: Resume Template Renderer ---
// Exported for Mediator View
export const ResumePreview: React.FC<{ data: ResumeData }> = ({ data }) => {
    const { templateId } = data;
    
    // Modern Neon Style
    if (templateId === 'modern-neon') {
        return (
            <div className="p-10 h-full font-sans text-gray-200">
                <header className="border-b-2 border-cyan-500 pb-6 mb-6">
                    <h1 className="text-5xl font-bold mb-2 text-cyan-400 tracking-tight">{data.fullName}</h1>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400 font-mono">
                        {data.email && <span>{data.email}</span>}
                        {data.phone && <span>• {data.phone}</span>}
                        {data.location && <span>• {data.location}</span>}
                    </div>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                         <section>
                            <h2 className="text-lg font-bold uppercase tracking-widest mb-3 text-white border-b border-cyan-900/30 pb-1">Profile</h2>
                            <p className="text-sm leading-relaxed text-gray-300">{data.summary}</p>
                         </section>
                         <section>
                            <h2 className="text-lg font-bold uppercase tracking-widest mb-3 text-white border-b border-cyan-900/30 pb-1">Experience</h2>
                            <div className="space-y-6">
                                {data.experience.map((exp) => (
                                    <div key={exp.id} className="relative pl-4 border-l-2 border-cyan-900/50">
                                        <div className="flex justify-between items-baseline mb-1"><h3 className="font-bold text-cyan-200 text-lg">{exp.role}</h3><span className="text-xs text-gray-500 font-mono">{exp.duration}</span></div>
                                        <p className="text-sm font-medium mb-2 text-gray-400">{exp.company}</p>
                                        <p className="text-sm whitespace-pre-wrap text-gray-300 leading-relaxed">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section>
                             <h2 className="text-lg font-bold uppercase tracking-widest mb-3 text-white border-b border-cyan-900/30 pb-1">Projects</h2>
                             <div className="space-y-4">
                                {data.projects.map((proj) => (
                                    <div key={proj.id} className="bg-white/5 p-4 rounded-lg border border-white/5">
                                         <h3 className="font-bold text-cyan-200">{proj.name}</h3>
                                         <p className="text-sm text-gray-300 mt-1">{proj.description}</p>
                                    </div>
                                ))}
                             </div>
                        </section>
                    </div>
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-lg font-bold uppercase tracking-widest mb-3 text-white border-b border-cyan-900/30 pb-1">Skills</h2>
                            <div className="flex flex-wrap gap-2">
                                {data.skills.map((skill) => (
                                    <span key={skill.id} className="text-xs px-2 py-1 rounded bg-cyan-900/20 border border-cyan-500/30 text-cyan-200">{skill.name}</span>
                                ))}
                            </div>
                        </section>
                        <section>
                            <h2 className="text-lg font-bold uppercase tracking-widest mb-3 text-white border-b border-cyan-900/30 pb-1">Education</h2>
                            <div className="space-y-4">
                                {data.education.map((edu) => (
                                    <div key={edu.id}>
                                        <h3 className="font-bold text-sm text-gray-200">{edu.school}</h3>
                                        <p className="text-xs text-gray-400">{edu.degree}</p>
                                        <p className="text-xs text-gray-500 mt-1">{edu.year}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        );
    }

    // Minimalist Style
    if (templateId === 'minimalist') {
        return (
            <div className="p-12 h-full font-sans text-black max-w-[900px] mx-auto">
                <header className="pb-8 mb-8 text-center">
                     <h1 className="text-4xl font-light tracking-widest uppercase mb-4">{data.fullName}</h1>
                     <div className="flex justify-center gap-6 text-xs text-gray-500 uppercase tracking-widest">
                        {data.email && <span>{data.email}</span>}
                        {data.phone && <span>{data.phone}</span>}
                        {data.location && <span>{data.location}</span>}
                     </div>
                </header>
                
                <div className="w-12 h-0.5 bg-black mx-auto mb-12"></div>

                <div className="space-y-8">
                     <section>
                        <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-gray-400">Profile</h2>
                        <p className="text-sm leading-relaxed text-gray-800">{data.summary}</p>
                     </section>

                     <section>
                        <h2 className="text-xs font-bold uppercase tracking-widest mb-6 text-gray-400">Experience</h2>
                        <div className="space-y-8">
                            {data.experience.map((exp) => (
                                <div key={exp.id} className="grid grid-cols-4 gap-4">
                                    <div className="col-span-1 text-xs text-gray-500 pt-1">{exp.duration}</div>
                                    <div className="col-span-3">
                                        <h3 className="font-bold text-gray-900">{exp.role}</h3>
                                        <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">{exp.company}</p>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{exp.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </section>
                     
                     <div className="grid grid-cols-2 gap-8">
                         <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-gray-400">Education</h2>
                            <div className="space-y-4">
                                {data.education.map((edu) => (
                                    <div key={edu.id}>
                                        <h3 className="font-bold text-sm">{edu.school}</h3>
                                        <p className="text-xs text-gray-600">{edu.degree}</p>
                                        <p className="text-xs text-gray-400 mt-1">{edu.year}</p>
                                    </div>
                                ))}
                            </div>
                         </section>
                         <section>
                            <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-gray-400">Skills</h2>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {data.skills.map((skill) => (
                                    <span key={skill.id} className="text-sm text-gray-800 border-b border-gray-200 pb-0.5">{skill.name}</span>
                                ))}
                            </div>
                         </section>
                     </div>
                </div>
            </div>
        )
    }

    // Professional Style (Default)
    return (
        <div className="p-10 h-full font-serif text-slate-800">
            <header className="border-b-4 border-slate-800 pb-6 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900">{data.fullName}</h1>
                    <p className="text-lg text-slate-600 mt-1 italic">{data.experience[0]?.role || 'Professional'}</p>
                </div>
                <div className="text-right text-sm text-slate-600 leading-relaxed">
                    {data.email && <div>{data.email}</div>}
                    {data.phone && <div>{data.phone}</div>}
                    {data.location && <div>{data.location}</div>}
                </div>
            </header>
            
            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-8">
                     <section>
                        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-300 mb-3 pb-1">Professional Experience</h2>
                        <div className="space-y-6">
                            {data.experience.map((exp) => (
                                <div key={exp.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-slate-900 text-lg">{exp.role}</h3>
                                        <span className="text-sm text-slate-600 italic">{exp.duration}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 mb-2">{exp.company}</p>
                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section>
                         <h2 className="text-lg font-bold text-slate-900 border-b border-slate-300 mb-3 pb-1">Key Projects</h2>
                         <div className="space-y-4">
                            {data.projects.map((proj) => (
                                <div key={proj.id}>
                                     <h3 className="font-bold text-slate-900">{proj.name}</h3>
                                     <p className="text-sm text-slate-700">{proj.description}</p>
                                </div>
                            ))}
                         </div>
                    </section>
                </div>

                <div className="col-span-1 space-y-8 bg-slate-50 p-4 -my-4 h-[calc(100%+2rem)]">
                    <section>
                        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-300 mb-3 pb-1">Profile</h2>
                        <p className="text-sm leading-relaxed text-slate-700">{data.summary}</p>
                    </section>
                    <section>
                        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-300 mb-3 pb-1">Education</h2>
                        <div className="space-y-4">
                            {data.education.map((edu) => (
                                <div key={edu.id}>
                                    <h3 className="font-bold text-sm text-slate-900">{edu.school}</h3>
                                    <p className="text-sm text-slate-700">{edu.degree}</p>
                                    <p className="text-xs text-slate-500 mt-1">{edu.year}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section>
                        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-300 mb-3 pb-1">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                            {data.skills.map((skill) => (
                                <span key={skill.id} className="text-xs px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 font-medium shadow-sm">{skill.name}</span>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}