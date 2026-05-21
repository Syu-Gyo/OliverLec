import {
  Box, Typography, IconButton, Divider, CircularProgress,
  Tooltip, TextField, Button, Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import BookIcon from '@mui/icons-material/Book';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useGlossary } from '../hooks/useGlossary';
import type { GlossaryEntry } from '../types';

export const GLOSSARY_WIDTH = 300;

interface Props {
  open: boolean;
  sessionId: string | null;
  onClose: () => void;
}

interface EntryFormState {
  term: string;
  definition: string;
  saving: boolean;
}

const emptyForm = (): EntryFormState => ({ term: '', definition: '', saving: false });

export default function GlossarySidebar({ open, sessionId, onClose }: Props) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { entries, loading, refetch } = useGlossary(sessionId);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<EntryFormState>(emptyForm());

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EntryFormState>(emptyForm());

  async function handleAdd() {
    if (!addForm.term.trim() || !addForm.definition.trim() || !sessionId || !profile) return;
    setAddForm((f) => ({ ...f, saving: true }));
    await supabase.from('glossary').insert({
      session_id: sessionId,
      term: addForm.term.trim(),
      definition: addForm.definition.trim(),
      display_order: entries.length,
      created_by: profile.id,
    });
    await refetch();
    setAddForm(emptyForm());
    setAddOpen(false);
  }

  function startEdit(entry: GlossaryEntry) {
    setEditId(entry.id);
    setEditForm({ term: entry.term, definition: entry.definition, saving: false });
  }

  async function handleEdit() {
    if (!editId || !editForm.term.trim() || !editForm.definition.trim()) return;
    setEditForm((f) => ({ ...f, saving: true }));
    await supabase.from('glossary').update({
      term: editForm.term.trim(),
      definition: editForm.definition.trim(),
      updated_at: new Date().toISOString(),
    }).eq('id', editId);
    await refetch();
    setEditId(null);
    setEditForm(emptyForm());
  }

  async function handleDelete(id: string) {
    await supabase.from('glossary').delete().eq('id', id);
    await refetch();
  }

  if (!open) return null;

  return (
    <Box
      sx={{
        width: GLOSSARY_WIDTH,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      {/* ヘッダー */}
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <BookIcon sx={{ fontSize: 18, color: 'primary.main' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, flexGrow: 1 }}>
          用語集
        </Typography>
        {isAdmin && sessionId && (
          <Tooltip title="用語を追加">
            <IconButton size="small" onClick={() => { setAddOpen((v) => !v); setEditId(null); }}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="閉じる">
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 追加フォーム（管理者用） */}
      {isAdmin && addOpen && (
        <Paper variant="outlined" sx={{ m: 1.5, p: 1.5, bgcolor: 'primary.50', flexShrink: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', display: 'block', mb: 1 }}>
            新しい用語
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              label="用語 *"
              value={addForm.term}
              onChange={(e) => setAddForm((f) => ({ ...f, term: e.target.value }))}
              size="small"
              fullWidth
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            />
            <TextField
              label="説明 *"
              value={addForm.definition}
              onChange={(e) => setAddForm((f) => ({ ...f, definition: e.target.value }))}
              size="small"
              fullWidth
              multiline
              rows={3}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="contained"
                startIcon={addForm.saving ? <CircularProgress size={12} color="inherit" /> : <CheckIcon />}
                disabled={!addForm.term.trim() || !addForm.definition.trim() || addForm.saving}
                onClick={handleAdd}
              >
                追加
              </Button>
              <Button size="small" onClick={() => { setAddOpen(false); setAddForm(emptyForm()); }}>
                キャンセル
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* 用語一覧 */}
      <Box sx={{ overflow: 'auto', flexGrow: 1, px: 1.5, py: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress size={20} />
          </Box>
        ) : entries.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <BookIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {sessionId ? '用語が登録されていません' : '講習会を選択してください'}
            </Typography>
            {isAdmin && sessionId && (
              <Typography variant="caption" color="text.secondary">
                ＋ボタンから用語を追加できます
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {entries.map((entry, idx) => (
              <Box key={entry.id}>
                {idx > 0 && <Divider sx={{ my: 0.5 }} />}

                {editId === entry.id ? (
                  /* 編集フォーム */
                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <TextField
                        label="用語"
                        value={editForm.term}
                        onChange={(e) => setEditForm((f) => ({ ...f, term: e.target.value }))}
                        size="small"
                        fullWidth
                        autoFocus
                      />
                      <TextField
                        label="説明"
                        value={editForm.definition}
                        onChange={(e) => setEditForm((f) => ({ ...f, definition: e.target.value }))}
                        size="small"
                        fullWidth
                        multiline
                        rows={3}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={editForm.saving ? <CircularProgress size={12} color="inherit" /> : <CheckIcon />}
                          disabled={!editForm.term.trim() || !editForm.definition.trim() || editForm.saving}
                          onClick={handleEdit}
                        >
                          保存
                        </Button>
                        <Button size="small" onClick={() => setEditId(null)}>キャンセル</Button>
                      </Box>
                    </Box>
                  </Paper>
                ) : (
                  /* 表示 */
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                      '&:hover .entry-actions': { opacity: 1 },
                      position: 'relative',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.4, wordBreak: 'break-all' }}
                      >
                        {entry.term}
                      </Typography>
                      {isAdmin && (
                        <Box className="entry-actions" sx={{ display: 'flex', gap: 0.25, opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
                          <Tooltip title="編集">
                            <IconButton size="small" onClick={() => startEdit(entry)} sx={{ p: 0.25 }}>
                              <EditIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="削除">
                            <IconButton size="small" onClick={() => handleDelete(entry.id)} sx={{ p: 0.25, color: 'error.main' }}>
                              <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {entry.definition}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
