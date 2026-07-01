'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Loader2, Plus, Target, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { toast } from 'sonner';

export default function MentorChallenges() {
  const { user, token } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();
  
  const [courses, setCourses] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [xpReward, setXpReward] = useState('100');
  const [deadline, setDeadline] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    if (user?.id && token) {
      fetchData();
    }
  }, [user, token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await res.json();
      const myCourses = resData.courses || [];
      
      setCourses(myCourses);
      
      if (myCourses && myCourses.length > 0) {
        if (!selectedCourse) setSelectedCourse(myCourses[0].id);
        
        // Fetch challenges
        const challResponse = await fetch('/api/mentor/challenges', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const challData = await challResponse.json();
          
        setChallenges(challData.challenges || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !xpReward || !selectedCourse) return;
    setSaving(true);
    try {
      const response = await fetch('/api/mentor/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: selectedCourse,
          title,
          description,
          xp_reward: parseInt(xpReward) || 0,
          deadline: deadline || null
        })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) throw new Error(responseData.error || 'Failed to save challenge');
      
      setChallenges(prev => [responseData.challenge, ...prev]);
      setShowModal(false);
      setTitle('');
      setDescription('');
      setXpReward('100');
      setDeadline('');
      toast.success("Challenge created successfully");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Haqiqatan ham ushbu challengeni o`chirmoqchimisiz?')) return;
    
    try {
      const response = await fetch(`/api/mentor/challenges?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const responseData = await response.json();
      
      if (!response.ok) throw new Error(responseData.error || 'Failed to delete challenge');
      
      setChallenges(prev => prev.filter(c => c.id !== id));
      toast.success("Challenge o'chirildi");
    } catch (error: any) {
      toast.error("Xatolik: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <>
      <div className="animate-fade-in pb-24 relative">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-primary">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-text-main">Challenges</h1>
        </div>
      </div>

      <div className="w-full">
        {challenges.length === 0 ? (
          <Card padding="lg" className="text-center border-dashed">
            <Target size={32} className="mx-auto text-text-tertiary mb-4" />
            <h2 className="text-lg font-semibold text-text-main mb-1">No Challenges</h2>
            <p className="text-sm text-text-secondary mb-4">Create competitive challenges for students.</p>
            <Button onClick={() => setShowModal(true)}>Add Challenge</Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {challenges.map(ch => (
              <div key={ch.id} className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-primary/40 via-bg-secondary to-primary/10 hover:from-primary/60 hover:to-primary/30 transition-all shadow-sm cursor-pointer" onClick={() => router.push(`/mentor/challenges/${ch.id}`)}>
                <Card padding="md" className="h-full w-full rounded-[15px] border-none flex flex-col gap-3 relative overflow-hidden bg-bg-card">
                  
                  {/* Decorative Elements */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
                  
                  <div className="flex justify-between items-start z-10 relative">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase tracking-wider">{ch.courses?.title}</span>
                      </div>
                      <h3 className="font-bold text-text-main text-lg leading-tight">{ch.title}</h3>
                    </div>
                    <div className="flex items-center justify-center shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-black shadow-lg shadow-yellow-500/20">
                      +{ch.xp_reward}
                    </div>
                  </div>
                  
                  <div className="z-10 relative">
                    <p className="text-sm text-text-secondary leading-relaxed bg-bg-secondary/50 p-3 rounded-lg border border-border/50">
                      {ch.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex justify-end z-10 relative mt-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(ch.id); }}
                      className="text-xs font-bold text-red-500 hover:text-white hover:bg-red-500 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={14} /> O'chirish
                    </button>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Challenge">
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <Select 
                label="Course"
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                required
              >
                <option value="" disabled>Select course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Select>

              <Input 
                label="Challenge Title (Maqsadi)"
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required 
                placeholder="Masalan: 100 ta yangi so'z yodlash" 
              />

              <Input 
                label="Qanday bajarish kerak? (Qoidalar)"
                type="text" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                required 
                placeholder="Masalan: Har kuni 20 tadan so'z yodlab, testdan o'tish..." 
              />

              <div className="flex gap-3">
                <div className="flex-1">
                  <Input 
                    label="XP Reward"
                    type="number" 
                    value={xpReward} 
                    onChange={e => setXpReward(e.target.value)} 
                    required 
                    placeholder="100" 
                  />
                </div>
                <div className="flex-1">
                  <DatePicker 
                    label="Deadline"
                    value={deadline} 
                    onChange={val => setDeadline(val)} 
                  />
                </div>
              </div>

              <Button type="submit" disabled={saving} className="mt-4">
                {saving ? <Loader2 className="animate-spin" /> : 'Create Challenge'}
              </Button>
            </form>
      </Modal>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-active transition-transform active:scale-95 z-50"
      >
        <Plus size={24} />
      </button>
    </>
  );
}
