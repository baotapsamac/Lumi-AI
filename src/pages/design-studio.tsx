import * as React from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';

import { auditStructuralAlignment } from '../utils/pedagogical-alignment';
import { approveGate, acceptProposal, proposeRevision } from '../utils/pedagogical-approval';
import { adaptApprovedLesson } from '../utils/pedagogical-h5p-adapter';
import { downloadStudioProject, parseStudioProject } from '../utils/pedagogical-project';

import type { ExportLesson } from '../utils/pedagogical-h5p-adapter';
import type { StudioProject } from '../utils/pedagogical-project';

const starter: ExportLesson = {
  lesson: { id: 'lesson-1', title: 'Bài học mới', language: 'vi' },
  learning_units: [{ id: 'unit-1', title: 'Nội dung 1', activities: [
    { id: 'activity-1', instruction: 'Mô tả hoạt động học tập ở đây.', resources: [] },
  ] }],
};

export default function DesignStudioPage() {
  const [project, setProject] = React.useState<StudioProject<ExportLesson>>({
    format: 'lumi-ai-design-project',
    version: 1,
    title: starter.lesson.title,
    current: { revision: 0, value: starter, approvals: [] },
    history: [],
    saved_at: new Date().toISOString(),
  });
  const [draft, setDraft] = React.useState(JSON.stringify(project.current.value, null, 2));
  const [message, setMessage] = React.useState('');
  const [exportJson, setExportJson] = React.useState('');
  const audit = auditStructuralAlignment(project.current.value);
  const approved = project.current.approvals.some((a) => a.gate === 'design');
  const exportPlan = adaptApprovedLesson(project.current.value, approved, audit.design_ready);

  const applyDraft = () => {
    try {
      const next = JSON.parse(draft) as ExportLesson;
      if (!next.lesson?.id || !Array.isArray(next.learning_units)) throw new Error('Thiếu cấu trúc bài học.');
      const proposal = proposeRevision(project.current, next, 'Cập nhật nội dung bài học', [next.lesson.id]);
      const decision = acceptProposal(project.current, proposal, true);
      setProject((prev) => ({
        ...prev,
        current: decision.next,
        history: [...prev.history, prev.current],
        saved_at: new Date().toISOString(),
      }));
      setMessage('Đã lưu phiên bản mới. Các phê duyệt cần được thực hiện lại.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không đọc được JSON.');
    }
  };
  const approveOutcomes = () => {
    try {
      const current = approveGate(project.current, 'outcomes', new Date().toISOString(), {
        schema_valid: false,
        alignment_passed: false,
      });
      setProject((prev) => ({ ...prev, current }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Chưa thể phê duyệt.');
    }
  };
  const importProject = async (file: File) => {
    try {
      const parsed = parseStudioProject<ExportLesson>(await file.text());
      setProject(parsed);
      setDraft(JSON.stringify(parsed.current.value, null, 2));
      setMessage('Đã mở dự án.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Tệp dự án không hợp lệ.');
    }
  };
  const exportPlanJson = () => {
    setExportJson(JSON.stringify(exportPlan, null, 2));
    setMessage('Bản xem trước kế hoạch xuất. Chưa cho phép xuất H5P khi chưa hoàn tất kiểm định.');
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Lumi-AI · Design Studio (thử nghiệm)</Typography>
      <Alert severity="warning" sx={{ mb: 2 }}>
        Chưa tích hợp đầy đủ JSON Schema, AI conversation và semantic auditor. Xuất bản chính thức bị khóa.
      </Alert>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
        <Button variant="outlined" onClick={() => downloadStudioProject(project)}>Lưu dự án JSON</Button>
        <Button component="label" variant="outlined">
          Mở dự án
          <input hidden type="file" accept=".json" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importProject(file);
          }} />
        </Button>
        <Button variant="outlined" onClick={applyDraft}>Lưu bản chỉnh sửa</Button>
        <Button variant="outlined" onClick={approveOutcomes}>Duyệt chuẩn đầu ra</Button>
        <Button variant="outlined" onClick={exportPlanJson}>Xem H5P Export Plan</Button>
      </Stack>
      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}
      <Typography variant="body2" sx={{ mb: 1 }}>
        Phiên bản {project.current.revision} · Audit: {audit.status} · {audit.findings.length} lỗi ·
        Đã duyệt thiết kế: {approved ? 'Có' : 'Chưa'} · Sẵn sàng xuất: {exportPlan.ready ? 'Có' : 'Chưa'}
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField label="lesson.json (bản chỉnh sửa)" multiline minRows={18} fullWidth value={draft}
          onChange={(e) => setDraft(e.target.value)} />
        <Box sx={{ width: '100%' }}>
          <Typography variant="h6">Kiểm định cấu trúc</Typography>
          {audit.findings.map((f, i) => <Alert severity="error" key={i} sx={{ my: 1 }}>
            {f.rule_id} · {f.entity_id}: {f.message}
          </Alert>)}
          <Typography variant="h6" sx={{ mt: 2 }}>Cần bổ sung</Typography>
          {exportPlan.completion.map((item, i) => <Alert severity="warning" key={i} sx={{ my: 1 }}>
            {item.object_id}: {item.action}
          </Alert>)}
          {exportJson && <TextField label="H5P Export Plan (chỉ xem)" multiline minRows={12} fullWidth value={exportJson} />}
        </Box>
      </Stack>
    </Box>
  );
}
