// Single Source of Truth (SSOT) Model Registry

export const MODEL_REGISTRY = {
  gemini: {
    name: 'Google Gemini',
    badgeColor: '#10b981',
    defaultModel: 'gemini-3.8-flash',
    models: [
      { id: 'gemini-3.8-flash', label: '1. Gemini 3.8 Flash High (권장)', thinking: 'high' },
      { id: 'gemini-3.7-flash', label: '2. Gemini 3.7 Flash High', thinking: 'high' },
      { id: 'gemini-3.1-pro-preview', label: '3. Gemini 3.1 Pro Preview', thinking: 'standard' }
    ]
  },
  claude: {
    name: 'Anthropic Claude',
    badgeColor: '#8b5cf6',
    defaultModel: 'claude-sonnet-5',
    models: [
      { id: 'claude-sonnet-5', label: '1. Claude Sonnet 5 (권장)' },
      { id: 'claude-opus-5', label: '2. Claude Opus 5' }
    ]
  },
  openai: {
    name: 'OpenAI',
    badgeColor: '#3b82f6',
    defaultModel: 'gpt-5.6-luna-max',
    models: [
      { id: 'gpt-5.6-luna-max', label: '1. GPT 5.6 Luna Max (권장)' },
      { id: 'gpt-5.6-sol', label: '2. GPT 5.6 Sol Medium', effort: 'medium' },
      { id: 'gpt-6-astra', label: '3. GPT 6 Astra Low', effort: 'low' }
    ]
  }
};

export function getModelLabel(provider, modelId) {
  const p = MODEL_REGISTRY[provider];
  if (!p) return modelId;
  const m = p.models.find(item => item.id === modelId);
  return m ? m.label.replace(/^\d+\.\s*/, '') : `${p.name} (${modelId})`;
}
