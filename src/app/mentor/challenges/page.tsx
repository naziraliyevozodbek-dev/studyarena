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
    <div className="animate-fade-in pb-24 relative">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-primary">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-text-main">Challenges</h1>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="px-3 py-1.5 h-auto text-xs">
          <Plus size={16} className="mr-1" /> New
        </Button>
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
          <div className="grid gap-3">
            {challenges.map(ch => (
              <Card key={ch.id} padding="md" className="flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                  {ch.xp_reward} XP
                </div>
                <div className="pr-12">
                  <h3 className="font-semibold text-text-main text-base mb-1">{ch.title}</h3>
                  <div className="text-xs text-text-secondary flex gap-2">
                    <span className="font-medium px-2 py-0.5 rounded bg-bg-secondary">{ch.courses?.title}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(ch.id)}
                  className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </Card>
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
                label="Title"
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required 
                placeholder="e.g. Read 5 articles" 
              />

              <Input 
                label="Description"
                type="text" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                required 
                placeholder="Rules..." 
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
                  <Input 
                    label="Deadline"
                    type="date" 
                    value={deadline} 
                    onChange={e => setDeadline(e.target.value)} 
                  />
                </div>
              </div>

              <Button type="submit" disabled={saving} className="mt-4">
                {saving ? <Loader2 className="animate-spin" /> : 'Create Challenge'}
              </Button>
            </form>
      </Modal>
    </div>
  );
}
