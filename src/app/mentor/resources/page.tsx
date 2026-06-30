'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Loader2, Plus, BookOpen, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';

export default function MentorResources() {
  const { user, token } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();
  
  const [courses, setCourses] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('other');
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
        
        // Fetch resources
        const resResponse = await fetch('/api/mentor/resources', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await resResponse.json();
          
        setResources(resData.resources || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating resource...");
    if (!title || !fileUrl || !selectedCourse) return;
    setSaving(true);
    try {
      const response = await fetch('/api/mentor/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: selectedCourse,
          title,
          description,
          file_url: fileUrl,
          file_type: fileType
        })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) throw new Error(responseData.error || 'Failed to save resource');
      
      setResources(prev => [responseData.resource, ...prev]);
      setShowModal(false);
      setTitle('');
      setDescription('');
      setFileUrl('');
      setFileType('other');
      toast.success("Resource saved successfully!");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Haqiqatan ham ushbu resursni o`chirmoqchimisiz?')) return;
    
    try {
      const response = await fetch(`/api/mentor/resources?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const responseData = await response.json();
      
      if (!response.ok) throw new Error(responseData.error || 'Failed to delete resource');
      
      setResources(prev => prev.filter(r => r.id !== id));
      toast.success("Resurs o'chirildi");
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
          <h1 className="text-2xl font-bold text-text-main">Manage Resources</h1>
        </div>
      </div>

      <div className="w-full">
        {resources.length === 0 ? (
          <Card padding="lg" className="text-center border-dashed">
            <BookOpen size={32} className="mx-auto text-text-tertiary mb-4" />
            <h2 className="text-lg font-semibold text-text-main mb-1">No Resources</h2>
            <p className="text-sm text-text-secondary mb-4">Share files, videos, or links with your students.</p>
            <Button onClick={() => setShowModal(true)}>Add Resource</Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {resources.map(res => (
              <div key={res.id} className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-primary/40 via-bg-secondary to-primary/10 hover:from-primary/60 hover:to-primary/30 transition-all shadow-sm">
                <Card padding="md" className="h-full w-full rounded-[15px] border-none flex flex-col gap-3 relative overflow-hidden bg-bg-card">
                  
                  <div className="flex justify-between items-start z-10 relative">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase tracking-wider">{res.file_type}</span>
                        <span className="text-xs text-text-tertiary font-medium">• {res.courses?.title}</span>
                      </div>
                      <h3 className="font-bold text-text-main text-lg leading-tight mb-2">{res.title}</h3>
                      {res.description && (
                         <p className="text-sm text-text-secondary leading-relaxed bg-bg-secondary/50 p-3 rounded-lg border border-border/50 mb-3">
                           {res.description}
                         </p>
                      )}
                      
                      <a 
                        href={res.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex text-sm items-center gap-2 text-white bg-primary hover:bg-primary-active px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
                      >
                        <BookOpen size={16} /> O'qish / Ko'rish
                      </a>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 z-10">
                    <button 
                      onClick={() => handleDelete(res.id)}
                      className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                      title="O'chirish"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Resource">
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
                placeholder="e.g. Grammar PDF" 
              />

              <Input 
                label="Description (Optional)"
                type="text" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Short note..." 
              />

              <div className="flex gap-3">
                <div className="flex-[2]">
                  <Input 
                    label="Link / URL"
                    type="url" 
                    value={fileUrl} 
                    onChange={e => setFileUrl(e.target.value)} 
                    required 
                    placeholder="https://..." 
                  />
                </div>
                <div className="flex-1">
                  <Select 
                    label="Type"
                    value={fileType} 
                    onChange={(e) => setFileType(e.target.value)}
                  >
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="other">Other</option>
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={saving} className="mt-4">
                {saving ? <Loader2 className="animate-spin" /> : 'Save Resource'}
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
