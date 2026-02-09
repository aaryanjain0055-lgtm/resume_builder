
import React, { useState, useEffect, useRef } from 'react';
import { ResumeData, ResumeAuditResult, TemplateId, ResumeVersion } from '../types';
import { Icons } from '../constants';
import { generateTailoredResume, auditResume, generateExperienceContent, getSkillResources } from '../services/geminiService';
import { db } from '../services/db';

interface ResumeFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  readOnly?: boolean;
}

type Tab = 'personal' | 'experience' | 'education' | 'skills' | 'projects' | 'history';
type Step = 'template' | 'edit' | 'preview';

// --- RICH TEXT EDITOR ---
const RichTextEditor = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder: string }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertBullet = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end);
        onChange(before + "• " + after);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + 2, start + 2);
        }, 0);
    };

    return (
        <div className="border border-white/10 rounded bg-[#1a1a3a] focus-within:border-cyan-500 transition-colors">
            <div className="flex items-center gap-2 p-1 border-b border-white/5 bg-[#1f1f45] rounded-t">
                <button type="button" onClick={insertBullet} className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white" title="Add Bullet Point"><Icons.List /></button>
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

// --- SVG TEMPLATE THUMBNAILS ---
const TemplateThumbnails = {
    Executive: () => (
        <svg viewBox="0 0 210 297" className="w-full h-full shadow-md bg-white" preserveAspectRatio="xMidYMid slice">
            <rect width="100%" height="100%" fill="white"/>
            <rect x="20" y="20" width="170" height="2" fill="#333"/>
            <rect x="65" y="30" width="80" height="8" fill="#1a1a1a"/>
            <rect x="50" y="45" width="110" height="4" fill="#666"/>
            
            <rect x="20" y="65" width="170" height="1" fill="#ccc"/>
            <rect x="20" y="75" width="170" height="40" fill="#f5f5f5"/>
            <rect x="25" y="80" width="160" height="2" fill="#999"/>
            
            <rect x="20" y="125" width="40" height="4" fill="#333"/>
            <rect x="20" y="132" width="170" height="1" fill="#333"/>
            <rect x="20" y="140" width="170" height="6" fill="#ddd"/>
            <rect x="20" y="150" width="170" height="6" fill="#ddd"/>
            <rect x="20" y="160" width="170" height="6" fill="#ddd"/>
            
            <rect x="20" y="180" width="40" height="4" fill="#333"/>
            <rect x="20" y="187" width="170" height="1" fill="#333"/>
            <rect x="20" y="195" width="170" height="6" fill="#ddd"/>
        </svg>
    ),
    Modern: () => (
        <svg viewBox="0 0 210 297" className="w-full h-full shadow-md bg-white" preserveAspectRatio="xMidYMid slice">
            <rect width="100%" height="100%" fill="white"/>
            <rect width="70" height="297" fill="#f1f5f9"/>
            <circle cx="35" cy="40" r="15" fill="#334155"/>
            
            <rect x="10" y="70" width="50" height="4" fill="#475569"/>
            <rect x="10" y="80" width="50" height="2" fill="#94a3b8"/>
            <rect x="10" y="85" width="40" height="2" fill="#94a3b8"/>
            
            <rect x="10" y="110" width="50" height="4" fill="#475569"/>
            <rect x="10" y="120" width="50" height="20" fill="#e2e8f0"/>
            
            <rect x="85" y="30" width="100" height="10" fill="#0f172a"/>
            <rect x="85" y="45" width="60" height="4" fill="#64748b"/>
            
            <rect x="85" y="70" width="110" height="30" fill="#f8fafc"/>
            
            <rect x="85" y="120" width="110" height="6" fill="#cbd5e1"/>
            <rect x="85" y="130" width="110" height="6" fill="#cbd5e1"/>
            <rect x="85" y="140" width="110" height="6" fill="#cbd5e1"/>
        </svg>
    ),
    Classic: () => (
        <svg viewBox="0 0 210 297" className="w-full h-full shadow-md bg-white" preserveAspectRatio="xMidYMid slice">
            <rect width="100%" height="100%" fill="white"/>
            <rect x="0" y="0" width="210" height="5" fill="#2563eb"/>
            
            <rect x="20" y="25" width="80" height="8" fill="#1e3a8a"/>
            <rect x="20" y="38" width="170" height="1" fill="#e5e7eb"/>
            <rect x="20" y="45" width="150" height="4" fill="#6b7280"/>
            
            <rect x="20" y="70" width="30" height="5" fill="#1d4ed8"/>
            <rect x="20" y="80" width="170" height="25" fill="#f3f4f6"/>
            
            <rect x="20" y="120" width="30" height="5" fill="#1d4ed8"/>
            <rect x="20" y="130" width="170" height="4" fill="#374151"/>
            <rect x="20" y="138" width="170" height="3" fill="#9ca3af"/>
            <rect x="20" y="145" width="170" height="3" fill="#9ca3af"/>
            
            <rect x="20" y="160" width="170" height="4" fill="#374151"/>
            <rect x="20" y="168" width="170" height="3" fill="#9ca3af"/>
        </svg>
    )
};


// --- MAIN COMPONENT ---
export const ResumeForm: React.FC<ResumeFormProps> = ({ data, onChange, readOnly = false }) => {
  const [step, setStep] = useState<Step>('template');
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'submitting'>('idle');
  const [draggedItem, setDraggedItem] = useState<{ index: number, type: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Updated: Only force preview if strictly readOnly (e.g. Admin View), otherwise let user toggle
  useEffect(() => {
    if (readOnly) {
        setStep('preview');
    }
  }, [readOnly]);

  const calculateCompleteness = () => {
      let filled = 0;
      if (data.fullName) filled++;
      if (data.email) filled++;
      if (data.summary) filled++;
      if (data.experience.length > 0) filled++;
      if (data.education.length > 0) filled++;
      if (data.skills.length > 0) filled++;
      return Math.round((filled / 6) * 100);
  };

  const handleManualSave = async () => {
      setSaveStatus('saving');
      await db.saveResume(data);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleSubmitForReview = async () => {
      if (!data.fullName || !data.email) return alert("Full Name & Email required.");
      if (data.experience.length === 0) return alert("Please add experience.");
      
      setSaveStatus('submitting');
      try {
          const updated = { ...data, status: 'pending_review' as const, updatedAt: Date.now() };
          await db.saveResume(updated);
          onChange(updated);
          setShowSuccessModal(true); 
          // Do not force setStep('preview'), user can choose to go back to edit if they want
      } catch(e) {
          alert("Submission failed.");
      } finally {
          setSaveStatus('idle');
      }
  };

  // Helper for Input Changes
  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ ...data, [e.target.name]: e.target.value });
  };

  // Helper for Array Changes (Exp, Edu, etc.)
  const handleArrayChange = (field: keyof ResumeData, index: number, key: string, value: any) => {
      const arr = [...(data[field] as any[])];
      arr[index] = { ...arr[index], [key]: value };
      onChange({ ...data, [field]: arr });
  };
  
  const addItem = (field: keyof ResumeData, item: any) => {
      onChange({ ...data, [field]: [...(data[field] as any[]), item] });
  };

  const removeItem = (field: keyof ResumeData, index: number) => {
      const arr = [...(data[field] as any[])];
      arr.splice(index, 1);
      onChange({ ...data, [field]: arr });
  };

  // Drag & Drop
  const onDragStart = (e: React.DragEvent, index: number, type: string) => { setDraggedItem({ index, type }); };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (index: number, type: string, field: keyof ResumeData) => {
      if (!draggedItem || draggedItem.type !== type || draggedItem.index === index) return;
      const list = [...(data[field] as any[])];
      const [item] = list.splice(draggedItem.index, 1);
      list.splice(index, 0, item);
      onChange({ ...data, [field]: list });
      setDraggedItem(null);
  };

  const StatusBanner = () => {
      if (data.status === 'draft') return null;
      const colors = {
          pending_review: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          changes_requested: 'bg-red-500/20 text-red-400 border-red-500/30',
          forwarded_to_admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          hired: 'bg-green-500/20 text-green-400 border-green-500/30',
          rejected: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      };
      const messages = {
          pending_review: 'Under Review by Mediator',
          changes_requested: 'Changes Requested by Mediator',
          forwarded_to_admin: 'Approved by Mediator - Forwarded to Admin',
          hired: 'Hired! Congratulations.',
          rejected: 'Application Rejected.'
      };
      return (
          <div className={`p-4 mb-4 rounded-lg border flex items-center gap-3 ${colors[data.status] || colors.pending_review}`}>
              <Icons.AlertCircle />
              <div className="flex-1 font-bold">{messages[data.status] || 'Status Update'}</div>
              {data.feedback && <div className="text-sm italic">" {data.feedback} "</div>}
          </div>
      );
  };

  // --- STEP 1: TEMPLATES ---
  if (step === 'template' && !readOnly) {
      return (
          <div className="p-8 animate-fade-in">
              <h2 className="text-3xl font-bold text-white text-center mb-2">Choose Your Look</h2>
              <p className="text-slate-400 text-center mb-10">Select a professional template to get started.</p>
              <div className="grid grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {/* Executive */}
                  <div onClick={() => { onChange({ ...data, templateId: 'executive' }); setStep('edit'); }}
                       className="group cursor-pointer bg-[#1a1a3a] border border-white/10 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all hover:-translate-y-2 hover:shadow-2xl">
                      <div className="h-72 bg-gray-100 relative p-4">
                           <TemplateThumbnails.Executive />
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-cyan-500/10 transition-colors"></div>
                           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg whitespace-nowrap">Select Executive</div>
                      </div>
                      <div className="p-5 border-t border-white/5">
                          <h3 className="text-xl font-bold text-white mb-1">Executive</h3>
                          <p className="text-sm text-slate-400">Serif, Authoritative, Clean. Best for C-Suite & Law.</p>
                      </div>
                  </div>

                  {/* Modern */}
                  <div onClick={() => { onChange({ ...data, templateId: 'modern' }); setStep('edit'); }}
                       className="group cursor-pointer bg-[#1a1a3a] border border-white/10 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all hover:-translate-y-2 hover:shadow-2xl">
                      <div className="h-72 bg-gray-100 relative p-4">
                           <TemplateThumbnails.Modern />
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-cyan-500/10 transition-colors"></div>
                           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg whitespace-nowrap">Select Modern</div>
                      </div>
                      <div className="p-5 border-t border-white/5">
                          <h3 className="text-xl font-bold text-white mb-1">Modern Split</h3>
                          <p className="text-sm text-slate-400">Visual Sidebar, Tech-Focused. Best for Design & IT.</p>
                      </div>
                  </div>

                  {/* Classic */}
                  <div onClick={() => { onChange({ ...data, templateId: 'classic' }); setStep('edit'); }}
                       className="group cursor-pointer bg-[#1a1a3a] border border-white/10 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all hover:-translate-y-2 hover:shadow-2xl">
                      <div className="h-72 bg-gray-100 relative p-4">
                           <TemplateThumbnails.Classic />
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-cyan-500/10 transition-colors"></div>
                           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg whitespace-nowrap">Select Classic</div>
                      </div>
                      <div className="p-5 border-t border-white/5">
                          <h3 className="text-xl font-bold text-white mb-1">Classic</h3>
                          <p className="text-sm text-slate-400">Standard ATS-Friendly. Best for General Applications.</p>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- STEP 2: EDIT ---
  if (step === 'edit' && !readOnly) {
      return (
          // CHANGED: Fixed 4-column layout (Sidebar 1 / Form 3) to prevent stacking
          <div className="grid grid-cols-4 h-full">
              {/* SIDEBAR */}
              <div className="col-span-1 bg-[#0f0f2d] p-4 border-r border-white/10 flex flex-col h-full overflow-y-auto">
                  <div className="mb-6 flex items-center justify-between">
                      <button onClick={() => setStep('template')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">← Templates</button>
                      <div className="text-xs font-bold text-cyan-400">{calculateCompleteness()}% Ready</div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                      {[
                          { id: 'personal', label: 'Personal', icon: Icons.FileText },
                          { id: 'experience', label: 'Experience', icon: Icons.Briefcase },
                          { id: 'education', label: 'Education', icon: Icons.GraduationCap },
                          { id: 'skills', label: 'Skills', icon: Icons.Sparkles },
                          { id: 'projects', label: 'Projects', icon: Icons.Code }
                      ].map(tab => (
                          <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-white/5'}`}>
                              <tab.icon /> {tab.label}
                          </button>
                      ))}
                  </div>

                  <div className="mt-auto pt-6 space-y-3">
                      <button onClick={handleManualSave} className="w-full py-3 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-bold flex justify-center gap-2">
                          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : <><Icons.Save /> Save Draft</>}
                      </button>
                      <button onClick={() => setStep('preview')} className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg text-white font-bold text-sm shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-transform">
                          Preview & Submit
                      </button>
                  </div>
              </div>

              {/* FORM AREA */}
              <div className="col-span-3 bg-[#05051e] p-8 overflow-y-auto h-full">
                   <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4 capitalize">{activeTab} Details</h2>
                   <div className="mb-4">
                       <StatusBanner />
                   </div>
                   
                   {activeTab === 'personal' && (
                       <div className="grid grid-cols-2 gap-6 max-w-3xl">
                           <div className="col-span-1"><label className="label text-slate-400 text-sm block mb-1">Full Name</label><input name="fullName" value={data.fullName} onChange={handleBasicInfoChange} className="input w-full bg-[#1a1a3a] border border-white/10 rounded p-2 text-white" /></div>
                           <div className="col-span-1"><label className="label text-slate-400 text-sm block mb-1">Email</label><input name="email" value={data.email} onChange={handleBasicInfoChange} className="input w-full bg-[#1a1a3a] border border-white/10 rounded p-2 text-white" /></div>
                           <div className="col-span-1"><label className="label text-slate-400 text-sm block mb-1">Phone</label><input name="phone" value={data.phone} onChange={handleBasicInfoChange} className="input w-full bg-[#1a1a3a] border border-white/10 rounded p-2 text-white" /></div>
                           <div className="col-span-1"><label className="label text-slate-400 text-sm block mb-1">Location</label><input name="location" value={data.location || ''} onChange={handleBasicInfoChange} className="input w-full bg-[#1a1a3a] border border-white/10 rounded p-2 text-white" /></div>
                           <div className="col-span-2"><label className="label text-slate-400 text-sm block mb-1">Summary</label><textarea name="summary" value={data.summary} onChange={handleBasicInfoChange} className="input w-full bg-[#1a1a3a] border border-white/10 rounded p-2 text-white min-h-[120px]" /></div>
                       </div>
                   )}

                   {activeTab === 'experience' && (
                       <div className="space-y-6 max-w-3xl">
                           {data.experience.map((exp, i) => (
                               <div key={exp.id} className="p-4 bg-[#1a1a3a] rounded-xl border border-white/10 group" draggable onDragStart={(e) => onDragStart(e, i, 'exp')} onDragOver={onDragOver} onDrop={() => onDrop(i, 'exp', 'experience')}>
                                   <div className="flex justify-between mb-4">
                                       <div className="flex gap-2"><Icons.GripVertical /><span className="text-xs font-bold text-slate-500">#{i+1}</span></div>
                                       <button onClick={() => removeItem('experience', i)} className="text-red-400 hover:text-red-300"><Icons.Trash /></button>
                                   </div>
                                   <div className="grid grid-cols-2 gap-4 mb-4">
                                       <input placeholder="Job Title" value={exp.role} onChange={(e) => handleArrayChange('experience', i, 'role', e.target.value)} className="input w-full bg-[#05051e] border border-white/10 rounded p-2 text-white" />
                                       <input placeholder="Company" value={exp.company} onChange={(e) => handleArrayChange('experience', i, 'company', e.target.value)} className="input w-full bg-[#05051e] border border-white/10 rounded p-2 text-white" />
                                       <input placeholder="Duration (e.g. 2020 - Present)" value={exp.duration} onChange={(e) => handleArrayChange('experience', i, 'duration', e.target.value)} className="input w-full bg-[#05051e] border border-white/10 rounded p-2 text-white col-span-2" />
                                   </div>
                                   <RichTextEditor placeholder="Key Achievements..." value={exp.description} onChange={(val) => handleArrayChange('experience', i, 'description', val)} />
                               </div>
                           ))}
                           <button onClick={() => addItem('experience', { id: Date.now().toString(), role: '', company: '', duration: '', description: '' })} className="text-cyan-400 text-sm font-bold hover:underline">+ Add Experience</button>
                       </div>
                   )}
                   
                   {activeTab === 'education' && (
                       <div className="space-y-4 max-w-3xl">
                           {data.education.map((edu, i) => (
                               <div key={edu.id} className="p-4 bg-[#1a1a3a] rounded-xl border border-white/10 flex gap-4 items-center">
                                   <div className="grid grid-cols-3 gap-4 flex-1 w-full">
                                       <input placeholder="School" value={edu.school} onChange={(e) => handleArrayChange('education', i, 'school', e.target.value)} className="input w-full bg-[#05051e] border border-white/10 rounded p-2 text-white" />
                                       <input placeholder="Degree" value={edu.degree} onChange={(e) => handleArrayChange('education', i, 'degree', e.target.value)} className="input w-full bg-[#05051e] border border-white/10 rounded p-2 text-white" />
                                       <input placeholder="Year" value={edu.year} onChange={(e) => handleArrayChange('education', i, 'year', e.target.value)} className="input w-full bg-[#05051e] border border-white/10 rounded p-2 text-white" />
                                   </div>
                                   <button onClick={() => removeItem('education', i)} className="text-red-400"><Icons.Trash /></button>
                               </div>
                           ))}
                           <button onClick={() => addItem('education', { id: Date.now().toString(), school: '', degree: '', year: '' })} className="text-cyan-400 text-sm font-bold hover:underline">+ Add Education</button>
                       </div>
                   )}

                   {activeTab === 'skills' && (
                       <div className="max-w-3xl">
                           <div className="flex flex-wrap gap-3 mb-4">
                               {data.skills.map((skill, i) => (
                                   <div key={skill.id} className="flex items-center bg-[#1a1a3a] border border-white/10 rounded-lg px-3 py-2">
                                       <input value={skill.name} onChange={(e) => handleArrayChange('skills', i, 'name', e.target.value)} className="bg-transparent text-white text-sm outline-none w-32" />
                                       <button onClick={() => removeItem('skills', i)} className="text-slate-500 hover:text-red-400 ml-2"><Icons.X /></button>
                                   </div>
                               ))}
                           </div>
                           <button onClick={() => addItem('skills', { id: Date.now().toString(), name: 'New Skill', level: 'Intermediate' })} className="text-cyan-400 text-sm font-bold hover:underline">+ Add Skill</button>
                       </div>
                   )}

                   {activeTab === 'projects' && (
                        <div className="space-y-6 max-w-3xl">
                           {data.projects.map((proj, i) => (
                               <div key={proj.id} className="p-4 bg-[#1a1a3a] rounded-xl border border-white/10">
                                   <div className="flex justify-between mb-2">
                                        <input placeholder="Project Name" value={proj.name} onChange={(e) => handleArrayChange('projects', i, 'name', e.target.value)} className="bg-transparent text-lg font-bold text-white outline-none w-full" />
                                        <button onClick={() => removeItem('projects', i)} className="text-red-400"><Icons.Trash /></button>
                                   </div>
                                   <RichTextEditor placeholder="Description..." value={proj.description} onChange={(val) => handleArrayChange('projects', i, 'description', val)} />
                               </div>
                           ))}
                           <button onClick={() => addItem('projects', { id: Date.now().toString(), name: '', description: '', technologies: [] })} className="text-cyan-400 text-sm font-bold hover:underline">+ Add Project</button>
                        </div>
                   )}
              </div>
          </div>
      );
  }

  // --- STEP 3: PREVIEW ---
  return (
      <div className="flex flex-col h-full bg-[#05051e] relative">
          
          {/* SUCCESS MODAL */}
          {showSuccessModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
                  <div className="bg-[#1a1a3a] border border-green-500/50 p-8 rounded-2xl max-w-md w-full text-center shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400">
                          <Icons.CheckCircle />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Submission Successful!</h3>
                      <p className="text-slate-300 mb-8">Your resume has been forwarded to the Mediator for review. You will be notified once the status changes.</p>
                      <button 
                        onClick={() => setShowSuccessModal(false)}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg w-full transition-colors"
                      >
                          Return to Dashboard
                      </button>
                  </div>
              </div>
          )}

          {/* TOOLBAR */}
          <div className="bg-[#0f0f2d] border-b border-white/10 p-4 flex flex-row justify-between items-center gap-4 shadow-lg z-10">
              <div className="flex items-center gap-4">
                  {!readOnly && (
                      <button onClick={() => setStep('edit')} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold">
                          ← Back to Edit
                      </button>
                  )}
                  {data.status !== 'draft' && <span className="text-white font-bold text-lg">Resume Preview</span>}
              </div>
              
              <div className="flex items-center gap-4">
                  <button onClick={() => window.print()} className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                      <Icons.Download /> <span>Download</span>
                  </button>
                  
                  {!readOnly && (
                      <button 
                          onClick={handleSubmitForReview} 
                          disabled={saveStatus === 'submitting'}
                          className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-green-500/20 transition-transform active:scale-95 disabled:opacity-50"
                      >
                          {saveStatus === 'submitting' ? 'Submitting...' : 'Submit to Mediator'}
                      </button>
                  )}
              </div>
          </div>

          <div className="flex-1 overflow-auto p-8 flex justify-center bg-slate-900/50">
               <div className="w-full max-w-[210mm] flex flex-col gap-6">
                   <StatusBanner />

                   <div className="overflow-x-auto pb-8">
                       <div id="resume-preview" className="bg-white shadow-2xl min-h-[297mm] w-[210mm] min-w-[210mm] text-slate-900 print:shadow-none print:m-0 mx-auto">
                           <ResumePreview data={data} />
                       </div>
                   </div>
               </div>
          </div>
      </div>
  );
};

// ... ResumePreview component logic remains identical, just formatting adjustments for consistent rendering ...
export const ResumePreview: React.FC<{ data: ResumeData }> = ({ data }) => {
    
    // 1. EXECUTIVE
    if (data.templateId === 'executive') {
        return (
            <div className="p-16 h-full font-serif text-slate-900 leading-relaxed max-w-[210mm] mx-auto">
                {/* Header */}
                <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
                    <h1 className="text-4xl font-bold uppercase tracking-widest mb-3">{data.fullName}</h1>
                    <div className="flex justify-center flex-wrap gap-4 text-sm font-medium text-slate-700">
                        {data.email && <span>{data.email}</span>}
                        {data.phone && <span>{data.phone}</span>}
                        {data.location && <span>{data.location}</span>}
                    </div>
                </div>
                
                {/* Summary */}
                {data.summary && (
                    <div className="mb-8">
                        <h3 className="text-sm font-bold uppercase border-b border-slate-300 mb-3 pb-1 tracking-wider">Professional Profile</h3>
                        <p className="text-sm text-justify leading-relaxed">{data.summary}</p>
                    </div>
                )}

                {/* Experience */}
                {data.experience.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-sm font-bold uppercase border-b border-slate-300 mb-4 pb-1 tracking-wider">Professional Experience</h3>
                        <div className="space-y-6">
                            {data.experience.map(exp => (
                                <div key={exp.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-bold text-lg">{exp.company}</h4>
                                        <span className="text-sm italic text-slate-600">{exp.duration}</span>
                                    </div>
                                    <div className="text-sm font-bold text-slate-700 mb-2">{exp.role}</div>
                                    <p className="text-sm whitespace-pre-line leading-relaxed">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Projects */}
                {data.projects.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-sm font-bold uppercase border-b border-slate-300 mb-4 pb-1 tracking-wider">Key Projects</h3>
                        <div className="space-y-4">
                            {data.projects.map(proj => (
                                <div key={proj.id}>
                                    <h4 className="font-bold text-md">{proj.name}</h4>
                                    <p className="text-sm leading-relaxed">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Education */}
                {data.education.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-sm font-bold uppercase border-b border-slate-300 mb-4 pb-1 tracking-wider">Education</h3>
                        {data.education.map(edu => (
                             <div key={edu.id} className="flex justify-between mb-2">
                                 <div><span className="font-bold">{edu.school}</span>, {edu.degree}</div>
                                 <span className="text-sm italic">{edu.year}</span>
                             </div>
                        ))}
                    </div>
                )}
                
                {/* Skills */}
                {data.skills.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-sm font-bold uppercase border-b border-slate-300 mb-4 pb-1 tracking-wider">Core Competencies</h3>
                         <div className="text-sm leading-relaxed">
                            {data.skills.map(s => s.name).join(' • ')}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // 2. MODERN SPLIT
    if (data.templateId === 'modern') {
        return (
            <div className="h-full font-sans flex text-slate-800 bg-white">
                {/* Sidebar */}
                <div className="w-[35%] bg-slate-100 p-8 border-r border-slate-200">
                    <div className="w-32 h-32 bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl text-white font-bold">
                        {data.fullName.charAt(0)}
                    </div>
                    
                    <div className="mb-8">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-300 mb-3 pb-1">Contact</h3>
                        <div className="text-sm space-y-3 break-words">
                            {data.email && <div><strong className="block text-xs text-slate-500 uppercase">Email</strong>{data.email}</div>}
                            {data.phone && <div><strong className="block text-xs text-slate-500 uppercase">Phone</strong>{data.phone}</div>}
                            {data.location && <div><strong className="block text-xs text-slate-500 uppercase">Location</strong>{data.location}</div>}
                        </div>
                    </div>

                    {data.skills.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-300 mb-3 pb-1">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {data.skills.map(s => (
                                    <span key={s.id} className="text-xs bg-white border border-slate-300 px-2 py-1 rounded font-medium shadow-sm">{s.name}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.education.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-300 mb-3 pb-1">Education</h3>
                            {data.education.map(edu => (
                                <div key={edu.id} className="mb-4">
                                    <div className="font-bold text-sm">{edu.school}</div>
                                    <div className="text-xs font-medium text-slate-700">{edu.degree}</div>
                                    <div className="text-xs text-slate-500 mt-1">{edu.year}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="w-[65%] p-10">
                    <div className="mb-10">
                        <h1 className="text-5xl font-bold text-slate-900 uppercase leading-none mb-2">{data.fullName}</h1>
                        <p className="text-xl text-slate-500 font-light">{data.experience[0]?.role || 'Professional'}</p>
                    </div>

                    {data.summary && (
                        <div className="mb-8">
                            <h3 className="text-sm font-bold uppercase text-slate-400 mb-2 tracking-widest">Profile</h3>
                            <p className="text-sm leading-relaxed text-slate-700">{data.summary}</p>
                        </div>
                    )}

                    {data.experience.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-sm font-bold uppercase text-slate-400 mb-6 tracking-widest">Experience</h3>
                            <div className="space-y-8">
                                {data.experience.map(exp => (
                                    <div key={exp.id} className="relative pl-6 border-l-2 border-slate-200">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-4 border-white"></div>
                                        <h4 className="font-bold text-lg text-slate-900">{exp.role}</h4>
                                        <div className="text-sm font-medium text-slate-600 mb-2">{exp.company} | {exp.duration}</div>
                                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.projects.length > 0 && (
                         <div>
                            <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 tracking-widest">Key Projects</h3>
                            <div className="space-y-6">
                                {data.projects.map(proj => (
                                    <div key={proj.id}>
                                        <h4 className="font-bold text-md text-slate-900">{proj.name}</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">{proj.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 3. CLASSIC (Default)
    return (
        <div className="p-12 h-full font-sans text-slate-900 bg-white">
            <div className="border-b-4 border-slate-900 pb-6 mb-8">
                <h1 className="text-4xl font-bold mb-2">{data.fullName}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600 font-medium">
                     <span>{data.email}</span>
                     <span>•</span>
                     <span>{data.phone}</span>
                     {data.location && <><span>•</span><span>{data.location}</span></>}
                </div>
            </div>

            <div className="space-y-8">
                {data.summary && (
                    <section>
                        <h3 className="text-lg font-bold uppercase border-b border-slate-300 mb-3 pb-1">Summary</h3>
                        <p className="text-sm leading-relaxed">{data.summary}</p>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <h3 className="text-lg font-bold uppercase border-b border-slate-300 mb-4 pb-1">Experience</h3>
                        <div className="space-y-6">
                            {data.experience.map(exp => (
                                <div key={exp.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-bold text-lg">{exp.role}</h4>
                                        <span className="text-sm text-slate-600 font-medium">{exp.duration}</span>
                                    </div>
                                    <div className="text-sm font-bold text-slate-700 italic mb-2">{exp.company}</div>
                                    <p className="text-sm whitespace-pre-line leading-relaxed">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                     <section>
                        <h3 className="text-lg font-bold uppercase border-b border-slate-300 mb-4 pb-1">Projects</h3>
                        <div className="space-y-4">
                            {data.projects.map(proj => (
                                <div key={proj.id}>
                                    <h4 className="font-bold text-md">{proj.name}</h4>
                                    <p className="text-sm leading-relaxed">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <h3 className="text-lg font-bold uppercase border-b border-slate-300 mb-4 pb-1">Education & Skills</h3>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                             <h4 className="font-bold text-sm mb-3 text-slate-700 uppercase">Education</h4>
                             {data.education.map(edu => (
                                 <div key={edu.id} className="mb-3">
                                     <div className="font-bold text-sm">{edu.school}</div>
                                     <div className="text-sm text-slate-600">{edu.degree}, {edu.year}</div>
                                 </div>
                             ))}
                        </div>
                        <div>
                             <h4 className="font-bold text-sm mb-3 text-slate-700 uppercase">Skills</h4>
                             <div className="flex flex-wrap gap-2">
                                 {data.skills.map(s => (
                                     <span key={s.id} className="text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-800 font-medium">{s.name}</span>
                                 ))}
                             </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
