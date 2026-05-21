import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Session, UserSessionProgress, SessionWithProgress } from '../types';

export function useUserSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) { setSessions([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('user_session_progress')
      .select('*, sessions(*)')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    if (data) {
      const result: SessionWithProgress[] = data.map((row: UserSessionProgress & { sessions: Session }) => ({
        ...row.sessions,
        progress: {
          id: row.id,
          user_id: row.user_id,
          session_id: row.session_id,
          status: row.status,
          started_at: row.started_at,
          completed_at: row.completed_at,
        },
      }));
      setSessions(result);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { sessions, loading, refetch: fetch };
}

export function useSessionProgress(sessionId: string | null) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserSessionProgress | null>(null);

  useEffect(() => {
    if (!user || !sessionId) { setProgress(null); return; }
    supabase
      .from('user_session_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .maybeSingle()
      .then(({ data }) => setProgress(data ?? null));
  }, [user, sessionId]);

  return progress;
}

export function useStartSession() {
  const { user } = useAuth();

  return useCallback(async (sessionId: string) => {
    if (!user) return;
    await supabase.from('user_session_progress').upsert(
      { user_id: user.id, session_id: sessionId, status: 'in_progress' },
      { onConflict: 'user_id,session_id', ignoreDuplicates: true }
    );
  }, [user]);
}

export function useCompleteSession() {
  const { user } = useAuth();

  return useCallback(async (sessionId: string) => {
    if (!user) return;
    await supabase
      .from('user_session_progress')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('session_id', sessionId);
  }, [user]);
}
