import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '../types';

export function useSessions(searchQuery = '') {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchSessions() {
    setLoading(true);
    let query = supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchQuery.trim()) {
      query = query.ilike('title', `%${searchQuery.trim()}%`);
    }

    const { data } = await query;
    setSessions(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchSessions();
  }, [searchQuery]);

  return { sessions, loading, refetch: fetchSessions };
}

export function useSessionDetail(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) { setSession(null); return; }
    setLoading(true);
    supabase.from('sessions').select('*').eq('id', sessionId).single()
      .then(({ data }) => { setSession(data ?? null); setLoading(false); });
  }, [sessionId]);

  return { session, loading };
}
