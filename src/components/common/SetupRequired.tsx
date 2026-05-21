import { Box, Paper, Typography, Alert, Divider } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

export default function SetupRequired() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 540, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Supabase 接続設定が必要です</Typography>
        </Box>

        <Alert severity="warning" sx={{ mb: 3 }}>
          <code>.env.local</code> に Supabase の URL と API キーを設定してください。
        </Alert>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>1.</strong> Supabase プロジェクトを作成（<a href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com</a>）
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>2.</strong> <code>supabase/migrations/</code> 内の SQL を SQL Editor で実行
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>3.</strong> <code>.env.local</code> を編集：
        </Typography>

        <Box sx={{ bgcolor: 'grey.900', color: 'grey.100', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: 13 }}>
          <div>VITE_SUPABASE_URL=https://xxxx.supabase.co</div>
          <div>VITE_SUPABASE_ANON_KEY=your-anon-key</div>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          設定後、開発サーバーを再起動してください。
        </Typography>
      </Paper>
    </Box>
  );
}
