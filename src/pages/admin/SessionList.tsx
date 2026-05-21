import {
  List, ListItemButton, ListItemText, ListItemSecondaryAction,
  IconButton, CircularProgress, Box, Typography, Tooltip,
  Collapse, Divider, Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSessions } from '../../hooks/useSessions';
import { useSeries } from '../../hooks/useSeries';
import ConfirmDialog from '../../components/ConfirmDialog';
import type { Session } from '../../types';

interface Props {
  selectedId: string | null;
  onSelect: (session: Session) => void;
  onEdit: (session: Session) => void;
  onDeleted: () => void;
}

export default function SessionList({ selectedId, onSelect, onEdit, onDeleted }: Props) {
  const { sessions, loading: sessionsLoading } = useSessions();
  const { series, loading: seriesLoading } = useSeries();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [confirmTarget, setConfirmTarget] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState(false);

  function toggleSeries(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleConfirmDelete() {
    if (!confirmTarget) return;
    setDeleting(true);

    // Storage ファイルを先に削除
    const { data: mats } = await supabase
      .from('materials')
      .select('file_path')
      .eq('session_id', confirmTarget.id);
    if (mats && mats.length > 0) {
      await supabase.storage.from('materials').remove(mats.map((m) => m.file_path));
    }

    await supabase.from('materials').delete().eq('session_id', confirmTarget.id);
    await supabase.from('sessions').delete().eq('id', confirmTarget.id);

    setDeleting(false);
    setConfirmTarget(null);
    onDeleted();
  }

  if (sessionsLoading || seriesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (sessions.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
        講習会がありません
      </Typography>
    );
  }

  // シリーズごとにグループ化
  const sessionsBySeries = new Map<string, Session[]>();
  const standaloneSessions: Session[] = [];

  for (const session of sessions) {
    if (session.series_id) {
      const group = sessionsBySeries.get(session.series_id) ?? [];
      group.push(session);
      sessionsBySeries.set(session.series_id, group);
    } else {
      standaloneSessions.push(session);
    }
  }
  for (const [, group] of sessionsBySeries) {
    group.sort((a, b) => (a.series_order ?? 0) - (b.series_order ?? 0));
  }

  const orderedSeries = series.filter((s) => sessionsBySeries.has(s.id));

  function SessionRow({ session, indent = false }: { session: Session; indent?: boolean }) {
    const isScheduled = session.published_at && new Date(session.published_at) > new Date();
    return (
      <ListItemButton
        selected={selectedId === session.id}
        onClick={() => onSelect(session)}
        sx={{ borderRadius: 1, mb: 0.5, pl: indent ? 3 : 1 }}
      >
        {indent && session.series_order > 0 && (
          <Typography component="span" sx={{ fontSize: 11, color: 'text.secondary', mr: 0.75, flexShrink: 0 }}>
            第{session.series_order}回
          </Typography>
        )}
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, overflow: 'hidden' }}>
              <Typography variant="body2" noWrap sx={{ flexShrink: 1, minWidth: 0 }}>{session.title}</Typography>
              {isScheduled && (
                <Chip label="公開予定" size="small" color="warning" variant="outlined"
                  sx={{ fontSize: 9, height: 14, flexShrink: 0 }} />
              )}
            </Box>
          }
          secondary={session.category ?? undefined}
          slotProps={{
            secondary: { noWrap: true, variant: 'caption' } as never,
          }}
        />
        <ListItemSecondaryAction>
          <Tooltip title="編集">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(session); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="削除">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => { e.stopPropagation(); setConfirmTarget(session); }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ListItemSecondaryAction>
      </ListItemButton>
    );
  }

  return (
    <>
      <List dense disablePadding>

        {/* ── シリーズあり ── */}
        {orderedSeries.map((s) => {
          const groupSessions = sessionsBySeries.get(s.id) ?? [];
          const isOpen = !collapsed.has(s.id);

          return (
            <Box key={s.id}>
              {/* シリーズヘッダー */}
              <ListItemButton
                onClick={() => toggleSeries(s.id)}
                sx={{ borderRadius: 1, mb: 0.5, bgcolor: 'grey.50', px: 1 }}
                dense
              >
                <FolderSpecialIcon sx={{ fontSize: 15, color: 'primary.main', mr: 0.75, flexShrink: 0 }} />
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{s.title}</Typography>
                      {s.category && (
                        <Chip label={s.category} size="small" variant="outlined" sx={{ fontSize: 9, height: 14 }} />
                      )}
                      <Chip
                        label={`${groupSessions.length}件`}
                        size="small"
                        sx={{ fontSize: 9, height: 14, bgcolor: 'primary.50', color: 'primary.main' }}
                      />
                    </Box>
                  }
                />
                {isOpen
                  ? <ExpandLessIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                  : <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                }
              </ListItemButton>

              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <Box sx={{ borderLeft: '2px solid', borderColor: 'primary.100', ml: 1.5, pl: 0.5, mb: 0.5 }}>
                  {groupSessions.map((session) => (
                    <SessionRow key={session.id} session={session} indent />
                  ))}
                </Box>
              </Collapse>
              <Divider sx={{ mb: 1 }} />
            </Box>
          );
        })}

        {/* ── シリーズなし ── */}
        {standaloneSessions.length > 0 && (
          <>
            {orderedSeries.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ px: 1, pt: 0.5, pb: 0.25, display: 'block', fontWeight: 700, letterSpacing: 0.5 }}>
                その他
              </Typography>
            )}
            {standaloneSessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </>
        )}
      </List>

      <ConfirmDialog
        open={confirmTarget !== null}
        title="講習会を削除"
        message={`「${confirmTarget?.title ?? ''}」を削除しますか？\n関連する資料（PDFファイル含む）もすべて削除されます。\nこの操作は取り消せません。`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </>
  );
}
