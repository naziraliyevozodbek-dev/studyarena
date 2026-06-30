'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Loader2, FileText, Video, Headphones, Download, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';

export default function ResourcesPage() {
  const { user, token } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id && token) fetchResources();
  }, [user, token]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/resources', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
        
      if (!res.ok) throw new Error(data.error);
      setResources(data.resources || []);
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
                        {getIcon(res.file_type)} <span className="ml-1">O'qish / Ko'rish</span>
                      </a>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 z-10 text-text-tertiary group-hover:text-primary transition-colors">
                     <ExternalLink size={20} />
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
