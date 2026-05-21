import { AppBar, Toolbar, Typography, IconButton, Box, Button, Tooltip, InputBase, alpha } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  onMenuClick: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function AppHeader({ onMenuClick, searchQuery = '', onSearchChange }: Props) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ gap: 1 }}>
        <IconButton color="inherit" edge="start" onClick={onMenuClick} sx={{ mr: 1 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, flexShrink: 0 }}>
          OliverLec
        </Typography>

        {/* 検索バー */}
        <Box
          sx={{
            flexGrow: 1,
            mx: 3,
            maxWidth: 480,
            bgcolor: (theme) => alpha(theme.palette.common.white, 0.15),
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.common.white, 0.25),
            },
          }}
        >
          <SearchIcon sx={{ fontSize: 18, mr: 1, opacity: 0.8 }} />
          <InputBase
            placeholder="講習会を検索..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            sx={{ color: 'inherit', width: '100%', fontSize: 14 }}
            inputProps={{ 'aria-label': '講習会を検索' }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          {profile?.role === 'admin' && (
            <Tooltip title="管理画面">
              <Button
                color="inherit"
                startIcon={<AdminPanelSettingsIcon />}
                onClick={() => navigate('/admin')}
                size="small"
              >
                管理
              </Button>
            </Tooltip>
          )}
          <Typography variant="body2" sx={{ opacity: 0.8, display: { xs: 'none', sm: 'block' } }}>
            {profile?.display_name ?? profile?.email ?? ''}
          </Typography>
          <Tooltip title="ログアウト">
            <IconButton color="inherit" onClick={handleSignOut} size="small">
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
