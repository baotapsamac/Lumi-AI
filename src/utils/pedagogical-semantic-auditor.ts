import { auditStructuralAlignment } from './pedagogical-alignment';
import { validateLessonSchema } from './pedagogical-schema-validator';
import rulebook from '../../pedagogical/alignment-rules.json';

type Obj = Record<string, any>;
export type RuleResult = { rule_id: string; status: 'pass'|'warn'|'fail'|'block'|'review_required'; message: string };
const semantic = new Set(['LO-03','EV-02','EV-03','AL-06','AF-01','AF-02','PR-02']);
const higher = new Set(['apply','analyze','evaluate','create']);
export function auditLesson(value: unknown, officialSnapshot?: Record<string,string>) {
  const schema = validateLessonSchema(value);
  const lesson = value && typeof value === 'object' ? value as Obj : {};
  const outcomes: Obj[] = Array.isArray(lesson.outcomes) ? lesson.outcomes : [];
  const units: Obj[] = Array.isArray(lesson.learning_units) ? lesson.learning_units : [];
  const activities: Obj[] = units.flatMap(u => Array.isArray(u.activities) ? u.activities : []);
  const resources: Obj[] = activities.flatMap(a => Array.isArray(a.resources) ? a.resources : []);
  const assessments: Obj[] = [...activities.flatMap(a => a.assessment ? [a.assessment] : []), ...(lesson.final_assessment?.assessments || [])];
  const structural = auditStructuralAlignment(lesson);
  const findings = structural.findings;
  const results: RuleResult[] = (rulebook.rules as {id:string}[]).map(rule => {
    const issues = findings.filter(f => f.rule_id === rule.id);
    return { rule_id: rule.id, status: issues.length ? issues.some(f => f.severity === 'block') ? 'block' : 'fail' : 'pass', message: issues.map(i => i.message).join('; ') || 'Structural check passed' };
  });
  const set = (id: string, status: RuleResult['status'], message: string) => {
    const r = results.find(x => x.rule_id === id);
    if (r && (r.status === 'pass' || status === 'block')) { r.status = status; r.message = message; }
  };
  for (const id of semantic) set(id, 'review_required', 'Cần giảng viên/chuyên gia xác minh ngữ nghĩa và ghi nhận kết quả độc lập');
  for (const o of outcomes) {
    if (o.source === 'official') {
      if (!officialSnapshot || !(o.id in officialSnapshot)) set('LO-01','block','Thiếu bản gốc chuẩn đầu ra đáng tin cậy');
      else if (officialSnapshot[o.id] !== o.text) set('LO-01','block','Chuẩn đầu ra chính thức bị thay đổi');
    }
    if (o.source === 'ai_proposed' && !['pending_approval','locked','rejected'].includes(o.status)) set('LO-02','block','Trạng thái chuẩn đầu ra AI không hợp lệ');
  }
  if (officialSnapshot && Object.keys(officialSnapshot).some(id => !outcomes.some(candidate => candidate.id === id && candidate.source === 'official'))) set('LO-01','block','Thiếu chuẩn đầu ra chính thức');
  for (const a of activities) if (!['acquisition','investigation','discussion','practice','collaboration','production'].includes(a.learning_type)) set('LA-01','fail','Learning type không hợp lệ');
  for (const o of outcomes.filter(o => higher.has(o.cognitive_process))) {
    const matching = activities.filter(a => a.supports_outcomes?.includes(o.id));
    if (!matching.some(a => ['practice','investigation','production','collaboration','discussion'].includes(a.learning_type))) set('LA-02','warn','Chuẩn đầu ra bậc cao thiếu hoạt động vận dụng');
    if (matching.length && matching.every(a => a.learning_type === 'acquisition')) set('LA-03','warn','Toàn bộ hoạt động chỉ là tiếp nhận');
  }
  if (resources.some(r => !String(r.purpose || '').trim())) set('MR-01','warn','Học liệu thiếu mục đích');
  const withProvenance = [...outcomes,...resources];
  if (withProvenance.some(x => x.provenance?.type === 'ai_generated' && x.provenance.requires_verification !== true)) set('PR-01','block','Nội dung AI thiếu yêu cầu xác minh');
  if (withProvenance.some(x => x.provenance?.type === 'ai_generated')) set('PR-02','review_required','Nội dung AI cần kiểm chứng nguồn trước xuất bản');
  if (assessments.some(a => a.purpose === 'formative' && !a.feedback)) set('AF-02','warn','Đánh giá quá trình thiếu phản hồi');
  if (schema.issues.length) set('PUB-01','block','JSON Schema không hợp lệ');
  if (results.some(r => r.status === 'block' && r.rule_id !== 'PUB-01')) set('PUB-01','block','Còn lỗi BLOCK');
  if (results.some(r => r.status === 'fail' && r.rule_id !== 'PUB-02')) set('PUB-02','fail','Còn lỗi FAIL');
  const unresolved = results.filter(r => r.status !== 'pass');
  return { schema, results, findings, review_required: results.filter(r => r.status === 'review_required').map(r => r.rule_id),
    design_ready: schema.valid && unresolved.length === 0,
    status: !schema.valid || unresolved.some(r => r.status === 'block') ? 'block' : unresolved.some(r => r.status === 'fail') ? 'fail' : unresolved.length ? 'warn' : 'pass',
  };
}
