import { auditLesson } from './pedagogical-semantic-auditor';
import { approveGate } from './pedagogical-approval';
import type { Gate, Revision } from './pedagogical-approval';

export type ReviewVerdict = 'pass' | 'fail';
export type ReviewEvidence = {
  rule_id: string;
  revision: number;
  reviewer: string;
  reviewed_at: string;
  verdict: ReviewVerdict;
  rationale: string;
  source_reference: string;
  lesson_fingerprint: string;
};
export type GateEvidence = {
  gate: Gate;
  revision: number;
  reviewer: string;
  reviewed_at: string;
  rationale: string;
  lesson_fingerprint: string;
};
export type EvidenceLedger = {
  reviews: ReviewEvidence[];
  gates: GateEvidence[];
  official_snapshot?: Record<string, string>;
};
export const emptyEvidenceLedger = (): EvidenceLedger => ({ reviews: [], gates: [] });
/** Stable equality fingerprint for revision binding, not a cryptographic signature. */
export function lessonFingerprint(value: unknown): string {
  const canonical = (v: unknown): unknown => Array.isArray(v) ? v.map(canonical)
    : v && typeof v === 'object'
      ? Object.fromEntries(Object.entries(v).sort(([a],[b]) => a.localeCompare(b)).map(([k,x]) => [k, canonical(x)]))
      : v;
  return JSON.stringify(canonical(value));
}
export function recordSemanticReview<T>(
  revision: Revision<T>, ledger: EvidenceLedger, entry: Omit<ReviewEvidence, 'revision'|'lesson_fingerprint'>,
): EvidenceLedger {
  const audit = auditLesson(revision.value, ledger.official_snapshot);
  if (!audit.review_required.includes(entry.rule_id)) throw new Error('Rule is not awaiting semantic review.');
  if (!entry.reviewer.trim() || !entry.rationale.trim() || !entry.source_reference.trim() || !Number.isFinite(Date.parse(entry.reviewed_at))) {
    throw new Error('Reviewer, rationale, source reference and timestamp are required.');
  }
  const review: ReviewEvidence = { ...entry, revision: revision.revision, lesson_fingerprint: lessonFingerprint(revision.value) };
  return { ...ledger, reviews: [...ledger.reviews.filter(x => !(x.rule_id === entry.rule_id && x.revision === revision.revision)), review] };
}
export function verifiedAudit<T>(revision: Revision<T>, ledger: EvidenceLedger) {
  const audit = auditLesson(revision.value, ledger.official_snapshot);
  const fingerprint = lessonFingerprint(revision.value);
  const reviews = audit.review_required.map(id => ledger.reviews.find(x =>
    x.rule_id === id && x.revision === revision.revision && x.lesson_fingerprint === fingerprint
    && x.reviewer.trim() && x.rationale.trim() && x.source_reference.trim()
    && Number.isFinite(Date.parse(x.reviewed_at)) && x.verdict === 'pass'));
  const review_complete = reviews.every(Boolean);
  const structural_passed = audit.schema.valid && audit.results.every(r =>
    r.status === 'pass' || (r.status === 'review_required' && review_complete));
  return { ...audit, review_complete, design_ready: structural_passed, missing_reviews: audit.review_required.filter((_,i) => !reviews[i]) };
}
export function recordGateEvidence<T>(
  revision: Revision<T>, ledger: EvidenceLedger, entry: Omit<GateEvidence,'revision'|'lesson_fingerprint'>,
): EvidenceLedger {
  if (!entry.reviewer.trim() || !entry.rationale.trim() || !Number.isFinite(Date.parse(entry.reviewed_at))) {
    throw new Error('Gate evidence requires reviewer, rationale and timestamp.');
  }
  return { ...ledger, gates: [...ledger.gates, { ...entry, revision: revision.revision, lesson_fingerprint: lessonFingerprint(revision.value) }] };
}
export function hasGateEvidence<T>(revision: Revision<T>, ledger: EvidenceLedger, gate: Gate): boolean {
  const fingerprint = lessonFingerprint(revision.value);
  return ledger.gates.some(x => x.gate === gate && x.revision === revision.revision
    && x.lesson_fingerprint === fingerprint && x.reviewer.trim() && x.rationale.trim() && Number.isFinite(Date.parse(x.reviewed_at)));
}

/** The UI must use this function rather than supplying its own validation booleans. */
export function approveWithEvidence<T>(
  revision: Revision<T>, ledger: EvidenceLedger, gate: Gate, approvedAt: string,
  publication?: { package_valid: boolean; runtime_accepted: boolean; accessibility_passed: boolean; dependency_valid: boolean },
): Revision<T> {
  const audit = verifiedAudit(revision, ledger);
  if (!hasGateEvidence(revision, ledger, gate)) throw new Error('Missing current-revision gate evidence.');
  if (!audit.schema.valid) throw new Error('Invalid canonical JSON Schema.');
  if (gate !== 'outcomes' && !audit.design_ready) throw new Error('Alignment or semantic review unresolved.');
  if (gate === 'outcomes') {
    const value = revision.value as { outcomes?: Array<{ status?: string }> };
    if (!value.outcomes?.length || value.outcomes.some(x => x.status !== 'locked')) throw new Error('Outcomes must be locked.');
  }
  return approveGate(revision, gate, approvedAt, {
    schema_valid: audit.schema.valid,
    alignment_passed: audit.design_ready,
    auditor_complete: gate === 'outcomes' ? audit.schema.valid : audit.review_complete && audit.design_ready,
    package_valid: publication?.package_valid,
    runtime_accepted: publication?.runtime_accepted,
    accessibility_passed: publication?.accessibility_passed,
    dependency_valid: publication?.dependency_valid,
  });
}
