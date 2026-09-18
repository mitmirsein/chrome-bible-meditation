import { getSettings, saveSettings, getActiveApiKeyAndModel, maskApiKey } from './auth.js';
import { callAI } from './ai-client.js';
import { MODEL_REGISTRY, getModelLabel } from './models.js';
import { buildDonCamilloPrompt, buildSynthesisPrompt } from './prompts.js';
import { generateFilename, formatMeditationMarkdown, lintMarkdown, triggerDownload, renderDialogueMarkdown } from './exporter.js';

// Application State
const state = {
  settings: null,
  dialogueHistory: [],
  synthesizedMarkdown: '',
  book: '',
  chapter: '',
  scripture: '',
  draft: '',
  currentAbortController: null
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
const geminiKeyStatus = document.getElementById('geminiKeyStatus');

const cfgClaudeKey = document.getElementById('cfgClaudeKey');
const cfgClaudeModel = document.getElementById('cfgClaudeModel');
const claudeKeyStatus = document.getElementById('claudeKeyStatus');

const cfgOpenaiKey = document.getElementById('cfgOpenaiKey');
const cfgOpenaiModel = document.getElementById('cfgOpenaiModel');
const openaiKeyStatus = document.getElementById('openaiKeyStatus');

const chkPersistKeys = document.getElementById('chkPersistKeys');

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
const btnCancelRequest = document.getElementById('btnCancelRequest');
const toast = document.getElementById('toast');

// Helpers
function setActionButtonsDisabled(disabled) {
  btnStartDialogue.disabled = disabled;
  btnSendReply.disabled = disabled;
  btnSynthesizeEssay.disabled = disabled;
}

function showLoading(message) {
  loadingText.textContent = message || '작업을 처리하고 있습니다...';
  loadingOverlay.classList.remove('hidden');
  setActionButtonsDisabled(true);
}

function hideLoading() {
  loadingOverlay.classList.add('hidden');
  setActionButtonsDisabled(false);
  state.currentAbortController = null;
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
  bubble.innerHTML = renderDialogueMarkdown(text);

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

  const providerInfo = MODEL_REGISTRY[s.activeProvider] || MODEL_REGISTRY.gemini;
  const currentModelId = s[`${s.activeProvider}Model`] || providerInfo.defaultModel;
  const displayLabel = getModelLabel(s.activeProvider, currentModelId);

  activeModelName.textContent = displayLabel;
  providerDot.style.backgroundColor = providerInfo.badgeColor;
}

function updateKeyPill(pillElem, keyVal, inputElem) {
  if (keyVal && keyVal.trim()) {
    pillElem.textContent = '등록됨 (' + maskApiKey(keyVal) + ')';
    pillElem.classList.add('registered');
    inputElem.placeholder = '키 변경 시에만 새 키를 입력하세요';
  } else {
    pillElem.textContent = '미등록';
    pillElem.classList.remove('registered');
    inputElem.placeholder = '새 API 키 입력';
  }
}

function openSettingsModal() {
  const s = state.settings || {};

  const radio = document.querySelector(`input[name="providerSelect"][value="${s.activeProvider || 'gemini'}"]`);
  if (radio) radio.checked = true;

  cfgGeminiModel.value = s.geminiModel || MODEL_REGISTRY.gemini.defaultModel;
  cfgClaudeModel.value = s.claudeModel || MODEL_REGISTRY.claude.defaultModel;
  cfgOpenaiModel.value = s.openaiModel || MODEL_REGISTRY.openai.defaultModel;

  // 키 입력창은 보안을 위해 비워두고 마스킹된 상태 배지 표시
  cfgGeminiKey.value = '';
  cfgClaudeKey.value = '';
  cfgOpenaiKey.value = '';

  updateKeyPill(geminiKeyStatus, s.geminiApiKey, cfgGeminiKey);
  updateKeyPill(claudeKeyStatus, s.claudeApiKey, cfgClaudeKey);
  updateKeyPill(openaiKeyStatus, s.openaiApiKey, cfgOpenaiKey);

  chkPersistKeys.checked = Boolean(s.persistKeys);

  settingsModalOverlay.classList.remove('hidden');
}

function closeSettingsModal() {
  settingsModalOverlay.classList.add('hidden');
}

async function handleSaveSettings() {
  const selectedProvider = document.querySelector('input[name="providerSelect"]:checked')?.value || 'gemini';
  const prev = state.settings || {};

  // 빈 값이면 기존 키 유지, 입력된 값이 있으면 교체
  const newGeminiKey = cfgGeminiKey.value.trim() ? cfgGeminiKey.value.trim() : prev.geminiApiKey;
  const newClaudeKey = cfgClaudeKey.value.trim() ? cfgClaudeKey.value.trim() : prev.claudeApiKey;
  const newOpenaiKey = cfgOpenaiKey.value.trim() ? cfgOpenaiKey.value.trim() : prev.openaiApiKey;

  const newSettings = {
    activeProvider: selectedProvider,
    geminiApiKey: newGeminiKey,
    geminiModel: cfgGeminiModel.value || MODEL_REGISTRY.gemini.defaultModel,
    claudeApiKey: newClaudeKey,
    claudeModel: cfgClaudeModel.value || MODEL_REGISTRY.claude.defaultModel,
    openaiApiKey: newOpenaiKey,
    openaiModel: cfgOpenaiModel.value || MODEL_REGISTRY.openai.defaultModel,
    persistKeys: chkPersistKeys.checked
  };

  await saveSettings(newSettings);
  state.settings = newSettings;
  updateHeaderBadge();
  closeSettingsModal();
  showToast('AI 설정이 안전하게 저장되었습니다.');
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
    showToast(`먼저 ${active.provider} API 키를 등록해 주십시오.`);
    return;
  }

  state.currentAbortController = new AbortController();
  showLoading(`돈 까밀로(${active.model})가 본문과 초안을 읽고 있습니다...`);

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
      contents: promptObj.contents,
      signal: state.currentAbortController.signal
    });

    state.dialogueHistory.push({
      role: 'model',
      parts: [{ text: response }]
    });

    sectionDialogue.classList.remove('hidden');
    appendDialogueBubble('돈 까밀로 (Don Camillo)', response, true);

    sectionDialogue.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    if (err.name === 'AbortError') {
      showToast('요청이 취소되었습니다.');
    } else {
      showToast(`오류: ${err.message}`);
    }
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

  state.currentAbortController = new AbortController();
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
      contents: promptObj.contents,
      signal: state.currentAbortController.signal
    });

    state.dialogueHistory.push({
      role: 'model',
      parts: [{ text: response }]
    });

    appendDialogueBubble('돈 까밀로 (Don Camillo)', response, true);
  } catch (err) {
    if (err.name === 'AbortError') {
      showToast('요청이 취소되었습니다.');
    } else {
      showToast(`오류: ${err.message}`);
    }
  } finally {
    hideLoading();
  }
}

// Phase 2: Synthesis Essay & Markdown Export
async function handleSynthesizeEssay() {
  state.book = inputBook.value.trim();
  state.chapter = inputChapter.value.trim();
  state.scripture = inputScripture.value.trim();
  state.draft = inputDraft.value.trim();

  const active = await getActiveApiKeyAndModel();
  if (!active.apiKey) {
    openSettingsModal();
    return;
  }

  state.currentAbortController = new AbortController();
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
      isJson: true,
      signal: state.currentAbortController.signal
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
    const targetFilename = generateFilename(null, state.book, state.chapter);
    filenamePreview.textContent = targetFilename;

    sectionResult.classList.remove('hidden');
    sectionResult.scrollIntoView({ behavior: 'smooth' });
    showToast('완성 에세이가 생성되었습니다.');
  } catch (err) {
    if (err.name === 'AbortError') {
      showToast('요청이 취소되었습니다.');
    } else {
      showToast(`에세이 생성 오류: ${err.message}`);
    }
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

  // 내보내기 전 실시간 린트 재검사
  const lintCheck = lintMarkdown(currentContent);
  if (!lintCheck.valid) {
    const confirmExport = confirm(`마크다운 서식에 주의 항목이 있습니다:\n- ${lintCheck.errors.join('\n- ')}\n\n그래도 다운로드하시겠습니까?`);
    if (!confirmExport) return;
  }

  const targetFilename = generateFilename(null, state.book, state.chapter);
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
    showToast('클립보드에 복사되었습니다 (성경 본문·초안·대화·에세이 전체).');
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

btnCancelRequest.addEventListener('click', () => {
  if (state.currentAbortController) {
    state.currentAbortController.abort();
  }
});

btnStartDialogue.addEventListener('click', handleStartDialogue);
btnSendReply.addEventListener('click', handleSendReply);
btnSynthesizeEssay.addEventListener('click', handleSynthesizeEssay);
btnExportMd.addEventListener('click', handleExportMd);
btnCopyClipboard.addEventListener('click', handleCopyClipboard);

// 에디터 수정 시 실시간 린트 재검사
resultMarkdown.addEventListener('input', () => {
  const lintResult = lintMarkdown(resultMarkdown.value);
  if (lintResult.valid) {
    lintBadge.className = 'badge badge-success';
    lintBadge.textContent = '✅ 마크다운 린트 통과';
  } else {
    lintBadge.className = 'badge';
    lintBadge.textContent = `⚠️ 린트 주의: ${lintResult.errors.length}건`;
  }
});

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
