export function generateFilename(dateStr, book, chapter) {
  const cleanBook = (book || 'meditation').trim().toLowerCase().replace(/\s+/g, '');
  const cleanChapter = (chapter || '1').trim().toLowerCase();
  const cleanDate = dateStr || new Date().toISOString().slice(0, 10);
  return `${cleanDate}_${cleanBook}${cleanChapter}.md`;
}

export function lintMarkdown(text) {
  const errors = [];
  // Detect single asterisk italics (not part of double asterisk bold)
  if (/(?<!\*)\*(?!\*)[^*\n]+(?<!\*)\*(?!\*)/.test(text) || /(?<!_)_(?!_)[^_\n]+(?<!_)_(?!_)/.test(text)) {
    errors.push('이탤릭 서식(*text* 또는 _text_)이 발견되었습니다. 볼드만 허용됩니다.');
  }
  // Detect em-dashes (— or –)
  if (/[\u2014\u2013]/.test(text)) {
    errors.push('엠대시(— 또는 –)가 발견되었습니다. 쉼표, 콜론 또는 접속사를 사용해야 합니다.');
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
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
