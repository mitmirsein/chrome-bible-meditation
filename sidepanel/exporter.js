// Markdown Formatter, Linter & Local-Safe Exporter

export function getLocalIsoDate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function sanitizeFilenamePart(str) {
  if (!str) return '';
  // 파일 시스템 금지 문자 및 제어문자 제거: / \ : * ? " < > | 및 공백
  return str
    .replace(/[\\/:*?"<>|\x00-\x1f\x7f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

export function generateFilename(dateStr, book, chapter) {
  const cleanBook = sanitizeFilenamePart(book) || 'meditation';
  const cleanChapter = sanitizeFilenamePart(chapter) || '1';
  const cleanDate = dateStr ? dateStr.trim() : getLocalIsoDate();
  return `${cleanDate}_${cleanBook}${cleanChapter}.md`;
}

export function lintMarkdown(text) {
  const errors = [];
  if (!text) return { valid: true, errors: [] };

  // 1. 이탤릭 서식 감지 (*text* 또는 _text_) - 볼드(**) 제외
  if (/(?<!\*)\*(?!\*)[^*\n]+(?<!\*)\*(?!\*)/.test(text) || /(?<!_)_(?!_)[^_\n]+(?<!_)_(?!_)/.test(text)) {
    errors.push('이탤릭 서식(*text* 또는 _text_)이 발견되었습니다. 볼드만 허용됩니다.');
  }

  // 2. 엠대시 감지 (— 또는 –)
  if (/[\u2014\u2013]/.test(text)) {
    errors.push('엠대시(— 또는 –)가 발견되었습니다. 쉼표, 콜론 또는 접속사를 사용해야 합니다.');
  }

  // 3. 보안 검사: 위험한 인라인 스크립트 및 XSS 패턴
  if (/<script[\s>]/i.test(text) || /javascript:/i.test(text)) {
    errors.push('보안 위협: 허용되지 않은 스크립트 태그 또는 javascript: URL 스킴이 발견되었습니다.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function renderDialogueMarkdown(rawText) {
  if (!rawText) return '';

  // 1. XSS 방지를 위한 HTML 엔티티 이스케이프
  let safe = rawText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // 2. 이탤릭 및 엠대시 린트/정제
  safe = safe.replace(/[\u2014\u2013]/g, ', '); // 엠대시를 쉼표로 정제
  safe = safe.replace(/(?<!\*)\*(?!\*)([^*\n]+)(?<!\*)\*(?!\*)/g, '<strong>$1</strong>'); // 단일 별표 이탤릭을 볼드로 정제

  // 3. 인용구 블록 렌더링 (&gt; 인용문)
  safe = safe.replace(/(?:^|\n)&gt;\s*([^\n]+)/g, '<blockquote class="dialogue-quote">$1</blockquote>');

  // 4. 볼드 렌더링: **"인용구"** 및 **텍스트** 패턴을 <strong> 태그로 변환
  safe = safe.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');

  // 5. 줄바꿈 변환
  safe = safe.replace(/\n/g, '<br>');
  safe = safe.replace(/(<\/blockquote>)<br>/g, '$1');

  return safe;
}

export function formatMeditationMarkdown({ scripture, draft, protocol = {}, essayTitle, bookRef, essayBody }) {
  const cleanTitle = (essayTitle || '').replace(/:/g, '').trim();
  const refText = bookRef && bookRef.trim() ? ` (${bookRef.trim()})` : '';

  const parts = [];

  // 1. 성경 본문
  if (scripture && scripture.trim()) {
    const quotedScripture = scripture
      .trim()
      .split('\n')
      .map(line => line.trim() ? `> ${line.trim()}` : '>')
      .join('\n');
    parts.push(`### 성경 본문${refText}\n\n${quotedScripture}`);
  }

  // 2. 1차 묵상 초안 메모 (씨앗)
  if (draft && draft.trim()) {
    parts.push(`### 1차 묵상 초안 메모 (씨앗)\n\n${draft.trim()}`);
  }

  // 3. 신학적 대화 프로토콜
  const protocolSection = `### 신학적 대화 프로토콜

- **초기 통찰과 질문**: ${protocol.initialInsight || ''}
- **돈 까밀로**(Don Camillo)의 도전적 질문: ${protocol.donCamillo || ''}
- **심화된 통찰과 종합**: ${protocol.deepenedInsight || ''}`;
  parts.push(protocolSection);

  // 4. 완성 묵상 에세이
  const titleHeader = bookRef && bookRef.trim() ? `### ${cleanTitle} (${bookRef.trim()})` : `### ${cleanTitle}`;
  const essaySection = `${titleHeader}\n\n${(essayBody || '').trim()}`;
  parts.push(essaySection);

  return parts.join('\n\n---\n\n') + '\n';
}

export function triggerDownload(filename, content) {
  const cleanName = filename.replace(/[\\/:*?"<>|]/g, '_');
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = cleanName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
