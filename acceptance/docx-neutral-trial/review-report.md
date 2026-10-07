# DOCX neutral parser trial

Status: PARSER TESTS PASS. AI: NOT EXECUTED. H5P: NOT COMPILED.
Human review: NOT REVIEWED.

Fixture contains a real four-column Word table, a horizontally merged section,
a vertically merged ordinal, an empty row/cell, lists and multiple paragraphs.
The contents are neutral classroom materials. Numeric strings are synthetic
Unicode typography examples, not technical thresholds.

## Association review

| Source ID | Group | Topic | Requirement | Method | DOCX row (zero-based) |
| --- | --- | --- | --- | --- | --- |
| S1 | Tài liệu giấy | Bìa sách | Tên sách đọc được. | Đọc tên trên bìa. | 3 |
| S2 | Tài liệu giấy | Trang sách | Các trang có số thứ tự. | Đọc số trên trang đầu. / Đối chiếu số trên trang tiếp theo. | 4 |
| S3 | Bảng thông tin | Danh sách lớp | Tên các mục đọc được. / Các mục nằm trong cùng danh sách. | Đọc từng mục. / Đối chiếu với tiêu đề danh sách. | 7 |
| S4 | Bảng thông tin | Ký hiệu minh họa | Dữ liệu thử kiểu chữ: ≥ 2; ≤ 4,5; 1/8; 30°. | Đối chiếu đúng chuỗi ký tự trong ô; không diễn giải thành tiêu chuẩn kỹ thuật. | 8 |
| S5 | Sổ theo dõi | Tiêu đề cột | Tiêu đề giữ nguyên tiếng Việt. | Đọc và đối chiếu tiêu đề. | 10 |
| S6 | Sổ theo dõi | Ghi chú | (ô rỗng) | Đọc ghi chú nếu có. | 11 |

## Hierarchy

I. Kiểm tra học liệu lớp học

- 3. Tài liệu giấy: Bìa sách; Trang sách.
- 4. Bảng thông tin: Danh sách lớp; Ký hiệu minh họa.
- 5. Sổ theo dõi: Tiêu đề cột; Ghi chú.

## Traceability and numeric fidelity

Segments S1–S6 each retain table/row/cell coordinates, merge anchors and the
original topic/requirement/method association. Lists and paragraphs remain in
structured-source.json. Source offsets use UTF-16 code units for future JS
compatibility. Segmentation currently covers table associations only; the
introductory paragraph is retained as a structured element.

≥ 2, ≤ 4,5, 1/8 and 30° are all in S4. AI usage is null because no AI ran.
This is exact-character preservation, not semantic validation.

## Human checklist

- Open the DOCX in Word/LibreOffice and check the real table/merged cells.
- Compare all six row associations and three parent groups against the source.
- Verify paragraphs, list items, empty cells and Vietnamese symbols survived.
- Follow each segment's origin/anchor coordinates back to its table cells.
- Record any parser corrections and editing time. No human score is prefilled.

## Limits

This is a convention-specific parser for the named four-column inspection table,
not a universal Word parser. Nested tables, ambiguous merged data columns, tracked
changes and unsupported structures reject rather than being silently flattened.
Numbering IDs/levels are preserved; numbering styles are not resolved into a
visual label. No headings-to-chapters, AI provider calls, blueprint generation or
H5P compilation are performed. Original technical weapon content is excluded.
