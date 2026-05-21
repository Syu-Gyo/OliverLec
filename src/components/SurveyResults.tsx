import {
  Box, Typography, Chip, CircularProgress, Divider, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import { useSurveyResponses } from '../hooks/useSurvey';
import type { SurveyQuestion } from '../types';

interface Props {
  open: boolean;
  surveyTitle: string;
  surveyId: string;
  questions: SurveyQuestion[];
  onClose: () => void;
}

export default function SurveyResults({ open, surveyTitle, surveyId, questions, onClose }: Props) {
  const { responses, loading } = useSurveyResponses(open ? surveyId : null);

  /** 評価質問の集計 */
  function calcRating(questionId: string) {
    const vals = responses.map((r) => Number(r.answers[questionId])).filter((v) => v > 0 && v <= 5);
    if (vals.length === 0) return null;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const counts = [1, 2, 3, 4, 5].map((n) => vals.filter((v) => v === n).length);
    return { avg, counts, total: vals.length };
  }

  /** 選択質問の集計 */
  function calcChoice(questionId: string, options: string[]) {
    const vals = responses.map((r) => String(r.answers[questionId] ?? '')).filter(Boolean);
    return options.map((opt) => ({
      label: opt,
      count: vals.filter((v) => v === opt).length,
      pct: vals.length > 0 ? Math.round((vals.filter((v) => v === opt).length / vals.length) * 100) : 0,
    }));
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
        <PeopleIcon color="primary" />
        {surveyTitle} — 回答結果
        <Chip
          label={loading ? '…' : `${responses.length}件`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ ml: 1 }}
        />
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : responses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">まだ回答がありません</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {questions.map((q, i) => (
              <Paper key={q.id} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Q{i + 1}. {q.question_text}
                  <Chip
                    label={q.question_type === 'rating' ? '★評価' : q.question_type === 'text' ? '自由記述' : '選択'}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1, fontSize: 10, height: 18 }}
                  />
                </Typography>

                {/* 評価 */}
                {q.question_type === 'rating' && (() => {
                  const stat = calcRating(q.id);
                  if (!stat) return <Typography variant="body2" color="text.secondary">回答なし</Typography>;
                  return (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <StarIcon sx={{ color: 'warning.main' }} />
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{stat.avg.toFixed(1)}</Typography>
                        <Typography variant="body2" color="text.secondary">/ 5 （{stat.total}件）</Typography>
                      </Box>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <Box key={n} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="caption" sx={{ width: 16, textAlign: 'right' }}>{n}</Typography>
                          <StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                          <Box sx={{ flexGrow: 1, bgcolor: 'grey.100', borderRadius: 1, height: 12, overflow: 'hidden' }}>
                            <Box
                              sx={{
                                height: '100%',
                                bgcolor: 'warning.main',
                                borderRadius: 1,
                                width: `${stat.total > 0 ? (stat.counts[n - 1] / stat.total) * 100 : 0}%`,
                                transition: 'width 0.5s',
                              }}
                            />
                          </Box>
                          <Typography variant="caption" sx={{ width: 24, textAlign: 'right' }}>{stat.counts[n - 1]}</Typography>
                        </Box>
                      ))}
                    </Box>
                  );
                })()}

                {/* 自由記述 */}
                {q.question_type === 'text' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {responses
                      .filter((r) => r.answers[q.id])
                      .map((r) => (
                        <Box key={r.id} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, borderLeft: '3px solid', borderColor: 'primary.light' }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{String(r.answers[q.id])}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {r.profiles?.display_name ?? r.profiles?.email ?? '匿名'}
                            　{new Date(r.submitted_at).toLocaleDateString('ja-JP')}
                          </Typography>
                        </Box>
                      ))}
                    {responses.every((r) => !r.answers[q.id]) && (
                      <Typography variant="body2" color="text.secondary">回答なし</Typography>
                    )}
                  </Box>
                )}

                {/* 選択 */}
                {q.question_type === 'choice' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {calcChoice(q.id, q.options).map((item) => (
                      <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ width: 120, flexShrink: 0 }} noWrap>{item.label}</Typography>
                        <Box sx={{ flexGrow: 1, bgcolor: 'grey.100', borderRadius: 1, height: 18, overflow: 'hidden' }}>
                          <Box
                            sx={{
                              height: '100%', bgcolor: 'primary.main', borderRadius: 1,
                              width: `${item.pct}%`, transition: 'width 0.5s',
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ width: 52, textAlign: 'right', flexShrink: 0 }}>
                          {item.count}件 ({item.pct}%)
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            ))}

            {/* 個別回答一覧 */}
            <Divider />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>個別回答一覧</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {responses.map((r) => (
                  <Paper key={r.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {r.profiles?.display_name ?? r.profiles?.email ?? '匿名'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(r.submitted_at).toLocaleString('ja-JP')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {questions.map((q) => {
                        const val = r.answers[q.id];
                        if (val === null || val === undefined || val === '') return null;
                        return (
                          <Chip
                            key={q.id}
                            label={`Q${questions.indexOf(q) + 1}: ${q.question_type === 'rating' ? `★${val}` : String(val)}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 11, maxWidth: 200 }}
                          />
                        );
                      })}
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}
