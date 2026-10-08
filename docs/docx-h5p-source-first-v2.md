# DOCX → H5P Source-First Specification V2.0

Status: LOCKED from the 18-decision design interview.

## Invariants
- Learner reading content is immutable source content: no AI summary, rewrite, correction, or factual supplementation.
- Preserve source order and structure; technical chunk limits never define learner-facing structure.
- Flow: Read → selective Check → source-directed feedback/Retry → cumulative final assessment.
- ESSENTIAL/SUPPORTING/ENRICHMENT affects assessment selection only, never source removal.
- Question count follows important content and locked outcomes, not a fixed quota.
- In-progress checks use only already-read source; final assessment may use the whole already-presented lesson.
- Stem, correct answers, distractors and feedback are source-grounded and retain provenance.
- Distractors: same subsection → same section → previously read content → broader already-read lesson; prefer same semantic class.
- Never invent false technical statements merely to create distractors.
- If good distractors are unavailable, try another supported MCQ structure; otherwise omit and emit DISTRACTOR_SOURCE_GAP.
- Review may edit/regenerate/omit questions without changing immutable source content.
- QA uses PASS/WARN/FAIL/BLOCK; never fabricate PASS.

## V2 model
SourceDocument → SourceSection → ordered SourceBlock[].
Block types: heading | paragraph | list | table | image | caption.
Every block has stable source_block_id and ordinal.

Question provenance:
- question_source_ids[]
- answers[].source_ids[]
- feedback_source_ids[]

## BLOCK gates
- learner source differs from parsed source without explicit source-author edit
- answer option lacks source provenance
- invented technical distractor
- in-progress question references future/unread source

## WARN gates
- DISTRACTOR_SOURCE_GAP
- weak semantic comparability
- source structure/media cannot yet be represented faithfully

## Delivery
1. Immutable Source Model + Question Contract.
2. Structure-preserving DOCX parser.
3. Distractor Retriever + Quality Gate + cumulative assessment.
4. Review UI.
5. H5P renderer + validator.
6. Regression/build + real long-DOCX Golden Test.
