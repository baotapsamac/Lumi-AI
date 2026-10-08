/**
 * Structural, read-only alignment audit. Semantic checks and JSON Schema validation
 * are separate requirements; therefore this module never declares design_ready.
 */
export type Finding = {
  rule_id: string;
  severity: 'block' | 'fail';
  entity_id: string;
  message: string;
};

type Linked = { id: string; supports_outcomes?: string[] };
type Evidence = Linked & { assessment_required?: boolean };
type Assessment = Linked & { measures_evidence?: string[] };
type Activity = Linked & { supports_evidence?: string[]; assessment?: Assessment | null; resources?: Linked[] };
type Unit = Linked & { activities?: Activity[] };
type Outcome = { id: string; status?: string };

export type LessonForAudit = {
  outcomes?: Outcome[];
  evidence?: Evidence[];
  learning_units?: Unit[];
  final_assessment?: { assessments?: Assessment[] } | null;
};

export function auditStructuralAlignment(lesson: LessonForAudit) {
  const findings: Finding[] = [];
  const report = (rule_id: string, severity: Finding['severity'], entity_id: string, message: string) => {
    findings.push({ rule_id, severity, entity_id, message });
  };
  const outcomes = lesson.outcomes || [];
  const evidence = lesson.evidence || [];
  const units = lesson.learning_units || [];
  const activities = units.flatMap((unit) => unit.activities || []);
  const assessments = [
    ...activities.flatMap((activity) => activity.assessment ? [activity.assessment] : []),
    ...(lesson.final_assessment?.assessments || []),
  ];
  const resources = activities.flatMap((activity) => activity.resources || []);
  const all = [...outcomes, ...evidence, ...units, ...activities, ...assessments, ...resources];
  const ids = new Set<string>();
  for (const item of all) {
    if (!item.id || ids.has(item.id)) report('RF-03', 'block', item.id || 'missing', 'ID trùng hoặc thiếu');
    ids.add(item.id);
  }
  const outcomeIds = new Set(outcomes.map((item) => item.id));
  const evidenceIds = new Set(evidence.map((item) => item.id));
  for (const item of [...evidence, ...units, ...activities, ...assessments, ...resources]) {
    for (const id of item.supports_outcomes || []) {
      if (!outcomeIds.has(id)) report('RF-01', 'block', item.id, 'Không tìm thấy LO: ' + id);
    }
  }
  for (const item of activities) {
    for (const id of item.supports_evidence || []) {
      if (!evidenceIds.has(id)) report('RF-02', 'block', item.id, 'Không tìm thấy evidence: ' + id);
    }
  }
  for (const item of assessments) {
    for (const id of item.measures_evidence || []) {
      if (!evidenceIds.has(id)) report('RF-02', 'block', item.id, 'Không tìm thấy evidence: ' + id);
    }
    if (!(item.supports_outcomes || []).length) report('AL-02', 'fail', item.id, 'Assessment thiếu LO');
    if (!(item.measures_evidence || []).length) report('AL-03', 'fail', item.id, 'Assessment thiếu evidence');
  }
  for (const item of activities) {
    if (!(item.supports_outcomes || []).length) report('AL-04', 'fail', item.id, 'Activity thiếu LO');
  }
  for (const item of outcomes.filter((outcome) => outcome.status === 'locked')) {
    if (!evidence.some((ev) => ev.supports_outcomes?.includes(item.id))) {
      report('EV-01', 'fail', item.id, 'LO chưa có evidence');
    }
  }
  for (const item of evidence.filter((ev) => ev.assessment_required !== false)) {
    if (!assessments.some((assessment) => assessment.measures_evidence?.includes(item.id))) {
      report('AL-01', 'fail', item.id, 'Evidence chưa được đánh giá');
    }
  }
  return {
    status: findings.some((item) => item.severity === 'block') ? 'block'
      : findings.length ? 'fail' : 'warn',
    design_ready: false,
    findings,
    implemented_rules: ['RF-01', 'RF-02', 'RF-03', 'EV-01', 'AL-01', 'AL-02', 'AL-03', 'AL-04'],
    note: 'Partial structural checks only. Full schema, semantic audit and human approvals remain required.',
  };
}
