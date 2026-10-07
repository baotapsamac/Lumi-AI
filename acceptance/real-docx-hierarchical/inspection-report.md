# Prompt 13 revised — real DOCX hierarchical table and symbols

**PARSER_SUCCESS / structural acceptance PASS / AI_NOT_EXECUTED.**
**Human review: NOT REVIEWED. H5P: NOT COMPILED.**

## Input and scope

The exact original upload KTKT cối 60.docx was inspected. Original SHA-256:
`d1b1b56aa537bcaad60980e2d72aa2db0f3e6e4c31c2d289b3fb182a2fc1a7cb`. The original DOCX is unchanged and not included in this
acceptance directory/package. Existing Prompt 12 FAIL artifacts remain historical
records; they were not overwritten. This is opaque structure/typography extraction,
not instructional design, interpretation, correction or evaluation of technical
content. The received request ends at “Test 4 — Single”; only received requirements
were implemented, with additional synthetic regressions for their stated contracts.

## Generic implementation

- Header span 1/2/1/1 over five physical columns selects the split-content profile.
- ordinal/topic/subtopic/requirement/method remain separate fields. Physical cells,
  paragraphs, gridSpan, vMerge and anchors remain available.
- A merged content-region cell is a simple item with null subtopic; separate content
  columns preserve parent and leaf. Only explicit merge continuations inherit text.
- Section title spans and row layout separate sections. No filename, header words,
  domain nouns or fixed child count determine projection.
- Word tblHeader flags and header anchor continuations are preserved and excluded
  from content associations. Page rendering is not materialized as duplicate rows.
- Symbol mapping uses font+code only. The vendored standard SymbolEncoding snapshot
  plus Adobe Glyph List maps Symbol/F0A3 → lessequal → U+2264 (≤). All original
  font/code/origin metadata remain. Unknown fonts/codes produce reversible structured
  placeholders and UNRESOLVED_FONT_SYMBOL, never contextual guesses.

Mapping provenance/licenses: scripts/data/symbol-font-map.json and
symbol-font-map-LICENSE.txt. Source identifiers/hashes are pinned in metadata.
Production parsing uses Python standard library; no runtime ReportLab/network
requirement or new npm/Python dependency.

## Real structural outcome

| Metric | Result |
| --- | ---: |
| Tables | 1 |
| Physical grid columns | 5 |
| Logical header fields | 4 |
| Physical rows | 36 |
| Physical cells | 168 |
| Physical paragraphs | 179 |
| Sections | 2 |
| Top-level items in sections | 10 / 2 |
| Parent groups | 6 |
| Simple items | 6 |
| Child items | 26 |
| Leaf associations | 32 |
| Source segments | 38 |
| Continuation candidates | 21 |
| Data continuations associated | 20 |
| Header continuation | 1 |
| Unresolved continuations | 0 |
| Mapped symbols | 3 |
| Unresolved symbols | 0 |
| Multi-paragraph cells | 6 |
| Direct numbering metadata | 0 |
| Unprojected rows / warnings / errors | 0 / 0 / 0 |
| Text-loss count | **0** |

Children per parent: section I = 3 / 2 / 4 / 4; section II = 5 / 8.
These counts emerge from original anchors, not hard-coded document knowledge.
The 38 source segments include body paragraphs, headers, section rows and leaves;
they are not a count of activities. Breaks/blank physical paragraphs stay available.

## Actual parser hierarchy

This tree shows original titles and row origins as formatting of supplied content;
it adds no explanations, requirements, methods or technical knowledge.

```text
Document
├── Section I: Kiểm tra ở trạng thái lắp [row 2]
│   ├── 1: Số đồng bộ trên thân với các bộ phận khác [anchor row 3]
│   ├── 2: Tình trạng han gỉ màng sơn, nhuộm, mạ... [anchor row 4]
│   ├── 3: Nòng cối [anchor row 5]
│   │   ├── Lòng nòng [row 5]
│   │   ├── Đường sinh [row 6]
│   │   ├── Mối ghép giữa nòng đuôi nòng [row 7]
│   ├── 4: Kiểm tra giá cối  [anchor row 8]
│   │   ├── Đai giữ nòng [row 8]
│   │   ├── Bộ phận giảm giật [row 9]
│   ├── 5: Bộ phận tầm [anchor row 10]
│   │   ├── Chuyển động [row 10]
│   │   ├── Lực quay tầm [row 11]
│   │   ├── Đai ốc, vít điều chỉnh, vít hãm [row 12]
│   │   ├── Độ rơ vòng tay quay [row 13]
│   ├── 6: Bộ phận hướng [anchor row 14]
│   │   ├── Chuyển động [row 14]
│   │   ├── Lực quay tầm [row 15]
│   │   ├── Đai ốc, vít điều chỉnh, vít hãm [row 16]
│   │   ├── Độ rơ vòng tay quay
 [row 17]
│   ├── 7: Bộ phận lấy thăng bằng [anchor row 18]
│   ├── 8: Kiểm tra chân cối [anchor row 19]
│   ├── 9: Kiểm tra đế cối  [anchor row 20]
│   ├── 10: Kiểm tra kính ngắm cối [anchor row 21]
├── Section II: Kiểm tra ở trạng thái tháo [row 22]
│   ├── 1: Nòng [anchor row 23]
│   │   ├── Miệng nòng [row 23]
│   │   ├── Lòng nòng [row 24]
│   │   ├── Đuôi nòng [row 25]
│   │   ├── Độ mòn nòng [row 26]
│   │   ├── Độ cong nòng, lõm nòng [row 27]
│   ├── 2: Kiểm tra đồng bộ theo cối  [anchor row 28]
│   │   ├── Chủng loại, số lượng [row 28]
│   │   ├── Dụng cụ tháo lắp [row 29]
│   │   ├── Thông nòng, cọc chuẩn [row 30]
│   │   ├── Hộp dầu, mỡ [row 31]
│   │   ├── Ni vô [row 32]
│   │   ├── Trang cụ [row 33]
│   │   ├── Chiếu sáng [row 34]
│   │   ├── Hòm đựng [row 35]
```

## Preservation evidence

Independent verify_docx_source.py reads OOXML directly and compares all 179
physical paragraph representations, including text/tab/break/symbol order, to
parser output. It verifies all 168 cell positions/spans/merge modes, all 32 section
associations, 64 requirement/method row origins, 35 nonempty table-row segment
coverage checks, source segment IDs and exact UTF-16 slices. All checks pass.
Three symbol font/code/resolution records agree with the mapping profile and source.

numeric-fidelity.json contains 32 literal occurrences, with origin, paragraph
UTF-16 offsets, source segment and preserved=true. All three symbols also have
preserved=true. The older failed audit counted tokens per separate XML text node;
this inventory uses complete original paragraphs, so occurrence counts are not
expected to equal its 33 fragment-level occurrences. No value, comma, range, unit,
percentage or apparent typo is corrected. Mapping declared-font glyph encoding is
kept distinct from source text correction.

physicalParagraphEquality=true; symbolMetadataEquality=true; textLossCount=0.
No semantic accuracy or factual correctness claim follows from these checks.

## Regression and independence evidence

Baseline: 322/322. Final: **350/350 PASS**, zero failed/skipped:
13 library foundation + 132 H5P + 88 instructional + 53 benchmark + 64 DOCX.
28 added DOCX tests cover single/two-level items, variable child counts, section
reset, anchors, blanks, repeated headers, row associations, three vocabularies,
30 Unicode property-style documents, mapping provenance, inline symbol order,
unknown/malformed symbols, literal numeric preservation and auditor failure cases.
Synthetic tests passed before the first real-document rerun.

Three representative five-column synthetic fixtures with unrelated vocabulary live
in acceptance/docx-hierarchy-symbols/. They are explicitly marked
TEST FIXTURE — SYNTHETIC NEUTRAL CONTENT and are never substituted for this upload.
Each fixture has its own source, parser outputs and preservation audit.

h5p:check PASS (17 libraries/assets/dependencies/catalog/archive).
Production build PASS; six existing lint warnings and baseline deprecation/chunk
warnings remain. No H5P compiler/BookSchema/mappers/catalog/localization/compatibility/
golden changes. No AI provider, LessonBlueprint or H5P generation in acceptance.
No dependency/lockfile changes.

## Artifacts

structured-source.json, source-segments.json, diagnostics.json,
numeric-fidelity.json, preservation-audit.json and this report. Source artifacts
now contain actual parser payloads, not the earlier NOT_PRODUCED failure manifests.
Original source filename/coordinates support traceability. The original DOCX is
excluded from the package. Code changes remain in the workspace for review.

## Limits and next step

PASS covers deterministic extraction/structural projection only. Custom embedded
font substitution, font aliases beyond Symbol, full Word rendering, nested tables,
legacy hMerge and other previously excluded Word structures are not promised.
Unmarked text-identical rows are not guessed to be repeated headers.
Open the unchanged original in Word/LibreOffice and compare this hierarchy, the
three mapped symbols, paragraph boundaries and representative associations with
parser artifacts. Human review remains NOT REVIEWED. AI and H5P remain OFF.
