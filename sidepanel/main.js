import { getSettings, saveSettings, getActiveApiKeyAndModel } from './auth.js';
import { callAI } from './ai-client.js';
import { buildDonCamilloPrompt, buildSynthesisPrompt } from './prompts.js';
import { generateFilename, formatMeditationMarkdown, lintMarkdown, triggerDownload } from './exporter.js';

// Application State
const state = {
  settings: null,
  dialogueHistory: [],
  synthesizedMarkdown: '',
  book: '',
  chapter: '',
  scripture: '',
  draft: ''
};

// DOM Elements
const btnActiveProviderBadge = document.getElementById('btnActiveProviderBadge');
const activeModelName = document.getElementById('activeModelName');
const providerDot = document.getElementById('providerDot');
const btnOpenSettings = document.getElementById('btnOpenSettings');

const settingsModalOverlay = document.getElementById('settingsModalOverlay');
const btnCloseSettingsModal = document.getElementById('btnCloseSettingsModal');
const btnCancelSettings = document.getElementById('btnCancelSettings');
const btnSaveSettings = document.getElementById('btnSaveSettings');

const cfgGeminiKey = document.getElementById('cfgGeminiKey');
const cfgGeminiModel = document.getElementById('cfgGeminiModel');
const cfgClaudeKey = document.getElementById('cfgClaudeKey');
const cfgClaudeModel = document.getElementById('cfgClaudeModel');
const cfgOpenaiKey = document.getElementById('cfgOpenaiKey');
const cfgOpenaiModel = document.getElementById('cfgOpenaiModel');

const inputBook = document.getElementById('inputBook');
const inputChapter = document.getElementById('inputChapter');
const inputScripture = document.getElementById('inputScripture');
const inputDraft = document.getElementById('inputDraft');
const btnStartDialogue = document.getElementById('btnStartDialogue');

const sectionDialogue = document.getElementById('sectionDialogue');
const dialogueFeed = document.getElementById('dialogueFeed');
const inputUserReply = document.getElementById('inputUserReply');
const btnSendReply = document.getElementById('btnSendReply');
const btnSynthesizeEssay = document.getElementById('btnSynthesizeEssay');

const sectionResult = document.getElementById('sectionResult');
const filenamePreview = document.getElementById('filenamePreview');
const lintBadge = document.getElementById('lintBadge');
const resultMarkdown = document.getElementById('resultMarkdown');
const btnExportMd = document.getElementById('btnExportMd');
const btnCopyClipboard = document.getElementById('btnCopyClipboard');

const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const toast = document.getElementById('toast');

// Helpers
function showLoading(message) {
  loadingText.textContent = message || '작업을 처리하고 있습니다...';
  loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

function showToast(message, duration = 2500) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, duration);
}

function appendDialogueBubble(author, text, isAi = false) {
  const msgWrapper = document.createElement('div');
  msgWrapper.className = `dialogue-message ${isAi ? 'message-ai' : 'message-user'}`;

  const authorSpan = document.createElement('span');
  authorSpan.className = 'message-author';
  authorSpan.textContent = author;

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = text;

  msgWrapper.appendChild(authorSpan);
  msgWrapper.appendChild(bubble);
  dialogueFeed.appendChild(msgWrapper);

  dialogueFeed.scrollTop = dialogueFeed.scrollHeight;
}

// Settings & Provider UI
async function loadAndApplySettings() {
  state.settings = await getSettings();
  updateHeaderBadge();
}

function updateHeaderBadge() {
  const s = state.settings;
  if (!s) return;

  const dotColors = {
    gemini: '#10b981', // green
    claude: '#8b5cf6', // purple
    openai: '#3b82f6'  // blue
  };

  const MODEL_LABELS = {
    'gemini-3.8-flash': 'Gemini 3.8 Flash High',
    'gemini-3.7-flash': 'Gemini 3.7 Flash High',
    'gemini-3.1-pro': 'Gemini 3.1 Pro',
    'claude-sonnet-5': 'Claude Sonnet 5',
    'claude-opus-5': 'Claude Opus 5',
    'gpt-5.6-luna-max': 'GPT 5.6 Luna Max',
    'gpt-5.6-sol': 'GPT 5.6 Sol Medium',
    'gpt-6-astra': 'GPT 6 Astra Low'
  };

  let displayLabel = 'Gemini 3.8 Flash High';
  if (s.activeProvider === 'claude') {
    const m = s.claudeModel || 'claude-sonnet-5';
    displayLabel = MODEL_LABELS[m] || `Claude (${m})`;
  } else if (s.activeProvider === 'openai') {
    const m = s.openaiModel || 'gpt-5.6-luna-max';
    displayLabel = MODEL_LABELS[m] || `OpenAI (${m})`;
  } else {
    const m = s.geminiModel || 'gemini-3.8-flash';
    displayLabel = MODEL_LABELS[m] || `Gemini (${m})`;
  }

  activeModelName.textContent = displayLabel;
  providerDot.style.backgroundColor = dotColors[s.activeProvider] || '#10b981';
}

function openSettingsModal() {
  const s = state.settings || {};

  // 라디오 버튼 선택
  const radio = document.querySelector(`input[name="providerSelect"][value="${s.activeProvider || 'gemini'}"]`);
  if (radio) radio.checked = true;

  cfgGeminiKey.value = s.geminiApiKey || '';
  cfgGeminiModel.value = s.geminiModel || 'gemini-3.8-flash';
  cfgClaudeKey.value = s.claudeApiKey || '';
  cfgClaudeModel.value = s.claudeModel || 'claude-sonnet-5';
  cfgOpenaiKey.value = s.openaiApiKey || '';
  cfgOpenaiModel.value = s.openaiModel || 'gpt-5.6-luna-max';

  settingsModalOverlay.classList.remove('hidden');
}

function closeSettingsModal() {
  settingsModalOverlay.classList.add('hidden');
}

async function handleSaveSettings() {
  const selectedProvider = document.querySelector('input[name="providerSelect"]:checked')?.value || 'gemini';

  const newSettings = {
    activeProvider: selectedProvider,
    geminiApiKey: cfgGeminiKey.value.trim(),
    geminiModel: cfgGeminiModel.value.trim() || 'gemini-3.8-flash',
    claudeApiKey: cfgClaudeKey.value.trim(),
    claudeModel: cfgClaudeModel.value.trim() || 'claude-sonnet-5',
    openaiApiKey: cfgOpenaiKey.value.trim(),
    openaiModel: cfgOpenaiModel.value.trim() || 'gpt-5.6-luna-max'
  };

  await saveSettings(newSettings);
  state.settings = newSettings;
  updateHeaderBadge();
  closeSettingsModal();
  showToast('AI 설정이 저장되었습니다.');
}

// Phase 1: Don Camillo Dialogue Flow
async function handleStartDialogue() {
  state.book = inputBook.value.trim();
  state.chapter = inputChapter.value.trim();
  state.scripture = inputScripture.value.trim();
  state.draft = inputDraft.value.trim();

  if (!state.draft) {
    showToast('1차 초안 묵상 메모를 먼저 작성해 주십시오.');
    inputDraft.focus();
    return;
  }

  const active = await getActiveApiKeyAndModel();
  if (!active.apiKey) {
    openSettingsModal();
    showToast(`먼저 ${active.provider} API 키를 설정해 주십시오.`);
    return;
  }

  showLoading(`돈 까밀로(${active.model})가 본문과 묵상 초안을 읽고 있습니다...`);
  try {
    state.dialogueHistory = [];
    dialogueFeed.innerHTML = '';

    const promptObj = buildDonCamilloPrompt({
      scripture: state.scripture,
      draft: state.draft,
      dialogueHistory: state.dialogueHistory
    });

    const response = await callAI({
      provider: active.provider,
      apiKey: active.apiKey,
      model: active.model,
      systemInstruction: promptObj.systemInstruction,
      contents: promptObj.contents
    });

    state.dialogueHistory.push({
      role: 'model',
      parts: [{ text: response }]
    });

    sectionDialogue.classList.remove('hidden');
    appendDialogueBubble('돈 까밀로 (Don Camillo)', response, true);

    sectionDialogue.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    showToast(`오류: ${err.message}`);
  } finally {
    hideLoading();
  }
}

async function handleSendReply() {
  const replyText = inputUserReply.value.trim();
  if (!replyText) return;

  const active = await getActiveApiKeyAndModel();
  if (!active.apiKey) {
    openSettingsModal();
    return;
  }

  appendDialogueBubble('나의 묵상 응답', replyText, false);
  inputUserReply.value = '';

  state.dialogueHistory.push({
    role: 'user',
    parts: [{ text: replyText }]
  });

  showLoading(`돈 까밀로(${active.model})가 신학적 사유를 되묻고 있습니다...`);
  try {
    const promptObj = buildDonCamilloPrompt({
      scripture: state.scripture,
      draft: state.draft,
      dialogueHistory: state.dialogueHistory
    });

    const response = await callAI({
      provider: active.provider,
      apiKey: active.apiKey,
      model: active.model,
      systemInstruction: promptObj.systemInstruction,
      contents: promptObj.contents
    });

    state.dialogueHistory.push({
      role: 'model',
      parts: [{ text: response }]
    });

    appendDialogueBubble('돈 까밀로 (Don Camillo)', response, true);
  } catch (err) {
    showToast(`오류: ${err.message}`);
  } finally {
    hideLoading();
  }
}

// Phase 2: Synthesis Essay & Markdown Export
async function handleSynthesizeEssay() {
  const active = await getActiveApiKeyAndModel();
  if (!active.apiKey) {
    openSettingsModal();
    return;
  }

  showLoading(`C.S. Lewis × Eugene Peterson 스타일로 완성 에세이를 집필 중입니다 (${active.model})...`);
  try {
    const promptObj = buildSynthesisPrompt({
      scripture: state.scripture,
      draft: state.draft,
      dialogueHistory: state.dialogueHistory,
      book: state.book,
      chapter: state.chapter
    });

    const rawJson = await callAI({
      provider: active.provider,
      apiKey: active.apiKey,
      model: active.model,
      systemInstruction: promptObj.systemInstruction,
      contents: promptObj.contents,
      isJson: true
    });

    let data;
    try {
      data = JSON.parse(rawJson);
    } catch {
      const cleaned = rawJson.replace(/```json\s*|```/g, '').trim();
      data = JSON.parse(cleaned);
    }

    const formattedMd = formatMeditationMarkdown({
      scripture: state.scripture,
      draft: state.draft,
      protocol: data.protocol || {},
      essayTitle: data.essayTitle || '묵상 에세이',
      bookRef: data.bookRef || `${state.book} ${state.chapter}장`,
      essayBody: data.essayBody || ''
    });

    state.synthesizedMarkdown = formattedMd;
    resultMarkdown.value = formattedMd;

    // Lint check
    const lintResult = lintMarkdown(formattedMd);
    if (lintResult.valid) {
      lintBadge.className = 'badge badge-success';
      lintBadge.textContent = '✅ 마크다운 린트 통과';
    } else {
      lintBadge.className = 'badge';
      lintBadge.textContent = `⚠️ 린트 주의: ${lintResult.errors.length}건`;
    }

    // Filename preview
    const today = new Date().toISOString().slice(0, 10);
    const targetFilename = generateFilename(today, state.book, state.chapter);
    filenamePreview.textContent = targetFilename;

    sectionResult.classList.remove('hidden');
    sectionResult.scrollIntoView({ behavior: 'smooth' });
    showToast('완성 에세이가 생성되었습니다.');
  } catch (err) {
    showToast(`에세이 생성 오류: ${err.message}`);
  } finally {
    hideLoading();
  }
}

function handleExportMd() {
  const currentContent = resultMarkdown.value;
  if (!currentContent) {
    showToast('내보낼 에세이 내용이 없습니다.');
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const targetFilename = generateFilename(today, state.book, state.chapter);

  triggerDownload(targetFilename, currentContent);
  showToast(`다운로드 시작: ${targetFilename}`);
}

async function handleCopyClipboard() {
  const currentContent = resultMarkdown.value;
  if (!currentContent) {
    showToast('복사할 에세이 내용이 없습니다.');
    return;
  }

  try {
    await navigator.clipboard.writeText(currentContent);
    showToast('클립보드에 복사되었습니다.');
  } catch {
    showToast('클립보드 복사에 실패했습니다.');
  }
}

// Event Listeners
btnActiveProviderBadge.addEventListener('click', openSettingsModal);
btnOpenSettings.addEventListener('click', openSettingsModal);
btnCloseSettingsModal.addEventListener('click', closeSettingsModal);
btnCancelSettings.addEventListener('click', closeSettingsModal);
btnSaveSettings.addEventListener('click', handleSaveSettings);

btnStartDialogue.addEventListener('click', handleStartDialogue);
btnSendReply.addEventListener('click', handleSendReply);
btnSynthesizeEssay.addEventListener('click', handleSynthesizeEssay);
btnExportMd.addEventListener('click', handleExportMd);
btnCopyClipboard.addEventListener('click', handleCopyClipboard);

inputUserReply.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendReply();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !settingsModalOverlay.classList.contains('hidden')) {
    closeSettingsModal();
  }
});

// Init on mount
loadAndApplySettings();
