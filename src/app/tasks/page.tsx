'use client';

import { useState } from 'react';
import { Target, CheckSquare, Clock, Upload, CheckCircle2 } from 'lucide-react';

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<'homework' | 'challenges'>('homework');

  return (
    <div className="animate-fade-in">
      <h1 className="text-h1 mb-4 text-center">Tasks</h1>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-full p-1 mb-6">
        <button 
          className={`flex-1 py-2 rounded-full font-bold text-sm ${activeTab === 'homework' ? 'bg-white shadow-sm text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('homework')}
        >
          Homework
        </button>
        <button 
          className={`flex-1 py-2 rounded-full font-bold text-sm ${activeTab === 'challenges' ? 'bg-white shadow-sm text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('challenges')}
        >
          Challenges
        </button>
      </div>

      {activeTab === 'homework' && (
        <>
          <h2 className="text-h2 mb-4">Pending</h2>
          
          <div className="card border-blue-500 border-b-4 relative">
            <div className="absolute top-4 right-4 text-yellow-500 font-bold flex items-center gap-1">
              +50 XP
            </div>
            <h3 className="font-bold text-lg mb-2 pr-16">Unit 3: Verbs</h3>
            <p className="text-body text-gray-500 mb-4">Write 5 sentences using regular verbs in present tense.</p>
            
            <div className="flex items-center gap-2 text-sm font-bold text-orange-500 mb-4">
              <Clock size={16} /> Due in 2 days
            </div>

            <button className="btn btn-secondary py-3 text-sm">
              <Upload size={18} /> SUBMIT WORK
            </button>
          </div>

          <h2 className="text-h2 mb-4 mt-8">Completed</h2>
          <div className="card opacity-60">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Unit 2: Nouns</h3>
                <p className="text-xs font-bold text-green-500 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Graded: 10/10
                </p>
              </div>
              <div className="text-sm font-bold text-yellow-500 bg-yellow-100 px-2 py-1 rounded-md">
                +40 XP
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'challenges' && (
        <>
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-6 text-center">
            <Target size={48} className="mx-auto text-yellow-500 mb-3" />
            <h3 className="text-h2 text-yellow-800 mb-2">Daily Quests</h3>
            <p className="text-sm text-yellow-600 font-bold">Complete quests to earn bonus XP!</p>
          </div>

          <div className="card flex items-center gap-4 border-b-4 border-gray-200">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center shrink-0">
              <BookOpen size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <h4 className="font-bold">Learn 10 new words</h4>
                <span className="font-bold text-yellow-500">+15 XP</span>
              </div>
              <div className="progress-bg h-3">
                <div className="progress-fill bg-blue-500" style={{ width: '80%' }}></div>
              </div>
              <p className="text-xs text-gray-400 mt-1 font-bold text-right">8 / 10</p>
            </div>
          </div>

          <div className="card flex items-center gap-4 border-b-4 border-green-500 bg-green-50">
            <div className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
              <CheckSquare size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <h4 className="font-bold text-green-800">Submit 1 Homework</h4>
                <span className="font-bold text-yellow-500">+30 XP</span>
              </div>
              <div className="progress-bg h-3 bg-green-200">
                <div className="progress-fill bg-green-500" style={{ width: '100%' }}></div>
              </div>
              <p className="text-xs text-green-600 mt-1 font-bold text-right">Completed!</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Just importing BookOpen locally for challenges icon
import { BookOpen } from 'lucide-react';
