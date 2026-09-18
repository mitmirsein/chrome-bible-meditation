// Multi-Provider Settings & API Key Manager

export const AVAILABLE_MODELS = {
  gemini: [
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash High (권장)', thinking: 'high' },
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash High', thinking: 'high' },
    { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', thinking: 'standard' }
  ],
  claude: [
    { id: 'claude-sonnet-5', name: 'Claude Sonnet 5 (권장)' },
    { id: 'claude-opus-5', name: 'Claude Opus 5' }
  ],
  openai: [
    { id: 'gpt-5.6-luna-max', name: 'GPT 5.6 Luna Max (권장)' },
    { id: 'gpt-5.6-sol', name: 'GPT 5.6 Sol Medium', effort: 'medium' },
    { id: 'gpt-6-astra', name: 'GPT 6 Astra Low', effort: 'low' }
  ]
};

export const DEFAULT_SETTINGS = {
  activeProvider: 'gemini',
  geminiApiKey: '',
  claudeApiKey: '',
  openaiApiKey: '',
  geminiModel: 'gemini-3.8-flash',
  claudeModel: 'claude-sonnet-5',
  openaiModel: 'gpt-5.6-luna-max'
};

export async function getSettings() {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      try {
        const raw = localStorage.getItem('bible_meditation_settings');
        const parsed = raw ? JSON.parse(raw) : {};
        if (!parsed.geminiApiKey) {
          parsed.geminiApiKey = localStorage.getItem('gemini_api_key') || '';
        }
        return resolve({ ...DEFAULT_SETTINGS, ...parsed });
      } catch {
        return resolve({ ...DEFAULT_SETTINGS });
      }
    }

    chrome.storage.local.get(['settings', 'gemini_api_key'], (result) => {
      const stored = result.settings || {};
      if (!stored.geminiApiKey && result.gemini_api_key) {
        stored.geminiApiKey = result.gemini_api_key;
      }
      resolve({ ...DEFAULT_SETTINGS, ...stored });
    });
  });
}

export async function saveSettings(newSettings) {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      localStorage.setItem('bible_meditation_settings', JSON.stringify(newSettings));
      return resolve();
    }
    chrome.storage.local.set({ settings: newSettings }, () => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve();
    });
  });
}

export async function getActiveApiKeyAndModel() {
  const s = await getSettings();
  if (s.activeProvider === 'claude') {
    return { provider: 'claude', apiKey: s.claudeApiKey, model: s.claudeModel || 'claude-sonnet-5' };
  } else if (s.activeProvider === 'openai') {
    return { provider: 'openai', apiKey: s.openaiApiKey, model: s.openaiModel || 'gpt-5.6-luna-max' };
  } else {
    return { provider: 'gemini', apiKey: s.geminiApiKey, model: s.geminiModel || 'gemini-3.8-flash' };
  }
}
