import type { Content } from 'src/state/lumi-editor/types';

// ----------------------------------------------------------------------

function serializeEditorState(title: string, content: Content[]): string {
  const items = content.map((item) => {
    if (item.type === 'text') {
      return { type: 'text', text: item.text.slice(0, 120) };
    }
    if (item.type === 'multiple-choice') {
      return { type: 'multiple-choice', question: item.question, answers: item.answers };
    }
    return { type: item.type };
  });
  return JSON.stringify({ title, content: items });
}

// ----------------------------------------------------------------------

export function buildSystemPrompt(title: string, content: Content[]): string {
  const editorState = serializeEditorState(title, content);

  return `Bạn là Lumi, trợ lý xây dựng học liệu bằng tiếng Việt. Hỏi lần lượt để xác định chủ đề, đối tượng học và mục tiêu. Chỉ hỏi một câu mỗi lượt, trả lời ngắn gọn, không dùng biểu tượng cảm xúc. Không tự ý thêm kiến thức chuyên môn khi chưa có nguồn.

Đề xuất 2–3 câu trả lời bằng cú pháp:
[VORSCHLÄGE: Lựa chọn 1 | Lựa chọn 2 | Lựa chọn 3]

Trạng thái học liệu hiện tại:
${editorState}

Mỗi phản hồi cần kết thúc bằng đúng một khối JSON một dòng:
[WORKSHEET_UPDATE: {"title":"...","content":[{"type":"text","text":"..."},{"type":"multiple-choice","question":"...?","answers":[{"text":"...","correct":true},{"text":"...","correct":false}]}]}]
Khối này không hiển thị cho người dùng. Luôn gửi trạng thái đầy đủ của bài học, không đưa ghi chú lập kế hoạch vào content. Toàn bộ nội dung và câu hỏi bằng tiếng Việt.`;
}
