# Lumi-AI Desktop 0.2.0 — Multi-provider preview

## Cấu hình nhà cung cấp

Trong thanh công cụ, chọn **Nhà cung cấp AI**, kiểm tra **Địa chỉ API**, nhập **Mô hình AI** và **API key**. API key của từng dịch vụ phải được tạo tại dịch vụ đó; thuê bao ChatGPT Pro không cấp hạn mức API.

| Dịch vụ | Endpoint Chat Completions | Mô hình gợi ý |
|---|---|---|
| OpenAI | https://api.openai.com/v1/chat/completions | gpt-4.1-mini |
| Google Gemini | https://generativelanguage.googleapis.com/v1beta/openai/chat/completions | gemini-2.5-flash |
| OpenRouter | https://openrouter.ai/api/v1/chat/completions | openrouter/free |
| API tùy chỉnh | URL Chat Completions của máy chủ tương thích | ID mô hình do máy chủ cung cấp |

Gemini có thể có hạn mức API miễn phí tùy khu vực và chính sách. OpenRouter có các mô hình miễn phí nhưng giới hạn sử dụng, độ ổn định và khả năng trả về JSON thay đổi theo mô hình. Các mô hình có phí được tính phí bởi nhà cung cấp.

**Lưu ý:** URL phải trỏ tới `/chat/completions`, không phải chỉ `/v1`. Chọn đúng model ID do nhà cung cấp hỗ trợ. API tùy chỉnh chỉ hỗ trợ HTTPS hoặc HTTP localhost.

## Bảo mật và giới hạn bản preview

- API key chỉ giữ trong bộ nhớ phiên ứng dụng và phải nhập lại khi khởi động. Chưa có tích hợp Windows Credential Manager; không dùng khóa có hạn mức chi tiêu lớn.
- Mã nguồn đã có một số giao diện tiếng Việt, nhưng **chưa Việt hóa toàn bộ** các cửa sổ và luồng hướng dẫn.
- Chưa nghiệm thu trên máy Windows của người dùng; GitHub CI chỉ xác nhận đóng gói.
- DOCX có ảnh/đồ họa chưa hỗ trợ sẽ bị chặn để tránh mất dữ liệu; kiểm thử với tài liệu DOCX chỉ có chữ và bảng trước.
- Không tự động chuyển sang dịch vụ có phí khi nhà cung cấp miễn phí lỗi.
- Để dùng mô hình cục bộ cần chạy máy chủ OpenAI-compatible (ví dụ LM Studio) và nhập endpoint localhost phù hợp.
