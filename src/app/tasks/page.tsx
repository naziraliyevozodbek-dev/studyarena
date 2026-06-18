'use client';

import { useState } from 'react';
import { Target, CheckSquare, Clock, Upload, CheckCircle2, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<'homework' | 'challenges'>('homework');

  return (
    <div className="animate-fade-in">
      <h1 className="text-h1 mb-4 text-center">Tasks</h1>

      {/* Tabs */}
      <div className="flex bg-bg-secondary rounded-[var(--radius-button)] p-1 mb-6">
        <button 
          className={`flex-1 py-2 rounded-[var(--radius-button)] font-bold text-sm transition-all ${activeTab === 'homework' ? 'bg-bg-card shadow-sm text-primary' : 'text-text-secondary'}`}
          onClick={() => setActiveTab('homework')}
        >
          Homework
        </button>
        <button 
          className={`flex-1 py-2 rounded-[var(--radius-button)] font-bold text-sm transition-all ${activeTab === 'challenges' ? 'bg-bg-card shadow-sm text-primary' : 'text-text-secondary'}`}
          onClick={() => setActiveTab('challenges')}
        >
          Challenges
        </button>
      </div>

      {activeTab === 'homework' && (
        <>
          <h2 className="text-h2 mb-4">Pending</h2>
          
          <Card className="border-b-4 border-b-primary relative">
            <div className="absolute top-4 right-4 text-yellow-500 font-bold flex items-center gap-1">
              +50 XP
            </div>
            <h3 className="font-bold text-lg text-text-main mb-2 pr-16">Unit 3: Verbs</h3>
            <p className="text-body text-text-secondary mb-4">Write 5 sentences using regular verbs in present tense.</p>
            
            <div className="flex items-center gap-2 text-sm font-bold text-orange-500 mb-4">
              <Clock size={16} /> Due in 2 days
            </div>

            <Button variant="secondary" className="w-full text-sm">
              <Upload size={18} /> SUBMIT WORK
            </Button>
          </Card>

          <h2 className="text-h2 mb-4 mt-8">Completed</h2>
          <Card className="opacity-60">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-text-main mb-1">Unit 2: Nouns</h3>
                <p className="text-xs font-bold text-green-500 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Graded: 10/10
                </p>
              </div>
              <div className="text-sm font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md">
                +40 XP
              </div>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'challenges' && (
        <>
          <div className="bg-yellow-500/10 border-2 border-yellow-500/20 rounded-2xl p-6 mb-6 text-center">
            <Target size={48} className="mx-auto text-yellow-500 mb-3" />
            <h3 className="text-h2 text-yellow-500 mb-2">Daily Quests</h3>
            <p className="text-sm text-yellow-600 font-bold">Complete quests to earn bonus XP!</p>
          </div>

          <Card className="flex items-center gap-4 border-b-4 border-b-border">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookOpen size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <h4 className="font-bold text-text-main">Learn 10 new words</h4>
                <span className="font-bold text-yellow-500">+15 XP</span>
              </div>
              <div className="progress-bg h-3">
                <div className="progress-fill bg-primary" style={{ width: '80%' }}></div>
              </div>
              <p className="text-xs text-text-tertiary mt-1 font-bold text-right">8 / 10</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 border-b-4 border-b-green-500 bg-green-500/5 mt-4">
            <div className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
              <CheckSquare size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <h4 className="font-bold text-green-600">Submit 1 Homework</h4>
                <span className="font-bold text-yellow-500">+30 XP</span>
              </div>
              <div className="progress-bg h-3 bg-green-500/20">
                <div className="progress-fill bg-green-500" style={{ width: '100%' }}></div>
              </div>
              <p className="text-xs text-green-600 mt-1 font-bold text-right">Completed!</p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
