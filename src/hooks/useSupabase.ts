import { useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';

export function useSupabase() {
  const { token } = useAuth();

  return useMemo(() => {
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    if (!supabaseUrl.startsWith('http')) {
      supabaseUrl = 'https://placeholder.supabase.co';
    }
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

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
