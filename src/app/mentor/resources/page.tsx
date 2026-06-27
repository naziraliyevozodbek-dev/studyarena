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
      // Fetch my courses
      const { data: myCourses } = await supabase
        .from('courses')
        .select('id, title');
      
      setCourses(myCourses || []);
      
      if (myCourses && myCourses.length > 0) {
        if (!selectedCourse) setSelectedCourse(myCourses[0].id);
        
        // Fetch resources
        const { data: resData } = await supabase
          .from('resources')
          .select('id, course_id, title, description, file_url, file_type, created_at, courses(title)')
          .order('created_at', { ascending: false });
          
        setResources(resData || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileUrl || !selectedCourse) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .insert([{
          course_id: selectedCourse,
          title,
          description,
          file_url: fileUrl,
          file_type: fileType
        }])
        .select('*, courses(title)')
        .single();
        
      if (error) throw error;
      
      setResources(prev => [data, ...prev]);
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
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
      setResources(prev => prev.filter(r => r.id !== id));
      toast.success("Resource deleted!");
    } catch (error: any) {
      toast.error("Error: " + error.message);
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
          <h1 className="text-2xl font-bold text-text-main">Manage Resources</h1>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="px-3 py-1.5 h-auto text-xs">
          <Plus size={16} className="mr-1" /> New
        </Button>
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
          <div className="grid gap-3">
            {resources.map(res => (
              <Card key={res.id} padding="md" className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-text-main text-base mb-1">{res.title}</h3>
                  <div className="text-xs text-text-secondary flex gap-2">
                    <span className="font-medium px-2 py-0.5 rounded bg-bg-secondary">{res.file_type}</span>
                    <span>• {res.courses?.title}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(res.id)}
                  className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </Card>
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
  );
}
