import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import type { AiDialogState } from '../types';

// ----------------------------------------------------------------------

type AIQuestionDialogProps = {
  dialogState: AiDialogState;
  apiToken: string;
  onClose: () => void;
  onContextChange: (context: string) => void;
  onGenerate: () => void;
};

export function AIQuestionDialog({
  dialogState,
  apiToken,
  onClose,
  onContextChange,
  onGenerate,
}: AIQuestionDialogProps) {
  return (
    <Dialog open={dialogState.open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:cup-star-bold" width={24} />
          <span>Tạo câu hỏi bằng AI</span>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Nhập nội dung hoặc chủ đề để AI tạo câu hỏi trắc nghiệm một hoặc nhiều đáp án đúng.
          </Typography>
          <TextField
            label="Nội dung tham chiếu"
            multiline
            rows={6}
            fullWidth
            value={dialogState.context}
            onChange={(e) => onContextChange(e.target.value)}
            placeholder="Nhập nội dung hoặc chủ đề cần tạo câu hỏi..."
            disabled={dialogState.loading}
          />
          {!apiToken && (
            <Alert severity="warning">
              Vui lòng nhập khóa API ở thanh trên trước khi tạo câu hỏi.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={dialogState.loading}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={onGenerate}
          disabled={dialogState.loading || !apiToken || !dialogState.context.trim()}
          startIcon={
            dialogState.loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <Iconify icon="solar:cup-star-bold" width={18} />
            )
          }
        >
          {dialogState.loading ? 'Đang tạo...' : 'Tạo câu hỏi'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
