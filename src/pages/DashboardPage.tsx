import { useState } from 'react';
import {
  Box, Toolbar, Typography, CircularProgress,
  Fab, Tooltip, IconButton, Chip, Button, List, ListItemButton,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AddIcon from '@mui/icons-material/Add';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookIcon from '@mui/icons-material/Book';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

import AppHeader from '../components/layout/AppHeader';
import Sidebar from '../components/layout/Sidebar';
import SessionCatalogGrid from '../components/SessionCatalogGrid';
import SessionDetailPanel from '../components/SessionDetailPanel';
import SlideViewer from '../components/SlideViewer';
import GlossarySidebar, { GLOSSARY_WIDTH } from '../components/GlossarySidebar';
import { useMaterials, useMaterialUrl } from '../hooks/useMaterials';
import { useSeries } from '../hooks/useSeries';
import { useSurveyForSession, useMyResponse } from '../hooks/useSurvey';
import SurveyForm from '../components/SurveyForm';
import { useStartSession, useCompleteSession } from '../hooks/useSessionProgress';
import SessionFormDialog from './admin/SessionFormDialog';
import { useAuth } from '../contexts/AuthContext';
import type { Session, Material, SessionWithProgress } from '../types';

function SlideViewerWrapper({ filePath }: { filePath: string }) {
  const url = useMaterialUrl(filePath);
  if (!url) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', bgcolor: '#1e1e2e', borderRadius: 1 }}>
        <CircularProgress sx={{ color: 'grey.400' }} />
      </Box>
    );
  }
  return <SlideViewer url={url} />;
}

/** セッション選択時に表示する概要パネル */
function SessionOverview({
  session, materials, loading, onSelect, onSurvey,
}: {
  session: Session;
  materials: Material[];
  loading: boolean;
  onSelect: (m: Material) => void;
  onSurvey: () => void;
}) {
  const { series } = useSeries();
  const { survey } = useSurveyForSession(session.id);
  const { response: myResponse } = useMyResponse(survey?.id ?? null);
  const seriesInfo = session.series_id ? series.find((s) => s.id === session.series_id) : null;

  return (
    <Box
      sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        height: '100%', bgcolor: '#1e1e2e', borderRadius: 1,
        overflowY: 'auto', p: 4,
      }}
    >
      {/* シリーズバッジ */}
      {seriesInfo && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
          <FolderSpecialIcon sx={{ fontSize: 14, color: 'primary.light' }} />
          <Typography variant="caption" sx={{ color: 'primary.light', fontWeight: 600 }}>
            {seriesInfo.title}
            {(session.series_order ?? 0) > 0 && `　第${session.series_order}回`}
          </Typography>
        </Box>
      )}

      {/* タイトル */}
      <Typography variant="h6" sx={{ color: 'grey.100', fontWeight: 700, textAlign: 'center', mb: 1 }}>
        {session.title}
      </Typography>

      {/* 説明 */}
      {session.description && (
        <Typography variant="body2" sx={{ color: 'grey.400', textAlign: 'center', mb: 3, maxWidth: 480, lineHeight: 1.7 }}>
          {session.description}
        </Typography>
      )}

      {/* 資料一覧 */}
      <Box sx={{ width: '100%', maxWidth: 480 }}>
        <Typography variant="caption" sx={{ color: 'grey.500', display: 'block', mb: 1, letterSpacing: 0.5, fontWeight: 600 }}>
          資料一覧 {!loading && `（${materials.length}件）`}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress size={24} sx={{ color: 'grey.500' }} />
          </Box>
        ) : materials.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, gap: 1 }}>
            <PictureAsPdfIcon sx={{ fontSize: 36, color: 'grey.600', opacity: 0.4 }} />
            <Typography variant="body2" sx={{ color: 'grey.600' }}>資料がありません</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {materials.map((m, i) => (
              <ListItemButton
                key={m.id}
                onClick={() => onSelect(m)}
                sx={{
                  borderRadius: 1.5, mb: 1,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.18)' },
                  gap: 1.5,
                }}
              >
                <PictureAsPdfIcon sx={{ color: 'error.light', fontSize: 22, flexShrink: 0 }} />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: 'grey.200', fontWeight: 500 }} noWrap>
                    {m.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'grey.500' }}>
                    資料 {i + 1}
                  </Typography>
                </Box>
                <NavigateNextIcon sx={{ color: 'grey.600', flexShrink: 0 }} />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>

      {/* アンケートボタン */}
      {survey && (
        <Box sx={{ width: '100%', maxWidth: 480, mt: 3 }}>
          <Box sx={{ height: 1, bgcolor: 'rgba(255,255,255,0.1)', mb: 3 }} />
          <ListItemButton
            onClick={onSurvey}
            sx={{
              borderRadius: 1.5,
              bgcolor: myResponse ? 'rgba(76,175,80,0.12)' : 'rgba(25,118,210,0.12)',
              border: '1px solid',
              borderColor: myResponse ? 'rgba(76,175,80,0.3)' : 'rgba(25,118,210,0.3)',
              '&:hover': { bgcolor: myResponse ? 'rgba(76,175,80,0.2)' : 'rgba(25,118,210,0.2)' },
              gap: 1.5,
            }}
          >
            {myResponse
              ? <AssignmentTurnedInIcon sx={{ color: 'success.light', fontSize: 22 }} />
              : <AssignmentIcon sx={{ color: 'primary.light', fontSize: 22 }} />
            }
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" sx={{ color: myResponse ? 'success.light' : 'primary.light', fontWeight: 600 }}>
                {myResponse ? '回答済み — アンケートを確認' : 'アンケートに回答する'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'grey.500' }}>{survey.title}</Typography>
            </Box>
            <NavigateNextIcon sx={{ color: 'grey.600' }} />
          </ListItemButton>
        </Box>
      )}
    </Box>
  );
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const startSession = useStartSession();
  const completeSession = useCompleteSession();
  const [sidebarRefresh, setSidebarRefresh] = useState(0);
  const [previewSession, setPreviewSession] = useState<Session | null>(null);

  const { materials, loading: materialsLoading } = useMaterials(selectedSession?.id ?? null);
  const isAdmin = profile?.role === 'admin';

  const currentIndex = selectedMaterial
    ? materials.findIndex((m) => m.id === selectedMaterial.id)
    : -1;

  async function handleStartSession(session: Session) {
    await startSession(session.id);
    setSidebarRefresh((v) => v + 1);
    setPreviewSession(null);
    setSelectedSession(session);
    setSelectedMaterial(null);
  }

  function handleSelectSessionFromSidebar(session: SessionWithProgress) {
    if (session.id !== selectedSession?.id) {
      setSelectedMaterial(null);
      setShowSurvey(false);
    }
    setSelectedSession(session);
  }

  function handleSelectMaterialFromSidebar(session: SessionWithProgress, material: Material) {
    setSelectedSession(session);
    setSelectedMaterial(material);
    setShowSurvey(false);
  }

  function handleSelectSurveyFromSidebar(session: SessionWithProgress) {
    setSelectedSession(session);
    setSelectedMaterial(null);
    setShowSurvey(true);
  }

  function handleShowCatalog() {
    setSelectedSession(null);
    setSelectedMaterial(null);
    setPreviewSession(null);
    setGlossaryOpen(false);
    setShowSurvey(false);
  }

  async function handleComplete() {
    if (!selectedSession) return;
    await completeSession(selectedSession.id);
    setSidebarRefresh((v) => v + 1);
  }

  function handleCreated(saved: boolean) {
    setCreateOpen(false);
    if (saved) setSidebarRefresh((v) => v + 1);
  }

  function goToPrev() {
    if (currentIndex > 0) setSelectedMaterial(materials[currentIndex - 1]);
  }

  function goToNext() {
    if (currentIndex < materials.length - 1) setSelectedMaterial(materials[currentIndex + 1]);
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppHeader
        onMenuClick={() => setSidebarOpen((v) => !v)}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (selectedSession) setSelectedSession(null);
        }}
      />
      <Sidebar
        open={sidebarOpen}
        selectedSessionId={selectedSession?.id ?? null}
        selectedMaterialId={selectedMaterial?.id ?? null}
        showSurvey={showSurvey}
        onSelectSession={handleSelectSessionFromSidebar}
        onSelectMaterial={handleSelectMaterialFromSidebar}
        onSelectSurvey={handleSelectSurveyFromSidebar}
        onShowCatalog={handleShowCatalog}
        refreshKey={sidebarRefresh}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <Toolbar />

        {!selectedSession ? (
          /* ──────────── カタログ画面 ──────────── */
          <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
            <SessionCatalogGrid
              searchQuery={searchQuery}
              previewSessionId={previewSession?.id ?? null}
              onPreview={(session) => setPreviewSession((prev) => prev?.id === session.id ? null : session)}
              onStartSession={handleStartSession}
            />
            {previewSession && (
              <SessionDetailPanel
                session={previewSession}
                onClose={() => setPreviewSession(null)}
                onStart={handleStartSession}
              />
            )}
          </Box>
        ) : (
          /* ──────────── 学習画面 ──────────── */
          <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 2, gap: 1, minWidth: 0 }}>

              {/* ナビゲーションバー */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                <Tooltip title="一覧に戻る">
                  <IconButton size="small" onClick={handleShowCatalog}>
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {showSurvey ? (
                  <>
                    <AssignmentIcon fontSize="small" sx={{ color: 'primary.main', flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1, minWidth: 0 }} noWrap>
                      アンケート
                    </Typography>
                    <Tooltip title="概要に戻る">
                      <IconButton size="small" onClick={() => setShowSurvey(false)} sx={{ flexShrink: 0 }}>
                        <MenuOpenIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                ) : materialsLoading ? (
                  <CircularProgress size={16} sx={{ mx: 1 }} />
                ) : selectedMaterial ? (
                  <>
                    <PictureAsPdfIcon fontSize="small" sx={{ color: 'error.main', flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1, minWidth: 0 }} noWrap>
                      {selectedMaterial.title}
                    </Typography>
                    {materials.length > 1 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <Chip label={`${currentIndex + 1} / ${materials.length}`} size="small" variant="outlined" sx={{ fontSize: 11, height: 22 }} />
                        <Tooltip title="前の資料">
                          <span>
                            <IconButton size="small" onClick={goToPrev} disabled={currentIndex <= 0}>
                              <NavigateBeforeIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="次の資料">
                          <span>
                            <IconButton size="small" onClick={goToNext} disabled={currentIndex >= materials.length - 1}>
                              <NavigateNextIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    )}
                    {/* 概要に戻るボタン */}
                    <Tooltip title="講習会概要に戻る">
                      <IconButton size="small" onClick={() => setSelectedMaterial(null)} sx={{ flexShrink: 0 }}>
                        <MenuOpenIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1, minWidth: 0 }} noWrap>
                    {selectedSession.title}
                  </Typography>
                )}

                {/* 用語集トグル */}
                <Tooltip title={glossaryOpen ? '用語集を閉じる' : '用語集を開く'}>
                  <IconButton
                    size="small"
                    onClick={() => setGlossaryOpen((v) => !v)}
                    color={glossaryOpen ? 'primary' : 'default'}
                    sx={{ flexShrink: 0 }}
                  >
                    <BookIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="この講習会を完了にする">
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<CheckCircleOutlineIcon />}
                    onClick={handleComplete}
                    sx={{ flexShrink: 0, fontSize: 12 }}
                  >
                    完了にする
                  </Button>
                </Tooltip>
              </Box>

              {/* メインコンテンツ：概要 / アンケート / スライドビューア */}
              <Box sx={{ flexGrow: 1, overflow: 'hidden', borderRadius: 1 }}>
                {showSurvey ? (
                  <Box sx={{ height: '100%', bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden' }}>
                    <SurveyForm sessionId={selectedSession.id} />
                  </Box>
                ) : !selectedMaterial ? (
                  <SessionOverview
                    session={selectedSession}
                    materials={materials}
                    loading={materialsLoading}
                    onSelect={setSelectedMaterial}
                    onSurvey={() => { setSelectedMaterial(null); setShowSurvey(true); }}
                  />
                ) : (
                  <SlideViewerWrapper filePath={selectedMaterial.file_path} />
                )}
              </Box>
            </Box>

            {/* 右サイドバー（用語集） */}
            {glossaryOpen && (
              <GlossarySidebar
                open={glossaryOpen}
                sessionId={selectedSession.id}
                onClose={() => setGlossaryOpen(false)}
              />
            )}
          </Box>
        )}
      </Box>

      {isAdmin && (
        <Tooltip title="講習会を作成" placement="left">
          <Fab
            color="primary"
            onClick={() => setCreateOpen(true)}
            sx={{ position: 'fixed', bottom: 32, right: glossaryOpen ? GLOSSARY_WIDTH + 16 : 32, transition: 'right 0.2s' }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      )}

      <SessionFormDialog open={createOpen} session={null} onClose={handleCreated} />
    </Box>
  );
}
