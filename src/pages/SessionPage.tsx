import {
  Box, Typography, AppBar, Toolbar, IconButton, Tooltip,
  Chip, Button, CircularProgress, Divider, List, ListItem,
  ListItemIcon, ListItemText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import SchoolIcon from '@mui/icons-material/School';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSessionProgress } from '../hooks/useSessionProgress';
import { useSeries } from '../hooks/useSeries';
import { useProfiles } from '../hooks/useProfiles';
import { useSurveyForSession } from '../hooks/useSurvey';
import type { Session, Material } from '../types';

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const progress = useSessionProgress(id ?? null);
  const { series } = useSeries();
  const { profiles } = useProfiles();
  const { survey } = useSurveyForSession(id ?? null);

  const sessionSeries = session?.series_id ? series.find((s) => s.id === session.series_id) : null;
  const profilesMap = new Map(profiles.map((p) => [p.id, p]));
  const instructorNames = (session?.instructors ?? [])
    .map((uid) => profilesMap.get(uid))
    .filter(Boolean)
    .map((p) => p!.display_name ?? p!.email);

  const isCompleted = progress?.status === 'completed';
  const isStarted = progress?.status === 'in_progress';
  const isScheduled = session?.published_at != null && new Date(session.published_at) > new Date();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      supabase.from('sessions').select('*').eq('id', id).single(),
      supabase.from('materials').select('*').eq('session_id', id).order('display_order'),
    ]).then(([{ data: sv }, { data: mats }]) => {
      setSession(sv ? { ...sv, instructors: sv.instructors ?? [] } : null);
      setMaterials(mats ?? []);
      setLoading(false);
    });
  }, [id]);

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleStart() {
    navigate('/', { state: { openSession: session } });
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2 }}>
        <Typography>講習会が見つかりません</Typography>
        <Button onClick={() => navigate('/')}>ダッシュボードへ</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <Tooltip title={sessionSeries ? 'シリーズページへ' : 'ダッシュボードへ'}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => sessionSeries ? navigate(`/series/${sessionSeries.id}`) : navigate('/')}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          {sessionSeries && (
            <Box
              component={Link}
              to={`/series/${sessionSeries.id}`}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mr: 2, textDecoration: 'none', color: 'inherit', opacity: 0.85 }}
            >
              <FolderSpecialIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>{sessionSeries.title}</Typography>
            </Box>
          )}
          <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }} noWrap>{session.title}</Typography>
          <Tooltip title={copied ? 'コピーしました！' : 'このページのURLをコピー'}>
            <IconButton color="inherit" onClick={copyUrl}>
              {copied ? <CheckIcon /> : <ContentCopyIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Toolbar />

      <Box sx={{ maxWidth: 720, mx: 'auto', px: 3, py: 5 }}>

        {/* ヒーロー */}
        <Box sx={{
          height: 160, bgcolor: isCompleted ? 'success.50' : isStarted ? 'primary.50' : 'grey.50',
          borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', mb: 4, border: 1, borderColor: 'divider',
        }}>
          <SchoolIcon sx={{ fontSize: 64, color: isCompleted ? 'success.light' : isStarted ? 'primary.light' : 'grey.200' }} />
          {session.series_order > 0 && (
            <Chip label={`第${session.series_order}回`} size="small"
              sx={{ position: 'absolute', top: 12, left: 12, bgcolor: 'background.paper' }} />
          )}
          {isCompleted && <CheckCircleIcon sx={{ position: 'absolute', top: 12, right: 12, color: 'success.main', fontSize: 22 }} />}
          {isStarted && <PlayCircleIcon sx={{ position: 'absolute', top: 12, right: 12, color: 'primary.main', fontSize: 22 }} />}
          {isScheduled && (
            <Chip
              label={`${new Date(session.published_at!).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 公開予定`}
              color="warning" size="small"
              sx={{ position: 'absolute', bottom: 12, right: 12 }}
            />
          )}
        </Box>

        {/* タイトル・チップ */}
        <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5, flexWrap: 'wrap' }}>
          {session.category && <Chip label={session.category} size="small" variant="outlined" />}
          {isCompleted && <Chip label="完了" size="small" color="success" icon={<CheckCircleIcon />} />}
          {isStarted && <Chip label="学習中" size="small" color="primary" icon={<PlayCircleIcon />} />}
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, lineHeight: 1.3 }}>{session.title}</Typography>

        {/* 説明 */}
        {session.description ? (
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 3 }}>
            {session.description}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>説明はありません</Typography>
        )}

        {/* メタ情報 */}
        {(instructorNames.length > 0 || session.published_at) && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1.5, border: 1, borderColor: 'divider' }}>
            {instructorNames.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">担当：{instructorNames.join('、')}</Typography>
              </Box>
            )}
            {session.published_at && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarTodayIcon sx={{ fontSize: 16, color: isScheduled ? 'warning.main' : 'text.secondary' }} />
                <Typography variant="body2" color={isScheduled ? 'warning.dark' : 'text.secondary'} sx={{ fontWeight: isScheduled ? 700 : 400 }}>
                  {isScheduled
                    ? `${new Date(session.published_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })} 公開予定`
                    : `${new Date(session.published_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })} 公開`}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* 資料一覧 */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          収録資料 {materials.length > 0 && `（${materials.length} 件）`}
        </Typography>
        {materials.length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>資料はまだありません</Typography>
        ) : (
          <List dense disablePadding sx={{ mb: 3 }}>
            {materials.map((m, i) => (
              <ListItem key={m.id} disablePadding sx={{ py: 0.5, borderBottom: 1, borderColor: 'divider' }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <PictureAsPdfIcon fontSize="small" sx={{ color: 'error.main', opacity: 0.7 }} />
                </ListItemIcon>
                <ListItemText
                  primary={m.title || `資料 ${i + 1}`}
                  slotProps={{ primary: { variant: 'body2' } as never }}
                />
              </ListItem>
            ))}
          </List>
        )}

        {/* アンケート */}
        {survey && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, p: 1.5, bgcolor: 'primary.50', borderRadius: 1.5 }}>
            <AssignmentIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="body2" color="primary.dark" sx={{ fontWeight: 600 }}>
              受講後アンケートあり — {survey.title}
            </Typography>
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* CTAボタン */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={handleStart}
            sx={{ flexGrow: 1, minWidth: 200 }}
          >
            {isCompleted ? 'もう一度見る' : isStarted ? '続きを学ぶ' : 'ダッシュボードで学習を始める'}
          </Button>
          {sessionSeries && (
            <Button
              component={Link}
              to={`/series/${sessionSeries.id}`}
              variant="outlined"
              size="large"
              startIcon={<FolderSpecialIcon />}
            >
              シリーズを見る
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
