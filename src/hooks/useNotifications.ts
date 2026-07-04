import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';

const fetcher = async (url: string, token: string) => {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  const data = await res.json();
  return data.notifications || [];
};

export function useNotifications() {
  const { token, user } = useAuth();
  
  // Use SWR to fetch notifications only if user is logged in
  const { data: notifications, error, mutate } = useSWR(
    token ? '/api/student/notifications' : null,
    (url) => fetcher(url, token!),
    {
      refreshInterval: 10000, // Poll every 10 seconds
      revalidateOnFocus: true,
    }
  );

  const unreadCount = notifications ? notifications.filter((n: any) => !n.is_read).length : 0;

  const markAsRead = async () => {
    if (!token || unreadCount === 0) return;
    
    // Optimistic update
    mutate(notifications.map((n: any) => ({ ...n, is_read: true })), false);
    
    try {
      await fetch('/api/student/notifications', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      // Revalidate after success
      mutate();
    } catch (error) {
      console.error('Failed to mark notifications as read', error);
      // Revert if error
      mutate();
    }
  };

  return {
    notifications: notifications || [],
    unreadCount,
    isLoading: !error && !notifications,
    isError: error,
    markAsRead,
    mutate
  };
}
