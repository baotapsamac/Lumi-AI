import type {
  Content,
  Freetext,
  TextContent,
  FillInTheBlanks,
  MultipleChoiceContent,
} from 'src/sections/editor/types';

import { zipSync, strToU8, unzipSync } from 'fflate';

// ----------------------------------------------------------------------
// UUID helper (available in all modern browsers)

function uuid(): string {
  return crypto.randomUUID();
}

// ----------------------------------------------------------------------
// H5P content.json shape helpers

function makeTextItem(item: TextContent) {
  return {
    content: {
      params: { text: `<p>${item.text}</p>` },
      library: 'H5P.AdvancedText 1.1',
      metadata: {
        contentType: 'Text',
        license: 'U',
        title: item.text.slice(0, 40) || 'Text',
        authors: [],
        changes: [],
      },
      subContentId: uuid(),
    },
    useSeparator: 'auto',
  };
}

function makeMultiChoiceItem(item: MultipleChoiceContent) {
  return {
    content: {
      params: {
        question: `<p>${item.question}</p>`,
        answers: item.answers.map((a) => ({
          correct: a.correct,
          tipsAndFeedback: { tip: '', chosenFeedback: '', notChosenFeedback: '' },
          text: `<div>${a.text}</div>`,
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
          a11yCheck:
            'Kiểm tra câu trả lời. Các lựa chọn sẽ được đánh dấu đúng, sai hoặc còn thiếu.',
          a11yShowSolution:
            'Hiển thị đáp án đúng của câu hỏi.',
          a11yRetry:
            'Làm lại câu hỏi. Các lựa chọn trước đó sẽ được đặt lại.',
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
      metadata: {
        contentType: 'Multiple Choice',
        license: 'U',
        title: item.question.slice(0, 40) || 'Multiple Choice',
        authors: [],
        changes: [],
        extraTitle: item.question.slice(0, 40) || 'Multiple Choice',
      },
      subContentId: uuid(),
    },
    useSeparator: 'auto',
  };
}

function makeFillInTheBlanksItem(item: FillInTheBlanks) {
  return {
    content: {
      params: { text: `<p>${item.text}</p>` },
      library: 'H5P.AdvancedText 1.1',
      metadata: {
        contentType: 'Text',
        license: 'U',
        title: item.text.slice(0, 40) || 'Text',
        authors: [],
        changes: [],
      },
      subContentId: uuid(),
    },
    useSeparator: 'auto',
  };
}

function makeFreetextItem(item: Freetext) {
  return {
    content: {
      params: { text: `<p>${item.task}</p>` },
      library: 'H5P.AdvancedText 1.1',
      metadata: {
        contentType: 'Text',
        license: 'U',
        title: item.task.slice(0, 40) || 'Text',
        authors: [],
        changes: [],
      },
      subContentId: uuid(),
    },
    useSeparator: 'auto',
  };
}

function contentItemToH5P(item: Content) {
  switch (item.type) {
    case 'text':
      return makeTextItem(item);
    case 'multiple-choice':
      return makeMultiChoiceItem(item);
    case 'fill-in-the-blanks':
      return makeFillInTheBlanksItem(item);
    case 'freetext':
      return makeFreetextItem(item);
    default:
      throw new Error(`Unknown content type: ${(item as Content).type}`);
  }
}

function buildContentJson(title: string, content: Content[]) {
  const chapterTitle = title.trim() || 'Trang 1';
  return {
    showCoverPage: false,
    bookCover: { coverDescription: '<p style="text-align:center"></p>' },
    chapters: [
      {
        params: {
          content: content.map(contentItemToH5P),
        },
        library: 'H5P.Column 1.18',
        subContentId: uuid(),
        metadata: {
          contentType: 'Column',
          license: 'U',
          title: chapterTitle,
          authors: [],
          changes: [],
          extraTitle: chapterTitle,
        },
      },
    ],
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
    noChapterInteractionText:
      'Bạn cần thực hiện ít nhất một nội dung để xem tổng kết.',
    yourAnswersAreSubmittedForReview:
      'Câu trả lời đã được gửi để xem xét!',
    bookProgress: 'Tiến độ bài học',
    interactionsProgress: 'Tiến độ tương tác',
    totalScoreLabel: 'Tổng điểm',
    a11y: {
      progress: 'Trang @page trên @total.',
      menu: 'Bật hoặc tắt mục lục',
    },
  };
}

function buildH5PJson(title: string) {
  return {
    defaultLanguage: 'vi',
    embedTypes: ['iframe'],
    language: 'vi',
    license: 'U',
    mainLibrary: 'H5P.InteractiveBook',
    preloadedDependencies: [
      { machineName: 'H5P.AdvancedText', majorVersion: 1, minorVersion: 1 },
      { machineName: 'H5P.MultiChoice', majorVersion: 1, minorVersion: 16 },
      { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
      { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
      { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
      { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
      { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
      { machineName: 'H5P.Column', majorVersion: 1, minorVersion: 18 },
      { machineName: 'H5P.InteractiveBook', majorVersion: 1, minorVersion: 11 },
    ],
    title: title.trim() || 'Bài học tương tác',
    extraTitle: title.trim() || 'Bài học tương tác',
  };
}

// ----------------------------------------------------------------------

export async function generateH5PPackage(title: string, content: Content[]): Promise<Blob> {
  // Fetch the pre-built library zip (all H5P library folders, no content)
  const response = await fetch('/h5p/interactive-book-libraries.zip');
  if (!response.ok) {
    throw new Error(`Không tải được gói thư viện H5P (${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const files = unzipSync(new Uint8Array(arrayBuffer));

  // Add generated content
  files['content/content.json'] = strToU8(JSON.stringify(buildContentJson(title, content)));
  files['h5p.json'] = strToU8(JSON.stringify(buildH5PJson(title)));

  const zipped = zipSync(files, { level: 6 });
  return new Blob([zipped], { type: 'application/zip' });
}

export function downloadH5PPackage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.h5p`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
