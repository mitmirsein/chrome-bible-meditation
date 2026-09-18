import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDonCamilloPrompt, buildSynthesisPrompt } from '../sidepanel/prompts.js';

test('buildDonCamilloPrompt includes Don Camillo persona and guardrails', () => {
  const prompt = buildDonCamilloPrompt({
    scripture: '레위기 18:3-4',
    draft: '광야의 코람데오가 중요합니다.',
    dialogueHistory: []
  });

  assert.match(prompt.systemInstruction, /돈 까밀로/);
  assert.match(prompt.systemInstruction, /신부님 신부님 우리들의 신부님/);
  assert.match(prompt.systemInstruction, /도전적 질문/);
  assert.match(prompt.systemInstruction, /형식적 칭찬/);
  assert.equal(prompt.contents.length, 1);
});

test('buildSynthesisPrompt enforces C.S. Lewis x Eugene Peterson style and lint rules', () => {
  const prompt = buildSynthesisPrompt({
    scripture: '레위기 18:3-4',
    draft: '초안 내용',
    dialogueHistory: [
      { role: 'model', parts: [{ text: '질문입니다' }] },
      { role: 'user', parts: [{ text: '답변입니다' }] }
    ],
    book: 'Lev',
    chapter: '18'
  });

  assert.match(prompt.systemInstruction, /C\.S\. Lewis/);
  assert.match(prompt.systemInstruction, /Eugene Peterson/);
  assert.match(prompt.systemInstruction, /이탤릭 일체 금지/);
  assert.match(prompt.systemInstruction, /엠대시 일체 금지/);
  assert.match(prompt.systemInstruction, /신학적 대화 프로토콜/);
});
