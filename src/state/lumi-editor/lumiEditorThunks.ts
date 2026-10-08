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

    const requiresModel = model;

    // Guided creation: step 1 – just acknowledge topic, ask for audience
    if (creationState.step === 'asking_topic') {
      return {
        assistantMessage: {
          id: `msg-${Date.now()}`,
          role: 'assistant' as const,
          content: `Super! Dein Arbeitsblatt wird sich mit "${userInput}" befassen.\n\nWer ist die Zielgruppe? (z.B. "Grundschüler", "Biologie-Oberstufenkurs", "Erwachsene Lernende", "Studierende im ersten Semester")`,
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
          content: `Perfekt! Ich erstelle jetzt ein Arbeitsblatt über "${topic}" für ${audience}. Das kann einen Moment dauern...`,
          createdAt: Date.now(),
        })
      );

      const generatePrompt = `Du erstellst ein Bildungs-Arbeitsblatt. Generiere einen vollständigen Arbeitsblatt-Entwurf basierend auf:\n\nThema: ${topic}\nZielgruppe: ${audience}\n\nErstelle ein Arbeitsblatt mit:\n1. Einem passenden Titel\n2. 2-3 Textblöcken, die das Thema zielgruppengerecht einführen und erklären\n3. 2-3 Multiple-Choice-Fragen zum Verständnistest\n\nWICHTIG: Alle Inhalte (Titel, Texte, Fragen, Antworten) MÜSSEN auf Deutsch sein!\n\nAntworte mit mehreren JSON-Befehlsblöcken zum Aufbau des Arbeitsblatts. Verwende diese Formate:\n\n\`\`\`json\n{"action": "set_title", "title": "Dein Titel hier"}\n\`\`\`\n\n\`\`\`json\n{"action": "add_text", "text": "Dein erklärender Text hier..."}\n\`\`\`\n\n\`\`\`json\n{"action": "add_question", "question": "Deine Frage?", "answers": [{"text": "Falsche Antwort", "correct": false}, {"text": "Richtige Antwort", "correct": true}]}\n\`\`\`\n\nFüge eine kurze Einleitung in natürlicher Sprache vor den Befehlen ein und eine Zusammenfassung danach. Antworte komplett auf Deutsch.`;

      const raw = await requestAiText(
        [
          { role: 'system', content: generatePrompt },
          { role: 'user', content: `Erstelle ein Arbeitsblatt über "${topic}" für ${audience}.` },
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
              ? `Fertig! Ich habe einen Arbeitsblatt-Entwurf mit ${commands.length} Elementen erstellt. Du kannst jetzt:\n\n• Jeden Inhalt direkt im Editor bearbeiten\n• Mich bitten, mehr Inhalt hinzuzufügen\n• Mich bitten, bestimmte Teile zu ändern\n\nWas möchtest du als nächstes tun?`
              : `Ich habe einige Ideen für dein Arbeitsblatt generiert. ${raw}\n\nMöchtest du, dass ich es nochmal versuche?`,
          commands,
        },
        commands,
      };
    }

    // Normal chat mode
    const systemPrompt = `Du bist ein hilfreicher KI-Assistent für einen Arbeitsblatt-Editor. Du hilfst Nutzern beim Erstellen von Bildungs-Arbeitsblättern mit verschiedenen Inhaltstypen.\n\nDer Nutzer arbeitet an einem Arbeitsblatt. Hier ist der aktuelle Stand:\n\n${buildWorksheetContext(title, content)}\n\nDu kannst dem Nutzer helfen durch:\n1. Beantworten von Fragen zum Arbeitsblatt\n2. Vorschlagen von Verbesserungen oder neuen Inhalten\n3. Ändern des Arbeitsblatts auf Anfrage (du antwortest mit speziellen Befehlen)\n\nWenn der Nutzer dich bittet, Inhalte hinzuzufügen oder zu ändern, antworte mit einem JSON-Befehlsblock:\n\`\`\`json\n{"action": "add_text", "text": "Dein Text hier"}\n\`\`\`\noder\n\`\`\`json\n{"action": "add_question", "question": "Deine Frage", "answers": [{"text": "Antwort 1", "correct": true}, {"text": "Antwort 2", "correct": false}]}\n\`\`\`\noder\n\`\`\`json\n{"action": "set_title", "title": "Neuer Titel"}\n\`\`\`\n\nWICHTIG: Antworte IMMER auf Deutsch. Alle generierten Inhalte müssen auf Deutsch sein.`;

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
