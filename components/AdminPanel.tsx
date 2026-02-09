
import React, { useState, useEffect } from 'react';
import { User, SystemMetrics } from '../types';
import { db } from '../services/db';
import { Icons } from '../constants';

export const AdminPanel: React.FC = () => {
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const m = await db.getSystemMetrics();
        const u = await db.getAllUsers();
        setMetrics(m);
        setUsers(u);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">System Administration</h2>
            
            <div className="flex gap-4 mb-6 border-b border-white/10">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`pb-2 px-4 text-sm font-medium transition-colors ${activeTab === 'overview' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
                >
                    System Overview
                </button>
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`pb-2 px-4 text-sm font-medium transition-colors ${activeTab === 'users' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
                >
                    User Management
                </button>
            </div>

            {activeTab === 'overview' && metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                    <div className="bg-[#0f0f2d] p-6 rounded-xl border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-slate-400 text-sm">Total Users</span>
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Icons.Briefcase /></div>
                        </div>
                        <p className="text-3xl font-bold text-white">{metrics.totalUsers}</p>
                    </div>

                    <div className="bg-[#0f0f2d] p-6 rounded-xl border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-slate-400 text-sm">Resumes Created</span>
                            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Icons.FileText /></div>
                        </div>
                        <p className="text-3xl font-bold text-white">{metrics.resumesCreated}</p>
                    </div>

                    <div className="bg-[#0f0f2d] p-6 rounded-xl border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-slate-400 text-sm">Pending Reviews</span>
                            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400"><Icons.AlertCircle /></div>
                        </div>
                        <p className="text-3xl font-bold text-white">{metrics.pendingReviews}</p>
                    </div>

                    <div className="bg-[#0f0f2d] p-6 rounded-xl border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-slate-400 text-sm">System Health</span>
                            <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><Icons.CheckCircle /></div>
                        </div>
                        <p className="text-3xl font-bold text-white">{metrics.systemHealth}</p>
                        <p className="text-xs text-slate-500 mt-1">{metrics.aiApiCalls} API Calls (24h)</p>
                    </div>

                    <div className="col-span-1 lg:col-span-2 bg-[#0f0f2d] p-6 rounded-xl border border-white/10">
                        <h3 className="font-bold text-white mb-4">AI Configuration</h3>
                        <div className="space-y-4">
                             <div className="flex justify-between items-center bg-[#1a1a3a] p-3 rounded-lg">
                                 <div>
                                     <p className="text-sm text-white font-medium">Model Version</p>
                                     <p className="text-xs text-slate-500">Gemini 1.5 Flash</p>
                                 </div>
                                 <span className="text-green-400 text-xs font-bold px-2 py-1 bg-green-500/10 rounded">Active</span>
                             </div>
                             <div className="flex justify-between items-center bg-[#1a1a3a] p-3 rounded-lg">
                                 <div>
                                     <p className="text-sm text-white font-medium">Content Safety</p>
                                     <p className="text-xs text-slate-500">Strict Filtering Enabled</p>
                                 </div>
                                 <button className="text-cyan-400 text-xs hover:underline">Configure</button>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="bg-[#0f0f2d] rounded-xl border border-white/10 overflow-hidden animate-fade-in">
                    <table className="w-full text-left">
                        <thead className="bg-[#1a1a3a] border-b border-white/10">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase">User</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Role</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Plan</th>
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
                                    <td className="p-4 text-right">
                                        <button className="text-xs text-slate-400 hover:text-white">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
