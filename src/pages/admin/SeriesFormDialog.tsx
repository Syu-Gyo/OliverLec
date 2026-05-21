import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, CircularProgress, Alert,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Series } from '../../types';

interface Props {
  open: boolean;
  series: Series | null;
  onClose: (saved: boolean) => void;
}

export default function SeriesFormDialog({ open, series, onClose }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(series?.title ?? '');
      setDescription(series?.description ?? '');
      setCategory(series?.category ?? '');
      setDisplayOrder(String(series?.display_order ?? 0));
      setError('');
    }
  }, [open, series]);

  async function handleSave() {
    if (!title.trim()) { setError('シリーズ名を入力してください'); return; }
    setSaving(true);
    setError('');

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      category: category.trim() || null,
      display_order: parseInt(displayOrder) || 0,
      updated_at: new Date().toISOString(),
    };

    let err;
    if (series) {
      ({ error: err } = await supabase.from('series').update(payload).eq('id', series.id));
    } else {
      ({ error: err } = await supabase.from('series').insert({ ...payload, created_by: user!.id }));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    onClose(true);
  }

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{series ? 'シリーズを編集' : 'シリーズを追加'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="シリーズ名 *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            autoFocus
            placeholder="例: Claude講習会、新人研修"
          />
          <TextField
            label="カテゴリ"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            fullWidth
            placeholder="例: AI活用、業務研修"
          />
          <TextField
            label="表示順（小さいほど先に表示）"
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
            fullWidth
            slotProps={{ htmlInput: { min: 0 } }}
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
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={20} color="inherit" /> : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
