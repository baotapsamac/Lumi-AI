import { unzipSync } from 'fflate';

import type {
  MaterializedAnswer,
  MaterializedChapter,
  MaterializedH5PPlan,
  MaterializedQuestion,
} from './h5p-pipeline';

export type DocxSection = {
  id: string;
  heading: string;
  text: string;
  paragraphCount: number;
};

export type LongDocxOptions = {
  apiEndpoint: string;
  apiToken: string;
  model?: string;
  maxChunkChars?: number;
  questionsPerChunk?: number;
  onProgress?: (completed: number, total: number, label: string) => void;
};

type GeneratedChunk = {
  title?: string;
  summary?: string;
  questions?: Array<{
    question?: string;
    selection_mode?: 'single' | 'multiple';
    answers?: Array<{ text?: string; correct?: boolean; feedback?: string }>;
  }>;
};

function xmlText(node: Element): string {
  return Array.from(node.getElementsByTagName('w:t'))
    .map((item) => item.textContent || '')
    .join('');
}

function paragraphStyle(node: Element): string {
  return (
    node.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val') ||
    node.getElementsByTagName('w:pStyle')[0]?.getAttribute('val') ||
    ''
  );
}

function isHeadingStyle(style: string): boolean {
  return /^(heading|title|tiêu.?đề|tieude)[ _-]?[1-6]?$/i.test(style.trim());
}

export async function extractDocxSections(
  file: File,
  maxChunkChars = 12000,
): Promise<DocxSection[]> {
  if (!file.name.toLowerCase().endsWith('.docx')) {
    throw new Error('Chỉ hỗ trợ tệp .docx.');
  }

  const zip = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const documentXml = zip['word/document.xml'];
  if (!documentXml) throw new Error('DOCX không có word/document.xml.');

  const xml = new TextDecoder().decode(documentXml);
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Không đọc được XML của tài liệu DOCX.');
  }

  const paragraphs = Array.from(document.getElementsByTagName('w:p'))
    .map((node) => ({
      text: xmlText(node).trim(),
      style: paragraphStyle(node),
    }))
    .filter((p) => p.text.length > 0);

  if (paragraphs.length === 0) throw new Error('Không tìm thấy văn bản trong DOCX.');

  const sections: DocxSection[] = [];
  let heading = file.name.replace(/\.docx$/i, '');
  let buffer: string[] = [];
  let paragraphCount = 0;

  const flush = () => {
    const text = buffer.join('\n\n').trim();
    if (!text) return;
    sections.push({
      id: `SEGMENT-${String(sections.length + 1).padStart(4, '0')}`,
      heading,
      text,
      paragraphCount,
    });
    buffer = [];
    paragraphCount = 0;
  };

  for (const paragraph of paragraphs) {
    const headingLike =
      isHeadingStyle(paragraph.style) ||
      (/^(?:[IVXLCDM]+|[A-Z])\.[ ]+\S/i.test(paragraph.text) && paragraph.text.length <= 160) ||
      (paragraph.text.length <= 120 &&
        paragraph.text === paragraph.text.toLocaleUpperCase('vi-VN') &&
        /[A-ZÀ-Ỹ]/i.test(paragraph.text));

    if (headingLike && buffer.length > 0) {
      flush();
      heading = paragraph.text;
      continue;
    }
    if (headingLike && buffer.length === 0) {
      heading = paragraph.text;
      continue;
    }

    const candidateLength = buffer.reduce((sum, value) => sum + value.length + 2, 0) + paragraph.text.length;
    if (candidateLength > maxChunkChars && buffer.length > 0) flush();

    buffer.push(paragraph.text);
    paragraphCount += 1;
  }
  flush();

  return sections;
}

function extractJsonObject(raw: string): GeneratedChunk {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] || raw.match(/\{[\s\S]*\}/)?.[0];
  if (!candidate) throw new Error('AI không trả về JSON hợp lệ.');
  return JSON.parse(candidate) as GeneratedChunk;
}

async function generateChunk(
  section: DocxSection,
  options: LongDocxOptions,
): Promise<GeneratedChunk> {
  const questionsPerChunk = options.questionsPerChunk ?? 2;
  const prompt = `Bạn là bộ materializer nội dung học tập. Chỉ được sử dụng thông tin có trong SOURCE bên dưới.
Không bổ sung kiến thức bên ngoài, không suy đoán dữ kiện còn thiếu.
Hãy tạo đúng một JSON object, không có lời giải thích ngoài JSON:
{
  "title": "tiêu đề ngắn",
  "summary": "nội dung học tập tóm lược nhưng giữ đúng thuật ngữ và ý nghĩa nguồn",
  "questions": [
    {
      "question": "câu hỏi chỉ dựa trên SOURCE",
      "selection_mode": "single hoặc multiple",
      "answers": [
        {"text":"phương án","correct":true,"feedback":"phản hồi dựa trên SOURCE"}
      ]
    }
  ]
}
Yêu cầu:
- Ngôn ngữ tiếng Việt.
- Tối đa ${questionsPerChunk} câu hỏi.
- Mỗi câu có 2-5 phương án và ít nhất một đáp án đúng.
- Nếu SOURCE không đủ để tạo câu hỏi có đáp án chắc chắn, để questions=[].
- Không tạo quy trình, thông số hoặc dữ kiện không xuất hiện trong SOURCE.
- summary không được biến suy luận thành sự thật từ nguồn.

SOURCE_ID: ${section.id}
HEADING: ${section.heading}
SOURCE:
${section.text}`;

  const body: Record<string, unknown> = {
    model: options.model || 'gpt-5.2',
    messages: [
      {
        role: 'system',
        content:
          'Bạn tạo nội dung giáo dục bám sát nguồn. Không được dùng kiến thức ngoài phần SOURCE được cung cấp.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
  };

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(options.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${options.apiToken}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`AI API lỗi ${response.status}: ${detail.slice(0, 500)}`);
      }
      const data = await response.json();
      return extractJsonObject(data.choices?.[0]?.message?.content || '');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError || new Error('Không thể xử lý phần tài liệu.');
}

function normalizeQuestion(
  raw: NonNullable<GeneratedChunk['questions']>[number],
  section: DocxSection,
  index: number,
): MaterializedQuestion | null {
  const question = raw.question?.trim();
  const answers: MaterializedAnswer[] = (raw.answers || [])
    .filter((answer) => Boolean(answer.text?.trim()))
    .map((answer) => ({
      text: answer.text!.trim(),
      correct: Boolean(answer.correct),
      feedback: answer.feedback?.trim() || '',
      origin: 'source_derived',
    }));

  if (!question || answers.length < 2 || !answers.some((answer) => answer.correct)) return null;

  const selectionMode =
    raw.selection_mode === 'multiple' || answers.filter((answer) => answer.correct).length > 1
      ? 'multiple'
      : 'single';

  return {
    id: `${section.id}-Q${index + 1}`,
    selection_mode: selectionMode,
    question,
    answers,
    source_segments: [section.id],
  };
}

export async function generateMaterializedPlanFromDocx(
  file: File,
  options: LongDocxOptions,
): Promise<{ plan: MaterializedH5PPlan; sections: DocxSection[] }> {
  if (!options.apiToken.trim()) throw new Error('Chưa cấu hình API token.');

  const sections = await extractDocxSections(file, options.maxChunkChars ?? 12000);
  const chapters: MaterializedChapter[] = [];

  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    options.onProgress?.(index, sections.length, section.heading);
    const generated = await generateChunk(section, options);
    const questions = (generated.questions || [])
      .map((question, questionIndex) => normalizeQuestion(question, section, questionIndex))
      .filter((question): question is MaterializedQuestion => question !== null);

    const items: MaterializedChapter['items'] = [
      {
        id: `${section.id}-TEXT`,
        type: 'text',
        content: generated.summary?.trim() || section.text,
        materialization_mode: generated.summary?.trim() ? 'SOURCE_TRANSFORM' : 'SOURCE_EXTRACT',
      },
    ];

    if (questions.length > 0) {
      items.push({
        id: `${section.id}-MCQ`,
        type: 'multiple-choice',
        items: questions,
        materialization_mode: 'SOURCE_DERIVED_ASSESSMENT',
      });
    }

    chapters.push({
      id: `CH-${String(index + 1).padStart(3, '0')}`,
      title: generated.title?.trim() || section.heading,
      items,
    });
  }

  options.onProgress?.(sections.length, sections.length, 'Hoàn tất');

  return {
    sections,
    plan: {
      materializer_version: '1.1.0-long-docx',
      lesson_id: `DOCX-${Date.now()}`,
      language: 'vi',
      status: 'PASS_WITH_WARNINGS',
      chapters,
      warnings: [
        {
          code: 'AI_SOURCE_DERIVED_CONTENT_REQUIRES_REVIEW',
          message: 'Nội dung do AI chuyển đổi từ nguồn cần được người dùng xem lại trước khi xuất bản.',
        },
      ],
    },
  };
}
