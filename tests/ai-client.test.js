import test from 'node:test';
import assert from 'node:assert/strict';
import { callAI, cleanErrorMessage } from '../sidepanel/ai-client.js';
import { MODEL_REGISTRY, getModelLabel } from '../sidepanel/models.js';

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
      await callAI({ provider: 'gemini', apiKey: '', model: 'gemini-3.8-flash', contents: [] });
    },
    /Google Gemini API 키가 등록되지 않았습니다/
  );
});

test('cleanErrorMessage redacts API keys from error messages', () => {
  const secretKey = 'sk-ant-api03-testkey-1234567890abcdef';
  const rawMsg = `Request failed: authentication failed for ${secretKey} on endpoint`;
  const sanitized = cleanErrorMessage(rawMsg, secretKey);

  assert.equal(sanitized.includes(secretKey), false);
  assert.match(sanitized, /\[REDACTED_KEY\]/);
});

test('MODEL_REGISTRY has user-demanded recommended models at rank 1', () => {
  // Gemini rank 1: gemini-3.8-flash
  assert.equal(MODEL_REGISTRY.gemini.models[0].id, 'gemini-3.8-flash');
  assert.match(MODEL_REGISTRY.gemini.models[0].label, /권장/);

  // Claude rank 1: claude-sonnet-5, only 2 models (fable excluded)
  assert.equal(MODEL_REGISTRY.claude.models[0].id, 'claude-sonnet-5');
  assert.equal(MODEL_REGISTRY.claude.models.length, 2);
  assert.match(MODEL_REGISTRY.claude.models[0].label, /권장/);

  // OpenAI rank 1: gpt-5.6-luna-max
  assert.equal(MODEL_REGISTRY.openai.models[0].id, 'gpt-5.6-luna-max');
  assert.match(MODEL_REGISTRY.openai.models[0].label, /권장/);
});

test('getModelLabel strips prefix numbers cleanly', () => {
  assert.equal(getModelLabel('gemini', 'gemini-3.8-flash'), 'Gemini 3.8 Flash High (권장)');
  assert.equal(getModelLabel('claude', 'claude-sonnet-5'), 'Claude Sonnet 5 (권장)');
  assert.equal(getModelLabel('openai', 'gpt-5.6-luna-max'), 'GPT 5.6 Luna Max (권장)');
});

