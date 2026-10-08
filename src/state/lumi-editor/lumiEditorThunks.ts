import type { RootState, AppDispatch } from 'src/state';

import { createAsyncThunk } from '@reduxjs/toolkit';

import { chatMessageAdded } from 'src/state/chat/actions';
import { selectChatMessages } from 'src/state/chat/selectors';

import { requestAiText } from '../../utils/ai-chat-client';
import {
  worksheetContentsSet,
  worksheetTitleChanged,
  worksheetContentAdded,
} from './lumiEditorSlice';
import {
  selectTitle,
  selectProvider,
  selectModel,
  selectApiToken,
  selectApiEndpoint,
  selectOrderedContent,
} from './lumiEditorSelectors';

import type { Content, TextContent, MultipleChoiceContent } from './types';

// ----------------------------------------------------------------------

type OpenAIMessage = { role: 'user' | 'assistant' | 'system'; content: string };

type WorksheetCommand = {
  action: string;
  text?: string;
  question?: string;
  answers?: Array<{ text: string; correct: boolean }>;
  title?: string;
};

// ----------------------------------------------------------------------

function buildWorksheetContext(title: string, content: Content[]): string {
  const descriptions = content.map((item, index) => {
    switch (item.type) {
      case 'text':
        return `${index + 1}. [Text Block]: "${item.text}"`;
      case 'multiple-choice': {
        const answers = item.answers
          .map((a) => `  - ${a.text}${a.correct ? ' (correct)' : ''}`)
          .join('\n');
        return `${index + 1}. [Multiple Choice Question]: "${item.question}"\n${answers}`;
      }
      case 'fill-in-the-blanks':
        return `${index + 1}. [Fill in the Blanks]: "${item.text}"`;
      case 'freetext':
        return `${index + 1}. [Freetext]: "${item.task}"`;
      default:
        return `${index + 1}. [Unknown]`;
    }
  });
  return `Worksheet Title: "${title}"\n\nCurrent Content:\n${descriptions.length > 0 ? descriptions.join('\n\n') : '(No content yet)'}`;
}

function executeCommandSync(command: WorksheetCommand, dispatch: AppDispatch) {
  switch (command.action) {
    case 'add_text':
      if (command.text) {
        dispatch(
          worksheetContentAdded({
            content: { id: `content-${Date.now()}`, type: 'text', text: command.text },
          })
        );
      }
      break;
    case 'add_question':
      if (command.question && command.answers) {
        dispatch(
          worksheetContentAdded({
            content: {
              id: `content-${Date.now()}`,
              type: 'multiple-choice',
              question: command.question,
              answers: command.answers,
            },
          })
        );
      }
      break;
    case 'set_title':
      if (command.title) {
        dispatch(worksheetTitleChanged(command.title));
      }
      break;
    default:
      break;
  }
}

// ----------------------------------------------------------------------

export const generateQuestion = createAsyncThunk<
  MultipleChoiceContent,
  { mode: 'create' | 'addBelow' | 'transform'; targetContentId: string | null },
  { state: RootState; dispatch: AppDispatch }
>('lumiEditor/generateQuestion', async ({ mode, targetContentId }, { getState }) => {
  const state = getState();
  const provider = selectProvider(state);
  const apiEndpoint = selectApiEndpoint(state);
  const apiToken = selectApiToken(state);
  const model = selectModel(state);
  const title = selectTitle(state);
  const content = selectOrderedContent(state);

  if (!apiToken.trim()) throw new Error('Vui lòng nhập API key');

  const targetItem = targetContentId ? content.find((c) => c.id === targetContentId) : null;

  const context =
    mode === 'transform' && targetItem
      ? targetItem.type === 'text'
        ? targetItem.text
        : targetItem.type === 'multiple-choice'
          ? `Frage: ${targetItem.question}\nAntworten:\n${targetItem.answers.map((a) => `${a.correct ? '* ' : ''}${a.text}`).join('\n')}`
          : buildWorksheetContext(title, content)
      : buildWorksheetContext(title, content);

  const prompt = mode === 'transform'
    ? `Hãy chuyển nội dung sau thành một câu hỏi trắc nghiệm tiếng Việt, bám sát nội dung nguồn, không thêm kiến thức ngoài nguồn:\n\n${context}\n\nChỉ trả về JSON: {"question":"Câu hỏi","answers":[{"text":"Đáp án đúng","correct":true},{"text":"Đáp án sai","correct":false}]}. Tạo từ 2 đến 4 phương án.`
    : `Tạo một câu hỏi trắc nghiệm tiếng Việt dựa trên ngữ cảnh sau, không thêm kiến thức không có trong ngữ cảnh:\n\n${context}\n\nChỉ trả về JSON: {"question":"Câu hỏi","answers":[{"text":"Đáp án đúng","correct":true},{"text":"Đáp án sai","correct":false}]}. Tạo từ 2 đến 4 phương án.`;

  const raw = await requestAiText(
    [{ role: 'user', content: prompt }],
    apiEndpoint,
    apiToken,
    model
  );

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI không trả về JSON hợp lệ');

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    id: `content-${Date.now()}`,
    type: 'multiple-choice',
    question: parsed.question,
    answers: parsed.answers,
  };
});

// ----------------------------------------------------------------------

export const generateText = createAsyncThunk<
  TextContent,
  { mode: 'create' | 'addBelow' | 'transform'; targetContentId: string | null },
  { state: RootState; dispatch: AppDispatch }
>('lumiEditor/generateText', async ({ mode, targetContentId }, { getState }) => {
  const state = getState();
  const provider = selectProvider(state);
  const apiEndpoint = selectApiEndpoint(state);
  const apiToken = selectApiToken(state);
  const model = selectModel(state);
  const title = selectTitle(state);
  const content = selectOrderedContent(state);

  if (!apiToken.trim()) throw new Error('Vui lòng nhập API key');

  const targetItem = targetContentId ? content.find((c) => c.id === targetContentId) : null;

  const context =
    mode === 'transform' && targetItem
      ? targetItem.type === 'text'
        ? targetItem.text
        : targetItem.type === 'multiple-choice'
          ? `Frage: ${targetItem.question}\nAntworten:\n${targetItem.answers.map((a) => `${a.correct ? '* ' : ''}${a.text}`).join('\n')}`
          : buildWorksheetContext(title, content)
      : buildWorksheetContext(title, content);

  const prompt = mode === 'transform'
    ? `Hãy diễn đạt nội dung sau thành đoạn văn tiếng Việt dễ hiểu, không tự ý thêm kiến thức:\n\n${context}\n\nChỉ trả về văn bản, không có giải thích ngoài lề.`
    : `Viết đoạn văn học tập bằng tiếng Việt dựa trên ngữ cảnh sau, không thêm kiến thức không có trong ngữ cảnh:\n\n${context}\n\nChỉ trả về văn bản.`;

  const raw = await requestAiText(
    [{ role: 'user', content: prompt }],
    apiEndpoint,
    apiToken,
    model
  );

  return { id: `content-${Date.now()}`, type: 'text', text: raw.trim() };
});

// ----------------------------------------------------------------------

export const sendChatMessage = createAsyncThunk<
  { assistantMessage: { id: string; role: 'assistant'; content: string }; commands?: WorksheetCommand[] },
  { userInput: string; creationState: { step: string; topic: string; audience: string } },
  { state: RootState; dispatch: AppDispatch }
>(
  'lumiEditor/sendChatMessage',
  async ({ userInput, creationState }, { getState, dispatch }) => {
    const state = getState();
    const apiToken = selectApiToken(state);
  const model = selectModel(state);
    const provider = selectProvider(state);
    const apiEndpoint = selectApiEndpoint(state);
    const chatMessages = selectChatMessages(state);
    const title = selectTitle(state);
    const content = selectOrderedContent(state);

    if (!apiToken.trim()) throw new Error('Vui lòng nhập API key');
    if (!userInput.trim()) throw new Error('Nội dung nhập đang trống');

    

    // Guided creation: step 1 – just acknowledge topic, ask for audience
    if (creationState.step === 'asking_topic') {
      return {
        assistantMessage: {
          id: `msg-${Date.now()}`,
          role: 'assistant' as const,
          content: `Đã nhận chủ đề "${userInput}".\n\nĐối tượng người học là ai (ví dụ: học viên trung cấp, sinh viên đại học)?`,
        },
      };
    }

    // Guided creation: step 2 – generate full worksheet draft
    if (creationState.step === 'asking_audience') {
      const { topic } = creationState;
      const audience = userInput;

      dispatch(
        chatMessageAdded({
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Đang tạo bản nháp bài học "${topic}" cho ${audience}. Vui lòng chờ...`,
          createdAt: Date.now(),
        })
      );

      const generatePrompt = `Bạn là trợ lý biên soạn học liệu tiếng Việt. Chủ đề: ${topic}. Đối tượng: ${audience}. Hãy tạo tiêu đề, 2–3 đoạn văn và 2–3 câu hỏi trắc nghiệm phù hợp, chỉ dùng kiến thức có căn cứ. Tất cả nội dung bằng tiếng Việt.

Trả về các khối lệnh JSON riêng trong markdown như:
\`\`\`json
{"action":"set_title","title":"Tiêu đề"}
\`\`\`
\`\`\`json
{"action":"add_text","text":"Đoạn văn"}
\`\`\`
\`\`\`json
{"action":"add_question","question":"Câu hỏi?","answers":[{"text":"Đúng","correct":true},{"text":"Sai","correct":false}]}
\`\`\`
Giới thiệu ngắn và tổng kết bằng tiếng Việt.`

      const raw = await requestAiText(
        [
          { role: 'system', content: generatePrompt },
          { role: 'user', content: `Hãy tạo bài học về "${topic}" cho ${audience}.` },
        ],
        apiEndpoint,
        apiToken,
        model
      );

      dispatch(worksheetContentsSet([]));

      const jsonMatches = raw.matchAll(/```json\n([\s\S]*?)\n```/g);
      const commands: WorksheetCommand[] = [];
      for (const match of jsonMatches) {
        try {
          const command = JSON.parse(match[1]) as WorksheetCommand;
          commands.push(command);
          executeCommandSync(command, dispatch);
        } catch {
          // ignore malformed command
        }
      }

      return {
        assistantMessage: {
          id: `msg-${Date.now()}`,
          role: 'assistant' as const,
          content:
            commands.length > 0
              ? `Đã tạo bản nháp với ${commands.length} thành phần. Bạn có thể chỉnh sửa nội dung hoặc yêu cầu bổ sung.`
              : `AI đã trả về nội dung nhưng chưa tạo được thành phần hợp lệ: ${raw}. Bạn có muốn thử lại?`,
          commands,
        },
        commands,
      };
    }

    // Normal chat mode
    const systemPrompt = `Bạn là trợ lý AI hỗ trợ biên soạn học liệu. Chỉ trả lời bằng tiếng Việt. Nội dung bài học hiện tại:
${buildWorksheetContext(title, content)}

Khi người dùng yêu cầu thêm nội dung, có thể trả về một khối JSON trong markdown theo một trong các mẫu:
\`\`\`json
{"action":"add_text","text":"Nội dung"}
\`\`\`
\`\`\`json
{"action":"add_question","question":"Câu hỏi?","answers":[{"text":"Đúng","correct":true},{"text":"Sai","correct":false}]}
\`\`\`
\`\`\`json
{"action":"set_title","title":"Tiêu đề"}
\`\`\`
Không tự ý sửa nội dung nguồn người dùng cung cấp.`

    const raw = await requestAiText(
      [
        { role: 'system', content: systemPrompt },
        ...chatMessages.map((msg) => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: userInput },
      ],
      apiEndpoint,
      apiToken,
      model
    );

    const jsonMatch = raw.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        executeCommandSync(JSON.parse(jsonMatch[1]) as WorksheetCommand, dispatch);
      } catch {
        // ignore malformed command
      }
    }

    return {
      assistantMessage: { id: `msg-${Date.now()}`, role: 'assistant' as const, content: raw },
    };
  }
);
