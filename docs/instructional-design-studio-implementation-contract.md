# Lumi-AI — Instructional Design Studio: implementation contract

Status: implementation specification, NOT a claim of implemented functionality.
Target branch: feat/automated-h5p-pipeline.
Product outcome: import DOCX/course outcomes, collaboratively design a lesson with AI and instructor approvals, export a fully editable .h5p Interactive Book, and report manual follow-up items.

## Non-negotiable architecture
SOURCE + OUTCOMES -> EVIDENCE -> ASSESSMENT -> LEARNING ACTIVITIES -> RESOURCES -> FEEDBACK -> QA -> lesson.json -> h5p-export-plan.json -> BookSchema -> H5P compiler -> .h5p + completion-report.json.

Preserve the original source artifacts exactly when recovered: SKILL.md, lesson.schema.json, alignment-rules.json, alignment-auditor-spec.md, lesson.json, alignment-report.json, compiler-adapter-spec.json, compiler-input.json, compiler-adapter-report.json. Never silently replace originals with inferred approximations. Keep pedagogical core publication-target-agnostic.

## Delivery stages
### 0. Baseline and artifact recovery
- Record git SHA, installed H5P libraries, compiler schema, test/build results, supported Lumi Desktop version.
- Recover original skill and schema files and compare hashes; place in pedagogical/ with provenance manifest.
- Add a requirement-to-rule-to-code-to-test traceability matrix. Mark every requirement NOT_IMPLEMENTED until executable code and tests exist.
- Preserve current DOCX-to-H5P path as legacy fallback.

### 1. Source ingestion
- Parse DOCX headings (Heading styles, Chương, Bài, 1., 1.1., Roman numerals), lists, tables, captions, images and source anchors.
- Preserve original chapter order and content. Chunk on semantic section boundaries, not arbitrary character counts.
- Identify official outcomes vs AI-proposed outcomes; official outcomes immutable unless explicitly unlocked and approved.
- Maintain source provenance (document hash, section ID, paragraph/table location) and evidence confidence.
- Report unsupported content; never fabricate missing media or factual claims.

### 2. Pedagogical design engine
- Implement exact canonical lesson.schema.json validation.
- Use Backward Design / Constructive Alignment: LO -> evidence -> assessment -> activity -> resource -> feedback.
- Record Bloom action and actual demand; select assessment from evidence, not MCQ by default.
- Model Laurillard learning types: acquisition, investigation, discussion, practice, collaboration, production.
- Support structured revision proposals with changed object IDs and rationale; prohibit automatic mutation of locked outcomes.
- Save every approved revision as a versioned lesson.json.

### 3. Conversational instructor studio
- Two-pane UI: structured lesson tree + contextual AI chat.
- Conversation must reference selected LO/evidence/assessment/activity and source spans.
- AI returns a typed change proposal (JSON Patch or equivalent) against an explicit revision ID, never an unreviewed direct overwrite.
- Show before/after diff; accept/reject/revise; re-run schema and alignment checks; maintain audit history and undo.
- Human Gate 1: approve/lock outcomes. Human Gate 2: approve lesson design. Human Gate 3: approve export readiness.
- Gates are durable across restarts, invalidated by dependent changes; draft export is explicitly labeled and allowed only when policy permits.

### 4. Independent alignment auditor
- Implement the original alignment-rules.json and alignment-auditor-spec.md as executable deterministic checks where possible.
- Validate schema, reference integrity, official LO integrity, evidence coverage, assessment alignment, activity alignment, resource alignment, provenance, and publication readiness.
- Distinguish PASS, WARN, FAIL, BLOCK. Never allow a BLOCK to pass official export.
- The auditor must not modify lesson.json. AI-based semantic review must be explicitly labeled as probabilistic and separately reviewable.
- Generate alignment-report.json with rule IDs, affected objects, explanations, source references, and remediation suggestions.

### 5. H5P mapping and editable output
- Implement lesson.json -> h5p-export-plan.json -> repository-specific BookSchema adapter; bind against actual compiler types, not a guessed interface.
- Start with Interactive Book, Column, AdvancedText, Accordion, MultipleChoice and TrueFalse; detect installed library versions.
- Emit native editable H5P content objects, not screenshots or flattened HTML substitutes.
- Preserve all headings, text and questions; do not silently drop questions when distractors are not verbatim in source. Verify correctness against source, but allow pedagogically valid distractors.
- Enforce minimum assessment expectations derived from approved lesson design; never treat empty assessment as valid when required.
- Validate ZIP, h5p.json, content/content.json, semantics and dependency versions.
- Keep unsupported activity mappings in completion-report.json, with exact chapter/object, reason, severity, manual steps, and expected Lumi Desktop editing location.
- An approved draft may contain clearly marked placeholders for missing non-critical media; missing critical evidence blocks official publication.

### 6. Quality gates and tests
- Unit: source parsing; schema; every alignment rule; patch/revision/lock behavior; mapping and export-plan statuses.
- Integration: real AI provider configured; prompt injection isolation; source-grounded design; save/reload; version conflicts; offline/failed API behavior.
- Golden tests: numbered headings, multi-section DOCX, tables, no media, long document, single and multiple correct answers, zero-question regression.
- End-to-end: DOCX -> instructor dialogue -> approval -> alignment PASS -> editable .h5p -> open/edit/save/reopen in Lumi Desktop -> import Moodle.
- Test both clean and blocked cases. Mock-only tests never count as real AI or Lumi Desktop acceptance.
- CI checks: typecheck, lint, unit/integration tests, build; Windows installer release only after acceptance evidence.

## Implementation milestones and acceptance
M1: original artifacts restored + provenance + baseline + traceability matrix.
M2: structured DOCX and pedagogical schema + auditor with negative tests.
M3: instructor chat, typed diffs, three approval gates, versioned project persistence.
M4: H5P adapter and compiler produce editable native H5P with completion report.
M5: real provider, Windows installer, Lumi Desktop round-trip, Moodle import, documented evidence.

## Definition of done
A teacher can import a representative DOCX, inspect source-grounded outcomes, negotiate revisions in natural language, approve outcomes and design, see independent alignment findings, produce an editable H5P Interactive Book with actual chapters and assessment, and receive a precise manual completion report. The H5P must round-trip through the target Lumi Desktop version. Every missing capability is labeled explicitly; no untested success claim.

## Safety, data integrity and secrets
Do not commit API keys or student personal data. Maintain source-grounded output and manual review for high-stakes procedural material. Version changes atomically; never overwrite approved data silently.
