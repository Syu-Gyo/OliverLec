import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Button, Container, TextField, Typography, Paper, Alert, CircularProgress,
} from '@mui/material';
import { supabase } from '../lib/supabase';

export default function SignupPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.toLowerCase().includes('oliver')) {
      setError('オリバー社員のメールアドレス（oliver を含む）のみ登録できます');
      return;
    }
    if (password !== confirm) { setError('パスワードが一致しません'); return; }
    if (password.length < 8) { setError('パスワードは8文字以上にしてください'); return; }

    setLoading(true);
    const { data, error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr) { setError(signUpErr.message); setLoading(false); return; }

    if (data.user && displayName.trim()) {
      await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', data.user.id);
    }

    navigate('/');
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <Container maxWidth="xs">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
            OliverLec
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
            新規アカウント登録
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="表示名"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              fullWidth
              autoFocus
              placeholder="山田 太郎"
            />
            <TextField
              label="メールアドレス *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="パスワード（8文字以上）*"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="パスワード（確認）*"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              fullWidth
            />
            <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
              {loading ? <CircularProgress size={24} color="inherit" /> : '登録'}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
            すでにアカウントをお持ちの方は{' '}
            <Link to="/login" style={{ color: 'inherit' }}>ログイン</Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
