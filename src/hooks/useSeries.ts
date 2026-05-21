import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Series } from '../types';

export function useSeries(refreshKey?: number) {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .order('display_order', { ascending: true });
    if (!error) setSeries(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch, refreshKey]);

  return { series, loading, refetch: fetch };
}
