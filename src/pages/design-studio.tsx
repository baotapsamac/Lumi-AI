import * as React from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';

import { requestAiText } from '../utils/ai-chat-client';
import { runMaterializedH5PPipeline } from '../utils/h5p-pipeline';
import { auditLesson } from '../utils/pedagogical-semantic-auditor';
import { validateLessonSchema } from '../utils/pedagogical-schema-validator';
import { approveWithEvidence, emptyEvidenceLedger, recordGateEvidence, recordSemanticReview, verifiedAudit } from '../utils/pedagogical-evidence';
import { acceptProposal, proposeRevision } from '../utils/pedagogical-approval';
import { adaptApprovedLesson } from '../utils/pedagogical-h5p-adapter';

import { downloadStudioProject, parseStudioProject } from '../utils/pedagogical-project';

import type { ExportLesson } from '../utils/pedagogical-h5p-adapter';
import type { StudioProject } from '../utils/pedagogical-project';

const starter: ExportLesson = {
  schema_version: '1.0',
  lesson: { id: 'lesson-1', title: 'Bài học mới', language: 'vi', status: 'draft' },
  outcomes: [{ id: 'lo-1', text: 'Mô tả được nội dung chính của bài học', source: 'user_provided', status: 'pending_approval', cognitive_process: 'understand' }],
  evidence: [{ id: 'ev-1', description: 'Bản trình bày mô tả nội dung bài học', evidence_type: 'constructed_response', supports_outcomes: ['lo-1'] }],
  learning_units: [{ id: 'unit-1', title: 'Nội dung 1', supports_outcomes: ['lo-1'], activities: [
    { id: 'activity-1', learning_type: 'production', supports_outcomes: ['lo-1'], instruction: 'Viết bản mô tả ngắn và trình bày để giảng viên nhận xét.', resources: [], assessment: { id: 'as-1', purpose: 'formative', supports_outcomes: ['lo-1'], measures_evidence: ['ev-1'], assessment_function: 'construct', interaction_preference: 'external' } },
  ] }],
  qa: { status: 'not_run', checks: [] },
};

export default function DesignStudioPage() {
  const [project, setProject] = React.useState<StudioProject<ExportLesson>>({
    format: 'lumi-ai-design-project',
    version: 1,
    title: starter.lesson.title,
    current: { revision: 0, value: starter, approvals: [] },
    history: [],
    evidence: emptyEvidenceLedger(),
    saved_at: new Date().toISOString(),
  });
  const [draft, setDraft] = React.useState(JSON.stringify(project.current.value, null, 2));
  const [message, setMessage] = React.useState('');
  const [reviewer, setReviewer] = React.useState('');
  const [reviewRationale, setReviewRationale] = React.useState('');
  const [reviewSource, setReviewSource] = React.useState('');
  const [exportJson, setExportJson] = React.useState('');
  const [endpoint, setEndpoint] = React.useState('');
  const [token, setToken] = React.useState('');
  const [model, setModel] = React.useState('');
  const [instruction, setInstruction] = React.useState('');
  const [aiBusy, setAiBusy] = React.useState(false);
  const [compileBusy, setCompileBusy] = React.useState(false);
  const [aiProposal, setAiProposal] = React.useState<{ baseRevision: number; value: ExportLesson; explanation: string } | null>(null);
  const audit = verifiedAudit(project.current, project.evidence || emptyEvidenceLedger());
  const preflight = validateLessonSchema(project.current.value);
  const approved = project.current.approvals.some((a) => a.gate === 'design' && a.revision === project.current.revision);
  const exportPlan = adaptApprovedLesson(project.current.value, approved, audit.design_ready);

  const officialOutcomesChanged = (next: ExportLesson): boolean => {
    const before = (project.current.value as ExportLesson & { outcomes?: Array<{ id: string; source?: string; text?: string }> }).outcomes || [];
    const after = (next as ExportLesson & { outcomes?: Array<{ id: string; source?: string; text?: string }> }).outcomes || [];
    return before.some((outcome) => outcome.source === 'official' &&
      !after.some((candidate) => candidate.id === outcome.id && candidate.source === 'official' && candidate.text === outcome.text));
  };
  const applyDraft = () => {
    try {
      const next = JSON.parse(draft) as ExportLesson;
      if (!next.lesson?.id || !Array.isArray(next.learning_units)) throw new Error('Thiếu cấu trúc bài học.');
      if (officialOutcomesChanged(next)) throw new Error('Không được thay đổi hoặc xóa chuẩn đầu ra chính thức.');
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
  const askAi = async () => {
    if (!instruction.trim()) return;
    setAiBusy(true);
    setAiProposal(null);
    try {
      const baseRevision = project.current.revision;
      const raw = await requestAiText([
        { role: 'system', content: 'Bạn là chuyên gia thiết kế sư phạm. Trả về đúng một JSON object với hai khóa explanation (string) và lesson (object). Lesson giữ cấu trúc đầu vào; không tự ý thay đổi chuẩn đầu ra chính thức; đề xuất chỉ là bản nháp, cần giảng viên duyệt. Không bịa nguồn.' },
        { role: 'user', content: 'Yêu cầu: ' + instruction + '\\nBản thiết kế hiện tại: ' + JSON.stringify(project.current.value) },
      ], endpoint, token, model);
      const jsonText = raw.replace(/^```(?:json)?\\s*/i, '').replace(/\\s*```$/, '').trim();
      const parsed: unknown = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== 'object') throw new Error('AI trả về dữ liệu không hợp lệ.');
      const proposal = parsed as { explanation?: string; lesson?: ExportLesson };
      if (!proposal.lesson?.lesson?.id || !Array.isArray(proposal.lesson.learning_units)) {
        throw new Error('AI không trả về cấu trúc lesson hợp lệ.');
      }
      if (officialOutcomesChanged(proposal.lesson)) throw new Error('AI đề xuất sửa chuẩn đầu ra chính thức; đề xuất bị từ chối.');
      setAiProposal({ baseRevision, value: proposal.lesson, explanation: proposal.explanation || 'Đề xuất chỉnh sửa' });
      setMessage('AI đã đề xuất bản chỉnh sửa. Kiểm tra trước khi chấp nhận.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không gọi được AI.');
    } finally {
      setAiBusy(false);
    }
  };
  const acceptAi = () => {
    if (!aiProposal) return;
    try {
      if (officialOutcomesChanged(aiProposal.value)) throw new Error('Không được thay đổi chuẩn đầu ra chính thức.');
      const proposal = proposeRevision(project.current, aiProposal.value, aiProposal.explanation, [aiProposal.value.lesson.id]);
      if (aiProposal.baseRevision !== project.current.revision) throw new Error('Đề xuất đã cũ. Yêu cầu AI tạo lại.');
      const decision = acceptProposal(project.current, proposal, true);
      setProject((prev) => ({ ...prev, current: decision.next, history: [...prev.history, prev.current], saved_at: new Date().toISOString() }));
      setDraft(JSON.stringify(decision.next.value, null, 2));
      setAiProposal(null);
      setMessage('Đã chấp nhận đề xuất. Phê duyệt cũ đã bị vô hiệu hóa.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể chấp nhận.');
    }
  };
  const approveOutcomes = () => {
    if (!preflight.valid) {
      setMessage('Chưa đạt kiểm tra cấu trúc: ' + preflight.issues.map((i) => i.path).join(', '));
      return;
    }
    const lesson = project.current.value as ExportLesson & { outcomes?: Array<{ status: string }> };
    if (!lesson.outcomes?.length || lesson.outcomes.some((o) => o.status !== 'locked')) {
      setMessage('Tất cả chuẩn đầu ra phải được giảng viên khóa trước khi duyệt.');
      return;
    }
    try {
      const ledger = recordGateEvidence(project.current, project.evidence || emptyEvidenceLedger(), { gate: 'outcomes', reviewer, rationale: reviewRationale, reviewed_at: new Date().toISOString() });
      const next = approveWithEvidence(project.current, ledger, 'outcomes', new Date().toISOString());
      setProject((prev) => ({ ...prev, current: next, evidence: ledger }));
      setMessage('Đã ghi nhận phê duyệt chuẩn đầu ra; kiểm định đầy đủ vẫn cần thực hiện.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể duyệt.');
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
  const compileApprovedDesign = async () => {
    if (!exportPlan.ready || !approved || !audit.design_ready) {
      setMessage('Chưa đủ điều kiện biên dịch: cần kiểm định và phê duyệt thiết kế.');
      return;
    }
    setCompileBusy(true);
    try {
      const result = await runMaterializedH5PPipeline(project.current.value.lesson.title, exportPlan.plan);
      setExportJson(JSON.stringify({ completion: exportPlan.completion, report: result.report }, null, 2));
      if (!result.blob || result.report.status === 'NOT_READY') {
        setMessage('Compiler từ chối gói H5P. Xem báo cáo để sửa.');
        return;
      }
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = project.current.value.lesson.id + '.h5p';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Đã tạo gói H5P; vẫn cần kiểm thử nhập/chỉnh sửa bằng Lumi Desktop và Moodle.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Biên dịch H5P thất bại.');
    } finally {
      setCompileBusy(false);
    }
  };
  const exportPlanJson = () => {
    setExportJson(JSON.stringify(exportPlan, null, 2));
    setMessage('Bản xem trước kế hoạch xuất. Chưa cho phép xuất H5P khi chưa hoàn tất kiểm định.');
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Lumi-AI · Design Studio (thử nghiệm)</Typography>
      <Link href="/editor" underline="hover">Mở Editor cũ (DOCX, câu hỏi và công cụ hiện có)</Link>
      <Alert severity="warning" sx={{ mb: 2 }}>
        JSON Schema đã được kiểm tra trong ứng dụng. Các quy tắc ngữ nghĩa vẫn cần chuyên gia xác nhận; xuất bản chính thức tiếp tục bị khóa cho đến khi kiểm định đầy đủ.
      </Alert>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
        <TextField label="Người kiểm định" size="small" value={reviewer} onChange={(e) => setReviewer(e.target.value)} />
        <TextField label="Nhận xét / lý do phê duyệt" size="small" value={reviewRationale} onChange={(e) => setReviewRationale(e.target.value)} />
        <TextField label="Tài liệu / bằng chứng đối chiếu" size="small" value={reviewSource} onChange={(e) => setReviewSource(e.target.value)} />
      </Stack>
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
        <Button variant="outlined" disabled={!preflight.valid} onClick={approveOutcomes}>Duyệt chuẩn đầu ra</Button>
        <Button variant="outlined" onClick={exportPlanJson}>Xem H5P Export Plan</Button>
        <Button variant="outlined" disabled={!audit.design_ready} onClick={() => {
          try {
            const ledger = recordGateEvidence(project.current, project.evidence || emptyEvidenceLedger(), { gate: 'design', reviewer, rationale: reviewRationale, reviewed_at: new Date().toISOString() });
            const next = approveWithEvidence(project.current, ledger, 'design', new Date().toISOString());
            setProject(prev => ({ ...prev, current: next, evidence: ledger }));
            setMessage('Đã phê duyệt thiết kế với bằng chứng phiên bản hiện tại.');
          } catch (e) { setMessage(e instanceof Error ? e.message : 'Không thể duyệt thiết kế.'); }
        }}>Duyệt thiết kế</Button>
        <Button variant="contained" disabled={compileBusy || !exportPlan.ready || !approved || !audit.design_ready} onClick={() => void compileApprovedDesign()}>{compileBusy ? "Đang biên dịch..." : "Biên dịch H5P đã duyệt"}</Button>
      </Stack>
      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}
      <Typography variant="h6" sx={{ mt: 2 }}>Bằng chứng thẩm định ngữ nghĩa</Typography>
      {audit.review_required.map(ruleId => <Stack key={ruleId} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography sx={{ minWidth: 80 }}>{ruleId}</Typography>
        <Button size="small" variant="outlined" onClick={() => {
          try {
            const ledger = recordSemanticReview(project.current, project.evidence || emptyEvidenceLedger(), {
              rule_id: ruleId, reviewer, rationale: reviewRationale, source_reference: reviewSource,
              reviewed_at: new Date().toISOString(), verdict: 'pass',
            });
            setProject(prev => ({ ...prev, evidence: ledger }));
            setMessage('Đã ghi bằng chứng thẩm định ' + ruleId + ' cho phiên bản hiện tại.');
          } catch (e) { setMessage(e instanceof Error ? e.message : 'Thiếu bằng chứng.'); }
        }}>Ghi nhận đạt</Button>
        <Button size="small" color="error" variant="outlined" onClick={() => {
          try {
            const ledger = recordSemanticReview(project.current, project.evidence || emptyEvidenceLedger(), {
              rule_id: ruleId, reviewer, rationale: reviewRationale, source_reference: reviewSource,
              reviewed_at: new Date().toISOString(), verdict: 'fail',
            });
            setProject(prev => ({ ...prev, evidence: ledger }));
          } catch (e) { setMessage(e instanceof Error ? e.message : 'Thiếu bằng chứng.'); }
        }}>Không đạt</Button>
      </Stack>)}
      <Typography variant="body2" sx={{ mb: 1 }}>Kiểm tra JSON Schema: {preflight.valid ? 'PASS' : 'FAIL'} · {preflight.issues.length} vấn đề</Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Phiên bản {project.current.revision} · Audit: {audit.status} · {audit.findings.length} lỗi cấu trúc · {audit.review_required.length} quy tắc cần chuyên gia duyệt ·
        Đã duyệt thiết kế: {approved ? 'Có' : 'Chưa'} · Sẵn sàng xuất: {exportPlan.ready ? 'Có' : 'Chưa'}
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>Trao đổi với AI về bản thiết kế</Typography>
      <Alert severity="info" sx={{ mb: 1 }}>API key chỉ sử dụng trong phiên làm việc; không lưu trong tệp dự án. Mọi đề xuất đều cần duyệt thủ công.</Alert>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 1 }}>
        <TextField label="API endpoint (HTTPS)" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} fullWidth size="small" />
        <TextField label="Model" value={model} onChange={(e) => setModel(e.target.value)} size="small" />
        <TextField label="API key" type="password" value={token} onChange={(e) => setToken(e.target.value)} size="small" />
      </Stack>
      <TextField label="Yêu cầu chỉnh sửa thiết kế" value={instruction} onChange={(e) => setInstruction(e.target.value)} fullWidth multiline minRows={2} />
      <Button sx={{ my: 1 }} variant="contained" disabled={aiBusy || !instruction.trim()} onClick={() => void askAi()}>
        {aiBusy ? 'Đang nhận đề xuất...' : 'Gửi yêu cầu AI'}
      </Button>
      {aiProposal && <Box sx={{ mb: 2 }}>
        <Alert severity="warning">{aiProposal.explanation} · Chưa áp dụng thay đổi</Alert>
        <TextField label="Đề xuất AI (xem trước)" multiline minRows={7} fullWidth value={JSON.stringify(aiProposal.value, null, 2)} />
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button variant="contained" onClick={acceptAi}>Chấp nhận đề xuất</Button>
          <Button onClick={() => setAiProposal(null)}>Từ chối</Button>
        </Stack>
      </Box>}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField label="lesson.json (bản chỉnh sửa)" multiline minRows={18} fullWidth value={draft}
          onChange={(e) => setDraft(e.target.value)} />
        <Box sx={{ width: '100%' }}>
          <Typography variant="h6">Kiểm định cấu trúc</Typography>
          {preflight.issues.map((issue, i) => <Alert severity="error" key={'schema-' + i} sx={{ my: 1 }}>{issue.path}: {issue.message}</Alert>)}
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
