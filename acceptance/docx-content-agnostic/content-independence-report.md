# DOCX content independence — Prompt 11

**TEST FIXTURE — SYNTHETIC NEUTRAL CONTENT**

These three inputs were generated for structural tests. They are not substituted
user documents and are not a processing result for any other document.
Parser: PARSER_SUCCESS. AI: AI_NOT_EXECUTED. Human review: NOT REVIEWED.
No real API request, LessonBlueprint acceptance or H5P compilation was performed.

## A. Baseline tests

Prior baseline: 289 passing tests (13 library + 132 H5P + 70 instructional +
53 benchmark + 21 DOCX). Final: 322 passing (18 added instructional/boundary tests
and 15 added content-independent DOCX tests). No failed/skipped tests.
Two earlier DOCX rejection expectations intentionally changed: arbitrary header
vocabulary and parentless rows now parse successfully. Earlier assertions of
six table-only segments were updated to include paragraphs, headers and hierarchy
rows; this is an intentional segmentation contract change, not a hidden loss.

## B. Parser/content separation

`scripts/docx_source.py` has no fixture import, network call, domain classification
or source-replacement branch. Generators and synthetic vocabulary remain in test
helpers. Its contract is bounded DOCX bytes → opaque text + structure.
The original Prompt 10 DOCX/inspection artifacts are unchanged historical files.

## C. Hard-coded vocabulary audit

Removed the production comparison against the four Vietnamese inspection headers.
Removed fixture-specific numeric token constants and Vietnamese labels added by
table-only segmentation. Automated audit checks absence of the seven named neutral
fixture terms, former headers and former typography literals in production rules.
Generic diagnostics detect literal comparison/fraction/degree patterns without
normalizing or interpreting their meaning.

## D. Table association invariant

Four-column positional mapping: ordinal/topic/requirement/method. A logical data
row keeps its four values and their separate physical/anchor origins together.
Header text is arbitrary; header-row count is an explicit configurable layout
policy (default 1, 0 supported). No topic-dependent branching exists.
A seeded property-style test generates 50 documents, each with six unrelated
Unicode topic/requirement/method triples: 300 triples / 900 values match exactly.

| Fixture | Vocabulary | Tables | Grid columns | Physical rows | Data associations | Segments |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| classroom/source.docx | Classroom materials | 1 | 4 | 12 | 6 | 12 |
| inventory/source.docx | Equipment inventory | 1 | 4 | 12 | 6 | 12 |
| records/source.docx | Laboratory records | 1 | 4 | 12 | 6 | 12 |

Their titles, topics and prose differ; a shared synthetic typography probe is
intentional. Role sequences, origins, anchors, merge modes, paragraph counts and
list definitions are equal across all three. No semantic accuracy claim is made.

## E. Hierarchy reconstruction

Sections use full-width gridSpan rows. Groups use nonempty ordinal/topic and blank
requirement/method under the declared layout convention. Data without parents
keeps null hierarchy rather than being rejected or supplied invented parents.
Body headings use direct/inherited outline metadata, not heading vocabulary.
Blank ordinary cells are preserved; only explicit vMerge resolves anchor text.

## F. Merged-cell handling

Horizontal section merges and vertical restart/continue retain physical origin and
anchor separately. Tests include vertically merged topic/requirement/method,
ordinal continuation, orphan merge rejection and invalid span rejection.
Other horizontal merges remain raw rows, segmented without invented positional
associations, with UNPROJECTED_MERGED_ROW diagnostics.

## G. Lists and multi-paragraph cells

Each fixture includes a requirement cell with three bullet paragraphs and a method
cell with four numbered paragraphs. Text/order/boundaries are exact. Numbering
metadata records numId, level, bullet/decimal format, levelText and start.
Word rendered numbering and inherited list styles are not promised.

## H. Unicode/numeric preservation

Exact preservation is tested for ABC-123, α β γ, ≥ 1, ≤ 3,0, 1/10, 45°,
Mục A.1, Nội dung X, tabs, XML-special characters and non-BMP Unicode (emoji).
All physical paragraph strings are independently compared to the original OOXML
strings. This validates typography extraction only, not technical interpretation.

## I. Source traceability

S1…S12 follow body/row order. Offsets are exact UTF-16 slices. Origins retain
original filename, body element, table, row, cell positions and merge anchors.
Introductory paragraph, headers, section/group rows and all logical data rows are
included. Empty rows remain in structured-source.json. Structural source validation
checks sequential IDs, exact slices, complete text coverage and original filename.
The DOCX provider path and Quality Gate preserve these logical IDs rather than
using the old plain-text resegmentation. Default plain-text behavior is unchanged.

## J. Provider boundary

`runParsedDocxTrial` consumes successful parser artifacts; execution is opt-in.
Explicit provider refusals stop downstream execution, preserve the two source
artifacts byte for byte and update diagnostics.json only. No neutral substitution
or mock fallback is implemented. Refusal/transport prose and secrets are discarded;
safe stage/code/path metadata remain. Provider response simulations are tests only.
This is a server-side API boundary, not a new UI or an automatic real-AI run.

## K. Explicit failure states

Parser status PARSER_SUCCESS is independent of AI states:
AI_NOT_CONFIGURED, AI_NOT_EXECUTED, AI_PROVIDER_DECLINED, AI_TRANSPORT_ERROR,
AI_INVALID_OUTPUT, QUALITY_GATE_FAILED and SUCCESS.
Refusal is identified by explicit protocol markers (message.refusal, content_filter
finish, supported HTTP policy code). Ordinary 401/403 errors remain transport/API
errors. Unmarked free-text replies are invalid output, not guessed refusals.
SUCCESS means deterministic gates pass; human acceptance remains NOT REVIEWED.
Tests separately exercise runtime-invalid output, quality failure, success,
configuration absence and each provider failure state.

## L. Tests

| Suite | Passed |
| --- | ---: |
| H5P library foundation | 13/13 |
| H5P compiler/regression | 132/132 |
| Instructional pipeline + DOCX boundary | 88/88 |
| Benchmark | 53/53 |
| DOCX structure/content independence | 36/36 |
| Total | **322/322** |

Commands: npm run h5p:test; npm run lesson:test; npm run benchmark:test;
npm run docx:test. Targeted ESLint of changed instructional source files passes.
No lockfile/dependency change; no H5P compiler/BookSchema/mapping/catalog/locale/
resolver/compatibility change in Prompt 11. No golden H5P fixture update.

## M. h5p:check

PASS: 17 libraries, runtime/editor dependency closure, assets, catalog and archive.

## N. Production build

PASS: tsc + Vite. Existing six lint warnings, runtime deprecation notice and large
chunk warning remain. New import-order lint findings were corrected before the
successful build; no new lint warnings remain.

## O. Acceptance artifacts

Each fixture directory contains source.docx and inspection/{structured-source.json,
source-segments.json,diagnostics.json,numeric-fidelity.json}. The downloadable ZIP
contains all three representative fixtures, parser outputs and this report.
All parser outputs have PARSER_SUCCESS / AI_NOT_EXECUTED / NOT REVIEWED.

## P. Known limitations

Content-independent does not mean every Word feature is supported. Explicit grids
and the declared positional layout are required for projected associations. Nested
tables, skipped cells, legacy hMerge, images/objects, tracked changes, symbols/note
references and unsupported body/cell structures fail rather than silently lose data.
Headers/footers/notes are outside the main-body contract. Partial horizontal merges
are kept raw; blank cells without anchors are not interpreted as semantic repeats.
No real AI run, semantic grounding assessment or visual Word/Lumi/Moodle acceptance.

## Q. Recommended next step

Open the three DOCX files in Word/LibreOffice and compare merged cells, lists and
paragraphs to their structured outputs. Then inspect a new authorized supported
DOCX before any explicitly configured blueprint-only provider trial.
