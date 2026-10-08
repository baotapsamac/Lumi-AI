import type { MaterializedH5PPlan, MaterializedItem, MaterializedQuestion } from './h5p-pipeline';

type Answer = { text: string; correct?: boolean; feedback?: string };
type AssessmentItem = { id: string; prompt: string; options?: Answer[] };
type Assessment = {
  id: string;
  interaction_preference?: string | null;
  assessment_function: string;
  purpose?: string;
  supports_outcomes?: string[];
  measures_evidence?: string[];
  items?: AssessmentItem[];
};
type Resource = { id: string; type: string; content?: string; purpose: string };
type Activity = { id: string; instruction: string; learning_type?: string; supports_outcomes?: string[]; resources?: Resource[]; assessment?: Assessment | null };
type Unit = { id: string; title: string; supports_outcomes?: string[]; activities: Activity[] };
export type ExportLesson = {
  schema_version?: string;
  lesson: { id: string; title: string; language: string; status?: string };
  outcomes?: Array<{ id: string; text: string; source: string; status: string; cognitive_process?: string }>;
  evidence?: Array<{ id: string; description: string; evidence_type: string; supports_outcomes: string[] }>;
  learning_units: Unit[];
  qa?: { status: string; checks: unknown[] };
};
export type CompletionItem = {
  unit_id: string;
  object_id: string;
  reason: string;
  action: string;
  severity: 'manual' | 'block';
};
export type ExportPlan = {
  plan: MaterializedH5PPlan;
  completion: CompletionItem[];
  ready: boolean;
};

/** Convert an approved pedagogical design into the existing native H5P plan. */
export function adaptApprovedLesson(
  lesson: ExportLesson,
  approved: boolean,
  alignmentReady: boolean,
): ExportPlan {
  const completion: CompletionItem[] = [];
  const chapters = lesson.learning_units.map((unit) => {
    const items: MaterializedItem[] = [];
    for (const activity of unit.activities) {
      items.push({ id: activity.id + '-instruction', type: 'text', content: activity.instruction });
      for (const resource of activity.resources || []) {
        if (resource.type === 'text' && resource.content?.trim()) {
          items.push({ id: resource.id, type: 'text', content: resource.content });
        } else {
          completion.push({
            unit_id: unit.id,
            object_id: resource.id,
            reason: 'Resource type is not supported by the current native H5P adapter: ' + resource.type,
            action: 'Add this resource manually in Lumi Desktop.',
            severity: 'manual',
          });
        }
      }
      const assessment = activity.assessment;
      if (!assessment) continue;
      const questions: MaterializedQuestion[] = [];
      const supported = assessment.interaction_preference === 'multiple_choice'
        || assessment.interaction_preference === 'multiple_response';
      if (supported) {
        for (const question of assessment.items || []) {
          const answers = question.options || [];
          if (answers.length >= 2 && answers.some((a) => a.correct) && question.prompt.trim()) {
            questions.push({
              id: question.id,
              question: question.prompt,
              selection_mode: assessment.interaction_preference === 'multiple_response' ? 'multiple' : 'single',
              answers: answers.map((a) => ({ text: a.text, correct: Boolean(a.correct), feedback: a.feedback })),
              review_state: 'approved',
            });
          } else {
            completion.push({
              unit_id: unit.id,
              object_id: question.id,
              reason: 'Question has no valid prompt or answer set.',
              action: 'Review and complete this question before publication.',
              severity: 'block',
            });
          }
        }
        if (questions.length) items.push({ id: assessment.id, type: 'multiple-choice', items: questions });
      } else {
        completion.push({
          unit_id: unit.id,
          object_id: assessment.id,
          reason: 'Assessment cannot be represented as native Multiple Choice: ' + assessment.assessment_function,
          action: 'Create a suitable activity in Lumi Desktop or assess externally.',
          severity: 'manual',
        });
        items.push({
          id: assessment.id,
          type: 'external-assessment',
          content: 'Hoạt động đánh giá cần giảng viên bổ sung: ' + assessment.assessment_function,
          assessment_mode: 'external',
          scored: false,
        });
      }
    }
    return { id: unit.id, title: unit.title, items };
  });
  if (!approved || !alignmentReady) completion.push({
    unit_id: lesson.lesson.id,
    object_id: lesson.lesson.id,
    reason: 'Design approval and independent alignment audit are required.',
    action: 'Approve the design and resolve audit findings.',
    severity: 'block',
  });
  const plan: MaterializedH5PPlan = {
    materializer_version: '1.0.0-approved-design',
    lesson_id: lesson.lesson.id,
    language: lesson.lesson.language,
    chapters,
    warnings: completion,
  };
  return { plan, completion, ready: !completion.some((item) => item.severity === 'block') };
}
