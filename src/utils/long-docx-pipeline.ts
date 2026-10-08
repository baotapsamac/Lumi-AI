import { unzipSync } from 'fflate';
import { requestAiText } from './ai-chat-client';

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

  const bodyNode = document.getElementsByTagName('w:body')[0];
  if (!bodyNode) throw new Error('DOCX không có phần thân văn bản.');
  const unsupportedMedia = Array.from(document.getElementsByTagName('a:blip')).length + Array.from(document.getElementsByTagName('v:imagedata')).length;
  if (unsupportedMedia > 0) {
    throw new Error(`DOCX có ${unsupportedMedia} hình ảnh. Phiên bản này chưa nhúng hình vào H5P; đã dừng để tránh xuất tài liệu thiếu nội dung.`);
  }
  const unsupportedDrawings = Array.from(document.getElementsByTagName('w:drawing')).length;
  if (unsupportedDrawings > 0 && unsupportedMedia === 0) {
    throw new Error('DOCX có đối tượng đồ họa chưa được hỗ trợ; dừng để tránh mất nội dung.');
  }
  const paragraphs = Array.from(bodyNode.children).flatMap((node) => {
    if (node.localName === 'p') {
      const text = xmlText(node).trim();
      return text ? [{ text, style: paragraphStyle(node), rows: undefined as string[][] | undefined }] : [];
    }
    if (node.localName === 'tbl') {
      const rows = Array.from(node.getElementsByTagName('w:tr')).map((row) =>
        Array.from(row.getElementsByTagName('w:tc')).map((cell) =>
          Array.from(cell.getElementsByTagName('w:p')).map(xmlText).join(' / ').trim()
        )
      );
      const text = rows.map((row) => row.join(' | ')).join('\\n');
      return text ? [{ text, style: 'SourceTable', rows }] : [];
    }
    return [];
  });

  if (paragraphs.length === 0) throw new Error('Không tìm thấy văn bản trong DOCX.');

  const sections: DocxSection[] = [];
  let heading = file.name.replace(/\.docx$/i, '');
  let buffer: Array<{ text: string; rows?: string[][] }> = [];
  let paragraphCount = 0;
  let blockOrdinal = 0;
  let headingLevel = 1;

  const flush = () => {
    const text = buffer.map((entry) => entry.text).join('\n\n').trim();
    if (!text) return;
    sections.push({
      id: `SEGMENT-${String(sections.length + 1).padStart(4, '0')}`,
      heading,
      text,
      paragraphCount,
      headingLevel,
      blocks: buffer.map((value, index) => ({
        id: `SOURCE-${String(blockOrdinal - buffer.length + index + 1).padStart(5, '0')}`,
        type: value.rows ? 'table' as const : 'paragraph' as const,
        ordinal: blockOrdinal - buffer.length + index + 1,
        text: value.text,
        rows: value.rows,
      })),
    });
    buffer = [];
    paragraphCount = 0;
  };

  for (const paragraph of paragraphs) {
    const headingLike =
      isHeadingStyle(paragraph.style) ||
      (/^(?:(?:\d+(?:\.\d+)*\.?|[IVXLCDM]+\.|[A-Z]\.)\s+\S|(?:Chương|Bài|Phần|Mục)\s+[\dIVXLCDM]+\b)/i.test(paragraph.text) && paragraph.text.length <= 160) ||
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
      headingLevel = Number(paragraph.style.match(/[1-6]$/)?.[0] || 1);
      continue;
    }

    const candidateLength = buffer.reduce((sum, value) => sum + value.text.length + 2, 0) + paragraph.text.length;
    if (candidateLength > maxChunkChars && buffer.length > 0) flush();

    buffer.push({ text: paragraph.text, rows: paragraph.rows });
    paragraphCount += 1;
    blockOrdinal += 1;
  }
  flush();

  return sections;
}

function escapeSourceHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function sourceSectionHtml(section: DocxSection): string {
  return section.blocks.map((block) => {
    if (block.type === 'table' && block.rows) {
      return `<table><tbody>${block.rows.map((row) =>
        `<tr>${row.map((cell) => `<td>${escapeSourceHtml(cell)}</td>`).join('')}</tr>`
      ).join('')}</tbody></table>`;
    }
    return `<p>${escapeSourceHtml(block.text).replace(/\\n/g, '<br>')}</p>`;
  }).join('');
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

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await requestAiText(
        [
          { role: 'system', content: 'Bạn tạo nội dung giáo dục bám sát nguồn. Không được dùng kiến thức ngoài phần SOURCE được cung cấp.' },
          { role: 'user', content: prompt },
        ],
        options.apiEndpoint,
        options.apiToken,
        options.model || 'gpt-4.1-mini',
        0.2
      );
      return extractJsonObject(response);
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
  // Distractors can be pedagogically valid paraphrases; source IDs remain mandatory.\n  // Do not silently reject a complete question solely because an option is not verbatim.\n  if (!answers.filter((answer) => answer.correct).every(answerIsSourceExtract)) return null;

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
  const chapters: MaterializedChapter[] = [];\n  const missingAssessments: string[] = [];

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
        content_html: sourceSectionHtml(section),
        materialization_mode: 'SOURCE_EXTRACT',
      },
    ];

    if (questions.length === 0) missingAssessments.push(section.heading);\n    if (questions.length > 0) {
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
