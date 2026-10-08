/**
 * Versioned human approval workflow for AI-proposed pedagogical changes.
 * Pure functions: caller is responsible for persistent storage.
 */
export type Gate = 'outcomes' | 'design' | 'publication';
export type Approval = { gate: Gate; revision: number; approved_at: string };
export type Revision<T> = { revision: number; value: T; approvals: Approval[] };
export type Proposal<T> = {
  base_revision: number;
  proposed_value: T;
  summary: string;
  affected_ids: string[];
};
export type RevisionDecision<T> = { next: Revision<T>; invalidated_gates: Gate[] };
const GATES: Gate[] = ['outcomes', 'design', 'publication'];

export function proposeRevision<T>(
  current: Revision<T>,
  proposed_value: T,
  summary: string,
  affected_ids: string[],
): Proposal<T> {
  if (!summary.trim() || affected_ids.length === 0) {
    throw new Error('Proposal must describe its changes and affected IDs.');
  }
  return { base_revision: current.revision, proposed_value, summary, affected_ids };
}

export function acceptProposal<T>(
  current: Revision<T>,
  proposal: Proposal<T>,
  changes_outcomes: boolean,
): RevisionDecision<T> {
  if (proposal.base_revision !== current.revision) {
    throw new Error('Stale AI proposal: regenerate against current revision.');
  }
  const invalidated_gates: Gate[] = changes_outcomes ? GATES : ['design', 'publication'];
  return {
    next: {
      revision: current.revision + 1,
      value: proposal.proposed_value,
      approvals: current.approvals.filter((item) => !invalidated_gates.includes(item.gate)),
    },
    invalidated_gates,
  };
}

export function approveGate<T>(
  current: Revision<T>,
  gate: Gate,
  approved_at: string,
  checks: { schema_valid: boolean; alignment_passed: boolean; package_valid?: boolean; runtime_accepted?: boolean; accessibility_passed?: boolean; dependency_valid?: boolean; auditor_complete?: boolean },
): Revision<T> {
  if (!checks.schema_valid) throw new Error('Cannot approve: schema validation failed.');
  if (!checks.auditor_complete) throw new Error('Cannot approve: complete independent alignment audit required.');
  if (gate !== 'outcomes' && !checks.alignment_passed) {
    throw new Error('Cannot approve: alignment audit has unresolved findings.');
  }
  if (gate === 'design' && !current.approvals.some((a) => a.gate === 'outcomes' && a.revision === current.revision)) {
    throw new Error('Approve outcomes first.');
  }
  if (gate === 'publication' && (
    !current.approvals.some((a) => a.gate === 'design' && a.revision === current.revision) || !checks.package_valid || !checks.runtime_accepted || !checks.accessibility_passed || !checks.dependency_valid
  )) {
    throw new Error('Design approval and package validation are required.');
  }
  return {
    ...current,
    approvals: [
      ...current.approvals.filter((a) => a.gate !== gate),
      { gate, revision: current.revision, approved_at },
    ],
  };
}
