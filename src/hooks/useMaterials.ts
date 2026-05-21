import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Material } from '../types';

export function useMaterials(sessionId: string | null) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchMaterials() {
    if (!sessionId) { setMaterials([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('materials')
      .select('*')
      .eq('session_id', sessionId)
      .order('display_order', { ascending: true });
    setMaterials(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchMaterials();
  }, [sessionId]);

  return { materials, loading, refetch: fetchMaterials };
}

/** 複数セッション分の資料を一括取得して Map<sessionId, Material[]> で返す */
export function useSessionMaterials(sessionIds: string[]) {
  const [materialsMap, setMaterialsMap] = useState<Map<string, Material[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const key = sessionIds.slice().sort().join(',');

  const fetch = useCallback(async () => {
    if (sessionIds.length === 0) { setMaterialsMap(new Map()); return; }
    setLoading(true);
    const { data } = await supabase
      .from('materials')
      .select('*')
      .in('session_id', sessionIds)
      .order('display_order', { ascending: true });
    const map = new Map<string, Material[]>();
    for (const m of data ?? []) {
      const arr = map.get(m.session_id) ?? [];
      arr.push(m);
      map.set(m.session_id, arr);
    }
    setMaterialsMap(map);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { fetch(); }, [fetch]);

  return { materialsMap, loading, refetch: fetch };
}

export function useMaterialUrl(filePath: string | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) { setUrl(null); return; }
    supabase.storage.from('materials').createSignedUrl(filePath, 3600).then(({ data }) => {
      setUrl(data?.signedUrl ?? null);
    });
  }, [filePath]);

  return url;
}
