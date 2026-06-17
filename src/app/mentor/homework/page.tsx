'use client';

import { useState } from 'react';
import { Plus, CheckCircle, XCircle, Search, Clock } from 'lucide-react';

export default function MentorHomework() {
  const [activeTab, setActiveTab] = useState<'review' | 'manage'>('review');

  const submissions = [
    { id: 1, student: 'Alex M.', task: 'Unit 3: Verbs', status: 'pending', date: '2h ago' },
    { id: 2, student: 'Sarah K.', task: 'Unit 3: Verbs', status: 'pending', date: '5h ago' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="saas-header m-0">Homework</h1>
      </div>

      <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
        <button 
          onClick={() => setActiveTab('review')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'review' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
        >
          To Review <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px]">2</span>
        </button>
        <button 
          onClick={() => setActiveTab('manage')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'manage' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Manage Tasks
        </button>
      </div>

      {activeTab === 'review' && (
        <div className="space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search student..." className="saas-input pl-9 mb-0" />
          </div>

          {submissions.map(sub => (
            <div key={sub.id} className="saas-card m-0 p-4 border-l-4 border-l-orange-400">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-slate-900">{sub.student}</h4>
                  <p className="text-xs text-slate-500">{sub.task}</p>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <Clock size={12} /> {sub.date}
                </span>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-md border border-slate-100 mb-4 text-sm text-slate-700 font-mono">
                "Ich habe einen Apfel gegessen."
              </div>

              <div className="flex gap-2">
                <button className="flex-1 saas-btn py-2 text-xs border border-red-200 text-red-600 hover:bg-red-50">
                  <XCircle size={16} /> REJECT
                </button>
                <button className="flex-1 saas-btn py-2 text-xs border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100">
                  <CheckCircle size={16} /> APPROVE (+50 XP)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-4">
          <button className="saas-btn saas-btn-primary w-full py-3">
            <Plus size={18} /> Create New Homework
          </button>
          
          <div className="saas-card m-0 p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-slate-900">Unit 3: Verbs</h4>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Active</span>
            </div>
            <p className="text-xs text-slate-500 mb-2">Write 5 sentences using regular verbs.</p>
            <div className="flex gap-4 text-xs font-semibold text-slate-500">
              <span>XP: 50</span>
              <span>Deadline: Oct 24</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
