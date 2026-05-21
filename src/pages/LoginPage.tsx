import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Button, Container, TextField, Typography, Paper, Alert, CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.toLowerCase().includes('oliver')) {
      setError('オリバー社員のメールアドレス（oliver を含む）のみログインできます');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <Container maxWidth="xs">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
            OliverLec
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
            社内講習会ポータル
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'ログイン'}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
            アカウントをお持ちでない方は{' '}
            <Link to="/signup" style={{ color: '#1a56db' }}>新規登録</Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
