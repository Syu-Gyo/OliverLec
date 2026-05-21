import {
  Box, Typography, IconButton, Chip, Divider, Button, CircularProgress,
  List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SchoolIcon from '@mui/icons-material/School';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useMaterials } from '../hooks/useMaterials';
import { useSessionProgress } from '../hooks/useSessionProgress';
import { useSeries } from '../hooks/useSeries';
import { useProfiles } from '../hooks/useProfiles';
import type { Session } from '../types';

export const DETAIL_PANEL_WIDTH = 300;

interface Props {
  session: Session;
  onClose: () => void;
  onStart: (session: Session) => void;
}

export default function SessionDetailPanel({ session, onClose, onStart }: Props) {
  const { materials, loading } = useMaterials(session.id);
  const progress = useSessionProgress(session.id);
  const { series } = useSeries();
  const { profiles } = useProfiles();

  const isCompleted = progress?.status === 'completed';
  const isStarted = progress?.status === 'in_progress';
  const isScheduled = session.published_at != null && new Date(session.published_at) > new Date();
  const sessionSeries = session.series_id ? series.find((s) => s.id === session.series_id) : null;

  const profilesMap = new Map(profiles.map((p) => [p.id, p]));
  const instructorNames = (session.instructors ?? [])
    .map((id) => profilesMap.get(id))
    .filter(Boolean)
    .map((p) => p!.display_name ?? p!.email);

  const publishDateLabel = session.published_at
    ? new Date(session.published_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })
    : null;

  return (
    <Box
      sx={{
        width: DETAIL_PANEL_WIDTH,
        flexShrink: 0,
        borderLeft: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      {/* ヘッダー */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
          講習会の詳細
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* コンテンツ */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {/* アイコンエリア */}
        <Box
          sx={{
            height: 120,
            bgcolor: isCompleted ? 'success.50' : isStarted ? 'primary.50' : 'grey.50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <SchoolIcon sx={{ fontSize: 56, color: isCompleted ? 'success.light' : isStarted ? 'primary.light' : 'grey.300' }} />
          {sessionSeries && session.series_order > 0 && (
            <Chip
              label={`第${session.series_order}回`}
              size="small"
              sx={{ position: 'absolute', top: 8, left: 8, fontSize: 11, bgcolor: 'background.paper' }}
            />
          )}
        </Box>

        <Box sx={{ p: 2 }}>
          {/* シリーズバッジ */}
          {sessionSeries && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5, p: 1, bgcolor: 'primary.50', borderRadius: 1 }}>
              <FolderSpecialIcon sx={{ fontSize: 16, color: 'primary.main', flexShrink: 0 }} />
              <Typography variant="caption" sx={{ color: 'primary.dark', fontWeight: 600 }} noWrap>
                {sessionSeries.title}
              </Typography>
            </Box>
          )}

          {/* チップ */}
          <Box sx={{ display: 'flex', gap: 0.75, mb: 1.25, flexWrap: 'wrap' }}>
            {session.category && <Chip label={session.category} size="small" variant="outlined" />}
            {isCompleted && <Chip label="完了" size="small" color="success" icon={<CheckCircleIcon />} />}
            {isStarted && <Chip label="学習中" size="small" color="primary" icon={<PlayCircleIcon />} />}
          </Box>

          {/* タイトル */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.4 }}>
            {session.title}
          </Typography>

          {/* 説明 */}
          {session.description ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>
              {session.description}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.disabled" sx={{ mb: 1.5 }}>
              説明はありません
            </Typography>
          )}

          {/* 担当者・公開日 */}
          {(instructorNames.length > 0 || publishDateLabel) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2, p: 1.25, bgcolor: 'grey.50', borderRadius: 1 }}>
              {instructorNames.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <PersonIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary">
                    {instructorNames.join('、')}
                  </Typography>
                </Box>
              )}
              {publishDateLabel && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <CalendarTodayIcon sx={{ fontSize: 14, color: isScheduled ? 'warning.main' : 'text.secondary', flexShrink: 0 }} />
                  <Typography variant="caption" color={isScheduled ? 'warning.dark' : 'text.secondary'} sx={{ fontWeight: isScheduled ? 700 : 400 }}>
                    {isScheduled ? `${publishDateLabel} 公開予定` : `${publishDateLabel} 公開`}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />

          {/* 資料一覧 */}
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
            収録資料 {!loading && `（${materials.length} 件）`}
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={18} />
            </Box>
          ) : materials.length === 0 ? (
            <Typography variant="body2" color="text.disabled">資料はまだありません</Typography>
          ) : (
            <List dense disablePadding>
              {materials.map((m, i) => (
                <ListItem key={m.id} disablePadding sx={{ py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <PictureAsPdfIcon fontSize="small" sx={{ color: 'error.main', opacity: 0.7 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={m.title || `資料 ${i + 1}`}
                    slotProps={{ primary: { variant: 'body2', noWrap: true } as never }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>

      {/* フッター: CTAボタン */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          variant={isStarted || isCompleted ? 'outlined' : 'contained'}
          color={isCompleted ? 'success' : 'primary'}
          endIcon={<ArrowForwardIcon />}
          onClick={() => onStart(session)}
          fullWidth
          size="large"
        >
          {isCompleted ? 'もう一度見る' : isStarted ? '続きを学ぶ' : '学習を始める'}
        </Button>
      </Box>
    </Box>
  );
}
