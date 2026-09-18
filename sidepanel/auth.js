// Multi-Provider Settings & API Key Manager

export const DEFAULT_SETTINGS = {
  activeProvider: 'gemini', // 'gemini' | 'claude' | 'openai'
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
        // 구버전 호환 (gemini_api_key)
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

// 편의 헬퍼
export async function getActiveApiKeyAndModel() {
  const s = await getSettings();
  if (s.activeProvider === 'claude') {
    return { provider: 'claude', apiKey: s.claudeApiKey, model: s.claudeModel };
  } else if (s.activeProvider === 'openai') {
    return { provider: 'openai', apiKey: s.openaiApiKey, model: s.openaiModel };
  } else {
    return { provider: 'gemini', apiKey: s.geminiApiKey, model: s.geminiModel };
  }
}
