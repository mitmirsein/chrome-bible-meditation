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

export function formatMeditationMarkdown({ scripture, draft, protocol = {}, essayTitle, bookRef, essayBody }) {
  const cleanTitle = (essayTitle || '').replace(/:/g, '').trim();
  const scriptureText = scripture && scripture.trim() ? scripture.trim() + '\n\n' : '';
  const draftText = (draft || '').trim();
  const headerSection = `${scriptureText}${draftText}`;

  const protocolSection = `### 신학적 대화 프로토콜

- **초기 통찰과 질문**: ${protocol.initialInsight || ''}
- **돈 까밀로**(Don Camillo)의 도전적 질문: ${protocol.donCamillo || ''}
- **심화된 통찰과 종합**: ${protocol.deepenedInsight || ''}`;

  const titleHeader = bookRef ? `### ${cleanTitle} (${bookRef.trim()})` : `### ${cleanTitle}`;
  const essaySection = `${titleHeader}\n\n${(essayBody || '').trim()}`;

  return `${headerSection}\n\n---\n\n${protocolSection}\n\n---\n\n${essaySection}\n`;
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
