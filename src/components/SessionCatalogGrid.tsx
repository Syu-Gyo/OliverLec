import {
  Box, Typography, Card, CardContent, CardActions, CardActionArea,
  Button, Chip, CircularProgress, Grid,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { useSessions } from '../hooks/useSessions';
import { useSeries } from '../hooks/useSeries';
import { useUserSessions } from '../hooks/useSessionProgress';
import type { Session, Series, UserSessionProgress } from '../types';

interface Props {
  searchQuery: string;
  previewSessionId: string | null;
  onPreview: (session: Session) => void;
  onStartSession: (session: Session) => void;
}

function SessionCard({
  session, series, progress, isSelected, onPreview, onStartSession,
}: {
  session: Session;
  series?: Series | null;
  progress: UserSessionProgress | undefined;
  isSelected: boolean;
  onPreview: (s: Session) => void;
  onStartSession: (s: Session) => void;
}) {
  const isCompleted = progress?.status === 'completed';
  const isStarted = progress?.status === 'in_progress';

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s, transform 0.15s',
        cursor: 'pointer',
        ...(isSelected && { borderColor: 'primary.main', borderWidth: 2, boxShadow: 3 }),
        ...(!isSelected && { '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' } }),
        ...(isCompleted && !isSelected && { borderColor: 'success.light' }),
        ...(isStarted && !isSelected && { borderColor: 'primary.light' }),
      }}
    >
      <CardActionArea
        onClick={() => onPreview(session)}
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box
          sx={{
            height: 80,
            bgcolor: isCompleted ? 'success.50' : isStarted ? 'primary.50' : 'grey.50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: 1,
            borderColor: 'divider',
            position: 'relative',
          }}
        >
          <SchoolIcon sx={{ fontSize: 36, color: isCompleted ? 'success.main' : isStarted ? 'primary.main' : 'grey.300' }} />
          {isCompleted && <CheckCircleIcon sx={{ position: 'absolute', top: 6, right: 6, color: 'success.main', fontSize: 16 }} />}
          {isStarted && <PlayCircleIcon sx={{ position: 'absolute', top: 6, right: 6, color: 'primary.main', fontSize: 16 }} />}
          {series && session.series_order > 0 && (
            <Chip
              label={`第${session.series_order}回`}
              size="small"
              sx={{ position: 'absolute', top: 6, left: 6, fontSize: 10, height: 18, bgcolor: 'background.paper' }}
            />
          )}
        </Box>

        <CardContent sx={{ pb: 1, flexGrow: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75, flexWrap: 'wrap' }}>
            {session.category && <Chip label={session.category} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />}
            {isCompleted && <Chip label="完了" size="small" color="success" sx={{ fontSize: 10, height: 18 }} />}
            {isStarted && <Chip label="学習中" size="small" color="primary" sx={{ fontSize: 10, height: 18 }} />}
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.4 }}>
            {session.title}
          </Typography>
          {session.description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.5,
              }}
            >
              {session.description}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>

      <CardActions sx={{ px: 2, pb: 1.5, pt: 0 }}>
        <Button
          size="small"
          variant={isStarted || isCompleted ? 'outlined' : 'contained'}
          color={isCompleted ? 'success' : 'primary'}
          endIcon={<ArrowForwardIcon />}
          onClick={(e) => { e.stopPropagation(); onStartSession(session); }}
          fullWidth
        >
          {isCompleted ? 'もう一度見る' : isStarted ? '続きを学ぶ' : '学習を始める'}
        </Button>
      </CardActions>
    </Card>
  );
}

export default function SessionCatalogGrid({ searchQuery, previewSessionId, onPreview, onStartSession }: Props) {
  const { sessions, loading } = useSessions(searchQuery);
  const { series } = useSeries();
  const { sessions: userSessions } = useUserSessions();

  const progressMap = new Map(userSessions.map((s) => [s.id, s.progress ?? undefined]));
  const seriesMap = new Map(series.map((s) => [s.id, s]));

  const gridSize = { xs: 12, sm: 6, md: previewSessionId ? 6 : 4, lg: previewSessionId ? 4 : 3 };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (sessions.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, gap: 2 }}>
        <SchoolIcon sx={{ fontSize: 64, opacity: 0.15 }} />
        <Typography color="text.secondary">
          {searchQuery ? `「${searchQuery}」に一致する講習会が見つかりません` : '講習会がまだ登録されていません'}
        </Typography>
      </Box>
    );
  }

  // 検索中はフラット表示
  if (searchQuery) {
    return (
      <Box sx={{ p: 3, overflow: 'auto', flexGrow: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          「{searchQuery}」の検索結果：{sessions.length} 件
        </Typography>
        <Grid container spacing={2.5}>
          {sessions.map((session) => (
            <Grid key={session.id} size={gridSize}>
              <SessionCard
                session={session}
                series={session.series_id ? seriesMap.get(session.series_id) : null}
                progress={progressMap.get(session.id)}
                isSelected={session.id === previewSessionId}
                onPreview={onPreview}
                onStartSession={onStartSession}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // シリーズごとにグルーピング
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
    group.sort((a, b) => a.series_order - b.series_order);
  }

  const orderedSeries = series
    .filter((s) => sessionsBySeries.has(s.id))
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <Box sx={{ p: 3, overflow: 'auto', flexGrow: 1 }}>
      {orderedSeries.map((s) => {
        const groupSessions = sessionsBySeries.get(s.id) ?? [];
        const completedCount = groupSessions.filter((ses) => progressMap.get(ses.id)?.status === 'completed').length;
        const startedCount = groupSessions.filter((ses) => progressMap.get(ses.id)?.status === 'in_progress').length;

        return (
          <Box key={s.id} sx={{ mb: 4 }}>
            {/* シリーズヘッダー */}
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              mb: 2, pb: 1.5, borderBottom: 2, borderColor: 'primary.main',
            }}>
              <FolderSpecialIcon sx={{ color: 'primary.main', fontSize: 22, flexShrink: 0 }} />
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{s.title}</Typography>
                  {s.category && (
                    <Chip label={s.category} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                  )}
                  {completedCount === groupSessions.length && groupSessions.length > 0 && (
                    <Chip label="全回完了" size="small" color="success" sx={{ fontSize: 10, height: 18 }} />
                  )}
                </Box>
                {s.description && (
                  <Typography variant="caption" color="text.secondary">{s.description}</Typography>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                {completedCount > 0 || startedCount > 0
                  ? `${completedCount} / ${groupSessions.length} 完了`
                  : `全 ${groupSessions.length} 回`}
              </Typography>
            </Box>

            <Grid container spacing={2.5}>
              {groupSessions.map((session) => (
                <Grid key={session.id} size={gridSize}>
                  <SessionCard
                    session={session}
                    series={s}
                    progress={progressMap.get(session.id)}
                    isSelected={session.id === previewSessionId}
                    onPreview={onPreview}
                    onStartSession={onStartSession}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      })}

      {standaloneSessions.length > 0 && (
        <Box sx={{ mb: 4 }}>
          {orderedSeries.length > 0 && (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              mb: 2, pb: 1.5, borderBottom: 2, borderColor: 'grey.300',
            }}>
              <SchoolIcon sx={{ color: 'text.disabled', fontSize: 22, flexShrink: 0 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                その他の講習会
              </Typography>
            </Box>
          )}
          <Grid container spacing={2.5}>
            {standaloneSessions.map((session) => (
              <Grid key={session.id} size={gridSize}>
                <SessionCard
                  session={session}
                  series={null}
                  progress={progressMap.get(session.id)}
                  isSelected={session.id === previewSessionId}
                  onPreview={onPreview}
                  onStartSession={onStartSession}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}
