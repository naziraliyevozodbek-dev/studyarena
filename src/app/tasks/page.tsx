'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckSquare, Clock, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function TasksPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'mentor') {
      router.push('/mentor');
      return;
    }
    fetchTasks();
  }, [user, router]);

  const fetchTasks = async () => {
    try {
      if (!token) return;
      const res = await fetch('/api/student/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => !t.submission || t.submission.status === 'rejected');
  const completedTasks = tasks.filter(t => t.submission && t.submission.status !== 'rejected');

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 mb-6">
        <h1 className="text-2xl font-bold text-text-main">Homeworks</h1>
      </div>

      <div>
        {tasks.length === 0 ? (
          <Card padding="lg" className="text-center mt-10 border-dashed">
            <CheckSquare size={48} className="mx-auto text-text-tertiary mb-4" />
            <h2 className="text-xl font-bold text-text-main mb-2">No Homeworks!</h2>
            <p className="text-text-secondary text-sm mb-6">
              You're all caught up. Wait for your mentor to add new homeworks.
            </p>
            <Button onClick={() => router.push('/')}>Go to Dashboard</Button>
          </Card>
        ) : (
          <>
            {pendingTasks.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-text-main mb-3">To Do ({pendingTasks.length})</h2>
                <div className="flex flex-col gap-3">
                  {pendingTasks.map(task => (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <Card interactive padding="md" className="border-l-4 border-l-primary">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-text-main leading-tight">{task.title}</h3>
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full whitespace-nowrap">
                            +{task.xp_reward} XP
                          </span>
                        </div>
                        <p className="text-xs font-medium text-text-secondary mb-3">{task.courses?.title}</p>
                        <div className="flex items-center justify-between text-xs text-text-tertiary">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>
                              {task.deadline ? `Due ${new Date(task.deadline).toLocaleDateString()}` : 'No deadline'}
                            </span>
                          </div>
                          {task.submission?.status === 'rejected' && (
                            <span className="text-error font-medium">Needs Revision</span>
                          )}
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {completedTasks.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-text-main mb-3">Completed ({completedTasks.length})</h2>
                <div className="flex flex-col gap-3">
                  {completedTasks.map(task => (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <Card interactive padding="md" className="opacity-80">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-text-main leading-tight line-through">{task.title}</h3>
                          {task.submission.status === 'graded' ? (
                            <span className="text-xs font-bold text-success flex items-center gap-1">
                              <CheckCircle size={14} /> +{task.submission.score || task.xp_reward} XP
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded-full">
                              Pending Review
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary">{task.courses?.title}</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
