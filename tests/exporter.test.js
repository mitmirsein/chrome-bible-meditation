import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getLocalIsoDate,
  sanitizeFilenamePart,
  generateFilename,
  formatMeditationMarkdown,
  lintMarkdown,
  renderDialogueMarkdown
} from '../sidepanel/exporter.js';

test('getLocalIsoDate returns formatted local YYYY-MM-DD', () => {
  const fixedDate = new Date(2026, 8, 18, 9, 30); // 2026-09-18 (월은 0-indexed)
  assert.equal(getLocalIsoDate(fixedDate), '2026-09-18');

  const now = new Date();
  const res = getLocalIsoDate(now);
  assert.match(res, /^\d{4}-\d{2}-\d{2}$/);
});

test('sanitizeFilenamePart cleans illegal filesystem characters and whitespace', () => {
  assert.equal(sanitizeFilenamePart('Lev:18/test?*'), 'lev18test');
  assert.equal(sanitizeFilenamePart('  1 Corinthians  '), '1corinthians');
  assert.equal(sanitizeFilenamePart('<Script>|File"'), 'scriptfile');
  assert.equal(sanitizeFilenamePart(''), '');
});

test('generateFilename formats correctly and sanitizes special characters', () => {
  assert.equal(generateFilename('2026-09-18', 'Lev', '18'), '2026-09-18_lev18.md');
  assert.equal(generateFilename('2026-09-18', 'GEN', '1'), '2026-09-18_gen1.md');
  assert.equal(generateFilename('2026-09-18', '1Cor', '13'), '2026-09-18_1cor13.md');
  assert.equal(generateFilename('2026-09-18', 'Lev:18', '18?'), '2026-09-18_lev1818.md');
});

test('lintMarkdown detects illegal italics and em-dashes', () => {
  const invalidText = '이것은 *이탤릭*이며 — 엠대시입니다.';
  const result = lintMarkdown(invalidText);
  assert.equal(result.valid, false);
  assert.equal(result.errors.length, 2);
});

test('lintMarkdown detects unsafe scripts or javascript URI', () => {
  const xssText = '본문 내용 <script>alert("XSS")</script>';
  const result1 = lintMarkdown(xssText);
  assert.equal(result1.valid, false);
  assert.match(result1.errors[0], /보안 위협/);

  const uriText = '참조 링크: [Click](javascript:stealData())';
  const result2 = lintMarkdown(uriText);
  assert.equal(result2.valid, false);
  assert.match(result2.errors[0], /보안 위협/);
});

test('lintMarkdown passes clean markdown', () => {
  const cleanText = '이것은 **정상적인** 볼트이며, 쉼표로 분리되었습니다.';
  const result = lintMarkdown(cleanText);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('formatMeditationMarkdown structures 3-part layout correctly', () => {
  const output = formatMeditationMarkdown({
    scripture: '창세기 1:1',
    draft: '초안 메모입니다.',
    protocol: {
      initialInsight: '초기 통찰 요약',
      donCamillo: '돈 까밀로의 질문',
      deepenedInsight: '심화된 통찰 요약'
    },
    essayTitle: '빛과 어둠의 분리',
    bookRef: '창세기 1장',
    essayBody: '첫째 날의 말씀이 시작됩니다.'
  });

  assert.match(output, /### 성경 본문 \(창세기 1장\)/);
  assert.match(output, /> 창세기 1:1/);
  assert.match(output, /### 1차 묵상 초안 메모 \(씨앗\)/);
  assert.match(output, /초안 메모입니다\./);
  assert.match(output, /### 신학적 대화 프로토콜/);
  assert.match(output, /### 빛과 어둠의 분리 \(창세기 1장\)/);
  assert.match(output, /첫째 날의 말씀이 시작됩니다\./);
});

test('renderDialogueMarkdown converts bold quotes, blockquotes, and sanitizes XSS', () => {
  const input = '**"그들이 깨끗하지 않은 가운데서 죽지 않을 것이다."**\n\n> 레위기 18장 말씀\n이것은 **중요한** 질문입니다.';
  const html = renderDialogueMarkdown(input);

  assert.match(html, /<strong>&quot;그들이 깨끗하지 않은 가운데서 죽지 않을 것이다\.&quot;<\/strong>/);
  assert.match(html, /<blockquote class="dialogue-quote">레위기 18장 말씀<\/blockquote>/);
  assert.match(html, /<strong>중요한<\/strong>/);
  assert.match(html, /<br>/);

  // XSS protection
  const malicious = '<script>alert("XSS")</script>';
  const safeHtml = renderDialogueMarkdown(malicious);
  assert.equal(safeHtml.includes('<script>'), false);
  assert.match(safeHtml, /&lt;script&gt;/);
});


