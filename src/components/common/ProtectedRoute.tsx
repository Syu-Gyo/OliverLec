import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box, Typography, Button, Paper, Container } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';

function LoadingScreen() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <CircularProgress />
    </Box>
  );
}

function AccessDenied() {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <Container maxWidth="xs">
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <LockIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>アクセス権限がありません</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            この画面は管理者（admin）のみ利用できます。
            管理者にロールの変更を依頼してください。
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            ダッシュボードへ戻る
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role !== 'admin') return <AccessDenied />;
  return <>{children}</>;
}
