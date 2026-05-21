import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Select, MenuItem, CircularProgress,
  Alert, TextField, InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Profile, Role } from '../../types';

export default function UserManager() {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function fetchProfiles() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setProfiles(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchProfiles(); }, []);

  async function handleRoleChange(profile: Profile, newRole: Role) {
    if (profile.id === currentUser?.id) {
      setError('自分自身のロールは変更できません');
      return;
    }
    setUpdatingId(profile.id);
    setError('');
    const { error: err } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profile.id);
    if (err) setError(err.message);
    else setProfiles((prev) => prev.map((p) => p.id === profile.id ? { ...p, role: newRole } : p));
    setUpdatingId(null);
  }

  const filtered = profiles.filter((p) =>
    p.email.toLowerCase().includes(query.toLowerCase()) ||
    (p.display_name ?? '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          ユーザー一覧（{profiles.length} 名）
        </Typography>
        <TextField
          size="small"
          placeholder="名前・メールで検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>名前</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>メールアドレス</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>登録日</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ロール</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((profile) => (
                <TableRow key={profile.id} hover>
                  <TableCell>
                    {profile.display_name ?? (
                      <Typography variant="body2" color="text.secondary">未設定</Typography>
                    )}
                    {profile.id === currentUser?.id && (
                      <Chip label="自分" size="small" sx={{ ml: 1 }} color="primary" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{profile.email}</TableCell>
                  <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                    {new Date(profile.created_at).toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell>
                    {updatingId === profile.id ? (
                      <CircularProgress size={18} />
                    ) : (
                      <Select
                        size="small"
                        value={profile.role}
                        onChange={(e) => handleRoleChange(profile, e.target.value as Role)}
                        disabled={profile.id === currentUser?.id}
                        sx={{ fontSize: 13, minWidth: 110 }}
                      >
                        <MenuItem value="viewer">
                          <Chip label="viewer" size="small" color="default" />
                        </MenuItem>
                        <MenuItem value="admin">
                          <Chip label="admin" size="small" color="primary" />
                        </MenuItem>
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
                    ユーザーが見つかりません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
