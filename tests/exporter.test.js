import test from 'node:test';
import assert from 'node:assert/strict';
import { generateFilename, formatMeditationMarkdown, lintMarkdown } from '../sidepanel/exporter.js';

test('generateFilename formats correctly', () => {
  assert.equal(generateFilename('2026-09-18', 'Lev', '18'), '2026-09-18_lev18.md');
  assert.equal(generateFilename('2026-09-18', 'GEN', '1'), '2026-09-18_gen1.md');
  assert.equal(generateFilename('2026-09-18', '1Cor', '13'), '2026-09-18_1cor13.md');
});

test('lintMarkdown detects illegal italics and em-dashes', () => {
  const invalidText = '이것은 *이탤릭*이며 — 엠대시입니다.';
  const result = lintMarkdown(invalidText);
  assert.equal(result.valid, false);
  assert.equal(result.errors.length, 2);
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

  assert.match(output, /창세기 1:1/);
  assert.match(output, /초안 메모입니다\./);
  assert.match(output, /### 신학적 대화 프로토콜/);
  assert.match(output, /### 빛과 어둠의 분리 \(창세기 1장\)/);
  assert.match(output, /첫째 날의 말씀이 시작됩니다\./);
});
