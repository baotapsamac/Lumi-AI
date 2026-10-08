export type SourceBlockType = 'heading' | 'paragraph' | 'list' | 'table' | 'image' | 'caption';

export type SourceBlock = { id: string; type: SourceBlockType; ordinal: number; text: string; level?: number; rows?: string[][]; mediaPath?: string };
export type SourceSection = { id: string; heading: string; ordinal: number; blocks: SourceBlock[] };
export type SourceDocument = { version: '2.0'; fileName: string; sections: SourceSection[] };
export type QuestionReviewState = 'draft' | 'qa_pass' | 'needs_review' | 'approved' | 'rejected';

export function sourceText(section: SourceSection): string {
  return section.blocks.filter((block) => block.type !== 'heading').map((block) => block.text).filter(Boolean).join('\n\n');
}

export function sourceIds(section: SourceSection): string[] {
  return section.blocks.filter((block) => block.text.length > 0).map((block) => block.id);
}
