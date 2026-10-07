import * as React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import type { MaterializedH5PPlan, MaterializedQuestion } from '../../../utils/h5p-pipeline';

type Props = {
  open: boolean;
  plan: MaterializedH5PPlan | null;
  onCancel: () => void;
  onApprove: (plan: MaterializedH5PPlan) => void;
};

function questionsOf(plan: MaterializedH5PPlan) {
  return plan.chapters.flatMap((chapter) =>
    chapter.items.flatMap((item) => (item.type === 'multiple-choice' ? item.items : []))
  );
}

export function DocxQuestionReviewDialog({ open, plan, onCancel, onApprove }: Props) {
  const [draft, setDraft] = React.useState<MaterializedH5PPlan | null>(plan);

  React.useEffect(() => setDraft(plan ? structuredClone(plan) : null), [plan]);

  if (!draft) return null;
  const questions = questionsOf(draft);

  const removeQuestion = (id: string) => {
    setDraft((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      next.chapters.forEach((chapter) => {
        chapter.items.forEach((item) => {
          if (item.type === 'multiple-choice') item.items = item.items.filter((q) => q.id !== id);
        });
      });
      return next;
    });
  };

  const updateQuestion = (id: string, updater: (question: MaterializedQuestion) => void) => {
    setDraft((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      const question = questionsOf(next).find((item) => item.id === id);
      if (question) updater(question);
      return next;
    });
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>Duyệt câu hỏi trước khi xuất H5P</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Nội dung học từ DOCX được giữ nguyên. Anh có thể sửa câu hỏi/phương án hoặc bỏ câu hỏi; provenance nguồn không bị thay đổi.
        </Typography>
        {questions.map((question, index) => (
          <Box key={question.id} sx={{ mb: 3 }}>
            <Typography variant="subtitle2">Câu {index + 1} · {question.id}</Typography>
            <TextField
              fullWidth
              multiline
              sx={{ my: 1 }}
              value={question.question}
              onChange={(event) => updateQuestion(question.id, (q) => { q.question = event.target.value; q.review_state = 'needs_review'; })}
            />
            {question.answers.map((answer, answerIndex) => (
              <Box key={answerIndex} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                <FormControlLabel
                  control={<Checkbox checked={answer.correct} onChange={(event) => updateQuestion(question.id, (q) => { q.answers[answerIndex].correct = event.target.checked; q.review_state = 'needs_review'; })} />}
                  label="Đúng"
                />
                <TextField
                  fullWidth
                  size="small"
                  value={answer.text}
                  onChange={(event) => updateQuestion(question.id, (q) => { q.answers[answerIndex].text = event.target.value; q.review_state = 'needs_review'; })}
                />
              </Box>
            ))}
            <Typography variant="caption" color="text.secondary">
              Nguồn câu hỏi: {(question.question_source_ids || []).join(', ') || 'chưa có'}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Button color="error" size="small" onClick={() => removeQuestion(question.id)}>Bỏ câu hỏi</Button>
            </Box>
            <Divider sx={{ mt: 2 }} />
          </Box>
        ))}
        {questions.length === 0 && <Typography>Không có câu hỏi để duyệt. Bài học vẫn có thể xuất phần nội dung đọc.</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Hủy</Button>
        <Button
          variant="contained"
          onClick={() => {
            questionsOf(draft).forEach((question) => { question.review_state = 'approved'; });
            onApprove(draft);
          }}
        >
          Duyệt và xuất H5P
        </Button>
      </DialogActions>
    </Dialog>
  );
}
