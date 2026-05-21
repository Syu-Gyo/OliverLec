import {
  Box, Typography, AppBar, Toolbar, IconButton, Tooltip,
  Chip, Button, CircularProgress, Card, CardContent, CardActionArea,
  CardActions, Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUserSessions } from '../hooks/useSessionProgress';
import { useProfiles } from '../hooks/useProfiles';
import type { Series, Session } from '../types';

export default function SeriesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [series, setSeries] = useState<Series | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const { sessions: userSessions } = useUserSessions();
  const { profiles } = useProfiles();

  const progressMap = new Map(userSessions.map((s) => [s.id, s.progress]));
  const profilesMap = new Map(profiles.map((p) => [p.id, p]));

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      supabase.from('series').select('*').eq('id', id).single(),
      supabase.from('sessions').select('*').eq('series_id', id).order('series_order'),
    ]).then(([{ data: sv }, { data: ss }]) => {
      setSeries(sv ?? null);
      setSessions((ss ?? []).map((s) => ({ ...s, instructors: s.instructors ?? [] })));
      setLoading(false);
    });
  }, [id]);

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!series) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2 }}>
        <Typography>シリーズが見つかりません</Typography>
        <Button onClick={() => navigate('/')}>ダッシュボードへ</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <Tooltip title="ダッシュボードへ">
            <IconButton color="inherit" edge="start" onClick={() => navigate('/')} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>OliverLec</Typography>
          <Tooltip title={copied ? 'コピーしました！' : 'このページのURLをコピー'}>
            <IconButton color="inherit" onClick={copyUrl}>
              {copied ? <CheckIcon /> : <ContentCopyIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Toolbar />

      <Box sx={{ maxWidth: 900, mx: 'auto', px: 3, py: 5 }}>
        {/* シリーズヘッダー */}
        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <FolderSpecialIcon sx={{ fontSize: 36, color: 'primary.main' }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{series.title}</Typography>
                {series.category && (
                  <Chip label={series.category} size="small" variant="outlined" color="primary" />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">全 {sessions.length} 回</Typography>
            </Box>
          </Box>
          {series.description && (
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, maxWidth: 640 }}>
              {series.description}
            </Typography>
          )}
        </Box>

        {/* セッション一覧 */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>講習会一覧</Typography>
        <Grid container spacing={2.5}>
          {sessions.map((session) => {
            const progress = progressMap.get(session.id);
            const isCompleted = progress?.status === 'completed';
            const isStarted = progress?.status === 'in_progress';
            const instructorNames = session.instructors
              .map((uid) => profilesMap.get(uid))
              .filter(Boolean)
              .map((p) => p!.display_name ?? p!.email);

            return (
              <Grid key={session.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%', display: 'flex', flexDirection: 'column',
                    borderColor: isCompleted ? 'success.light' : isStarted ? 'primary.light' : 'divider',
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: 3 },
                  }}
                >
                  <CardActionArea
                    component={Link}
                    to={`/sessions/${session.id}`}
                    sx={{ flexGrow: 1 }}
                  >
                    <Box sx={{
                      height: 72, bgcolor: isCompleted ? 'success.50' : isStarted ? 'primary.50' : 'grey.50',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                    }}>
                      <SchoolIcon sx={{ fontSize: 30, color: isCompleted ? 'success.main' : isStarted ? 'primary.main' : 'grey.300' }} />
                      {session.series_order > 0 && (
                        <Chip label={`第${session.series_order}回`} size="small"
                          sx={{ position: 'absolute', top: 6, left: 6, fontSize: 10, height: 18, bgcolor: 'background.paper' }} />
                      )}
                      {isCompleted && <CheckCircleIcon sx={{ position: 'absolute', top: 6, right: 6, color: 'success.main', fontSize: 16 }} />}
                      {isStarted && <PlayCircleIcon sx={{ position: 'absolute', top: 6, right: 6, color: 'primary.main', fontSize: 16 }} />}
                    </Box>
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.75, flexWrap: 'wrap' }}>
                        {session.category && <Chip label={session.category} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />}
                        {isCompleted && <Chip label="完了" size="small" color="success" sx={{ fontSize: 10, height: 18 }} />}
                        {isStarted && <Chip label="学習中" size="small" color="primary" sx={{ fontSize: 10, height: 18 }} />}
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.4 }}>
                        {session.title}
                      </Typography>
                      {session.description && (
                        <Typography variant="caption" color="text.secondary" sx={{
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5,
                        }}>
                          {session.description}
                        </Typography>
                      )}
                      {instructorNames.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                          <PersonIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11 }}>
                            {instructorNames.join('、')}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </CardActionArea>
                  <CardActions sx={{ px: 2, pb: 1.5, pt: 0 }}>
                    <Button
                      component={Link}
                      to={`/sessions/${session.id}`}
                      size="small"
                      variant={isStarted || isCompleted ? 'outlined' : 'contained'}
                      color={isCompleted ? 'success' : 'primary'}
                      endIcon={<ArrowForwardIcon />}
                      fullWidth
                    >
                      {isCompleted ? 'もう一度見る' : isStarted ? '続きを学ぶ' : '詳細を見る'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
}
