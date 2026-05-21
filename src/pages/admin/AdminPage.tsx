import { useState } from 'react';
import {
  Box, Toolbar, Typography, Button, Paper, AppBar,
  IconButton, Tooltip, Grid, Tabs, Tab,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import ClassIcon from '@mui/icons-material/Class';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import PeopleIcon from '@mui/icons-material/People';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useNavigate } from 'react-router-dom';

import SessionList from './SessionList';
import SessionFormDialog from './SessionFormDialog';
import SeriesManager from './SeriesManager';
import SeriesFormDialog from './SeriesFormDialog';
import MaterialManager from './MaterialManager';
import SurveyManager from './SurveyManager';
import UserManager from './UserManager';
import type { Session, Series } from '../../types';

export default function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  // 講習会管理
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionFormOpen, setSessionFormOpen] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [sessionRefresh, setSessionRefresh] = useState(0);
  const [sessionDetailTab, setSessionDetailTab] = useState(0); // 0=資料, 1=アンケート

  // シリーズ管理
  const [seriesFormOpen, setSeriesFormOpen] = useState(false);
  const [editSeries, setEditSeries] = useState<Series | null>(null);
  const [seriesRefresh, setSeriesRefresh] = useState(0);

  function handleEditSession(session: Session) {
    setEditSession(session);
    setSessionFormOpen(true);
  }

  function handleCreateSession() {
    setEditSession(null);
    setSessionFormOpen(true);
  }

  function handleSessionFormClose(saved: boolean) {
    setSessionFormOpen(false);
    setEditSession(null);
    if (saved) setSessionRefresh((v) => v + 1);
  }

  function handleEditSeries(series: Series) {
    setEditSeries(series);
    setSeriesFormOpen(true);
  }

  function handleCreateSeries() {
    setEditSeries(null);
    setSeriesFormOpen(true);
  }

  function handleSeriesFormClose(saved: boolean) {
    setSeriesFormOpen(false);
    setEditSeries(null);
    if (saved) setSeriesRefresh((v) => v + 1);
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="fixed">
        <Toolbar>
          <Tooltip title="ダッシュボードに戻る">
            <IconButton color="inherit" edge="start" onClick={() => navigate('/')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            OliverLec — 管理画面
          </Typography>
        </Toolbar>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ bgcolor: 'primary.dark', px: 2 }}
        >
          <Tab icon={<ClassIcon fontSize="small" />} iconPosition="start" label="講習会管理" />
          <Tab icon={<FolderSpecialIcon fontSize="small" />} iconPosition="start" label="シリーズ管理" />
          <Tab icon={<PeopleIcon fontSize="small" />} iconPosition="start" label="ユーザー管理" />
        </Tabs>
      </AppBar>

      {/* fixed AppBar + Tabs のオフセット */}
      <Box sx={{ height: 112 }} />

      <Box sx={{ p: 3, flexGrow: 1 }}>
        {/* ── 講習会管理 ── */}
        {tab === 0 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>講習会一覧</Typography>
                  <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={handleCreateSession}>
                    追加
                  </Button>
                </Box>
                <SessionList
                  key={sessionRefresh}
                  selectedId={selectedSession?.id ?? null}
                  onSelect={setSelectedSession}
                  onEdit={handleEditSession}
                  onDeleted={() => { setSessionRefresh((v) => v + 1); setSelectedSession(null); }}
                />
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Paper sx={{ minHeight: 400 }}>
                {selectedSession ? (
                  <>
                    <Tabs
                      value={sessionDetailTab}
                      onChange={(_, v) => setSessionDetailTab(v)}
                      sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
                    >
                      <Tab icon={<PictureAsPdfIcon fontSize="small" />} iconPosition="start" label="資料" sx={{ minHeight: 48 }} />
                      <Tab icon={<AssignmentIcon fontSize="small" />} iconPosition="start" label="アンケート" sx={{ minHeight: 48 }} />
                    </Tabs>
                    <Box sx={{ p: 2 }}>
                      {sessionDetailTab === 0 && <MaterialManager session={selectedSession} />}
                      {sessionDetailTab === 1 && <SurveyManager session={selectedSession} />}
                    </Box>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'text.secondary' }}>
                    <Typography>左から講習会を選択してください</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* ── シリーズ管理 ── */}
        {tab === 1 && (
          <Grid container spacing={3} justifyContent="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>シリーズ一覧</Typography>
                  <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={handleCreateSeries}>
                    追加
                  </Button>
                </Box>
                <SeriesManager
                  key={seriesRefresh}
                  onEdit={handleEditSeries}
                  onDeleted={() => setSeriesRefresh((v) => v + 1)}
                  refreshKey={seriesRefresh}
                />
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* ── ユーザー管理 ── */}
        {tab === 2 && (
          <Paper sx={{ p: 2 }}>
            <UserManager />
          </Paper>
        )}
      </Box>

      <SessionFormDialog
        open={sessionFormOpen}
        session={editSession}
        onClose={handleSessionFormClose}
      />
      <SeriesFormDialog
        open={seriesFormOpen}
        series={editSeries}
        onClose={handleSeriesFormClose}
      />
    </Box>
  );
}
