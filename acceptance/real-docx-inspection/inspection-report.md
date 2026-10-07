# Real user DOCX inspection — Prompt 12

**Acceptance: FAIL. Production parser: PARSER_FAILED. AI_NOT_EXECUTED.**
**Human review: NOT REVIEWED. No replacement source, AI, instructional design or H5P.**

This is inspection of the exact uploaded DOCX, not a synthetic fixture. The
production parser stopped on an unsupported font-dependent symbol. Counts below
come from a separate read-only OOXML metadata audit and are explicitly not a
successful production parse or a lossless source representation.

## A. Input document

Original filename: KTKT cối 60.docx. Size: 22,774 bytes.
SHA-256: `d1b1b56aa537bcaad60980e2d72aa2db0f3e6e4c31c2d289b3fb182a2fc1a7cb`.
The original upload remains outside this acceptance directory and was not edited,
rewritten, renamed, copied into Git, or replaced by a fixture. Instructions inside
the document were treated as source data, not execution commands.

## B. Parser status

**FAIL** — production inspect-only exited with status 1:
`Images, objects, tracked changes, symbols or note references require review`.
The actual offending nodes are three `w:sym` nodes, each font `Symbol`, char
`F0A3`. This document contains no drawing/object/tracked-change/note-reference
nodes triggering that check; the parser error is broader than the actual cause.
No PARSER_SUCCESS claim is made.

## C. Document structure

Independent metadata audit found 179 physical paragraphs, including 3 direct body
paragraphs, and 1 table. The complete supported-text preservation audit could not
run because production parsing stopped before output. No source text was corrected.

## D. Tables

1 table; 36 physical rows; 168 physical cells; **5 physical grid columns**.
Its header has four physical cells with spans 1 / 2 / 1 / 1. The logical topic area
is therefore physically split. Later rows contain five cells and merge anchors.
Header vocabulary was not used as a parser acceptance rule.

## E. Sections

Raw layout contains section candidates at zero-based rows 2 and 22. Their ordinal
cells contain I and II, with a three-column merged title cell. These source
boundaries were observed directly; the production parser did not reconstruct them.
Section-boundary correctness is **NOT VERIFIED**, rather than reported as PASS.

## F. Hierarchy

No production hierarchy was produced. Printing a reconstructed tree here would
misrepresent the failed execution. Existing generic projection handles four-grid-
column conventions, not this five-grid-column nested-topic layout. Raw rows and
anchor coordinates are documented in diagnostics.json for a future generic fix.
No hierarchy was generated from subject vocabulary.

## G. Logical associations

**NOT PRODUCED / NOT VERIFIED.** A successful list of topic–requirement–method
associations is unavailable; none was fabricated. Consequently a representative
association sample with Segment IDs is unavailable. Cross-row correctness cannot
be claimed from raw metadata counts alone.

## H. Continuation rows

Independent audit found 21 blank-ordinal row candidates: 1 header continuation and
20 data continuation candidates. OOXML merge anchors were readable, but no
production association was completed. `continuationRowsAssociated = null` and
`continuationRowsUnresolved = 21` express this unverified pipeline outcome; they do
not mean 21 malformed source merges. Diagnostics distinguish the header candidate.

## I. Merged cells

10 horizontally spanning cells; 60 vertical-merge cells: 16 restart, 44 continue.
The independent audit checked declared grid coverage and continuation-anchor spans,
finding 0 orphan anchors. These checks validate source metadata only; they do not
prove production projection or hierarchy correctness.

## J. Lists/multi-paragraph cells

6 cells contain multiple paragraphs. All 179 physical paragraphs were counted in
OOXML. 0 paragraphs have direct numbering metadata; 9 begin with list-like text
characters. No numbering was invented. Production preservation/order verification
is **NOT ASSESSED** because extraction failed.

## K. Unicode preservation

Ordinary `w:t` literals and three font-coded `w:sym` nodes are distinct. The audit
keeps raw symbol attributes, without mapping F0A3 to a displayed Unicode glyph.
There is no automatic replacement by ≤, £ or another character. Literal symbol
occurrence counts are in diagnostics.json. End-to-end Unicode fidelity is
**NOT ASSESSED**; it is not inferred from the ability to read XML text nodes.

## L. Numeric fidelity

numeric-fidelity.json inventories 33 numeric literal occurrences using generic
comparison/percentage/decimal/fraction/range/measurement/degree patterns. Each
entry retains the raw token, original OOXML origin and text-node offsets. This is
typography inventory only, not interpretation, normalization or an exhaustive
semantic audit. `sourceSegment = null`, `preserved = null` and
`verificationStatus = NOT_ASSESSED_PARSE_FAILED` are intentional. No token was
corrected; there is no claim that segmented output preserved it.

## M. Source segmentation

**NOT PRODUCED** — the CLI stopped before segmentation and before writing its
output directory. No S1…Sn IDs were invented. source-segments.json is an explicit
failure manifest, with null source/segments, not a successful segment artifact.

## N. Traceability

The independent metadata audit records original filename, body element, table,
row, cell, column/span and merge-anchor coordinates. This can locate unsupported
symbols and continuation candidates in OOXML. End-to-end Segment → DOCX
traceability remains **NOT VERIFIED**, since no segments exist.

## O. Unsupported/unprojected structures

Blocking actual structure: three font-dependent `w:sym` nodes. Separate layout
limitation: five physical columns / split-topic area, outside the current four-
column projection contract. This is reported as FIVE_COLUMN_GRID_NOT_PROJECTED;
it is not a produced count of unprojected rows. The source was not altered to make
it pass. Production parser, H5P compiler, BookSchema, mappers, catalog, localization,
compatibility and golden fixtures were not modified in this inspection.

## P. Text-loss audit

**NOT ASSESSED — PARSE FAILED.** `textLossCount = null`, not zero. The original
upload remains unchanged, but that fact does not establish successful extraction.
Lossless representation and acceptance gates cannot be claimed.

## Q. Diagnostics

Files distinguish the production exception from independent metadata findings.
structured-source.json and source-segments.json are clearly marked
`artifactStatus = NOT_PRODUCED` / `parserStatus = PARSER_FAILED`. Their null payloads
avoid presenting a partial or substitute document as successfully parsed.
diagnostics.json records coordinates, unsupported symbol attributes, row shapes,
merge anchors, continuation candidates and unverified metrics. Provider status is
AI_NOT_EXECUTED. Human review remains NOT REVIEWED.

## R. Regression tests

Fresh regression run: **322/322 PASS**, 0 failed/skipped:
13 library + 132 H5P + 88 instructional + 53 benchmark + 36 DOCX.
Commands: npm run docx:test; npm run lesson:test; npm run h5p:test;
npm run benchmark:test. Test-suite simulations are existing regression fixtures;
the real-document acceptance pipeline called neither real nor mock AI.
Passing regression tests do not make this real-document acceptance PASS.

## S. h5p:check

PASS: 17 libraries, runtime/editor dependencies, assets, catalog and archive.

## T. Production build

PASS: TypeScript + Vite. Existing baseline lint/deprecation/chunk warnings remain.
No code changes or dependency/lockfile changes were needed for this inspection.

## U. Artifacts

Five requested files: structured-source.json, source-segments.json,
diagnostics.json, numeric-fidelity.json and inspection-report.md. Their meaning
and unavailable payloads are described above. ZIP packages these five files only;
the original DOCX is not included. No AI or H5P artifact was generated.

## V. Recommended next step

First define and test a generic contract for preserving font-dependent OOXML
symbols without guessed glyph substitution, and for projecting a split-topic grid
using spans/anchors. Use synthetic structural regressions before rerunning this
unchanged document. Real AI remains blocked until parser acceptance succeeds.
