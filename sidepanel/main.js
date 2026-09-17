import { getGoogleAuthToken, removeGoogleAuthToken, getGoogleUserProfile } from './auth.js';
import { callGemini } from './gemini.js';
import { buildDonCamilloPrompt, buildSynthesisPrompt } from './prompts.js';
import { generateFilename, formatMeditationMarkdown, lintMarkdown, triggerDownload } from './exporter.js';

// Application State
const state = {
  authToken: null,
  dialogueHistory: [],
  synthesizedMarkdown: '',
  book: '',
  chapter: '',
  scripture: '',
  draft: ''
};

// DOM Elements
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const userBadge = document.getElementById('userBadge');
const userEmail = document.getElementById('userEmail');

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

// Authentication
async function checkAuth(interactive = false) {
  try {
    const token = await getGoogleAuthToken(interactive);
    state.authToken = token;

    const profile = await getGoogleUserProfile(token);
    userEmail.textContent = profile?.email || '인증됨';
    btnLogin.classList.add('hidden');
    userBadge.classList.remove('hidden');
    return token;
  } catch (err) {
    state.authToken = null;
    btnLogin.classList.remove('hidden');
    userBadge.classList.add('hidden');
    if (interactive) {
      showToast(`로그인 실패: ${err.message}`);
    }
    return null;
  }
}

async function handleLogout() {
  if (state.authToken) {
    await removeGoogleAuthToken(state.authToken);
    state.authToken = null;
    btnLogin.classList.remove('hidden');
    userBadge.classList.add('hidden');
    showToast('로그아웃되었습니다.');
  }
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

  if (!state.authToken) {
    const token = await checkAuth(true);
    if (!token) return;
  }

  showLoading('돈 까밀로가 본문과 묵상 초안을 읽고 있습니다...');
  try {
    state.dialogueHistory = [];
    dialogueFeed.innerHTML = '';

    const promptObj = buildDonCamilloPrompt({
      scripture: state.scripture,
      draft: state.draft,
      dialogueHistory: state.dialogueHistory
    });

    const response = await callGemini({
      token: state.authToken,
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

  if (!state.authToken) {
    showToast('로그인이 필요합니다.');
    return;
  }

  appendDialogueBubble('나의 묵상 응답', replyText, false);
  inputUserReply.value = '';

  state.dialogueHistory.push({
    role: 'user',
    parts: [{ text: replyText }]
  });

  showLoading('돈 까밀로가 신학적 사유를 되묻고 있습니다...');
  try {
    const promptObj = buildDonCamilloPrompt({
      scripture: state.scripture,
      draft: state.draft,
      dialogueHistory: state.dialogueHistory
    });

    const response = await callGemini({
      token: state.authToken,
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
  if (!state.authToken) {
    showToast('로그인이 필요합니다.');
    return;
  }

  showLoading('C.S. Lewis × Eugene Peterson 스타일로 완성 에세이를 집필 중입니다...');
  try {
    const promptObj = buildSynthesisPrompt({
      scripture: state.scripture,
      draft: state.draft,
      dialogueHistory: state.dialogueHistory,
      book: state.book,
      chapter: state.chapter
    });

    const rawJson = await callGemini({
      token: state.authToken,
      systemInstruction: promptObj.systemInstruction,
      contents: promptObj.contents,
      isJson: true
    });

    let data;
    try {
      data = JSON.parse(rawJson);
    } catch {
      // Fallback clean
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
btnLogin.addEventListener('click', () => checkAuth(true));
btnLogout.addEventListener('click', handleLogout);
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

// Init on mount
checkAuth(false);
