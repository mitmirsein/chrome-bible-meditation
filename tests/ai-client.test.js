import test from 'node:test';
import assert from 'node:assert/strict';
import { callAI } from '../sidepanel/ai-client.js';

test('callAI throws descriptive error when apiKey is missing', async () => {
  await assert.rejects(
    async () => {
      await callAI({ provider: 'claude', apiKey: '', model: 'claude-sonnet-5', contents: [] });
    },
    /Anthropic Claude API 키가 등록되지 않았습니다/
  );

  await assert.rejects(
    async () => {
      await callAI({ provider: 'openai', apiKey: '', model: 'gpt-5.6-luna-max', contents: [] });
    },
    /OpenAI API 키가 등록되지 않았습니다/
  );

  await assert.rejects(
    async () => {
      await callAI({ provider: 'openai', apiKey: '', model: 'gpt-6-astra', contents: [] });
    },
    /OpenAI API 키가 등록되지 않았습니다/
  );

  await assert.rejects(
    async () => {
      await callAI({ provider: 'gemini', apiKey: '', model: 'gemini-3.8-flash', contents: [] });
    },
    /Google Gemini API 키가 등록되지 않았습니다/
  );
});
