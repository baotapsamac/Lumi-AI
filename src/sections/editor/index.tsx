import * as React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

import { sendMessage } from 'src/state/chat/thunks';
import { useSelector, useDispatch } from 'src/state';
import { buildSystemPrompt } from 'src/state/chat/prompts';
import { chatReadAloudToggled } from 'src/state/chat/actions';
import { CHAT_SYSTEM_PROMPT_CHANGED } from 'src/state/chat/action-types';
import {
  generateText,
  generateQuestion,
} from 'src/state/lumi-editor/lumiEditorThunks';
import {
  selectChatLoading,
  selectChatMessages,
  selectCustomSystemPrompt,
  selectReadAloudEnabled,
} from 'src/state/chat/selectors';
import {
  selectTitle,
  selectProvider,
  selectModel,
  modelChanged,
  selectApiToken,
  providerChanged,
  apiTokenChanged,
  selectHasContent,
  selectApiEndpoint,
  apiEndpointChanged,
  createContentHelper,
  selectOrderedContent,
  worksheetContentsSet,
  worksheetTitleChanged,
  worksheetContentAdded,
  worksheetContentUpdated,
  worksheetContentDeleted,
  worksheetContentDuplicated,
} from 'src/state/lumi-editor';

import { useMenus } from './hooks/use-menus';
import { useSpeech } from './hooks/use-speech';
import { metadata, drawerWidth } from './constants';
import { useDragDrop } from './hooks/use-drag-drop';
import { CommandMenu } from './components/command-menu';
import { ContentMenu } from './components/content-menu';
import { useFocusState } from './hooks/use-focus-state';
import { EditorHeader } from './components/editor-header';
import { EditorCanvas } from './components/editor-canvas';
import { AIChatHandle } from './components/ai-chat-handle';
import { AIChatDrawer } from './components/ai-chat-drawer';
import { TurnIntoMenu } from './components/turn-into-menu';
import { SystemPromptDialog } from './components/system-prompt-dialog';
import { DocxQuestionReviewDialog } from './components/docx-question-review-dialog';
import { runMaterializedH5PPipeline } from '../../utils/h5p-pipeline';
import type { MaterializedH5PPlan } from '../../utils/h5p-pipeline';
import { generateH5PPackage, downloadH5PPackage } from '../../utils/h5p-generator';
import { generateMaterializedPlanFromDocx } from '../../utils/long-docx-pipeline';
import { loadDocxProject, saveDocxProject, downloadProjectFile, importProjectFile } from '../../utils/project-store';

import type { ContentType, CommandOption, GeneratingSkeleton } from './types';

// ----------------------------------------------------------------------

function EditorPage() {
  // Keep legacy editor components unmounted in the DOCX-first workflow.
  const [legacyUiEnabled] = React.useState(false);
  const dispatch = useDispatch();

  // Redux state (data only)
  const provider = useSelector(selectProvider);
  const model = useSelector(selectModel);
  const apiEndpoint = useSelector(selectApiEndpoint);
  const apiToken = useSelector(selectApiToken);
  const title = useSelector(selectTitle);
  const content = useSelector(selectOrderedContent);
  const hasContent = useSelector(selectHasContent);
  const chatMessages = useSelector(selectChatMessages);
  const customSystemPrompt = useSelector(selectCustomSystemPrompt);
  const readAloudEnabled = useSelector(selectReadAloudEnabled);

  // Local UI state - System Prompt Dialog
  const [systemPromptDialogOpen, setSystemPromptDialogOpen] = React.useState(false);

  // Local UI state - Chat
  const [chatDrawerOpen, setChatDrawerOpen] = React.useState(false);
  const [chatInput, setChatInput] = React.useState('');
  const chatLoading = useSelector(selectChatLoading);
  const chatMessagesEndRef = React.useRef<HTMLDivElement>(null);

  // Speech (STT + TTS)
  const speech = useSpeech({
    onTranscript: (text) => setChatInput(text),
  });

  // Auto-read the latest assistant message when read-aloud is enabled
  const lastMessageRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!readAloudEnabled) return;
    const last = chatMessages[chatMessages.length - 1];
    if (!last || last.role !== 'assistant') return;
    if (last.id === lastMessageRef.current) return;
    lastMessageRef.current = last.id;
    // Strip suggestion markers before speaking
    const text = last.content.replace(/\[VORSCHLÄGE:.*?\]/s, '').trim();
    speech.speak(text, last.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages, readAloudEnabled]);

  // Local UI state - Snackbar
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Local UI state - Download
  const [downloadLoading, setDownloadLoading] = React.useState(false);
  const [docxLoading, setDocxLoading] = React.useState(false);
  const [docxReviewPlan, setDocxReviewPlan] = React.useState<MaterializedH5PPlan | null>(null);
  const [docxReviewTitle, setDocxReviewTitle] = React.useState('');

  React.useEffect(() => {
    const saved = loadDocxProject();
    if (saved) {
      setDocxReviewPlan(saved.plan);
      setDocxReviewTitle(saved.title);
    }
  }, []);

  // Local UI state - Generating skeletons
  const [generatingSkeletons, setGeneratingSkeletons] = React.useState<GeneratingSkeleton[]>([]);

  // Hooks for transient UI state
  const menus = useMenus();
  const focusState = useFocusState();
  const dragDrop = useDragDrop(content, (newContent) =>
    dispatch(worksheetContentsSet(newContent))
  );

  // Auto-scroll chat
  React.useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Download handler
  const handleDownload = async () => {
    setDownloadLoading(true);
    try {
      setSnackbar({ open: true, message: 'H5P-Paket wird vorbereitet...', severity: 'info' });
      const h5pBlob = await generateH5PPackage(title, content);
      downloadH5PPackage(h5pBlob, title.trim() || 'interactive-book');
      setSnackbar({ open: true, message: 'H5P-Paket erfolgreich heruntergeladen!', severity: 'success' });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Lỗi khi tạo gói H5P: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
        severity: 'error',
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDocxImport = async (file: File) => {
    if (!apiToken.trim()) {
      setSnackbar({ open: true, message: 'Hãy cấu hình API token trước khi xử lý DOCX.', severity: 'error' });
      return;
    }

    setDocxLoading(true);
    try {
      const baseTitle = file.name.replace(/\.docx$/i, '') || 'bai-hoc';
      setSnackbar({ open: true, message: 'Đang đọc và chia tài liệu DOCX...', severity: 'info' });

      const { plan, sections } = await generateMaterializedPlanFromDocx(file, {
        apiEndpoint,
        apiToken,
        model,
        maxChunkChars: 12000,
        questionsPerChunk: 2,
        onProgress: (completed, total, label) => {
          setSnackbar({
            open: true,
            message: `Đang xử lý ${completed}/${total}: ${label}`,
            severity: 'info',
          });
        },
      });

      setDocxReviewPlan(plan);
      setDocxReviewTitle(baseTitle);
      saveDocxProject({
        version: '1.0',
        id: plan.lesson_id,
        title: baseTitle,
        sourceFileName: file.name,
        updatedAt: new Date().toISOString(),
        plan,
      });
      setSnackbar({
        open: true,
        message: `Đã phân tích ${sections.length} phần. Hãy duyệt câu hỏi trước khi xuất H5P.`,
        severity: 'success',
      });
      return;
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Không thể tạo H5P từ DOCX: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
        severity: 'error',
      });
    } finally {
      setDocxLoading(false);
    }
  };

  // AI generation helpers
  const handleGenerateQuestion = async (
    mode: 'create' | 'addBelow' | 'transform',
    targetContentId: string | null
  ) => {
    if (!apiToken.trim()) {
      setSnackbar({ open: true, message: 'Bitte geben Sie einen API-Token ein', severity: 'error' });
      return;
    }
    const skeletonId = `skeleton-${Date.now()}`;
    setGeneratingSkeletons((prev) => [
      ...prev,
      { id: skeletonId, type: 'multiple-choice', mode, targetContentId },
    ]);
    try {
      const result = await dispatch(generateQuestion({ mode, targetContentId })).unwrap();

      if (mode === 'create') {
        dispatch(worksheetContentAdded({ content: result, index: 0 }));
      } else if (mode === 'addBelow' && targetContentId) {
        const targetIndex = content.findIndex((c) => c.id === targetContentId);
        dispatch(worksheetContentAdded({ content: result, index: targetIndex + 1 }));
      } else if (mode === 'transform' && targetContentId) {
        dispatch(
          worksheetContentsSet(
            content.map((item) =>
              item.id === targetContentId ? { ...result, id: targetContentId } : item
            )
          )
        );
      }
      setSnackbar({
        open: true,
        message: mode === 'transform' ? 'Đã chuyển đổi nội dung' : 'Đã tạo câu hỏi',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Lỗi khi tạo câu hỏi',
        severity: 'error',
      });
    } finally {
      setGeneratingSkeletons((prev) => prev.filter((s) => s.id !== skeletonId));
    }
  };

  const handleGenerateText = async (
    mode: 'create' | 'addBelow' | 'transform',
    targetContentId: string | null
  ) => {
    if (!apiToken.trim()) {
      setSnackbar({ open: true, message: 'Bitte geben Sie einen API-Token ein', severity: 'error' });
      return;
    }
    const skeletonId = `skeleton-${Date.now()}`;
    setGeneratingSkeletons((prev) => [
      ...prev,
      { id: skeletonId, type: 'text', mode, targetContentId },
    ]);
    try {
      const result = await dispatch(generateText({ mode, targetContentId })).unwrap();

      if (mode === 'create') {
        dispatch(worksheetContentAdded({ content: result, index: 0 }));
      } else if (mode === 'addBelow' && targetContentId) {
        const targetIndex = content.findIndex((c) => c.id === targetContentId);
        dispatch(worksheetContentAdded({ content: result, index: targetIndex + 1 }));
      } else if (mode === 'transform' && targetContentId) {
        dispatch(
          worksheetContentsSet(
            content.map((item) =>
              item.id === targetContentId ? { ...result, id: targetContentId } : item
            )
          )
        );
      }
      setSnackbar({
        open: true,
        message: mode === 'transform' ? 'Đã chuyển đổi nội dung' : 'Đã tạo văn bản',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Lỗi khi tạo văn bản',
        severity: 'error',
      });
    } finally {
      setGeneratingSkeletons((prev) => prev.filter((s) => s.id !== skeletonId));
    }
  };

  // Chat handlers
  const startGuidedCreation = () => {
    if (!apiToken.trim()) {
      setSnackbar({ open: true, message: 'Bitte geben Sie Ihren API-Token ein', severity: 'error' });
      return;
    }
    setChatDrawerOpen(true);
    dispatch(sendMessage('Hilf mir bitte ein Arbeitsblatt zu erstellen.', 'user'));
  };

  const handleSendChatMessage = () => {
    if (!apiToken.trim() || !chatInput.trim()) return;
    const userInput = chatInput;
    setChatInput('');
    dispatch(sendMessage(userInput, 'user'));
  };

  // Command menu handlers
  const handleCommandSelect = (option: CommandOption) => {
    if (menus.commandMenu.contentId === null) return;
    if (menus.commandMenu.mode === 'addBelow') {
      const newContent = createContentHelper(option.contentType);
      const currentIndex = content.findIndex((c) => c.id === menus.commandMenu.contentId);
      dispatch(worksheetContentAdded({ content: newContent, index: currentIndex + 1 }));
    }
    menus.setCommandMenu({ anchor: null, contentId: null, mode: 'transform' });
  };

  const handleWelcomeContentCreate = (option: CommandOption) => {
    if (!title || title.trim() === '') return;
    const newContent = createContentHelper(option.contentType);
    dispatch(worksheetContentsSet([newContent]));
  };

  const handleTurnInto = (contentId: string, targetType: ContentType) => {
    const newContent = createContentHelper(targetType);
    dispatch(
      worksheetContentsSet(
        content.map((item) => (item.id === contentId ? { ...newContent, id: contentId } : item))
      )
    );
    menus.setContentMenu({ anchor: null, contentId: null });
    menus.setTurnIntoMenuAnchor(null);
  };

  const handleAITurnInto = (contentId: string, targetType: ContentType) => {
    if (targetType === 'multiple-choice') {
      handleGenerateQuestion('transform', contentId);
    } else if (targetType === 'text') {
      handleGenerateText('transform', contentId);
    }
    menus.setContentMenu({ anchor: null, contentId: null });
    menus.setTurnIntoMenuAnchor(null);
  };

  return (
    <>
      <title>{metadata.title}</title>

      {/* Main Content Area */}
      <Box
        sx={{
          minHeight: '100vh',
          pr: chatDrawerOpen ? `${drawerWidth}px` : 0,
          transition: (theme) =>
            theme.transitions.create('padding-right', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        {/* Header */}
        <EditorHeader
          provider={provider}
          apiEndpoint={apiEndpoint}
          apiToken={apiToken}
          model={model}
          onModelChange={(value) => dispatch(modelChanged(value))}
          downloadLoading={downloadLoading}
          docxLoading={docxLoading}
          hasContent={hasContent}
          onProviderChange={(newProvider) => dispatch(providerChanged(newProvider))}
          onEndpointChange={(endpoint) => dispatch(apiEndpointChanged(endpoint))}
          onTokenChange={(token) => dispatch(apiTokenChanged(token))}
          onDownload={handleDownload}
          onDocxImport={handleDocxImport}
        />

        <Box sx={{ maxWidth: 760, mx: 'auto', mt: 10, px: 3, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ mb: 2 }}>Lumi-AI — Tạo học liệu từ DOCX</Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>Nạp tài liệu Word. Lumi tự đọc, phân chia nội dung và tạo câu hỏi bám sát nguồn. Chỉ khi cần giảng viên duyệt câu hỏi, ứng dụng mới yêu cầu xác nhận trước khi xuất H5P.</Typography>
          <Button component="label" size="large" variant="contained" disabled={docxLoading}>
            {docxLoading ? 'Đang phân tích tài liệu...' : 'Chọn tệp DOCX'}
            <input hidden type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleDocxImport(file); event.currentTarget.value = ''; }} />
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>Quy trình: DOCX → phân tích nguồn → tạo nội dung và câu hỏi → giảng viên duyệt → kiểm tra → tải H5P.</Typography>
        </Box>
        {/* Editor Canvas (legacy editor disabled in DOCX-first workflow) */}
        {legacyUiEnabled && (
        <EditorCanvas
          title={title}
          content={content}
          generatingSkeletons={generatingSkeletons}
          focusedTextId={focusState.focusedTextId}
          focusedMCQId={focusState.focusedMCQId}
          mcqTextValue={focusState.mcqTextValue}
          dropTargetId={dragDrop.dropTargetId}
          dropPosition={dragDrop.dropPosition}
          onTitleChange={(newTitle) => dispatch(worksheetTitleChanged(newTitle))}
          onContentUpdate={(id, updates) => dispatch(worksheetContentUpdated({ id, updates }))}
          onDeleteContent={(id) => dispatch(worksheetContentDeleted(id))}
          onAddBelowClick={(e, contentId) =>
            menus.setCommandMenu({ anchor: e.currentTarget, contentId, mode: 'addBelow' })
          }
          onContentMenuClick={(e, contentId) =>
            menus.setContentMenu({ anchor: e.currentTarget, contentId })
          }
          onDragStart={dragDrop.handleDragStart}
          onDragEnd={() => dragDrop.setDragId(null)}
          onDragOver={dragDrop.handleDragOver}
          onDrop={dragDrop.handleDrop}
          onTextFocus={focusState.setFocusedTextId}
          onTextBlur={() => focusState.setFocusedTextId(null)}
          onMCQFocus={(id, textValue) => {
            focusState.setFocusedMCQId(id);
            focusState.setMcqTextValue(textValue);
          }}
          onMCQBlur={() => focusState.setFocusedMCQId(null)}
          onMCQTextChange={focusState.setMcqTextValue}
          onStartGuidedCreation={startGuidedCreation}
          onWelcomeContentCreate={handleWelcomeContentCreate}
          onOpenAiQuestionDialog={() => handleGenerateQuestion('create', null)}
          onOpenAiTextDialog={() => handleGenerateText('create', null)}
        />

        )}
        {/* AI Chat Handle */}
        {legacyUiEnabled && !chatDrawerOpen && <AIChatHandle onClick={() => setChatDrawerOpen(true)} />}
      </Box>

      {/* AI Chat Drawer */}
      {legacyUiEnabled && <AIChatDrawer
        open={chatDrawerOpen}
        apiToken={apiToken}
        chatMessages={chatMessages}
        chatInput={chatInput}
        chatLoading={chatLoading}
        chatMessagesEndRef={chatMessagesEndRef}
        readAloudEnabled={readAloudEnabled}
        isListening={speech.isListening}
        isSpeaking={speech.isSpeaking}
        speakingMessageId={speech.speakingId}
        sttSupported={speech.sttSupported}
        ttsSupported={speech.ttsSupported}
        onClose={() => setChatDrawerOpen(false)}
        onChatInputChange={setChatInput}
        onSendMessage={handleSendChatMessage}
        onStartGuidedCreation={startGuidedCreation}
        onSuggestionClick={(text) => {
          dispatch(sendMessage(text, 'user'));
        }}
        onReadAloudToggle={() => dispatch(chatReadAloudToggled())}
        onMicClick={() => {
          if (speech.isListening) {
            speech.stopListening();
          } else {
            speech.startListening();
          }
        }}
        onSpeakMessage={speech.speak}
        onStopSpeaking={speech.stopSpeaking}
      />}

      {/* Command Menu */}
      <CommandMenu
        menuState={menus.commandMenu}
        onClose={() => menus.setCommandMenu({ anchor: null, contentId: null, mode: 'transform' })}
        onSelect={handleCommandSelect}
        onAIButtonClick={(contentType, contentId) => {
          const mode = menus.commandMenu.mode === 'transform' ? 'transform' : 'addBelow';
          if (contentType === 'multiple-choice') {
            handleGenerateQuestion(mode, contentId);
          } else if (contentType === 'text') {
            handleGenerateText(mode, contentId);
          }
          menus.setCommandMenu({ anchor: null, contentId: null, mode: 'transform' });
        }}
      />

      {/* Content Menu */}
      <ContentMenu
        menuState={menus.contentMenu}
        onClose={() => menus.setContentMenu({ anchor: null, contentId: null })}
        onDuplicate={() => {
          if (menus.contentMenu.contentId) {
            dispatch(worksheetContentDuplicated(menus.contentMenu.contentId));
          }
          menus.setContentMenu({ anchor: null, contentId: null });
        }}
        onTurnIntoHover={(e) => menus.setTurnIntoMenuAnchor(e.currentTarget)}
        onTurnIntoClick={(e) => menus.setTurnIntoMenuAnchor(e.currentTarget)}
      />

      {/* Turn Into Submenu */}
      <TurnIntoMenu
        anchorEl={menus.turnIntoMenuAnchor}
        onClose={() => menus.setTurnIntoMenuAnchor(null)}
        onMouseLeave={() => menus.setTurnIntoMenuAnchor(null)}
        onSelect={(contentType) => {
          if (menus.contentMenu.contentId) handleTurnInto(menus.contentMenu.contentId, contentType);
        }}
        onAITransform={(contentType) => {
          if (menus.contentMenu.contentId) handleAITurnInto(menus.contentMenu.contentId, contentType);
        }}
      />

      <DocxQuestionReviewDialog
        open={docxReviewPlan !== null}
        plan={docxReviewPlan}
        onCancel={() => setDocxReviewPlan(null)}
        onApprove={async (approvedPlan) => {
          try {
            setDocxLoading(true);
            const result = await runMaterializedH5PPipeline(docxReviewTitle || 'bai-hoc', approvedPlan);
            if (!result.blob || !result.report.gates.package_layer_ready) {
              const failed = result.report.checks
                .filter((check) => check.result === 'FAIL' || check.result === 'BLOCK')
                .map((check) => check.name)
                .join('; ');
              throw new Error(failed || 'Package Validator không cho phép xuất H5P.');
            }
            downloadH5PPackage(result.blob, docxReviewTitle || 'bai-hoc');
            const project = {
              version: '1.0' as const,
              id: approvedPlan.lesson_id,
              title: docxReviewTitle || 'bai-hoc',
              sourceFileName: docxReviewTitle ? `${docxReviewTitle}.docx` : 'source.docx',
              updatedAt: new Date().toISOString(),
              plan: approvedPlan,
            };
            saveDocxProject(project);
            downloadProjectFile(project);
            setDocxReviewPlan(null);
            setSnackbar({ open: true, message: `Đã xuất H5P. Validator: ${result.report.status}.`, severity: 'success' });
          } catch (error) {
            setSnackbar({ open: true, message: `Không thể xuất H5P: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`, severity: 'error' });
          } finally {
            setDocxLoading(false);
          }
        }}
      />

      <Box sx={{ position: 'fixed', bottom: 16, left: 16, zIndex: 1200 }}>
        <input
          id="lumiai-open-project"
          type="file"
          accept=".json,.lumiai.json"
          style={{ display: 'none' }}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            try {
              const project = await importProjectFile(file);
              saveDocxProject(project);
              setDocxReviewPlan(project.plan);
              setDocxReviewTitle(project.title);
              setSnackbar({ open: true, message: 'Đã mở dự án Lumi-AI.', severity: 'success' });
            } catch (error) {
              setSnackbar({ open: true, message: error instanceof Error ? error.message : 'Không thể mở dự án.', severity: 'error' });
            }
            event.target.value = '';
          }}
        />
        <Box component="label" htmlFor="lumiai-open-project" sx={{ cursor: 'pointer', bgcolor: 'background.paper', p: 1, borderRadius: 1, boxShadow: 2 }}>
          Mở dự án Lumi-AI
        </Box>
      </Box>

      {/* System Prompt Dialog */}
      {legacyUiEnabled && <SystemPromptDialog
        open={systemPromptDialogOpen}
        customPrompt={customSystemPrompt}
        defaultPrompt={buildSystemPrompt(title, content)}
        onClose={() => setSystemPromptDialogOpen(false)}
        onSave={(prompt) => dispatch({ type: CHAT_SYSTEM_PROMPT_CHANGED, payload: prompt })}
      />}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default function Page() {
  return <EditorPage />;
}
