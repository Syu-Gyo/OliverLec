import {
  Box, Typography, Button, CircularProgress, TextField,
  RadioGroup, FormControlLabel, Radio, FormControl, FormHelperText,
  Paper, Divider, Alert,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSurveyForSession, useMyResponse } from '../hooks/useSurvey';
import type { SurveyQuestion } from '../types';

interface Props {
  sessionId: string;
}

/** 星評価 1〜5 */
function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Box
          key={n}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          sx={{ cursor: 'pointer', color: n <= (hovered || value) ? 'warning.main' : 'text.disabled', fontSize: 32, lineHeight: 1 }}
        >
          {n <= (hovered || value) ? <StarIcon fontSize="inherit" /> : <StarBorderIcon fontSize="inherit" />}
        </Box>
      ))}
      {value > 0 && (
        <Typography variant="body2" sx={{ ml: 1, alignSelf: 'center', color: 'text.secondary' }}>
          {value} / 5
        </Typography>
      )}
    </Box>
  );
}

/** 1問分のインプット */
function QuestionInput({
  question, value, onChange, error,
}: {
  question: SurveyQuestion;
  value: string | number | null;
  onChange: (v: string | number | null) => void;
  error: boolean;
}) {
  if (question.question_type === 'rating') {
    return (
      <FormControl error={error} component="fieldset">
        <RatingInput value={Number(value ?? 0)} onChange={onChange} />
        {error && <FormHelperText>評価を選択してください</FormHelperText>}
      </FormControl>
    );
  }
  if (question.question_type === 'text') {
    return (
      <TextField
        multiline
        rows={3}
        fullWidth
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="回答を入力してください"
        error={error}
        helperText={error ? '回答を入力してください' : undefined}
      />
    );
  }
  // choice
  return (
    <FormControl error={error} component="fieldset">
      <RadioGroup value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {question.options.map((opt) => (
          <FormControlLabel key={opt} value={opt} control={<Radio size="small" />} label={opt} />
        ))}
      </RadioGroup>
      {error && <FormHelperText>選択してください</FormHelperText>}
    </FormControl>
  );
}

export default function SurveyForm({ sessionId }: Props) {
  const { profile } = useAuth();
  const { survey, questions, loading } = useSurveyForSession(sessionId);
  const { response, loading: responseLoading, refetch: refetchResponse } = useMyResponse(survey?.id ?? null);

  const [answers, setAnswers] = useState<Record<string, string | number | null>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function setAnswer(questionId: string, value: string | number | null) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => ({ ...prev, [questionId]: false }));
  }

  async function handleSubmit() {
    if (!survey || !profile) return;

    // バリデーション
    const newErrors: Record<string, boolean> = {};
    for (const q of questions) {
      if (q.required) {
        const val = answers[q.id];
        if (val === null || val === undefined || val === '' || (q.question_type === 'rating' && Number(val) === 0)) {
          newErrors[q.id] = true;
        }
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const { error } = await supabase.from('survey_responses').insert({
      survey_id: survey.id,
      session_id: sessionId,
      user_id: profile.id,
      answers,
    });

    setSubmitting(false);
    if (error) {
      setSubmitError(error.code === '23505' ? 'すでに回答済みです' : error.message);
      return;
    }
    await refetchResponse();
  }

  if (loading || responseLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!survey) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
        <AssignmentIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
        <Typography variant="body2" color="text.secondary">アンケートがありません</Typography>
      </Box>
    );
  }

  // 回答済み
  if (response) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
        <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>回答ありがとうございました</Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date(response.submitted_at).toLocaleString('ja-JP')} に回答済み
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', p: 3, overflowY: 'auto', height: '100%' }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{survey.title}</Typography>
        {survey.description && (
          <Typography variant="body2" color="text.secondary">{survey.description}</Typography>
        )}
      </Box>
      <Divider sx={{ mb: 3 }} />

      {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

      {/* 質問一覧 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {questions.map((q, i) => (
          <Paper key={q.id} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
              {i + 1}. {q.question_text}
              {q.required && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
            </Typography>
            <QuestionInput
              question={q}
              value={answers[q.id] ?? null}
              onChange={(v) => setAnswer(q.id, v)}
              error={!!errors[q.id]}
            />
          </Paper>
        ))}
      </Box>

      {questions.length > 0 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            回答を送信する
          </Button>
        </Box>
      )}
    </Box>
  );
}
