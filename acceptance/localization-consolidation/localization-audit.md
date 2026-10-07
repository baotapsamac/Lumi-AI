# Vietnamese localization consolidation audit

Source of truth: src/utils/h5p/locales/. Defaults: vi. No library JS/CSS modifications.

| Component | Field | Semantics default | Original mapper | Vietnamese | Mapper |
| --- | --- | --- | --- | --- | --- |
| InteractiveBook | read | Read | Öffnen | Mở | interactive-book.ts |
| InteractiveBook | displayTOC | Display 'Table of contents' | Inhaltsverzeichnis anzeigen | Hiện mục lục | interactive-book.ts |
| InteractiveBook | hideTOC | Hide 'Table of contents' | Inhaltsverzeichnis ausblenden | Ẩn mục lục | interactive-book.ts |
| InteractiveBook | nextPage | Next page | Nächste Seite | Trang tiếp theo | interactive-book.ts |
| InteractiveBook | previousPage | Previous page | Vorherige Seite | Trang trước | interactive-book.ts |
| InteractiveBook | chapterCompleted | Page completed! | Seite abgeschlossen! | Đã hoàn thành trang! | interactive-book.ts |
| InteractiveBook | partCompleted | @pages of @total completed | @pages von @total Seiten abgeschlossen | Đã hoàn thành @pages trên @total trang | interactive-book.ts |
| InteractiveBook | incompleteChapter | Incomplete page | Unvollständige Seite | Trang chưa hoàn thành | interactive-book.ts |
| InteractiveBook | navigateToTop | Navigate to the top | Nach oben springen | Về đầu trang | interactive-book.ts |
| InteractiveBook | markAsFinished | I have finished this page | Ich habe diese Seite abgeschlossen | Tôi đã hoàn thành trang này | interactive-book.ts |
| InteractiveBook | fullscreen | Fullscreen | Vollbild | Toàn màn hình | interactive-book.ts |
| InteractiveBook | exitFullscreen | Exit fullscreen | Vollbild beenden | Thoát toàn màn hình | interactive-book.ts |
| InteractiveBook | bookProgressSubtext | @count of @total pages | @count von @total Seiten | @count trên @total trang | interactive-book.ts |
| InteractiveBook | interactionsProgressSubtext | @count of @total interactions | @count von @total Interaktionen | @count trên @total hoạt động | interactive-book.ts |
| InteractiveBook | submitReport | Submit Report | Report absenden | Gửi báo cáo | interactive-book.ts |
| InteractiveBook | restartLabel | Restart | Neustart | Làm lại | interactive-book.ts |
| InteractiveBook | summaryHeader | Summary | Zusammenfassung | Tổng kết bài tập | interactive-book.ts |
| InteractiveBook | allInteractions | All interactions | Alle Interaktionen | Tất cả hoạt động | interactive-book.ts |
| InteractiveBook | unansweredInteractions | Unanswered interactions | Unbeantwortete Interaktionen | Hoạt động chưa trả lời | interactive-book.ts |
| InteractiveBook | scoreText | @score / @maxscore | @score / @maxscore | @score / @maxscore | interactive-book.ts |
| InteractiveBook | leftOutOfTotalCompleted | @left of @max interactions completed | @left von @max Interaktionen abgeschlossen | Đã hoàn thành @left trên @max hoạt động | interactive-book.ts |
| InteractiveBook | noInteractions | No interactions | Keine Interaktionen | Chưa có hoạt động | interactive-book.ts |
| InteractiveBook | score | Score | Punkte | Điểm | interactive-book.ts |
| InteractiveBook | summaryAndSubmit | Summary &amp; submit | Zusammenfassung und Einsenden | Tổng kết và gửi | interactive-book.ts |
| InteractiveBook | noChapterInteractionBoldText | You have not interacted with any pages. | Du hast noch keine Seiten bearbeitet. | Bạn chưa hoàn thành trang nào. | interactive-book.ts |
| InteractiveBook | noChapterInteractionText | You have to interact with at least one page before you can see the summary. | Du musst wenigstens eine Seite bearbeiten, um die Zusammenfassung zu sehen. | Bạn cần thực hiện ít nhất một trang để xem tổng kết. | interactive-book.ts |
| InteractiveBook | yourAnswersAreSubmittedForReview | Your answers are submitted for review! | Deine Antworten wurden zur Begutachtung versendet! | Câu trả lời đã được gửi để đánh giá! | interactive-book.ts |
| InteractiveBook | bookProgress | Book progress | Buchfortschritt | Tiến độ bài học | interactive-book.ts |
| InteractiveBook | interactionsProgress | Interactions progress | Interaktionsfortschritt | Tiến độ hoạt động | interactive-book.ts |
| InteractiveBook | totalScoreLabel | Total score | Gesamtpunktzahl | Tổng điểm | interactive-book.ts |
| InteractiveBook | a11y.progress | Page @page of @total. | Seite @page von @total. | Trang @page trên @total. | interactive-book.ts |
| InteractiveBook | a11y.menu | Toggle navigation menu | Inhaltsverzeichnis ein- bzw. ausschalten | Bật hoặc tắt mục lục | interactive-book.ts |
| MultiChoice | UI.checkAnswerButton | Check | Überprüfen | Kiểm tra | multi-choice.ts |
| MultiChoice | UI.submitAnswerButton | Submit | Absenden | Gửi câu trả lời | multi-choice.ts |
| MultiChoice | UI.showSolutionButton | Show solution | Lösung anzeigen | Xem đáp án | multi-choice.ts |
| MultiChoice | UI.tryAgainButton | Retry | Wiederholen | Làm lại | multi-choice.ts |
| MultiChoice | UI.tipsLabel | Show tip | Hinweis anzeigen | Xem gợi ý | multi-choice.ts |
| MultiChoice | UI.scoreBarLabel | You got :num out of :total points | Du hast :num von :total Punkten erreicht. | Bạn đạt :num trên :total điểm. | multi-choice.ts |
| MultiChoice | UI.tipAvailable | Tip available | Hinweis verfügbar | Có gợi ý | multi-choice.ts |
| MultiChoice | UI.feedbackAvailable | Feedback available | Rückmeldung verfügbar | Có phản hồi | multi-choice.ts |
| MultiChoice | UI.readFeedback | Read feedback | Rückmeldung vorlesen | Đọc phản hồi | multi-choice.ts |
| MultiChoice | UI.wrongAnswer | Wrong answer | Falsche Antwort | Đáp án sai | multi-choice.ts |
| MultiChoice | UI.correctAnswer | Correct answer | Richtige Antwort | Đáp án đúng | multi-choice.ts |
| MultiChoice | UI.shouldCheck | Should have been checked | Hätte gewählt werden müssen | Cần chọn | multi-choice.ts |
| MultiChoice | UI.shouldNotCheck | Should not have been checked | Hätte nicht gewählt werden sollen | Không nên chọn | multi-choice.ts |
| MultiChoice | UI.noInput | Please answer before viewing the solution | Bitte antworte, bevor du die Lösung ansiehst | Hãy trả lời trước khi xem đáp án | multi-choice.ts |
| MultiChoice | UI.a11yCheck | Check the answers. The responses will be marked as correct, incorrect, or unanswered. | Die Antworten überprüfen. Die Auswahlen werden als richtig, falsch oder fehlend markiert. | Kiểm tra câu trả lời. Các câu trả lời được đánh dấu đúng, sai hoặc chưa trả lời. | multi-choice.ts |
| MultiChoice | UI.a11yShowSolution | Show the solution. The task will be marked with its correct solution. | Die Lösung anzeigen. Die richtigen Lösungen werden in der Aufgabe angezeigt. | Xem đáp án đúng của câu hỏi. | multi-choice.ts |
| MultiChoice | UI.a11yRetry | Retry the task. Reset all responses and start the task over again. | Die Aufgabe wiederholen. Alle Versuche werden zurückgesetzt und die Aufgabe wird erneut gestartet. | Làm lại câu hỏi và đặt lại tất cả câu trả lời. | multi-choice.ts |
| MultiChoice | confirmCheck.header | Finish ? | Beenden? | Kết thúc? | multi-choice.ts |
| MultiChoice | confirmCheck.body | Are you sure you wish to finish ? | Ganz sicher beenden? | Bạn có chắc muốn kết thúc? | multi-choice.ts |
| MultiChoice | confirmCheck.cancelLabel | Cancel | Abbrechen | Hủy | multi-choice.ts |
| MultiChoice | confirmCheck.confirmLabel | Finish | Beenden | Kết thúc | multi-choice.ts |
| MultiChoice | confirmRetry.header | Retry ? | Wiederholen? | Làm lại? | multi-choice.ts |
| MultiChoice | confirmRetry.body | Are you sure you wish to retry ? | Ganz sicher wiederholen? | Bạn có chắc muốn làm lại? | multi-choice.ts |
| MultiChoice | confirmRetry.cancelLabel | Cancel | Abbrechen | Hủy | multi-choice.ts |
| MultiChoice | confirmRetry.confirmLabel | Confirm | Bestätigen | Xác nhận | multi-choice.ts |
| TrueFalse | l10n.trueText | True | True | Đúng | true-false.ts |
| TrueFalse | l10n.falseText | False | False | Sai | true-false.ts |
| TrueFalse | l10n.score | You got @score of @total points | You got @score of @total points | Bạn đạt @score trên @total điểm | true-false.ts |
| TrueFalse | l10n.checkAnswer | Check | Check | Kiểm tra | true-false.ts |
| TrueFalse | l10n.submitAnswer | Submit | Submit | Gửi câu trả lời | true-false.ts |
| TrueFalse | l10n.showSolutionButton | Show solution | Show solution | Xem đáp án | true-false.ts |
| TrueFalse | l10n.tryAgain | Retry | Retry | Làm lại | true-false.ts |
| TrueFalse | l10n.wrongAnswerMessage | Wrong answer | Wrong answer | Đáp án sai | true-false.ts |
| TrueFalse | l10n.correctAnswerMessage | Correct answer | Correct answer | Đáp án đúng | true-false.ts |
| TrueFalse | l10n.scoreBarLabel | You got :num out of :total points | You got :num out of :total points | Bạn đạt :num trên :total điểm | true-false.ts |
| TrueFalse | l10n.a11yCheck | Check the answers. The responses will be marked as correct, incorrect, or unanswered. | Check the answers. The responses will be marked as correct, incorrect, or unanswered. | Kiểm tra câu trả lời. Các câu trả lời được đánh dấu đúng, sai hoặc chưa trả lời. | true-false.ts |
| TrueFalse | l10n.a11yShowSolution | Show the solution. The task will be marked with its correct solution. | Show the solution. The task will be marked with its correct solution. | Xem đáp án đúng của câu hỏi. | true-false.ts |
| TrueFalse | l10n.a11yRetry | Retry the task. Reset all responses and start the task over again. | Retry the task. Reset all responses and start the task over again. | Làm lại câu hỏi và đặt lại tất cả câu trả lời. | true-false.ts |
| TrueFalse | confirmCheck.header | Finish ? | Finish ? | Kết thúc? | true-false.ts |
| TrueFalse | confirmCheck.body | Are you sure you wish to finish ? | Are you sure you wish to finish ? | Bạn có chắc muốn kết thúc? | true-false.ts |
| TrueFalse | confirmCheck.cancelLabel | Cancel | Cancel | Hủy | true-false.ts |
| TrueFalse | confirmCheck.confirmLabel | Finish | Finish | Kết thúc | true-false.ts |
| TrueFalse | confirmRetry.header | Retry ? | Retry ? | Làm lại? | true-false.ts |
| TrueFalse | confirmRetry.body | Are you sure you wish to retry ? | Are you sure you wish to retry ? | Bạn có chắc muốn làm lại? | true-false.ts |
| TrueFalse | confirmRetry.cancelLabel | Cancel | Cancel | Hủy | true-false.ts |
| TrueFalse | confirmRetry.confirmLabel | Confirm | Confirm | Xác nhận | true-false.ts |

Original golden is retained unchanged; the Vietnamese golden has 81 explicitly recorded label changes. No semantic accuracy or manual acceptance is claimed.
