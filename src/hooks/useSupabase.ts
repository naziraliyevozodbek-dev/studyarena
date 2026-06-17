import { useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';

export function useSupabase() {
  const { token } = useAuth();

  return useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }, [token]);
}
