import { CONFIG } from 'src/config-global';

import type { CommandOption } from './types';

// Re-export provider config from the state layer
export { PROVIDERS, DEFAULT_PROVIDER } from 'src/state/lumi-editor/providers';

// ----------------------------------------------------------------------

export const metadata = { title: `Trình biên soạn học liệu - ${CONFIG.appName}` };

export const drawerWidth = 450;

export const commandOptions: CommandOption[] = [
  {
    id: 'text',
    label: 'Text',
    description: 'Thêm đoạn văn',
    contentType: 'text',
    icon: 'solar:file-text-bold',
  },
  {
    id: 'multiple-choice',
    label: 'Câu hỏi',
    description: 'Tạo câu hỏi',
    contentType: 'multiple-choice',
    icon: 'solar:check-circle-bold',
  },
];
