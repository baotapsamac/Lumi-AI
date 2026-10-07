# Instructional design benchmark

Provider: fixed-mock; model: N/A; execution: mock.
Temperature: N/A; maxAttempts: 2.

Deterministic metrics only; human review has not been performed. No subject-matter accuracy score is claimed.

| Case | Source | Preset | Schema valid | Quality Gate | Decision | Chapters | Blocks | Questions | Warnings | Human review |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| single-lesson | source.txt | theory | true | true | PASS WITH WARNINGS | 3 | 12 | 4 |  | NOT REVIEWED |

## Aggregate

{
  "schemaValidity": 1,
  "qualityGatePassRate": 1,
  "sourceGrounding": {
    "numerator": 12,
    "denominator": 12,
    "ratio": 1
  },
  "learningOutcomeCoverage": {
    "numerator": 3,
    "denominator": 3,
    "ratio": 1
  },
  "questionValidity": {
    "numerator": 4,
    "denominator": 4,
    "ratio": 1
  },
  "duplicateRate": {
    "duplicates": 0,
    "total": 13,
    "ratio": 0
  },
  "interactionBalancePassRate": 1,
  "chapterStructurePassRate": 1
}

## Case single-lesson

Decision: PASS WITH WARNINGS.
Blocking: none.
Non-blocking: semantic-grounding-human-review-required, instructional-quality-human-review-required, editing-effort-not-reviewed.

Summary: {"chapters":3,"activities":12,"interactionDistribution":{"text":7,"accordion":1,"multiple-choice":2,"true-false":2},"bloomDistribution":{"2":12},"outcomeIds":["O1","O2","O3"]}
Interaction distribution: {"text":7,"accordion":1,"multiple-choice":2,"true-false":2}.
Learning outcome coverage: {"covered":3,"total":3,"ratio":1}.

### 1. Theo nguồn, nhóm nào có thể được chia sẻ cho mọi người theo mục đích đã xác định?

- Chapter: Nhận diện và bảo vệ thông tin
- Type: multiple-choice; Bloom: 2
- Learning outcomes: O1 — Phân biệt các nhóm thông tin và các khái niệm bảo vệ thông tin trong nguồn.
- Correct answer: Thông tin công khai
- Distractors: Thông tin cá nhân; Thông tin nội bộ
- SourceRefs: S2, S3

Source evidence:

> S2: Thông tin công khai có thể được chia sẻ cho mọi người theo mục đích đã xác định. Ví dụ trong bài học là thông báo lịch sinh hoạt chung của lớp. Khi đọc một thông báo công khai, người học vẫn cần kiểm tra người gửi và thời điểm thông báo để tránh dùng nội dung đã cũ.

Option evidence and rationale:

- Thông tin công khai (correct): Nguồn mô tả nhóm này được chia sẻ cho mọi người theo mục đích đã xác định.; S2: Thông tin công khai có thể được chia sẻ cho mọi người theo mục đích đã xác định. Ví dụ trong bài học là thông báo lịch sinh hoạt chung của lớp. Khi đọc một thông báo công khai, người học vẫn cần kiểm tra người gửi và thời điểm thông báo để tránh dùng nội dung đã cũ.
- Thông tin cá nhân (distractor): Nguồn yêu cầu có sự đồng ý phù hợp trước khi gửi lên kênh công khai.; S3: Thông tin cá nhân liên quan đến một người cụ thể, chẳng hạn tên và địa chỉ liên hệ. Thông tin nội bộ chỉ dành cho nhóm được phép tiếp cận, chẳng hạn ghi chú làm việc của nhóm học tập. Không gửi thông tin cá nhân hoặc nội bộ lên một kênh công khai khi chưa có sự đồng ý phù hợp.
- Thông tin nội bộ (distractor): Nguồn giới hạn nhóm này cho người được phép tiếp cận.; S3: Thông tin cá nhân liên quan đến một người cụ thể, chẳng hạn tên và địa chỉ liên hệ. Thông tin nội bộ chỉ dành cho nhóm được phép tiếp cận, chẳng hạn ghi chú làm việc của nhóm học tập. Không gửi thông tin cá nhân hoặc nội bộ lên một kênh công khai khi chưa có sự đồng ý phù hợp.

Human review: NOT REVIEWED.

### 2. Khái niệm nào chỉ việc tạo bản sao dữ liệu để khôi phục khi bản gốc gặp sự cố?

- Chapter: Kiểm tra thông điệp và giữ bản sao
- Type: multiple-choice; Bloom: 2
- Learning outcomes: O2 — Nhận biết và lựa chọn thao tác kiểm tra thông điệp đáng ngờ theo nguồn.
- Correct answer: Sao lưu
- Distractors: Phishing
- SourceRefs: S6, S5

Source evidence:

> S6: Sao lưu là tạo bản sao dữ liệu để có thể khôi phục khi bản gốc gặp sự cố. Người học nên giữ một bản sao riêng cho tài liệu học tập quan trọng và kiểm tra xem bản sao có mở được hay không. Sao lưu không thay thế việc giữ mật khẩu riêng và không chứng minh một thông điệp là đáng tin.

Option evidence and rationale:

- Sao lưu (correct): Nguồn định nghĩa đây là tạo bản sao để khôi phục.; S6: Sao lưu là tạo bản sao dữ liệu để có thể khôi phục khi bản gốc gặp sự cố. Người học nên giữ một bản sao riêng cho tài liệu học tập quan trọng và kiểm tra xem bản sao có mở được hay không. Sao lưu không thay thế việc giữ mật khẩu riêng và không chứng minh một thông điệp là đáng tin.
- Phishing (distractor): Nguồn mô tả đây là thông điệp giả mạo, không phải tạo bản sao.; S5: Phishing là hành vi dùng thông điệp giả mạo để dụ người nhận cung cấp thông tin hoặc thực hiện thao tác có hại. Dấu hiệu cần kiểm tra gồm người gửi lạ, lời thúc giục khẩn cấp và liên kết không phù hợp với nơi gửi. Một thông điệp có logo quen thuộc vẫn cần được kiểm tra bằng các dấu hiệu này.

Human review: NOT REVIEWED.

### 3. Có thể gửi mật khẩu hoặc mã xác minh để chứng minh mình là chủ tài khoản.

- Chapter: Kiểm tra thông điệp và giữ bản sao
- Type: true-false; Bloom: 2
- Learning outcomes: O2 — Nhận biết và lựa chọn thao tác kiểm tra thông điệp đáng ngờ theo nguồn.
- Correct answer: Sai
- Distractors: N/A
- SourceRefs: S7
- Corrected statement: Không gửi mật khẩu hoặc mã xác minh để chứng minh mình là chủ tài khoản.
- Justification: Nhận định đảo ngược quy tắc không gửi mật khẩu hoặc mã xác minh trong nguồn.

Source evidence:

> S7: Khi nhận thông điệp đáng ngờ, bước đầu là dừng thao tác theo yêu cầu trong thông điệp. Bước tiếp theo là kiểm tra người gửi và liên kết qua một kênh liên hệ đã biết. Nếu vẫn nghi ngờ, báo cho người phụ trách bằng kênh đã xác định. Không gửi mật khẩu hoặc mã xác minh để chứng minh mình là chủ tài khoản.

Human review: NOT REVIEWED.

### 4. Báo sự cố sớm giúp nhóm có cơ hội kiểm tra và xử lý; không tự che giấu một lần gửi nhầm tài liệu.

- Chapter: Chia sẻ có trách nhiệm
- Type: true-false; Bloom: 2
- Learning outcomes: O3 — Lựa chọn cách chia sẻ và báo sự cố có trách nhiệm theo nguồn.
- Correct answer: Đúng
- Distractors: N/A
- SourceRefs: S9
- Corrected statement: Báo sự cố sớm giúp nhóm có cơ hội kiểm tra và xử lý; không tự che giấu một lần gửi nhầm tài liệu.
- Justification: Nhận định trích nguyên văn quy tắc trách nhiệm của người học.

Source evidence:

> S9: Người học chịu trách nhiệm giữ thông tin của mình và tôn trọng thông tin của người khác. Khi chưa chắc một yêu cầu chia sẻ có phù hợp hay không, hỏi người phụ trách trước khi thực hiện. Báo sự cố sớm giúp nhóm có cơ hội kiểm tra và xử lý; không tự che giấu một lần gửi nhầm tài liệu.

Human review: NOT REVIEWED.


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
