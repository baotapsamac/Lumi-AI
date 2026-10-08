# ALIGNMENT AUDITOR SPECIFICATION V1.0

## Responsibility
Read lesson.json and alignment-rules.json, validate pedagogical relationships, build an alignment map, report findings and publication readiness. AUDIT ≠ REVISE. The Auditor must not modify outcomes, content, assessments, media, or activities.

## Inputs
Required: lesson.json, lesson.schema.json, alignment-rules.json.
Optional: original source manifest, official outcomes snapshot, previous audit report, verified-content manifest.

## Output
alignment-report.json with audit_version, lesson_id, timestamp, status (pass|warn|fail|block), design_ready, summary counts, coverage, alignment_map, findings, recommendations.

## Audit order
0 Schema validation
1 Referential integrity
2 Outcome integrity
3 Evidence coverage
4 Assessment alignment
5 Activity alignment
6 Content/resource alignment
7 Learning design review
8 Provenance review
9 Publication gate
Do not run deep semantic audit when Phase 0 or 1 is BLOCK.

## Phase 0 — Schema
Validate against lesson.schema.json. Invalid schema => BLOCK and stop semantic audit.

## Phase 1 — Referential integrity
Build indexes for outcomes, evidence, activities, resources and assessments. Detect duplicate IDs and dangling references. Broken graph => BLOCK.

## Phase 2 — Outcome integrity
If source=official, compare with official snapshot when available. Changed official wording => LO-01 BLOCK. AI-proposed pending outcomes cannot support publication. Locked outcomes must be assessable. Auditor never rewrites them.

## Phase 3 — Evidence coverage
For every locked outcome, collect evidence referencing it. Zero evidence => EV-01 FAIL. Existing evidence must be observable, relevant and compatible with outcome demand.

## Phase 4 — Assessment alignment
For every evidence item requiring assessment, find assessments whose measures_evidence contains its ID. None => AL-01 FAIL. Validate Assessment → Evidence → Outcome chain.

## Cognitive demand compatibility
Use Bloom only as supporting metadata: remember=1, understand=2, apply=3, analyze=4, evaluate=5, create=6. Do not decide compatibility only by numeric rank. Inspect observable action, evidence description, assessment function, instructions and expected response/product. Recognition/recall alone cannot demonstrate application/performance/creation. If evidence is insufficient to decide, WARN rather than inventing a FAIL.

## Assessment function heuristic
identify: selection/hotspot/short response
classify: classification/matching/drag-drop/sorting
sequence: ordering/drag-drop/constructed sequence
explain: short answer/essay/oral/structured response
apply: scenario/problem/simulation/performance task
perform: observation/performance task/valid simulation
create: product/project/constructed response/portfolio
This is heuristic, not absolute. If another interaction produces valid evidence, PASS.

## Phase 5 — Activity alignment
For every outcome, collect supporting activities and evaluate whether they prepare learners to produce required evidence, not merely whether IDs match.

## Learning type review
Use acquisition, investigation, discussion, practice, collaboration, production. Calculate learning time distribution when duration is available. Never impose fixed percentages. Missing discussion/collaboration is not automatically a problem.

## Acquisition dominance
If outcomes are mainly remember/understand, acquisition dominance is not automatically a warning. If higher/application/performance outcomes exist without meaningful opportunities to practice, investigate, produce or perform, issue WARN or FAIL according to the alignment gap. Never use an arbitrary percentage threshold.

## Phase 6 — Resource alignment
For every essential resource check purpose, activity relationship and outcome relationship. Text may be the best representation. Never reward video/3D/animation merely for existing.

## Media audit
Evaluate pedagogical purpose, informational necessity, activity/outcome relationship, accessibility requirement and cognitive appropriateness. More multimedia is not inherently better.

## Phase 7 — Learning design review
Inspect Outcome → Evidence → Learning opportunity → Practice/feedback where needed → Assessment. Detect passive-only design, busy work, assessment without preparation, resources without purpose, activities without outcomes and unnecessary redundancy.

## Formative assessment
Do not require a quiz per learning unit. Consider complexity, misconception risk, procedural requirements, importance and need for feedback. Missing formative support normally WARNs; FAIL only when the omission breaks outcome alignment.

## Feedback
For formative assessment, inspect whether feedback helps learners know result, understand the issue and know a next action when appropriate. Bare Correct/Incorrect feedback may WARN when corrective feedback is pedagogically needed.

## Phase 8 — Provenance
Classify factual resources as source, user_provided, inferred or ai_generated. AI-generated factual content must remain requires_verification=true until verified. Unverified AI factual content blocks publication.

## Official outcome protection
When official_outcomes_snapshot exists, compare current text/hash against snapshot. Any unauthorized difference => BLOCK. This is stronger than relying on prompt memory.

## Alignment graph
Build edges Outcome → Evidence → Assessment and Outcome → Activity → Resource, with optional Activity → Feedback. Every locked outcome must have at least one valid path to evidence and an assessment mechanism when required.

## Coverage metrics
Calculate outcome_evidence_coverage, outcome_assessment_coverage, outcome_activity_coverage, essential_resource_alignment, reference_integrity and provenance_completion. Do not create a single pedagogical quality score in V1.

## Finding object
Each finding contains finding_id, rule_id, severity, entity_type, entity_id, related_ids, message, evidence, recommended_action, auto_fix_allowed=false for semantic design decisions.

## Auto-fix policy
No semantic auto-fix for outcomes, evidence, assessments, factual content or activity design. Future auto-fix may cover optional metadata, formatting, ID normalization and ordering only.

## Severity aggregation
block_count>0 => BLOCK; else fail_count>0 => FAIL; else warn_count>0 => WARN; else PASS.

## design_ready
True only when schema_valid=true, reference_integrity=true, required outcomes are locked, outcome_evidence_coverage=100%, outcome_assessment_coverage=100%, block_count=0, fail_count=0, and no unverified AI factual content remains.

## Publication readiness
publication_ready is separate from design_ready and additionally requires accessibility validation, target-adapter validation, media availability, resolved external dependencies and package validation.

## Central question
Does the design provide content, learning opportunities, practice/feedback and assessment that enable learners to produce valid evidence of achieving the approved learning outcomes?