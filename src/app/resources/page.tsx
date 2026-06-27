'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Loader2, FileText, Video, Headphones, Download, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';

export default function ResourcesPage() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchResources();
  }, [user]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select(`
          id, title, description, file_url, file_type, created_at,
          courses (title)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={24} className="text-blue-500" />;
      case 'audio': return <Headphones size={24} className="text-purple-500" />;
      case 'pdf': return <FileText size={24} className="text-red-500" />;
      default: return <Download size={24} className="text-gray-500" />;
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
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center pt-4 mb-6">
        <button onClick={() => router.back()} className="mr-4 text-primary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-text-main">Resources</h1>
      </div>

      <div className="w-full">
        {resources.length === 0 ? (
          <Card padding="lg" className="text-center border-dashed">
            <FileText size={32} className="mx-auto text-text-tertiary mb-4" />
            <h2 className="text-lg font-semibold text-text-main mb-1">No Resources</h2>
            <p className="text-sm text-text-secondary">Your mentors haven't uploaded any resources yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {resources.map(res => (
              <a href={res.file_url} target="_blank" rel="noopener noreferrer" key={res.id}>
                <Card interactive padding="md" className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-bg-secondary flex items-center justify-center shrink-0">
                    {getIcon(res.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-main text-base truncate">{res.title}</h3>
                    <p className="text-xs text-text-tertiary mb-1">
                      {res.courses?.title} • {new Date(res.created_at).toLocaleDateString()}
                    </p>
                    {res.description && (
                      <p className="text-sm text-text-secondary line-clamp-2">{res.description}</p>
                    )}
                  </div>
                  <ExternalLink size={18} className="text-text-tertiary shrink-0 mt-2" />
                </Card>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
