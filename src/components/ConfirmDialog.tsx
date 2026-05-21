import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, CircularProgress,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = '削除', loading = false, onConfirm, onCancel,
}: Props) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <WarningAmberIcon color="warning" />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>キャンセル</Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
