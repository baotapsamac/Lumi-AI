import { strToU8, unzipSync, zipSync } from 'fflate';

export type MaterializedAnswer = {
  text: string;
  correct: boolean;
  feedback?: string;
  origin?: string;
};

export type MaterializedQuestion = {
  id: string;
  selection_mode?: 'single' | 'multiple';
  question: string;
  answers: MaterializedAnswer[];
  source_segments?: string[];
};

export type MaterializedItem =
  | {
      id: string;
      type: 'text';
      content: string;
      materialization_mode?: string;
    }
  | {
      id: string;
      type: 'multiple-choice';
      items: MaterializedQuestion[];
      materialization_mode?: string;
      media_policy?: string;
    }
  | {
      id: string;
      type: 'external-assessment';
      content?: string;
      assessment_mode?: string;
      scored?: false;
    };

export type MaterializedChapter = {
  id: string;
  title: string;
  items: MaterializedItem[];
};

export type MaterializedH5PPlan = {
  materializer_version?: string;
  lesson_id: string;
  language?: string;
  status?: string;
  chapters: MaterializedChapter[];
  warnings?: unknown[];
};

export type PipelineCheck = {
  id: string;
  name: string;
  result: 'PASS' | 'WARN' | 'FAIL' | 'BLOCK';
  evidence?: unknown;
};

export type H5PPipelineReport = {
  pipeline_version: '1.0.0';
  lesson_id: string;
  status: 'PASS' | 'PASS_WITH_WARNINGS' | 'NOT_READY';
  summary: { pass: number; warn: number; fail: number; block: number };
  inventory: {
    chapters: number;
    multi_choice: number;
    advanced_text: number;
    declared_dependencies: number;
  };
  checks: PipelineCheck[];
  gates: {
    compile_allowed: boolean;
    package_layer_ready: boolean;
    runtime_acceptance_required: true;
    publication_ready: false;
  };
};

export type H5PPipelineResult = {
  blob: Blob | null;
  report: H5PPipelineReport;
};

const DEPENDENCIES = [
  { machineName: 'H5P.AdvancedText', majorVersion: 1, minorVersion: 1 },
  { machineName: 'H5P.MultiChoice', majorVersion: 1, minorVersion: 16 },
  { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
  { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
  { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
  { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
  { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
  { machineName: 'H5P.Column', majorVersion: 1, minorVersion: 18 },
  { machineName: 'H5P.InteractiveBook', majorVersion: 1, minorVersion: 11 },
] as const;

function uuid(): string {
  return crypto.randomUUID();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function paragraphs(value: string): string {
  return value
    .split(/\n\s*\n/)
    .map((p) => `<p>${escapeHtml(p).replaceAll('\n', '<br>')}</p>`)
    .join('');
}

function metadata(contentType: string, title: string) {
  return {
    contentType,
    license: 'U',
    title: title.slice(0, 80) || contentType,
    authors: [],
    changes: [],
    extraTitle: title.slice(0, 80) || contentType,
  };
}

function makeAdvancedText(text: string, title: string) {
  return {
    content: {
      params: { text: paragraphs(text) },
      library: 'H5P.AdvancedText 1.1',
      metadata: metadata('Text', title),
      subContentId: uuid(),
    },
    useSeparator: 'auto',
  };
}

function makeMultiChoice(question: MaterializedQuestion) {
  return {
    content: {
      params: {
        question: `<p>${escapeHtml(question.question)}</p>`,
        answers: question.answers.map((answer) => ({
          correct: answer.correct,
          tipsAndFeedback: {
            tip: '',
            chosenFeedback: answer.feedback ? escapeHtml(answer.feedback) : '',
            notChosenFeedback: '',
          },
          text: `<div>${escapeHtml(answer.text)}</div>`,
        })),
        overallFeedback: [{ from: 0, to: 100 }],
        behaviour: {
          enableRetry: true,
          enableSolutionsButton: true,
          enableCheckButton: true,
          type: 'auto',
          singlePoint: false,
          randomAnswers: false,
          showSolutionsRequiresInput: true,
          confirmCheckDialog: false,
          confirmRetryDialog: false,
          autoCheck: false,
          passPercentage: 100,
          showScorePoints: true,
        },
        UI: {
          checkAnswerButton: 'Kiểm tra',
          submitAnswerButton: 'Gửi câu trả lời',
          showSolutionButton: 'Hiển thị đáp án',
          tryAgainButton: 'Làm lại',
          tipsLabel: 'Hiển thị gợi ý',
          scoreBarLabel: 'Bạn đạt :num trên :total điểm.',
          tipAvailable: 'Có gợi ý',
          feedbackAvailable: 'Có phản hồi',
          readFeedback: 'Đọc phản hồi',
          wrongAnswer: 'Câu trả lời sai',
          correctAnswer: 'Câu trả lời đúng',
          shouldCheck: 'Đáp án này cần được chọn',
          shouldNotCheck: 'Đáp án này không nên được chọn',
          noInput: 'Hãy trả lời trước khi xem đáp án',
          a11yCheck: 'Kiểm tra câu trả lời. Các lựa chọn sẽ được đánh dấu đúng, sai hoặc còn thiếu.',
          a11yShowSolution: 'Hiển thị đáp án đúng của câu hỏi.',
          a11yRetry: 'Làm lại câu hỏi. Các lựa chọn trước đó sẽ được đặt lại.',
        },
        confirmCheck: {
          header: 'Hoàn tất?',
          body: 'Bạn có chắc muốn kiểm tra câu trả lời?',
          cancelLabel: 'Hủy',
          confirmLabel: 'Kiểm tra',
        },
        confirmRetry: {
          header: 'Làm lại?',
          body: 'Bạn có chắc muốn làm lại câu hỏi?',
          cancelLabel: 'Hủy',
          confirmLabel: 'Làm lại',
        },
      },
      library: 'H5P.MultiChoice 1.16',
      metadata: metadata('Multiple Choice', question.question),
      subContentId: uuid(),
    },
    useSeparator: 'auto',
  };
}

function itemToColumnEntries(item: MaterializedItem) {
  if (item.type === 'text') return [makeAdvancedText(item.content, item.id)];
  if (item.type === 'multiple-choice') return item.items.map(makeMultiChoice);
  return [makeAdvancedText(item.content || 'Nội dung này được đánh giá bởi giảng viên ngoài phần chấm điểm tự động.', item.id)];
}

export function buildMaterializedContentJson(plan: MaterializedH5PPlan) {
  return {
    showCoverPage: false,
    bookCover: { coverDescription: '<p style="text-align:center"></p>' },
    chapters: plan.chapters.map((chapter) => ({
      params: { content: chapter.items.flatMap(itemToColumnEntries) },
      library: 'H5P.Column 1.18',
      subContentId: uuid(),
      metadata: metadata('Column', chapter.title),
    })),
    behaviour: {
      baseColor: '#1768c4',
      defaultTableOfContents: true,
      progressIndicators: true,
      progressAuto: true,
      displaySummary: true,
      enableRetry: true,
    },
    read: 'Mở',
    displayTOC: 'Hiển thị mục lục',
    hideTOC: 'Ẩn mục lục',
    nextPage: 'Trang tiếp theo',
    previousPage: 'Trang trước',
    chapterCompleted: 'Đã hoàn thành trang!',
    partCompleted: '@pages trên @total trang đã hoàn thành',
    incompleteChapter: 'Trang chưa hoàn thành',
    navigateToTop: 'Lên đầu trang',
    markAsFinished: 'Tôi đã hoàn thành trang này',
    fullscreen: 'Toàn màn hình',
    exitFullscreen: 'Thoát toàn màn hình',
    bookProgressSubtext: '@count trên @total trang',
    interactionsProgressSubtext: '@count trên @total tương tác',
    submitReport: 'Gửi báo cáo',
    restartLabel: 'Làm lại',
    summaryHeader: 'Tổng kết',
    allInteractions: 'Tất cả tương tác',
    unansweredInteractions: 'Tương tác chưa trả lời',
    scoreText: '@score / @maxscore',
    leftOutOfTotalCompleted: '@left trên @max tương tác đã hoàn thành',
    noInteractions: 'Không có tương tác',
    score: 'Điểm',
    summaryAndSubmit: 'Tổng kết và gửi',
    noChapterInteractionBoldText: 'Bạn chưa thực hiện nội dung nào.',
    noChapterInteractionText: 'Bạn cần thực hiện ít nhất một nội dung để xem tổng kết.',
    yourAnswersAreSubmittedForReview: 'Câu trả lời đã được gửi để xem xét!',
    bookProgress: 'Tiến độ bài học',
    interactionsProgress: 'Tiến độ tương tác',
    totalScoreLabel: 'Tổng điểm',
    a11y: {
      progress: 'Trang @page trên @total.',
      menu: 'Bật hoặc tắt mục lục',
    },
  };
}

export function buildMaterializedH5PJson(title: string, language = 'vi') {
  return {
    defaultLanguage: language,
    embedTypes: ['iframe'],
    language,
    license: 'U',
    mainLibrary: 'H5P.InteractiveBook',
    preloadedDependencies: DEPENDENCIES,
    title: title.trim() || 'Bài học tương tác',
    extraTitle: title.trim() || 'Bài học tương tác',
  };
}

function validatePlan(plan: MaterializedH5PPlan): PipelineCheck[] {
  const checks: PipelineCheck[] = [];
  const add = (id: string, name: string, ok: boolean, evidence?: unknown, severity: 'FAIL' | 'BLOCK' = 'BLOCK') =>
    checks.push({ id, name, result: ok ? 'PASS' : severity, evidence });

  add('PL-01', 'Lesson id exists', Boolean(plan.lesson_id), plan.lesson_id);
  add('PL-02', 'At least one chapter exists', Array.isArray(plan.chapters) && plan.chapters.length > 0, plan.chapters?.length);
  add('PL-03', 'All chapters have titles', plan.chapters.every((c) => Boolean(c.title?.trim())));
  add('PL-04', 'All chapters contain items', plan.chapters.every((c) => c.items.length > 0));

  const questions = plan.chapters.flatMap((c) =>
    c.items.flatMap((i) => (i.type === 'multiple-choice' ? i.items : [])),
  );
  add('PL-05', 'All questions have answers', questions.every((q) => q.answers.length >= 2));
  add('PL-06', 'Every question has a correct answer', questions.every((q) => q.answers.some((a) => a.correct)));
  add('PL-07', 'Single-response questions have exactly one correct answer',
    questions.filter((q) => q.selection_mode === 'single').every((q) => q.answers.filter((a) => a.correct).length === 1));
  return checks;
}

export function validatePackageFiles(
  files: Record<string, Uint8Array>,
  plan: MaterializedH5PPlan,
): PipelineCheck[] {
  const checks: PipelineCheck[] = [];
  const add = (id: string, name: string, ok: boolean, evidence?: unknown, severity: 'FAIL' | 'BLOCK' = 'BLOCK') =>
    checks.push({ id, name, result: ok ? 'PASS' : severity, evidence });

  add('PK-01', 'h5p.json generated', Boolean(files['h5p.json']));
  add('PK-02', 'content/content.json generated', Boolean(files['content/content.json']));

  const missing = DEPENDENCIES
    .map((d) => `${d.machineName}-${d.majorVersion}.${d.minorVersion}`)
    .filter((dir) => !Object.keys(files).some((path) => path.startsWith(`${dir}/`)));
  add('PK-03', 'All declared H5P dependencies embedded', missing.length === 0, missing);

  const decoder = new TextDecoder();
  const identityProblems: unknown[] = [];
  const assetProblems: unknown[] = [];
  for (const dependency of DEPENDENCIES) {
    const dir = `${dependency.machineName}-${dependency.majorVersion}.${dependency.minorVersion}`;
    const libraryPath = `${dir}/library.json`;
    if (!files[libraryPath]) {
      identityProblems.push({ dependency: dir, problem: 'library.json missing' });
      continue;
    }
    try {
      const library = JSON.parse(decoder.decode(files[libraryPath])) as {
        machineName?: string;
        majorVersion?: number;
        minorVersion?: number;
        preloadedJs?: Array<{ path?: string }>;
        preloadedCss?: Array<{ path?: string }>;
      };
      if (
        library.machineName !== dependency.machineName ||
        library.majorVersion !== dependency.majorVersion ||
        library.minorVersion !== dependency.minorVersion
      ) {
        identityProblems.push({
          dependency: dir,
          actual: [library.machineName, library.majorVersion, library.minorVersion],
        });
      }
      for (const asset of [...(library.preloadedJs || []), ...(library.preloadedCss || [])]) {
        if (asset.path && !files[`${dir}/${asset.path}`]) {
          assetProblems.push({ dependency: dir, asset: asset.path });
        }
      }
    } catch (error) {
      identityProblems.push({ dependency: dir, problem: String(error) });
    }
  }
  add('PK-04', 'Embedded library identities match declared versions', identityProblems.length === 0, identityProblems);
  add('PK-05', 'Declared direct JS/CSS assets are embedded', assetProblems.length === 0, assetProblems);

  const questionCount = plan.chapters.reduce(
    (sum, chapter) =>
      sum + chapter.items.reduce((n, item) => n + (item.type === 'multiple-choice' ? item.items.length : 0), 0),
    0,
  );
  const hasAssessment = plan.chapters.some((chapter) =>
    chapter.items.some((item) => item.type === 'multiple-choice'),
  );
  add(
    'PK-06',
    'Question inventory matches assessment presence',
    !hasAssessment || questionCount > 0,
    questionCount,
    'FAIL',
  );

  const germanTokens = ['Überprüfen', 'Lösung anzeigen', 'Wiederholen', 'Nächste Seite', 'Vorherige Seite'];
  const serialized = new TextDecoder().decode(files['content/content.json']);
  const germanHits = germanTokens.filter((token) => serialized.includes(token));
  checks.push({
    id: 'PK-07',
    name: 'No known German UI remnants',
    result: germanHits.length === 0 ? 'PASS' : 'FAIL',
    evidence: germanHits,
  });

  let parsedH5P: { language?: string; defaultLanguage?: string } | null = null;
  let parsedContent: { chapters?: unknown[] } | null = null;
  try {
    parsedH5P = JSON.parse(decoder.decode(files['h5p.json']));
    parsedContent = JSON.parse(decoder.decode(files['content/content.json']));
  } catch {
    // PK-01/PK-02 and the checks below will fail cleanly.
  }
  add(
    'PK-08',
    'Package language is Vietnamese',
    parsedH5P?.language === 'vi' && parsedH5P?.defaultLanguage === 'vi',
    parsedH5P,
    'FAIL',
  );
  add(
    'PK-09',
    'Generated chapter count matches materialized plan',
    parsedContent?.chapters?.length === plan.chapters.length,
    { expected: plan.chapters.length, actual: parsedContent?.chapters?.length },
    'FAIL',
  );

  return checks;
}

function summarize(checks: PipelineCheck[]) {
  return {
    pass: checks.filter((c) => c.result === 'PASS').length,
    warn: checks.filter((c) => c.result === 'WARN').length,
    fail: checks.filter((c) => c.result === 'FAIL').length,
    block: checks.filter((c) => c.result === 'BLOCK').length,
  };
}

export async function runMaterializedH5PPipeline(
  title: string,
  plan: MaterializedH5PPlan,
  libraryBundleUrl = '/h5p/interactive-book-libraries.zip',
): Promise<H5PPipelineResult> {
  const planChecks = validatePlan(plan);
  if (planChecks.some((c) => c.result === 'BLOCK')) {
    const summary = summarize(planChecks);
    return {
      blob: null,
      report: {
        pipeline_version: '1.0.0',
        lesson_id: plan.lesson_id,
        status: 'NOT_READY',
        summary,
        inventory: {
          chapters: plan.chapters?.length || 0,
          multi_choice: 0,
          advanced_text: 0,
          declared_dependencies: DEPENDENCIES.length,
        },
        checks: planChecks,
        gates: {
          compile_allowed: false,
          package_layer_ready: false,
          runtime_acceptance_required: true,
          publication_ready: false,
        },
      },
    };
  }

  const response = await fetch(libraryBundleUrl);
  if (!response.ok) throw new Error(`Không tải được gói thư viện H5P (${response.status})`);

  const files = unzipSync(new Uint8Array(await response.arrayBuffer()));
  const contentJson = buildMaterializedContentJson(plan);
  files['content/content.json'] = strToU8(JSON.stringify(contentJson));
  files['h5p.json'] = strToU8(JSON.stringify(buildMaterializedH5PJson(title, plan.language || 'vi')));

  const packageChecks = validatePackageFiles(files, plan);
  const checks = [...planChecks, ...packageChecks];
  const summary = summarize(checks);
  const blocked = summary.block > 0 || summary.fail > 0;

  const multiChoice = plan.chapters.reduce(
    (sum, chapter) =>
      sum + chapter.items.reduce((n, item) => n + (item.type === 'multiple-choice' ? item.items.length : 0), 0),
    0,
  );
  const advancedText = plan.chapters.reduce(
    (sum, chapter) =>
      sum + chapter.items.filter((item) => item.type === 'text' || item.type === 'external-assessment').length,
    0,
  );

  const report: H5PPipelineReport = {
    pipeline_version: '1.0.0',
    lesson_id: plan.lesson_id,
    status: blocked ? 'NOT_READY' : summary.warn ? 'PASS_WITH_WARNINGS' : 'PASS',
    summary,
    inventory: {
      chapters: plan.chapters.length,
      multi_choice: multiChoice,
      advanced_text: advancedText,
      declared_dependencies: DEPENDENCIES.length,
    },
    checks,
    gates: {
      compile_allowed: !blocked,
      package_layer_ready: !blocked,
      runtime_acceptance_required: true,
      publication_ready: false,
    },
  };

  if (blocked) return { blob: null, report };

  const zipped = zipSync(files, { level: 6 });
  return {
    blob: new Blob([zipped], { type: 'application/zip' }),
    report,
  };
}
