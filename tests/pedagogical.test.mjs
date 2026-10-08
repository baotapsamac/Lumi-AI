import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

async function loadTs(path) {
  const source = readFileSync(path, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: path,
    reportDiagnostics: true,
  });
  assert.equal(compiled.diagnostics?.length || 0, 0, path + ' must transpile');
  return import('data:text/javascript;base64,' + Buffer.from(compiled.outputText).toString('base64'));
}

const { auditStructuralAlignment } = await loadTs('src/utils/pedagogical-alignment.ts');
const { approveGate, acceptProposal, proposeRevision } = await loadTs('src/utils/pedagogical-approval.ts');
const rulebook = JSON.parse(readFileSync('pedagogical/alignment-rules.json', 'utf8'));
const allRules = rulebook.rules.map((r) => r.id);
const base = () => ({
  outcomes: [{ id: 'lo-1', status: 'locked' }],
  evidence: [{ id: 'ev-1', supports_outcomes: ['lo-1'] }],
  learning_units: [{
    id: 'unit-1', supports_outcomes: ['lo-1'], activities: [{
      id: 'act-1', supports_outcomes: ['lo-1'],
      assessment: { id: 'as-1', supports_outcomes: ['lo-1'], measures_evidence: ['ev-1'] },
    }],
  }],
});

test('rulebook has exactly 25 distinct rules', () => {
  assert.equal(allRules.length, 25);
  assert.equal(new Set(allRules).size, 25);
});

for (const id of allRules) {
  test('rule ' + id + ' must be implemented or explicitly pending (never silently PASS)', () => {
    const result = auditStructuralAlignment(base());
    assert.ok(result.implemented_rules.includes(id) || result.pending_rules.includes(id), id);
    assert.equal(result.design_ready, false, 'Incomplete audit must fail closed');
    if (result.pending_rules.includes(id)) {
      assert.notEqual(result.status, 'pass', 'Pending semantic rule must not PASS');
    }
  });
}

const cases = [
  ['RF-03', (x) => { x.learning_units[0].activities[0].id = 'lo-1'; }],
  ['RF-01', (x) => { x.evidence[0].supports_outcomes = ['missing-lo']; }],
  ['RF-02', (x) => { x.learning_units[0].activities[0].assessment.measures_evidence = ['missing-ev']; }],
  ['EV-01', (x) => { x.evidence[0].supports_outcomes = ['missing-lo']; }],
  ['AL-01', (x) => { x.learning_units[0].activities[0].assessment = null; }],
  ['AL-02', (x) => { x.learning_units[0].activities[0].assessment.supports_outcomes = []; }],
  ['AL-03', (x) => { x.learning_units[0].activities[0].assessment.measures_evidence = []; }],
  ['AL-04', (x) => { x.learning_units[0].activities[0].supports_outcomes = []; }],
  ['AL-05', (x) => { x.learning_units[0].activities[0].resources = [{ id: 'res-1', supports_outcomes: [] }]; }],
];
for (const [id, mutate] of cases) {
  test('negative mutation triggers ' + id, () => {
    const lesson = base();
    mutate(lesson);
    assert.ok(auditStructuralAlignment(lesson).findings.some((f) => f.rule_id === id), id);
  });
}

const revision = () => ({ revision: 3, value: base(), approvals: [] });
const allTrue = {
  schema_valid: true, alignment_passed: true, auditor_complete: true,
  package_valid: true, runtime_accepted: true, accessibility_passed: true, dependency_valid: true,
};
const approve = (r, gate, checks = allTrue) => approveGate(r, gate, '2026-10-08T00:00:00Z', checks);
const approvedOutcomes = () => approve(revision(), 'outcomes');
const approvedDesign = () => approve(approvedOutcomes(), 'design');

test('all three gates can proceed only in order with positive evidence', () => {
  assert.equal(approve(approvedDesign(), 'publication').approvals.length, 3);
});
test('cannot bypass design approval', () => assert.throws(() => approve(revision(), 'design')));
test('cannot bypass publication approval', () => assert.throws(() => approve(approvedOutcomes(), 'publication')));
for (const gate of ['outcomes', 'design', 'publication']) {
  test(gate + ' rejects invalid schema', () => {
    const r = gate === 'outcomes' ? revision() : gate === 'design' ? approvedOutcomes() : approvedDesign();
    assert.throws(() => approve(r, gate, { ...allTrue, schema_valid: false }));
  });
  test(gate + ' rejects incomplete auditor', () => {
    const r = gate === 'outcomes' ? revision() : gate === 'design' ? approvedOutcomes() : approvedDesign();
    assert.throws(() => approve(r, gate, { ...allTrue, auditor_complete: false }));
  });
}
test('design rejects failed alignment', () => assert.throws(() => approve(approvedOutcomes(), 'design', { ...allTrue, alignment_passed: false })));
for (const field of ['package_valid', 'runtime_accepted', 'accessibility_passed', 'dependency_valid', 'alignment_passed']) {
  test('publication rejects missing ' + field, () => assert.throws(() => approve(approvedDesign(), 'publication', { ...allTrue, [field]: false })));
}
test('stale proposal rejected', () => {
  const r = revision();
  const p = proposeRevision(r, base(), 'Update', ['act-1']);
  assert.throws(() => acceptProposal({ ...r, revision: 4 }, p, false));
});
test('outcome changes invalidate all approvals', () => {
  const r = approve(approvedDesign(), 'publication');
  const p = proposeRevision(r, base(), 'Change outcomes', ['lo-1']);
  assert.equal(acceptProposal(r, p, true).next.approvals.length, 0);
});
test('stale approvals cannot authorize downstream gates', () => {
  const r = approvedOutcomes();
  assert.throws(() => approve({ ...r, revision: 4 }, 'design'));
});
