import {
  Box, Typography, Button, List, ListItem, ListItemText,
  ListItemSecondaryAction, IconButton, CircularProgress, Alert,
  Tooltip, Chip, LinearProgress, TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useMaterials } from '../../hooks/useMaterials';
import ConfirmDialog from '../../components/ConfirmDialog';
import type { Session, Material } from '../../types';

interface Props {
  session: Session;
}

/** Storage に安全に保存できるパスに変換（非ASCII文字をアンダースコアに置換） */
function sanitizeFileName(name: string): string {
  const lastDot = name.lastIndexOf('.');
  const base = lastDot >= 0 ? name.slice(0, lastDot) : name;
  const ext  = lastDot >= 0 ? name.slice(lastDot)   : '';
  const safe = base
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/[\s\/\\:*?"<>|]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    || 'file';
  return safe + ext;
}

export default function MaterialManager({ session }: Props) {
  const { materials, loading, refetch } = useMaterials(session.id);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 削除確認
  const [confirmTarget, setConfirmTarget] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState(false);

  // タイトル編集
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);

  function startEdit(m: Material) {
    setEditId(m.id);
    setEditTitle(m.title);
  }

  function cancelEdit() {
    setEditId(null);
    setEditTitle('');
  }

  async function handleSaveEdit() {
    if (!editId || !editTitle.trim()) return;
    setSaving(true);
    await supabase.from('materials').update({ title: editTitle.trim() }).eq('id', editId);
    setSaving(false);
    setEditId(null);
    refetch();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);
    setUploadProgress(0);

    const nextOrder = materials.length > 0
      ? Math.max(...materials.map((m) => m.display_order)) + 1
      : 1;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('PDFファイルのみアップロード可能です');
        continue;
      }

      const safeFileName = sanitizeFileName(file.name);
      const filePath = `${session.id}/${Date.now()}_${safeFileName}`;
      const displayTitle = file.name.replace(/\.pdf$/i, '');

      const { error: uploadErr } = await supabase.storage
        .from('materials')
        .upload(filePath, file);

      if (uploadErr) {
        setError(`アップロードに失敗しました: ${uploadErr.message}`);
        continue;
      }

      await supabase.from('materials').insert({
        session_id: session.id,
        title: displayTitle,
        file_path: filePath,
        display_order: nextOrder + i,
      });

      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setUploading(false);
    fileInputRef.current!.value = '';
    refetch();
  }

  async function handleConfirmDelete() {
    if (!confirmTarget) return;
    setDeleting(true);
    await supabase.storage.from('materials').remove([confirmTarget.file_path]);
    await supabase.from('materials').delete().eq('id', confirmTarget.id);
    setDeleting(false);
    setConfirmTarget(null);
    refetch();
  }

  async function handleMove(material: Material, direction: 'up' | 'down') {
    const idx = materials.findIndex((m) => m.id === material.id);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= materials.length) return;
    const target = materials[targetIdx];
    await supabase.from('materials').update({ display_order: target.display_order }).eq('id', material.id);
    await supabase.from('materials').update({ display_order: material.display_order }).eq('id', target.id);
    refetch();
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{session.title}</Typography>
          {session.category && <Chip label={session.category} size="small" sx={{ mt: 0.5 }} />}
        </Box>
        <Button
          variant="outlined"
          startIcon={<UploadFileIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          size="small"
        >
          PDFをアップロード
        </Button>
        <input ref={fileInputRef} type="file" accept=".pdf" multiple hidden onChange={handleUpload} />
      </Box>

      {uploading && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : materials.length === 0 ? (
        <Box
          sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: 200, border: '2px dashed', borderColor: 'grey.300', borderRadius: 2,
            color: 'text.secondary', gap: 1,
          }}
        >
          <PictureAsPdfIcon sx={{ fontSize: 40, opacity: 0.3 }} />
          <Typography variant="body2">PDFファイルをアップロードしてください</Typography>
        </Box>
      ) : (
        <List dense>
          {materials.map((m, i) => (
            <ListItem
              key={m.id}
              divider
              sx={{ bgcolor: 'background.paper', borderRadius: 1, mb: 0.5, pr: editId === m.id ? 1 : undefined }}
              alignItems="center"
            >
              <PictureAsPdfIcon fontSize="small" sx={{ mr: 1, color: 'error.main', flexShrink: 0 }} />

              {editId === m.id ? (
                /* ── インライン編集 ── */
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, mr: 1 }}>
                  <TextField
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    size="small"
                    fullWidth
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                  />
                  <Tooltip title="保存 (Enter)">
                    <span>
                      <IconButton size="small" color="primary" onClick={handleSaveEdit} disabled={!editTitle.trim() || saving}>
                        {saving ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="キャンセル (Esc)">
                    <IconButton size="small" onClick={cancelEdit}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ) : (
                /* ── 通常表示 ── */
                <>
                  <ListItemText
                    primary={m.title}
                    secondary={`順序: ${m.display_order}`}
                    slotProps={{ primary: { variant: 'body2' } as never }}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="上へ">
                      <span>
                        <IconButton size="small" onClick={() => handleMove(m, 'up')} disabled={i === 0}>
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="下へ">
                      <span>
                        <IconButton size="small" onClick={() => handleMove(m, 'down')} disabled={i === materials.length - 1}>
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="タイトルを編集">
                      <IconButton size="small" onClick={() => startEdit(m)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="削除">
                      <IconButton size="small" color="error" onClick={() => setConfirmTarget(m)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </>
              )}
            </ListItem>
          ))}
        </List>
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        title="資料を削除"
        message={`「${confirmTarget?.title ?? ''}」を削除しますか？\nPDFファイルも合わせて削除されます。\nこの操作は取り消せません。`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </Box>
  );
}
