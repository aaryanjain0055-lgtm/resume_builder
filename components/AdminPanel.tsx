
import React, { useState, useEffect } from 'react';
import { User, SystemMetrics, ResumeData, AccessLog } from '../types';
import { db } from '../services/db';
import { Icons } from '../constants';
import { ResumePreview } from './ResumeForm';

export const AdminPanel: React.FC = () => {
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [allResumes, setAllResumes] = useState<ResumeData[]>([]);
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    
    // View State
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'resumes' | 'pending' | 'logs'>('overview');
    const [selectedResume, setSelectedResume] = useState<ResumeData | null>(null);

    useEffect(() => {
        loadData();
    }, [activeTab]); // Reload when tab changes to refresh data

    const loadData = async () => {
        const m = await db.getSystemMetrics();
        const u = await db.getAllUsers();
        const r = await db.getAllResumes();
        const l = await db.getAccessLogs();
        setMetrics(m);
        setUsers(u);
        setAllResumes(r);
        setAccessLogs(l);
    };

    const getPendingResumes = () => allResumes.filter(r => r.status === 'pending_review' || r.status === 'forwarded_to_admin');

    const handleAdminDecision = async (resume: ResumeData, decision: 'hired' | 'rejected' | 'forwarded_to_admin') => {
        if(!resume.id) return;
        if(confirm(`Are you sure you want to mark this resume as ${decision}?`)) {
            await db.reviewResume(resume.id, decision, decision === 'hired' ? 'Congratulations! You are hired.' : 'Application rejected by Admin.');
            alert("Status Updated");
            loadData();
            setSelectedResume(null);
        }
    };

    // --- RESUME MODAL ---
    const ResumeReviewModal = () => {
        if (!selectedResume) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                <div className="bg-[#0f0f2d] w-full max-w-6xl h-[90vh] rounded-2xl flex flex-row overflow-hidden border border-white/10">
                    <div className="w-1/3 p-6 border-r border-white/10 flex flex-col overflow-y-auto">
                        <button onClick={() => setSelectedResume(null)} className="mb-4 text-slate-400 hover:text-white flex items-center gap-1">← Back</button>
                        <h2 className="text-xl font-bold text-white mb-1">{selectedResume.fullName}</h2>
                        <span className={`text-xs w-fit px-2 py-1 rounded font-bold uppercase mb-6 ${
                            selectedResume.status === 'hired' ? 'bg-green-500/20 text-green-400' :
                            selectedResume.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-amber-500/20 text-amber-400'
                        }`}>{selectedResume.status.replace(/_/g, " ")}</span>

                        <div className="space-y-2 mb-6 text-sm text-slate-300">
                             <p><strong>Email:</strong> {selectedResume.email}</p>
                             <p><strong>Role:</strong> {selectedResume.experience[0]?.role || 'N/A'}</p>
                             <p><strong>Last Updated:</strong> {new Date(selectedResume.updatedAt || 0).toLocaleDateString()}</p>
                        </div>

                        {selectedResume.status === 'forwarded_to_admin' || selectedResume.status === 'pending_review' ? (
                            <div className="mt-auto space-y-3">
                                <p className="text-xs text-slate-500 mb-2">Admin Actions</p>
                                <button onClick={() => handleAdminDecision(selectedResume, 'hired')} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold">Accept & Hire</button>
                                <button onClick={() => handleAdminDecision(selectedResume, 'rejected')} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold">Reject Application</button>
                                {selectedResume.status === 'pending_review' && (
                                     <button onClick={() => handleAdminDecision(selectedResume, 'forwarded_to_admin')} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold">Approve (Mediator Override)</button>
                                )}
                            </div>
                        ) : (
                            <div className="mt-auto p-4 bg-white/5 rounded text-center text-slate-500 text-sm">
                                Decision finalized.
                            </div>
                        )}
                    </div>
                    <div className="w-2/3 bg-white overflow-y-auto p-8">
                         <div className="overflow-x-auto">
                             <div className="min-w-[210mm] mx-auto">
                                <ResumePreview data={selectedResume} />
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-20">
            {selectedResume && <ResumeReviewModal />}
            
            <h2 className="text-2xl font-bold text-white mb-6">System Administration</h2>
            
            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-4 mb-6 border-b border-white/10 overflow-x-auto pb-1">
                {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'users', label: 'User Management' },
                    { id: 'resumes', label: 'All Resumes' },
                    { id: 'pending', label: 'Pending Approvals' },
                    { id: 'logs', label: 'Access Logs' }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-2 px-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && metrics && (
                // Fixed grid-cols-4
                <div className="grid grid-cols-4 gap-6 animate-fade-in">
                    <div onClick={() => setActiveTab('users')} className="bg-[#0f0f2d] p-6 rounded-xl border border-white/10 cursor-pointer hover:border-cyan-500/50 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-slate-400 text-sm group-hover:text-white">Total Users</span>
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Icons.Briefcase /></div>
                        </div>
                        <p className="text-3xl font-bold text-white">{metrics.totalUsers}</p>
                    </div>

                    <div onClick={() => setActiveTab('resumes')} className="bg-[#0f0f2d] p-6 rounded-xl border border-white/10 cursor-pointer hover:border-cyan-500/50 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-slate-400 text-sm group-hover:text-white">Resumes Created</span>
                            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Icons.FileText /></div>
                        </div>
                        <p className="text-3xl font-bold text-white">{metrics.resumesCreated}</p>
                    </div>

                    <div onClick={() => setActiveTab('pending')} className="bg-[#0f0f2d] p-6 rounded-xl border border-white/10 cursor-pointer hover:border-cyan-500/50 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-slate-400 text-sm group-hover:text-white">Pending Reviews</span>
                            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400"><Icons.AlertCircle /></div>
                        </div>
                        <p className="text-3xl font-bold text-white">{getPendingResumes().length}</p>
                        <p className="text-xs text-amber-500 mt-1">Requires Action</p>
                    </div>

                    <div className="bg-[#0f0f2d] p-6 rounded-xl border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-slate-400 text-sm">System Health</span>
                            <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><Icons.CheckCircle /></div>
                        </div>
                        <p className="text-3xl font-bold text-white">{metrics.systemHealth}</p>
                        <p className="text-xs text-slate-500 mt-1">{metrics.aiApiCalls} API Calls (24h)</p>
                    </div>

                    {/* Who is accessing visualization */}
                    <div className="col-span-4 bg-[#0f0f2d] p-6 rounded-xl border border-white/10">
                        <h3 className="font-bold text-white mb-4">Live User Activity (Recent Logins)</h3>
                        <div className="flex flex-wrap gap-4">
                            {users.filter(u => u.lastLogin && (Date.now() - u.lastLogin < 86400000)).map(u => (
                                <div key={u.id} className="flex items-center gap-3 bg-[#1a1a3a] p-3 rounded-lg border border-white/5">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-white text-xs">
                                        {u.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{u.name}</p>
                                        <p className="text-xs text-slate-400">{new Date(u.lastLogin || 0).toLocaleTimeString()}</p>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-2"></div>
                                </div>
                            ))}
                            {users.filter(u => u.lastLogin && (Date.now() - u.lastLogin < 86400000)).length === 0 && (
                                <p className="text-slate-500 text-sm italic">No active sessions in last 24h.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
                <div className="bg-[#0f0f2d] rounded-xl border border-white/10 overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-[#1a1a3a] border-b border-white/10">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase">User</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase">Role</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase">Plan</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase">Last Login</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <p className="text-sm font-bold text-white">{u.name}</p>
                                            <p className="text-xs text-slate-500">{u.email}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                                                u.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                                                u.role === 'MEDIATOR' ? 'bg-purple-500/20 text-purple-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-300 capitalize">{u.plan}</td>
                                        <td className="p-4 text-xs text-slate-400">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</td>
                                        <td className="p-4 text-right">
                                            <button className="text-xs text-slate-400 hover:text-white">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ALL RESUMES TAB */}
            {activeTab === 'resumes' && (
                <div className="bg-[#0f0f2d] rounded-xl border border-white/10 overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-[#1a1a3a] border-b border-white/10">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase">Candidate</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase">Role</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {allResumes.map((r) => (
                                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <p className="text-sm font-bold text-white">{r.fullName}</p>
                                            <p className="text-xs text-slate-500">{r.email}</p>
                                        </td>
                                        <td className="p-4 text-sm text-slate-300">{r.experience[0]?.role || 'N/A'}</td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                                                r.status === 'hired' ? 'bg-green-500/20 text-green-400' : 
                                                r.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 
                                                'bg-amber-500/20 text-amber-400'
                                            }`}>
                                                {r.status.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => setSelectedResume(r)} className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded">View</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PENDING TAB */}
            {activeTab === 'pending' && (
                // Fixed grid-cols-3
                 <div className="grid grid-cols-3 gap-6 animate-fade-in">
                    {getPendingResumes().length === 0 ? (
                        <div className="col-span-3 text-center py-10 text-slate-500">No pending approvals.</div>
                    ) : (
                        getPendingResumes().map(r => (
                            <div key={r.id} className="bg-[#0f0f2d] border border-white/10 rounded-xl p-6 shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-white">{r.fullName}</h3>
                                    <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded uppercase font-bold">{r.status === 'pending_review' ? 'In Mediator Queue' : 'Forwarded'}</span>
                                </div>
                                <p className="text-sm text-slate-300 mb-4">{r.experience[0]?.role || 'Unknown Role'}</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setSelectedResume(r)} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold py-2 rounded">Review</button>
                                </div>
                            </div>
                        ))
                    )}
                 </div>
            )}

            {/* LOGS TAB */}
            {activeTab === 'logs' && (
                <div className="bg-[#0f0f2d] rounded-xl border border-white/10 overflow-hidden animate-fade-in">
                     <div className="overflow-x-auto">
                         <table className="w-full text-left min-w-[500px]">
                            <thead className="bg-[#1a1a3a] border-b border-white/10">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase">Timestamp</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase">User</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {accessLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-xs text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="p-4 text-sm text-white font-bold">{log.userName}</td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                                                log.action === 'Login' ? 'bg-green-500/20 text-green-400' :
                                                log.action === 'Logout' ? 'bg-slate-500/20 text-slate-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
