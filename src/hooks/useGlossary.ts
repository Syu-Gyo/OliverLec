import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { GlossaryEntry } from '../types';

export function useGlossary(sessionId: string | null) {
  const [entries, setEntries] = useState<GlossaryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!sessionId) { setEntries([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('glossary')
      .select('*')
      .eq('session_id', sessionId)
      .order('display_order', { ascending: true });
    if (!error) setEntries(data ?? []);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { entries, loading, refetch: fetch };
}
