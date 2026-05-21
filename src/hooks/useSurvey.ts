import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Survey, SurveyQuestion, SurveyResponse } from '../types';

/** セッションに紐づくアンケートと質問を取得 */
export function useSurveyForSession(sessionId: string | null) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!sessionId) { setSurvey(null); setQuestions([]); return; }
    setLoading(true);

    const { data: sv } = await supabase
      .from('surveys')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sv) {
      setSurvey(sv);
      const { data: qs } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', sv.id)
        .order('display_order', { ascending: true });
      setQuestions((qs ?? []).map((q) => ({ ...q, options: q.options ?? [] })));
    } else {
      setSurvey(null);
      setQuestions([]);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { survey, questions, loading, refetch: fetch };
}

/** 現在のユーザーの回答を確認 */
export function useMyResponse(surveyId: string | null) {
  const [response, setResponse] = useState<SurveyResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!surveyId) { setResponse(null); return; }
    setLoading(true);
    const { data } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('survey_id', surveyId)
      .maybeSingle();
    setResponse(data ?? null);
    setLoading(false);
  }, [surveyId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { response, loading, refetch: fetch };
}

/** 管理者：全回答を取得（プロフィール情報付き） */
export function useSurveyResponses(surveyId: string | null) {
  const [responses, setResponses] = useState<(SurveyResponse & { profiles: { display_name: string | null; email: string } | null })[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!surveyId) { setResponses([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('survey_responses')
      .select('*, profiles(display_name, email)')
      .eq('survey_id', surveyId)
      .order('submitted_at', { ascending: false });
    setResponses((data ?? []) as typeof responses);
    setLoading(false);
  }, [surveyId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { responses, loading, refetch: fetch };
}

/** 複数セッションのうちアンケートが存在するセッションIDセットを返す（サイドバー用） */
export function useSurveysMap(sessionIds: string[]) {
  const [surveySessionIds, setSurveySessionIds] = useState<Set<string>>(new Set());
  const key = sessionIds.slice().sort().join(',');

  const fetch = useCallback(async () => {
    if (sessionIds.length === 0) { setSurveySessionIds(new Set()); return; }
    const { data } = await supabase
      .from('surveys')
      .select('session_id')
      .in('session_id', sessionIds)
      .eq('is_active', true);
    setSurveySessionIds(new Set((data ?? []).map((s) => s.session_id as string)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { fetch(); }, [fetch]);
  return { surveySessionIds, refetch: fetch };
}

/** 管理者：セッションの全アンケート（非アクティブ含む） */
export function useAllSurveysForSession(sessionId: string | null) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!sessionId) { setSurveys([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('surveys')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    setSurveys(data ?? []);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { surveys, loading, refetch: fetch };
}
