import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import { PROVIDERS } from '../constants';

import type { ProviderType } from '../types';

// ----------------------------------------------------------------------

type EditorHeaderProps = {
  provider: ProviderType;
  apiEndpoint: string;
  apiToken: string;
  model: string;
  onModelChange: (model: string) => void;
  downloadLoading: boolean;
  docxLoading: boolean;
  hasContent: boolean;
  onProviderChange: (provider: ProviderType) => void;
  onEndpointChange: (endpoint: string) => void;
  onTokenChange: (token: string) => void;
  onDownload: () => void;
  onDocxImport: (file: File) => void;
};

export function EditorHeader({
  provider,
  apiEndpoint,
  apiToken,
  model,
  onModelChange,
  downloadLoading,
  docxLoading,
  hasContent,
  onProviderChange,
  onEndpointChange,
  onTokenChange,
  onDownload,
  onDocxImport,
}: EditorHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 3,
        py: 2,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="provider-select-label">Nhà cung cấp AI</InputLabel>
          <Select
            labelId="provider-select-label"
            value={provider}
            label="Nhà cung cấp AI"
            onChange={(e) => onProviderChange(e.target.value as ProviderType)}
          >
            {Object.entries(PROVIDERS).map(([key, config]) => (
              <MenuItem key={key} value={key}>
                {config.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Địa chỉ API"
          value={apiEndpoint}
          onChange={(e) => onEndpointChange(e.target.value)}
          placeholder="https://api.openai.com/v1/chat/completions"
          sx={{ minWidth: 260 }}
        />
        <TextField
          size="small"
          label="API Token"
          type="password"
          value={apiToken}
          onChange={(e) => onTokenChange(e.target.value)}
          placeholder="Nhập API key"
          sx={{ minWidth: 190 }}
          slotProps={{
            input: {
              startAdornment: (
                <Iconify icon="solar:shield-check-bold" width={20} sx={{ mr: 1, color: 'text.secondary' }} />
              ),
            },
          }}
        />
        <TextField
          size="small"
          label="Mô hình AI"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          sx={{ minWidth: 170 }}
        />
        {apiToken && (
          <Chip
            size="small"
            label="Đã cấu hình"
            color="success"
            icon={<Iconify icon="solar:check-circle-bold" width={16} />}
          />
        )}
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button
          component="label"
          variant="contained"
          disabled={docxLoading}
          startIcon={
            docxLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Iconify icon="solar:file-text-bold" />
            )
          }
        >
          {docxLoading ? 'Đang xử lý DOCX...' : 'Nạp DOCX và tạo học liệu'}
          <input
            hidden
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onDocxImport(file);
              event.currentTarget.value = '';
            }}
          />
        </Button>
      </Stack>
    </Box>
  );
}
