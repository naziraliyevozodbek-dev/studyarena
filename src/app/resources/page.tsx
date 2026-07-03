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
              <div key={res.id} className="relative group bg-bg-card rounded-[20px] p-5 border border-border/40 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                      {res.file_type}
                    </span>
                    <span className="text-[11px] text-text-tertiary font-medium bg-bg-secondary/50 px-2.5 py-1 rounded-full">
                      {res.courses?.title}
                    </span>
                  </div>
                  
                  <div className="text-text-tertiary group-hover:text-primary transition-colors">
                     <ExternalLink size={18} />
                  </div>
                </div>
                
                <h3 className="font-bold text-text-main text-lg leading-tight mb-2 pr-8">{res.title}</h3>
                
                {res.description && (
                  <p className="text-sm text-text-secondary leading-relaxed bg-bg-secondary/30 p-3 rounded-xl border border-border/30 mb-4">
                    {res.description}
                  </p>
                )}
                
                <div className="mt-4">
                  <a 
                    href={res.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex text-sm items-center gap-2 text-primary bg-primary/10 hover:bg-primary hover:text-white px-5 py-2.5 rounded-[12px] transition-all font-semibold"
                  >
                    {getIcon(res.file_type)} <span className="ml-1">O'qish / Ko'rish</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
