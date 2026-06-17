'use client';

import { useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';

export function useSupabase() {
  const { token } = useAuth();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
       console.warn('Supabase URL or Key is missing from environment variables.');
    }
    
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }, [token, supabaseUrl, supabaseAnonKey]);

  return supabase;
}
