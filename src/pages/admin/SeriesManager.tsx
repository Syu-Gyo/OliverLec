import {
  List, ListItemButton, ListItemText, ListItemSecondaryAction,
  IconButton, CircularProgress, Box, Typography, Tooltip, Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSeries } from '../../hooks/useSeries';
import ConfirmDialog from '../../components/ConfirmDialog';
import type { Series } from '../../types';

interface Props {
  onEdit: (series: Series) => void;
  onDeleted: () => void;
  refreshKey?: number;
}

export default function SeriesManager({ onEdit, onDeleted, refreshKey }: Props) {
  const { series, loading } = useSeries(refreshKey);
  const [confirmTarget, setConfirmTarget] = useState<Series | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!confirmTarget) return;
    setDeleting(true);
    await supabase.from('series').delete().eq('id', confirmTarget.id);
    setDeleting(false);
    setConfirmTarget(null);
    onDeleted();
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (series.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
        シリーズがありません
      </Typography>
    );
  }

  return (
    <>
      <List dense disablePadding>
        {series.map((s) => (
          <ListItemButton key={s.id} sx={{ borderRadius: 1, mb: 0.5 }}>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {s.title}
                  {s.category && (
                    <Chip label={s.category} size="small" variant="outlined" sx={{ fontSize: 10, height: 16 }} />
                  )}
                </Box>
              }
              secondary={s.description ?? `表示順: ${s.display_order}`}
              slotProps={{
                secondary: { noWrap: true, variant: 'caption' } as never,
              }}
            />
            <ListItemSecondaryAction>
              <Tooltip title="編集">
                <IconButton size="small" onClick={() => onEdit(s)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="削除">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => { e.stopPropagation(); setConfirmTarget(s); }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </ListItemSecondaryAction>
          </ListItemButton>
        ))}
      </List>

      <ConfirmDialog
        open={confirmTarget !== null}
        title="シリーズを削除"
        message={`「${confirmTarget?.title ?? ''}」を削除しますか？\n関連する講習会のシリーズ設定は解除されます（講習会自体は残ります）。\nこの操作は取り消せません。`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </>
  );
}
