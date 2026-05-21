import {
  Box, Typography, Button, TextField, Switch, FormControlLabel,
  CircularProgress, Alert, Paper, IconButton, Tooltip, Chip, Select,
  MenuItem, FormControl, InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import BarChartIcon from '@mui/icons-material/BarChart';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAllSurveysForSession } from '../../hooks/useSurvey';
import SurveyResults from '../../components/SurveyResults';
import ConfirmDialog from '../../components/ConfirmDialog';
import type { Session, Survey, SurveyQuestion, QuestionType } from '../../types';

interface Props { session: Session; }

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  rating: '★ 5段階評価',
  text:   '📝 オープンクエスチョン',
  choice: '☑ 選択式',
};

interface QuestionFormState {
  question_text: string;
  question_type: QuestionType;
  options_raw: string; // カンマ区切り
  required: boolean;
}
const emptyQForm = (): QuestionFormState => ({
  question_text: '', question_type: 'rating', options_raw: '', required: false,
});

export default function SurveyManager({ session }: Props) {
  const { profile } = useAuth();
  const { surveys, loading: surveysLoading, refetch: refetchSurveys } = useAllSurveysForSession(session.id);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);

  // 選択中サーベイ（リストから直接選択のケース）
  const selectedSurvey = selectedSurveyId
    ? surveys.find((s) => s.id === selectedSurveyId) ?? null
    : surveys[0] ?? null;

  // selectedSurvey が変わったら質問を自動ロード
  useEffect(() => {
    if (selectedSurvey?.id) {
      loadQuestions(selectedSurvey.id);
    } else {
      setManagedQuestions([]);
    }
  }, [selectedSurvey?.id]);

  // サーベイ編集フォーム
  const [editSurvey, setEditSurvey] = useState<{ title: string; description: string; is_active: boolean } | null>(null);
  const [savingSurvey, setSavingSurvey] = useState(false);
  const [surveyError, setSurveyError] = useState('');

  // 質問追加フォーム
  const [addQOpen, setAddQOpen] = useState(false);
  const [qForm, setQForm] = useState<QuestionFormState>(emptyQForm());
  const [savingQ, setSavingQ] = useState(false);

  // 質問編集
  const [editQId, setEditQId] = useState<string | null>(null);
  const [editQForm, setEditQForm] = useState<QuestionFormState>(emptyQForm());

  // 削除確認
  const [confirmSurvey, setConfirmSurvey] = useState(false);
  const [confirmQTarget, setConfirmQTarget] = useState<SurveyQuestion | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 結果ダイアログ
  const [resultsOpen, setResultsOpen] = useState(false);
  const [resultsQuestions, setResultsQuestions] = useState<SurveyQuestion[]>([]);

  // 管理では選択サーベイの質問をフェッチ
  const [managedQuestions, setManagedQuestions] = useState<SurveyQuestion[]>([]);
  const [qLoading, setQLoading] = useState(false);

  async function loadQuestions(surveyId: string) {
    setQLoading(true);
    const { data } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('display_order', { ascending: true });
    setManagedQuestions((data ?? []).map((q) => ({ ...q, options: q.options ?? [] })));
    setQLoading(false);
  }

  // 新規アンケート作成
  async function handleCreateSurvey() {
    if (!profile) return;
    setSavingSurvey(true);
    const { data, error } = await supabase.from('surveys').insert({
      session_id: session.id,
      title: 'アンケート',
      description: null,
      is_active: true,
      created_by: profile.id,
    }).select().single();
    setSavingSurvey(false);
    if (error || !data) { setSurveyError(error?.message ?? '作成に失敗'); return; }
    await refetchSurveys();
    setSelectedSurveyId(data.id);
    setEditSurvey({ title: data.title, description: data.description ?? '', is_active: data.is_active });
    await loadQuestions(data.id);
  }

  // アンケート情報保存
  async function handleSaveSurvey() {
    if (!editSurvey || !selectedSurvey) return;
    setSavingSurvey(true);
    await supabase.from('surveys').update({
      title: editSurvey.title.trim() || 'アンケート',
      description: editSurvey.description.trim() || null,
      is_active: editSurvey.is_active,
      updated_at: new Date().toISOString(),
    }).eq('id', selectedSurvey.id);
    setSavingSurvey(false);
    await refetchSurveys();
    setEditSurvey(null);
  }

  // アンケート削除
  async function handleDeleteSurvey() {
    if (!selectedSurvey) return;
    setDeleting(true);
    await supabase.from('surveys').delete().eq('id', selectedSurvey.id);
    setDeleting(false);
    setConfirmSurvey(false);
    setSelectedSurveyId(null);
    setEditSurvey(null);
    setManagedQuestions([]);
    await refetchSurveys();
  }

  // 質問追加
  async function handleAddQuestion() {
    if (!selectedSurvey || !qForm.question_text.trim()) return;
    setSavingQ(true);
    const options = qForm.question_type === 'choice'
      ? qForm.options_raw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    await supabase.from('survey_questions').insert({
      survey_id: selectedSurvey.id,
      question_text: qForm.question_text.trim(),
      question_type: qForm.question_type,
      options,
      display_order: managedQuestions.length,
      required: qForm.required,
    });
    setSavingQ(false);
    setQForm(emptyQForm());
    setAddQOpen(false);
    await loadQuestions(selectedSurvey.id);
  }

  // 質問編集保存
  async function handleSaveQuestion() {
    if (!editQId || !editQForm.question_text.trim()) return;
    setSavingQ(true);
    const options = editQForm.question_type === 'choice'
      ? editQForm.options_raw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    await supabase.from('survey_questions').update({
      question_text: editQForm.question_text.trim(),
      question_type: editQForm.question_type,
      options,
      required: editQForm.required,
    }).eq('id', editQId);
    setSavingQ(false);
    setEditQId(null);
    if (selectedSurvey) await loadQuestions(selectedSurvey.id);
  }

  // 質問削除
  async function handleDeleteQuestion() {
    if (!confirmQTarget || !selectedSurvey) return;
    setDeleting(true);
    await supabase.from('survey_questions').delete().eq('id', confirmQTarget.id);
    setDeleting(false);
    setConfirmQTarget(null);
    await loadQuestions(selectedSurvey.id);
  }

  async function handleSelectSurvey(sv: Survey) {
    setSelectedSurveyId(sv.id);
    setEditSurvey(null);
    await loadQuestions(sv.id);
  }

  function openResults(qs: SurveyQuestion[]) {
    setResultsQuestions(qs);
    setResultsOpen(true);
  }

  if (surveysLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size={24} /></Box>;
  }

  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          <AssignmentIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
          アンケート管理
        </Typography>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={handleCreateSurvey} disabled={savingSurvey}>
          新規作成
        </Button>
      </Box>

      {surveyError && <Alert severity="error" onClose={() => setSurveyError('')} sx={{ mb: 2 }}>{surveyError}</Alert>}

      {surveys.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <AssignmentIcon sx={{ fontSize: 40, opacity: 0.3, display: 'block', mx: 'auto', mb: 1 }} />
          <Typography variant="body2">アンケートがありません</Typography>
          <Typography variant="caption">「新規作成」から作成できます</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>

          {/* サーベイ選択リスト（複数ある場合） */}
          {surveys.length > 1 && (
            <Box sx={{ width: 200, flexShrink: 0 }}>
              {surveys.map((sv) => (
                <Paper
                  key={sv.id}
                  variant="outlined"
                  onClick={() => handleSelectSurvey(sv)}
                  sx={{
                    p: 1.5, mb: 1, cursor: 'pointer',
                    bgcolor: selectedSurvey?.id === sv.id ? 'primary.50' : 'background.paper',
                    borderColor: selectedSurvey?.id === sv.id ? 'primary.main' : 'divider',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{sv.title}</Typography>
                  <Chip
                    label={sv.is_active ? '有効' : '無効'}
                    size="small"
                    color={sv.is_active ? 'success' : 'default'}
                    variant="outlined"
                    sx={{ fontSize: 10, height: 16, mt: 0.5 }}
                  />
                </Paper>
              ))}
            </Box>
          )}

          {/* 選択中サーベイの詳細 */}
          {selectedSurvey && (
            <Box sx={{ flexGrow: 1 }}>

              {/* サーベイ情報 */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                {editSurvey ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <TextField label="タイトル" value={editSurvey.title} onChange={(e) => setEditSurvey((f) => f && ({ ...f, title: e.target.value }))} size="small" fullWidth />
                    <TextField label="説明（任意）" value={editSurvey.description} onChange={(e) => setEditSurvey((f) => f && ({ ...f, description: e.target.value }))} size="small" fullWidth multiline rows={2} />
                    <FormControlLabel
                      control={<Switch checked={editSurvey.is_active} onChange={(e) => setEditSurvey((f) => f && ({ ...f, is_active: e.target.checked }))} />}
                      label="アンケートを有効にする"
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="contained" onClick={handleSaveSurvey} disabled={savingSurvey}
                        startIcon={savingSurvey ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}>保存</Button>
                      <Button size="small" onClick={() => setEditSurvey(null)}>キャンセル</Button>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{selectedSurvey.title}</Typography>
                        <Chip label={selectedSurvey.is_active ? '有効' : '無効'} size="small" color={selectedSurvey.is_active ? 'success' : 'default'} variant="outlined" sx={{ fontSize: 10, height: 16 }} />
                      </Box>
                      {selectedSurvey.description && <Typography variant="caption" color="text.secondary">{selectedSurvey.description}</Typography>}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="編集"><IconButton size="small" onClick={() => setEditSurvey({ title: selectedSurvey.title, description: selectedSurvey.description ?? '', is_active: selectedSurvey.is_active })}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="結果を見る"><IconButton size="small" color="primary" onClick={() => openResults(managedQuestions)}><BarChartIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="削除"><IconButton size="small" color="error" onClick={() => setConfirmSurvey(true)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </Box>
                  </Box>
                )}
              </Paper>

              {/* 質問一覧 */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>質問一覧</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={() => { setAddQOpen(true); setQForm(emptyQForm()); }}>質問を追加</Button>
              </Box>

              {qLoading ? (
                <CircularProgress size={20} />
              ) : managedQuestions.length === 0 && !addQOpen ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>質問がありません</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {managedQuestions.map((q, idx) => (
                    <Paper key={q.id} variant="outlined" sx={{ p: 1.5 }}>
                      {editQId === q.id ? (
                        <QuestionEditForm
                          form={editQForm}
                          setForm={setEditQForm}
                          onSave={handleSaveQuestion}
                          onCancel={() => setEditQId(null)}
                          saving={savingQ}
                        />
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.disabled', pt: 0.25, flexShrink: 0 }}>Q{idx + 1}</Typography>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2">{q.question_text}</Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                              <Chip label={QUESTION_TYPE_LABELS[q.question_type]} size="small" variant="outlined" sx={{ fontSize: 10, height: 16 }} />
                              {q.required && <Chip label="必須" size="small" color="error" variant="outlined" sx={{ fontSize: 10, height: 16 }} />}
                              {q.question_type === 'choice' && q.options.map((opt) => (
                                <Chip key={opt} label={opt} size="small" sx={{ fontSize: 10, height: 16 }} />
                              ))}
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
                            <Tooltip title="編集">
                              <IconButton size="small" onClick={() => { setEditQId(q.id); setEditQForm({ question_text: q.question_text, question_type: q.question_type, options_raw: q.options.join(', '), required: q.required }); }}>
                                <EditIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="削除">
                              <IconButton size="small" color="error" onClick={() => setConfirmQTarget(q)}>
                                <DeleteIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}

              {/* 質問追加フォーム */}
              {addQOpen && (
                <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'primary.50' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', display: 'block', mb: 1.5 }}>新しい質問</Typography>
                  <QuestionEditForm
                    form={qForm}
                    setForm={setQForm}
                    onSave={handleAddQuestion}
                    onCancel={() => setAddQOpen(false)}
                    saving={savingQ}
                    saveLabel="追加"
                  />
                </Paper>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* 確認ダイアログ */}
      <ConfirmDialog
        open={confirmSurvey}
        title="アンケートを削除"
        message="このアンケートとすべての回答データを削除しますか？\nこの操作は取り消せません。"
        loading={deleting}
        onConfirm={handleDeleteSurvey}
        onCancel={() => setConfirmSurvey(false)}
      />
      <ConfirmDialog
        open={confirmQTarget !== null}
        title="質問を削除"
        message={`「${confirmQTarget?.question_text ?? ''}」を削除しますか？`}
        loading={deleting}
        onConfirm={handleDeleteQuestion}
        onCancel={() => setConfirmQTarget(null)}
      />

      {/* 結果ダイアログ */}
      {selectedSurvey && (
        <SurveyResults
          open={resultsOpen}
          surveyTitle={selectedSurvey.title}
          surveyId={selectedSurvey.id}
          questions={resultsQuestions}
          onClose={() => setResultsOpen(false)}
        />
      )}
    </Box>
  );
}

/** 質問フォーム（追加・編集共通） */
function QuestionEditForm({
  form, setForm, onSave, onCancel, saving, saveLabel = '保存',
}: {
  form: { question_text: string; question_type: QuestionType; options_raw: string; required: boolean };
  setForm: React.Dispatch<React.SetStateAction<{ question_text: string; question_type: QuestionType; options_raw: string; required: boolean }>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  saveLabel?: string;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <FormControl size="small" fullWidth>
        <InputLabel>質問タイプ</InputLabel>
        <Select value={form.question_type} label="質問タイプ" onChange={(e) => setForm((f) => ({ ...f, question_type: e.target.value as QuestionType }))}>
          <MenuItem value="rating">★ 5段階評価</MenuItem>
          <MenuItem value="text">📝 オープンクエスチョン</MenuItem>
          <MenuItem value="choice">☑ 選択式</MenuItem>
        </Select>
      </FormControl>
      <TextField label="質問文 *" value={form.question_text} onChange={(e) => setForm((f) => ({ ...f, question_text: e.target.value }))} size="small" fullWidth autoFocus onKeyDown={(e) => { if (e.key === 'Enter' && form.question_type !== 'text') onSave(); }} />
      {form.question_type === 'choice' && (
        <TextField label="選択肢（カンマ区切り）" value={form.options_raw} onChange={(e) => setForm((f) => ({ ...f, options_raw: e.target.value }))} size="small" fullWidth placeholder="例: とても良い, 良い, 普通, 悪い" />
      )}
      <FormControlLabel control={<Switch size="small" checked={form.required} onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))} />} label={<Typography variant="caption">必須</Typography>} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button size="small" variant="contained" onClick={onSave} disabled={saving || !form.question_text.trim()}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}>{saveLabel}</Button>
        <Button size="small" onClick={onCancel} startIcon={<CloseIcon />}>キャンセル</Button>
      </Box>
    </Box>
  );
}
