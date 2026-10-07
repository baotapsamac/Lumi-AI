import fs from 'node:fs';

const pipeline = fs.readFileSync('src/utils/h5p-pipeline.ts', 'utf8');
const legacy = fs.readFileSync('src/utils/h5p-generator.ts', 'utf8');
const docx = fs.readFileSync('src/utils/long-docx-pipeline.ts', 'utf8');
const editor = fs.readFileSync('src/sections/editor/index.tsx', 'utf8');
const sourceModel = fs.readFileSync('src/utils/source-model.ts', 'utf8');
const review = fs.readFileSync('src/sections/editor/components/docx-question-review-dialog.tsx', 'utf8');
const projectStore = fs.readFileSync('src/utils/project-store.ts', 'utf8');

const checks = [
  ['legacy API preserved', /export async function generateH5PPackage\([\s\S]*title: string,[\s\S]*content: Content\[\][\s\S]*\): Promise<Blob>/.test(legacy)],
  ['multi chapter compiler', /plan\.chapters\.map/.test(pipeline)],
  ['Vietnamese package language', /language = 'vi'/.test(pipeline)],
  ['answer feedback mapped', /chosenFeedback: answer\.feedback/.test(pipeline)],
  ['dependency identity validator', /Embedded library identities match declared versions/.test(pipeline)],
  ['dependency asset validator', /Declared direct JS\/CSS assets are embedded/.test(pipeline)],
  ['long DOCX parser', /extractDocxSections/.test(docx)],
  ['chunked DOCX materializer', /generateMaterializedPlanFromDocx/.test(docx)],
  ['DOCX pipeline wired to editor', /handleDocxImport/.test(editor) && /runMaterializedH5PPipeline/.test(editor)],
  ['immutable source model', /SourceBlock/.test(sourceModel) && /SourceDocument/.test(sourceModel)],
  ['source-first content rendering', /content: section\.text/.test(docx) && !/content: generated\.summary/.test(docx)],
  ['question provenance', /question_source_ids/.test(docx) && /source_ids/.test(pipeline)],
  ['review gate before export', /review_state = 'approved'/.test(review) && /PL-10/.test(pipeline)],
  ['per-question review UI', /Bỏ câu hỏi/.test(review) && /Duyệt và xuất H5P/.test(review)],
  ['project persistence', /saveDocxProject/.test(projectStore) && /loadDocxProject/.test(projectStore) && /downloadProjectFile/.test(projectStore)],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed += 1;
}
if (failed) {
  console.error(`H5P regression gate failed: ${failed}/${checks.length}`);
  process.exit(1);
}
console.log(`H5P regression gate: ${checks.length}/${checks.length} PASS`);
