import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/common/ProtectedRoute';
import SetupRequired from './components/common/SetupRequired';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/admin/AdminPage';
import SeriesPage from './pages/SeriesPage';
import SessionPage from './pages/SessionPage';
import { isSupabaseConfigured } from './lib/supabase';

const theme = createTheme({
  palette: {
    primary: { main: '#1a56db' },
    background: { default: '#f9fafb' },
  },
  typography: {
    fontFamily: [
      '"Noto Sans JP"',
      '"Hiragino Kaku Gothic ProN"',
      '"Meiryo"',
      'sans-serif',
    ].join(','),
  },
  shape: { borderRadius: 8 },
});

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SetupRequired />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
            <Route
              path="/series/:id"
              element={
                <ProtectedRoute>
                  <SeriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sessions/:id"
              element={
                <ProtectedRoute>
                  <SessionPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
