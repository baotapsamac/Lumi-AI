/**
 * Strict preflight for canonical lesson.json. This is a conservative schema
 * subset; it never substitutes for the authoritative JSON Schema validator.
 */
type Obj = Record<string, unknown>;
export type PreflightIssue = { path: string; message: string };
const object = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const array = (v: unknown): unknown[] => Array.isArray(v) ? v : [];
const idOk = (v: unknown) => typeof v === 'string' && /^[A-Za-z][A-Za-z0-9._-]{1,99}$/.test(v);
export function preflightLesson(value: unknown): { valid: boolean; issues: PreflightIssue[] } {
  const issues: PreflightIssue[] = [];
  const requireField = (obj: Obj, field: string, path: string, check: (v: unknown) => boolean) => {
    if (!check(obj[field])) issues.push({ path: path + '.' + field, message: 'Missing or invalid required field' });
  };
  if (!object(value)) return { valid: false, issues: [{ path: '$', message: 'Lesson must be an object' }] };
  if (value.schema_version !== '1.0') issues.push({ path: '$.schema_version', message: 'Expected 1.0' });
  if (!object(value.lesson)) issues.push({ path: '$.lesson', message: 'Missing lesson metadata' });
  else {
    requireField(value.lesson, 'id', '$.lesson', idOk);
    requireField(value.lesson, 'title', '$.lesson', (v) => typeof v === 'string' && !!v.trim());
    requireField(value.lesson, 'language', '$.lesson', (v) => typeof v === 'string' && !!v.trim());
    requireField(value.lesson, 'status', '$.lesson', (v) => ['draft','outcomes_pending','outcomes_locked','design_ready','published'].includes(String(v)));
  }
  for (const key of ['outcomes','evidence','learning_units']) {
    if (!Array.isArray(value[key]) || !value[key].length) issues.push({ path: '$.' + key, message: 'Expected non-empty array' });
  }
  array(value.outcomes).forEach((item, i) => {
    const path = '$.outcomes[' + i + ']';
    if (!object(item)) { issues.push({ path, message: 'Expected object' }); return; }
    requireField(item, 'id', path, idOk);
    requireField(item, 'text', path, (v) => typeof v === 'string' && !!v.trim());
    requireField(item, 'source', path, (v) => ['official','user_provided','ai_proposed'].includes(String(v)));
    requireField(item, 'status', path, (v) => ['pending_approval','locked','rejected'].includes(String(v)));
  });
  array(value.evidence).forEach((item, i) => {
    const path = '$.evidence[' + i + ']';
    if (!object(item)) { issues.push({ path, message: 'Expected object' }); return; }
    requireField(item, 'id', path, idOk);
    requireField(item, 'description', path, (v) => typeof v === 'string' && !!v.trim());
    requireField(item, 'supports_outcomes', path, (v) => Array.isArray(v) && v.length > 0);
    requireField(item, 'evidence_type', path, (v) => typeof v === 'string' && !!v);
  });
  array(value.learning_units).forEach((item, i) => {
    const path = '$.learning_units[' + i + ']';
    if (!object(item)) { issues.push({ path, message: 'Expected object' }); return; }
    requireField(item, 'id', path, idOk);
    requireField(item, 'title', path, (v) => typeof v === 'string' && !!v.trim());
    requireField(item, 'supports_outcomes', path, (v) => Array.isArray(v) && v.length > 0);
    requireField(item, 'activities', path, (v) => Array.isArray(v) && v.length > 0);
    array(item.activities).forEach((act, j) => {
      const p = path + '.activities[' + j + ']';
      if (!object(act)) { issues.push({ path: p, message: 'Expected object' }); return; }
      requireField(act, 'id', p, idOk);
      requireField(act, 'instruction', p, (v) => typeof v === 'string' && !!v.trim());
      requireField(act, 'supports_outcomes', p, (v) => Array.isArray(v) && v.length > 0);
      requireField(act, 'learning_type', p, (v) => ['acquisition','investigation','discussion','practice','collaboration','production'].includes(String(v)));
    });
  });
  if (!object(value.qa) || !Array.isArray(value.qa.checks)) issues.push({ path: '$.qa', message: 'Missing QA report' });
  return { valid: issues.length === 0, issues };
}
