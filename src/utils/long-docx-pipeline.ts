import { unzipSync } from 'fflate';

import type { SourceBlock } from './source-model';
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
  blocks: SourceBlock[];
  headingLevel?: number;
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
  source_text?: string;
  questions?: Array<{
    question?: string;
    selection_mode?: 'single' | 'multiple';
    answers?: Array<{ text?: string; correct?: boolean; feedback?: string; source_ids?: string[] }>;
    question_source_ids?: string[];
    feedback_source_ids?: string[];
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
  let blockOrdinal = 0;
  let headingLevel = 1;

  const flush = () => {
    const text = buffer.join('\n\n').trim();
    if (!text) return;
    sections.push({
      id: `SEGMENT-${String(sections.length + 1).padStart(4, '0')}`,
      heading,
      text,
      paragraphCount,
      headingLevel,
      blocks: buffer.map((value, index) => ({
        id: `SOURCE-${String(blockOrdinal - buffer.length + index + 1).padStart(5, '0')}`,
        type: 'paragraph' as const,
        ordinal: blockOrdinal - buffer.length + index + 1,
        text: value,
      })),
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
      headingLevel = Number(paragraph.style.match(/[1-6]$/)?.[0] || 1);
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
    blockOrdinal += 1;
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
  "questions": [
    {
      "question": "câu hỏi chỉ dựa trên SOURCE",
      "selection_mode": "single hoặc multiple",
      "answers": [
        {"text":"phương án","correct":true,"feedback":"phản hồi dựa trên SOURCE","source_ids":["SOURCE-00001"]}
      ],
      "question_source_ids":["SOURCE-00001"],
      "feedback_source_ids":["SOURCE-00001"]
    }
  ]
}
Yêu cầu:
- Ngôn ngữ tiếng Việt.
- Tối đa ${questionsPerChunk} câu hỏi; chất lượng quan trọng hơn số lượng.
- Mỗi câu có 2-5 phương án và ít nhất một đáp án đúng.\n- Tất cả phương án phải lấy từ SOURCE; distractor là thông tin thật trong SOURCE nhưng sai trong ngữ cảnh câu hỏi, ưu tiên cùng loại ngữ nghĩa.\n- Nếu không đủ distractor chất lượng, thử cấu trúc Multiple Choice khác; vẫn không đủ thì bỏ câu hỏi.
- Nếu SOURCE không đủ để tạo câu hỏi có đáp án chắc chắn, để questions=[].
- Không tạo quy trình, thông số hoặc dữ kiện không xuất hiện trong SOURCE.
- Nếu SOURCE mô tả thao tác với vũ khí, không chuyển phần thao tác đó thành hướng dẫn thực hành, checklist thao tác, tối ưu hóa quy trình hoặc câu hỏi yêu cầu người học thực hiện thao tác. Chỉ được tạo nội dung nhận biết/khái niệm/yêu cầu kỹ thuật/an toàn ở mức không hướng dẫn thao tác.
- Nội dung đọc lấy trực tiếp từ SOURCE trong chương trình; AI không được sửa nguồn.

SOURCE_ID: ${section.id}
HEADING: ${section.heading}
SOURCE_BLOCKS:
${section.blocks.map((block) => `[${block.id}] ${block.text}`).join('\n\n')}`;

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
      source_ids: answer.source_ids || [],
    }));

  if (!question || answers.length < 2 || !answers.some((answer) => answer.correct)) return null;

  const knownIds = new Set(section.blocks.map((block) => block.id));
  const validIds = (ids: string[] | undefined) =>
    Boolean(ids?.length) && ids!.every((id) => knownIds.has(id));
  if (!validIds(raw.question_source_ids) || !answers.every((answer) => validIds(answer.source_ids))) {
    return null;
  }

  const blockById = new Map(section.blocks.map((block) => [block.id, block.text] as const));
  const answerIsSourceExtract = (answer: MaterializedAnswer) =>
    (answer.source_ids || []).some((id) => (blockById.get(id) || '').includes(answer.text));
  if (!answers.every(answerIsSourceExtract)) return null;

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
    question_source_ids: raw.question_source_ids || [],
    feedback_source_ids: raw.feedback_source_ids || [],
    review_state: 'draft',
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
        content: section.text,
        materialization_mode: 'SOURCE_EXTRACT',
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
      materializer_version: '2.0.0-source-first',
      lesson_id: `DOCX-${Date.now()}`,
      language: 'vi',
      status: 'PASS_WITH_WARNINGS',
      chapters,
      warnings: [
        {
          code: 'AI_SOURCE_DERIVED_CONTENT_REQUIRES_REVIEW',
          message: 'Câu hỏi do AI tạo từ nguồn cần được người dùng duyệt trước khi xuất bản; nội dung học giữ nguyên nguồn.',
        },
      ],
    },
  };
}
