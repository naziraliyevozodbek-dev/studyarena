'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, MessageCircle, ChevronRight, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Image from 'next/image';

export default function ChatList() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/chat/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setChatUsers(data.users || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, token, isLoading, router]);

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-32 pt-4 px-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-main mb-1">Xabarlar</h1>
        <p className="text-sm text-text-secondary">
          {user?.role === 'mentor' ? "O'quvchilaringiz bilan yozishmalar" : "Mentoringiz bilan yozishmalar"}
        </p>
      </div>

      {chatUsers.length === 0 ? (
        <Card padding="lg" className="text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <MessageCircle size={32} />
          </div>
          <h3 className="font-bold text-text-main mb-2">Hozircha suhbatdoshlar yo'q</h3>
          <p className="text-sm text-text-secondary">Siz hech qanday kursda emassiz yoki o'quvchilaringiz yo'q.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {chatUsers.map(u => (
            <Card 
              key={u.id}
              padding="md"
              className="flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => router.push(`/chat/${u.id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-bg-secondary flex items-center justify-center shrink-0">
                  {u.avatar_url ? (
                    <Image src={u.avatar_url} width={48} height={48} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} className="text-text-tertiary" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-text-main">{u.full_name}</h3>
                  <p className="text-xs text-text-tertiary">@{u.username}</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-text-tertiary" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
