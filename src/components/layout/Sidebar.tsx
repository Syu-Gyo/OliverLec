import {
  Box, Drawer, Toolbar, Typography,
  List, ListItemButton, ListItemText, Divider, CircularProgress, Chip, Collapse,
} from '@mui/material';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useEffect, useState } from 'react';
import { useUserSessions } from '../../hooks/useSessionProgress';
import { useSeries } from '../../hooks/useSeries';
import { useSessionMaterials } from '../../hooks/useMaterials';
import { useSurveysMap } from '../../hooks/useSurvey';
import type { SessionWithProgress, Material } from '../../types';

export const DRAWER_WIDTH = 240;

interface Props {
  open: boolean;
  selectedSessionId: string | null;
  selectedMaterialId: string | null;
  showSurvey: boolean;
  onSelectSession: (session: SessionWithProgress) => void;
  onSelectMaterial: (session: SessionWithProgress, material: Material) => void;
  onSelectSurvey: (session: SessionWithProgress) => void;
  onShowCatalog: () => void;
  refreshKey?: number;
}

function StatusChip({ status }: { status: 'in_progress' | 'completed' }) {
  return status === 'completed'
    ? <Chip label="完了" size="small" color="success" variant="outlined" sx={{ fontSize: 10, height: 18, ml: 0.5, flexShrink: 0 }} />
    : <Chip label="学習中" size="small" color="info"    variant="outlined" sx={{ fontSize: 10, height: 18, ml: 0.5, flexShrink: 0 }} />;
}

export default function Sidebar({
  open, selectedSessionId, selectedMaterialId, showSurvey,
  onSelectSession, onSelectMaterial, onSelectSurvey, onShowCatalog, refreshKey,
}: Props) {
  const { sessions, loading, refetch } = useUserSessions();
  const { series } = useSeries(refreshKey);
  const { materialsMap, refetch: refetchMaterials } = useSessionMaterials(sessions.map((s) => s.id));
  const { surveySessionIds } = useSurveysMap(sessions.map((s) => s.id));

  // シリーズの開閉（デフォルト：全展開）
  const [seriesCollapsed, setSeriesCollapsed] = useState<Set<string>>(new Set());
  // セッションの開閉（デフォルト：全折りたたみ）
  const [sessionExpanded, setSessionExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (refreshKey) { refetch(); refetchMaterials(); }
  }, [refreshKey]);

  // 選択セッションが変わったとき、そのセッションを自動展開
  useEffect(() => {
    if (selectedSessionId) {
      setSessionExpanded((prev) => {
        if (prev.has(selectedSessionId)) return prev; // 既に展開済みならそのまま
        const next = new Set(prev);
        next.add(selectedSessionId);
        return next;
      });
    }
  }, [selectedSessionId]);

  function toggleSeries(id: string) {
    setSeriesCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSession(id: string) {
    setSessionExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // シリーズごとにグループ化
  const sessionsBySeries = new Map<string, SessionWithProgress[]>();
  const standaloneSessions: SessionWithProgress[] = [];

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

  /** セッション行 + トグルで開閉する資料行 */
  function SessionBlock({ session, indent }: { session: SessionWithProgress; indent: boolean }) {
    const mats = materialsMap.get(session.id) ?? [];
    const hasMaterials = mats.length > 0;
    const isSelected = selectedSessionId === session.id;
    const isExpanded = sessionExpanded.has(session.id);

    function handleSessionClick() {
      onSelectSession(session);   // メインエリアにセッション情報を表示
      toggleSession(session.id);  // 資料リストを開閉
    }

    return (
      <Box>
        {/* セッション行 */}
        <ListItemButton
          selected={isSelected}
          onClick={handleSessionClick}
          sx={{
            pl: indent ? 3.5 : 1.5,
            pr: 1,
            py: 0.5,
            borderLeft: '3px solid',
            borderLeftColor: isSelected ? 'primary.main' : 'transparent',
            minWidth: DRAWER_WIDTH,
          }}
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, overflow: 'hidden' }}>
                {indent && (session.series_order ?? 0) > 0 && (
                  <Typography component="span" sx={{ fontSize: 10, color: 'text.secondary', flexShrink: 0, lineHeight: 1.4 }}>
                    第{session.series_order}回
                  </Typography>
                )}
                <Typography component="span" sx={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                  {session.title}
                </Typography>
              </Box>
            }
          />
          {session.progress && <StatusChip status={session.progress.status} />}
          {hasMaterials && (
            isExpanded
              ? <ExpandLessIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0, ml: 0.25 }} />
              : <ExpandMoreIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0, ml: 0.25 }} />
          )}
        </ListItemButton>

        {/* 資料行（PDF一覧） */}
        {hasMaterials && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            {mats.map((material) => {
              const isMaterialSelected = isSelected && selectedMaterialId === material.id;
              return (
                <ListItemButton
                  key={material.id}
                  selected={isMaterialSelected}
                  onClick={(e) => { e.stopPropagation(); onSelectMaterial(session, material); }}
                  sx={{
                    pl: indent ? 5 : 3,
                    pr: 1,
                    py: 0.35,
                    borderLeft: '3px solid',
                    borderLeftColor: isMaterialSelected ? 'secondary.main' : 'transparent',
                    minWidth: DRAWER_WIDTH,
                  }}
                >
                  <PictureAsPdfIcon sx={{ fontSize: 12, color: 'error.main', mr: 0.75, flexShrink: 0, opacity: 0.8 }} />
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: isMaterialSelected ? 'text.primary' : 'text.secondary', lineHeight: 1.4,
                    }}
                  >
                    {material.title}
                  </Typography>
                </ListItemButton>
              );
            })}
          </Collapse>
        )}

        {/* アンケート行 */}
        {isExpanded && surveySessionIds.has(session.id) && (
          <ListItemButton
            selected={isSelected && showSurvey}
            onClick={(e) => { e.stopPropagation(); onSelectSurvey(session); }}
            sx={{
              pl: indent ? 5 : 3,
              pr: 1,
              py: 0.35,
              borderLeft: '3px solid',
              borderLeftColor: isSelected && showSurvey ? 'warning.main' : 'transparent',
              minWidth: DRAWER_WIDTH,
            }}
          >
            <AssignmentIcon sx={{ fontSize: 12, color: 'warning.main', mr: 0.75, flexShrink: 0, opacity: 0.8 }} />
            <Typography
              component="span"
              sx={{
                fontSize: 11, lineHeight: 1.4,
                color: isSelected && showSurvey ? 'text.primary' : 'text.secondary',
              }}
            >
              アンケート
            </Typography>
          </ListItemButton>
        )}
      </Box>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        transition: 'width 0.2s',
        '& .MuiDrawer-paper': {
          width: open ? DRAWER_WIDTH : 0,
          overflowX: 'hidden',
          transition: 'width 0.2s',
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%', width: DRAWER_WIDTH }}>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : sessions.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontSize: 12 }}>
              まだ学習を開始した講習会がありません
            </Typography>
            <Typography variant="caption" color="text.secondary">
              講習会一覧から始めましょう
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ flexGrow: 1, py: 0.5 }}>

            {/* ── シリーズあり ── */}
            {orderedSeries.map((s) => {
              const groupSessions = sessionsBySeries.get(s.id) ?? [];
              const isSeriesOpen = !seriesCollapsed.has(s.id);
              const allDone = groupSessions.every((ses) => ses.progress?.status === 'completed');
              const anyProgress = groupSessions.some((ses) => ses.progress != null);

              return (
                <Box key={s.id}>
                  <ListItemButton
                    onClick={() => toggleSeries(s.id)}
                    sx={{ py: 0.75, px: 1.5, minWidth: DRAWER_WIDTH }}
                  >
                    <FolderSpecialIcon sx={{ fontSize: 15, color: 'primary.main', mr: 1, flexShrink: 0 }} />
                    <ListItemText
                      primary={s.title}
                      slotProps={{ primary: { variant: 'caption', fontWeight: 700, noWrap: true } as never }}
                    />
                    {anyProgress && (
                      allDone
                        ? <Chip label="完了" size="small" color="success" variant="outlined" sx={{ fontSize: 9, height: 16, mr: 0.25, flexShrink: 0 }} />
                        : <Chip label="学習中" size="small" color="info" variant="outlined" sx={{ fontSize: 9, height: 16, mr: 0.25, flexShrink: 0 }} />
                    )}
                    {isSeriesOpen
                      ? <ExpandLessIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                      : <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                    }
                  </ListItemButton>

                  <Collapse in={isSeriesOpen} timeout="auto" unmountOnExit>
                    {groupSessions.map((session) => (
                      <SessionBlock key={session.id} session={session} indent />
                    ))}
                  </Collapse>
                  <Divider />
                </Box>
              );
            })}

            {/* ── シリーズなし ── */}
            {standaloneSessions.length > 0 && (
              <>
                {orderedSeries.length > 0 && (
                  <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                      その他
                    </Typography>
                  </Box>
                )}
                {standaloneSessions.map((session) => (
                  <SessionBlock key={session.id} session={session} indent={false} />
                ))}
              </>
            )}
          </List>
        )}
      </Box>
    </Drawer>
  );
}
