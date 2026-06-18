'use client';

import { useState } from 'react';
import { Plus, CheckCircle, XCircle, Search, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function MentorHomework() {
  const [activeTab, setActiveTab] = useState<'review' | 'manage'>('review');

  const submissions = [
    { id: 1, student: 'Alex M.', task: 'Unit 3: Verbs', status: 'pending', date: '2h ago' },
    { id: 2, student: 'Sarah K.', task: 'Unit 3: Verbs', status: 'pending', date: '5h ago' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-h1 m-0">Homework</h1>
      </div>

      <div className="flex bg-bg-secondary rounded-[var(--radius-button)] p-1 mb-6">
        <button 
          onClick={() => setActiveTab('review')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[var(--radius-button)] text-xs font-bold transition-all ${activeTab === 'review' ? 'bg-bg-card shadow-sm text-primary' : 'text-text-secondary hover:text-text-main'}`}
        >
          To Review <span className="bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded text-[10px]">2</span>
        </button>
        <button 
          onClick={() => setActiveTab('manage')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[var(--radius-button)] text-xs font-bold transition-all ${activeTab === 'manage' ? 'bg-bg-card shadow-sm text-primary' : 'text-text-secondary hover:text-text-main'}`}
        >
          Manage Tasks
        </button>
      </div>

      {activeTab === 'review' && (
        <div className="space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
            <Input type="text" placeholder="Search student..." className="pl-9 mb-0" />
          </div>

          {submissions.map(sub => (
            <Card key={sub.id} className="m-0 p-4 border-l-4 border-l-orange-400">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-text-main">{sub.student}</h4>
                  <p className="text-xs text-text-secondary">{sub.task}</p>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-text-tertiary">
                  <Clock size={12} /> {sub.date}
                </span>
              </div>
              
              <div className="bg-bg-secondary p-3 rounded-md border border-border mb-4 text-sm text-text-main font-mono">
                "Ich habe einen Apfel gegessen."
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 py-2 text-xs border-red-200 text-red-500 hover:bg-red-50">
                  <XCircle size={16} /> REJECT
                </Button>
                <Button variant="outline" className="flex-1 py-2 text-xs border-green-500/30 text-green-600 bg-green-500/5 hover:bg-green-500/10">
                  <CheckCircle size={16} /> APPROVE (+50 XP)
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-4">
          <Button variant="primary" className="w-full py-3">
            <Plus size={18} /> Create New Homework
          </Button>
          
          <Card className="m-0 p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-text-main">Unit 3: Verbs</h4>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Active</span>
            </div>
            <p className="text-xs text-text-secondary mb-2">Write 5 sentences using regular verbs.</p>
            <div className="flex gap-4 text-xs font-semibold text-text-secondary">
              <span>XP: 50</span>
              <span>Deadline: Oct 24</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
