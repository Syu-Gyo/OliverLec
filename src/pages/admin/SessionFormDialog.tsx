import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem,
  Collapse, Paper, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSeries } from '../../hooks/useSeries';
import type { Session } from '../../types';

const NEW_SERIES_VALUE = '__new__';

interface Props {
  open: boolean;
  session: Session | null;
  onClose: (saved: boolean) => void;
}

export default function SessionFormDialog({ open, session, onClose }: Props) {
  const { user } = useAuth();
  const { series, refetch: refetchSeries } = useSeries();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [seriesId, setSeriesId] = useState<string>('');
  const [seriesOrder, setSeriesOrder] = useState('1');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // 新規シリーズ作成用
  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [newSeriesCategory, setNewSeriesCategory] = useState('');
  const [newSeriesOrder, setNewSeriesOrder] = useState('1');
  const [creatingNewSeries, setCreatingNewSeries] = useState(false);

  const isCreatingNew = seriesId === NEW_SERIES_VALUE;

  useEffect(() => {
    if (open) {
      setTitle(session?.title ?? '');
      setDescription(session?.description ?? '');
      setCategory(session?.category ?? '');
      setSeriesId(session?.series_id ?? '');
      setSeriesOrder(String(session?.series_order ?? 1));
      setNewSeriesTitle('');
      setNewSeriesCategory('');
      setNewSeriesOrder('1');
      setError('');
    }
  }, [open, session]);

  async function handleCreateSeries() {
    if (!newSeriesTitle.trim()) return;
    setCreatingNewSeries(true);
    const { data, error: err } = await supabase
      .from('series')
      .insert({
        title: newSeriesTitle.trim(),
        category: newSeriesCategory.trim() || null,
        display_order: series.length,
        created_by: user!.id,
      })
      .select()
      .single();
    setCreatingNewSeries(false);
    if (err || !data) { setError(err?.message ?? 'シリーズの作成に失敗しました'); return; }
    await refetchSeries();
    setSeriesId(data.id);
    setSeriesOrder(newSeriesOrder);
    setNewSeriesTitle('');
    setNewSeriesCategory('');
    setNewSeriesOrder('1');
  }

  async function handleSave() {
    if (!title.trim()) { setError('タイトルを入力してください'); return; }
    if (isCreatingNew) { setError('シリーズを作成してから保存してください'); return; }
    setSaving(true);
    setError('');

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      category: category.trim() || null,
      series_id: seriesId || null,
      series_order: seriesId ? (parseInt(seriesOrder) || 1) : 0,
      updated_at: new Date().toISOString(),
    };

    let err;
    if (session) {
      ({ error: err } = await supabase.from('sessions').update(payload).eq('id', session.id));
    } else {
      ({ error: err } = await supabase.from('sessions').insert({ ...payload, created_by: user!.id }));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    onClose(true);
  }

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{session ? '講習会を編集' : '講習会を追加'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* シリーズ選択 */}
          <FormControl fullWidth>
            <InputLabel>シリーズ（任意）</InputLabel>
            <Select
              value={seriesId}
              label="シリーズ（任意）"
              onChange={(e) => setSeriesId(e.target.value)}
            >
              <MenuItem value=""><em>シリーズなし</em></MenuItem>
              {series.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.title}</MenuItem>
              ))}
              <MenuItem value={NEW_SERIES_VALUE} sx={{ color: 'primary.main', fontWeight: 600 }}>
                <AddIcon fontSize="small" sx={{ mr: 0.5 }} />
                新しいシリーズを作成...
              </MenuItem>
            </Select>
          </FormControl>

          {/* 新規シリーズ入力フォーム */}
          <Collapse in={isCreatingNew}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', display: 'block', mb: 1.5 }}>
                新しいシリーズ
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  label="シリーズ名 *"
                  value={newSeriesTitle}
                  onChange={(e) => setNewSeriesTitle(e.target.value)}
                  size="small"
                  fullWidth
                  autoFocus={isCreatingNew}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateSeries(); }}
                />
                <TextField
                  label="カテゴリ（任意）"
                  value={newSeriesCategory}
                  onChange={(e) => setNewSeriesCategory(e.target.value)}
                  size="small"
                  fullWidth
                  placeholder="例: AI活用、業務研修"
                />
                <FormControl fullWidth size="small">
                  <InputLabel>第何回</InputLabel>
                  <Select
                    value={newSeriesOrder}
                    label="第何回"
                    onChange={(e) => setNewSeriesOrder(e.target.value)}
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                      <MenuItem key={n} value={String(n)}>第 {n} 回</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={creatingNewSeries ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
                  onClick={handleCreateSeries}
                  disabled={!newSeriesTitle.trim() || creatingNewSeries}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  作成して選択
                </Button>
              </Box>
            </Paper>
          </Collapse>

          {/* 第何回（シリーズ選択時） */}
          {seriesId && !isCreatingNew && (
            <FormControl fullWidth>
              <InputLabel>第何回</InputLabel>
              <Select
                value={seriesOrder}
                label="第何回"
                onChange={(e) => setSeriesOrder(e.target.value)}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <MenuItem key={n} value={String(n)}>第 {n} 回</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            label="タイトル *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
          <TextField
            label="カテゴリ"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            fullWidth
            placeholder="例: セキュリティ、コンプライアンス"
          />
          <TextField
            label="説明"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>キャンセル</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || isCreatingNew}>
          {saving ? <CircularProgress size={20} color="inherit" /> : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
