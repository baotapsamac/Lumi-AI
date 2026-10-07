# Instructional design benchmark

Provider: fixed-mock; model: N/A; execution: mock.

Deterministic metrics only; human review has not been performed. No subject-matter accuracy score is claimed.

| Case | Source | Preset | Schema valid | Quality Gate | Chapters | Blocks | Questions | Interaction distribution | Warnings | Human review |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| information-safety | cases/information-safety/source.txt | theory | true | true | 3 | 12 | 4 | {"text":7,"accordion":1,"multiple-choice":2,"true-false":2} |  | not-reviewed |
| seedling-care | cases/seedling-care/source.txt | procedure | true | true | 1 | 3 | 1 | {"text":2,"accordion":0,"multiple-choice":1,"true-false":0} |  | not-reviewed |
| library-review | cases/library-review/source.txt | review | true | true | 1 | 3 | 1 | {"text":2,"accordion":0,"multiple-choice":1,"true-false":0} |  | not-reviewed |

## Aggregate

```json
{
  "schemaValidity": 1,
  "qualityGatePassRate": 1,
  "sourceGrounding": {
    "numerator": 18,
    "denominator": 18,
    "ratio": 1
  },
  "learningOutcomeCoverage": {
    "numerator": 5,
    "denominator": 5,
    "ratio": 1
  },
  "questionValidity": {
    "numerator": 6,
    "denominator": 6,
    "ratio": 1
  },
  "duplicateRate": {
    "duplicates": 0,
    "total": 19,
    "ratio": 0
  },
  "interactionBalancePassRate": 1,
  "chapterStructurePassRate": 1
}
```

## Human review rubric (1–5)

- Bám sát nguồn: 1 = Nhiều ý không có căn cứ; 5 = Các ý quan trọng đúng và có căn cứ.
- Cấu trúc bài hợp lý: 1 = Cần tổ chức lại toàn bộ; 5 = Tiến trình rõ ràng, phù hợp nội dung.
- Phù hợp chuẩn đầu ra: 1 = Không phục vụ chuẩn đầu ra; 5 = Hoạt động phục vụ chuẩn đầu ra rõ ràng.
- Câu hỏi có chất lượng: 1 = Đáp án/distractors không phù hợp; 5 = Câu hỏi rõ, có căn cứ và phân biệt tốt.
- Mức Bloom phù hợp: 1 = Sai mức yêu cầu; 5 = Mức nhận thức phù hợp nguồn và yêu cầu.
- Tương tác hợp lý: 1 = Tùy tiện hoặc gây cản trở; 5 = Tương tác giúp học đúng mục đích.
- Ngôn ngữ rõ ràng: 1 = Khó hiểu, cần viết lại; 5 = Rõ ràng, phù hợp người học.
- Editing Effort: 1 = Phải sửa gần như toàn bộ; 5 = Gần như dùng ngay.

Record editing minutes and review evidence. Mock execution does not measure real AI performance.
