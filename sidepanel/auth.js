// Secure Multi-Provider Settings & Key Storage (session by default, local when explicit)
import { MODEL_REGISTRY } from './models.js';

export const DEFAULT_SETTINGS = {
  activeProvider: 'gemini',
  geminiModel: MODEL_REGISTRY.gemini.defaultModel,
  claudeModel: MODEL_REGISTRY.claude.defaultModel,
  openaiModel: MODEL_REGISTRY.openai.defaultModel,
  persistKeys: false // 명시적 선택 시에만 local 저장
};

function getStorage(area = 'session') {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    if (area === 'session' && chrome.storage.session) {
      return chrome.storage.session;
    }
    if (chrome.storage.local) {
      return chrome.storage.local;
    }
  }
  return null;
}

export function maskApiKey(key) {
  if (!key || key.length < 8) return '';
  const start = key.slice(0, 4);
  const end = key.slice(-4);
  return `${start}••••••••${end}`;
}

export async function getSettings() {
  const sessionStore = getStorage('session');
  const localStore = getStorage('local');

  let settings = { ...DEFAULT_SETTINGS };
  let keys = { geminiApiKey: '', claudeApiKey: '', openaiApiKey: '' };

  // 1. local 읽기 (영구 설정)
  if (localStore) {
    const localData = await new Promise(r => localStore.get(['settings', 'keys'], r));
    if (localData?.settings) {
      settings = { ...settings, ...localData.settings };
    }
    if (settings.persistKeys && localData?.keys) {
      keys = { ...keys, ...localData.keys };
    }
  } else {
    try {
      const raw = localStorage.getItem('bbm_settings');
      if (raw) settings = { ...settings, ...JSON.parse(raw) };
      if (settings.persistKeys) {
        const rawKeys = localStorage.getItem('bbm_keys');
        if (rawKeys) keys = { ...keys, ...JSON.parse(rawKeys) };
      }
    } catch {}
  }

  // 2. session 읽기 (세션 키 우선 적용)
  if (sessionStore) {
    const sessionData = await new Promise(r => sessionStore.get(['keys'], r));
    if (sessionData?.keys) {
      keys = {
        geminiApiKey: sessionData.keys.geminiApiKey || keys.geminiApiKey,
        claudeApiKey: sessionData.keys.claudeApiKey || keys.claudeApiKey,
        openaiApiKey: sessionData.keys.openaiApiKey || keys.openaiApiKey
      };
    }
  } else {
    try {
      const rawSession = sessionStorage.getItem('bbm_session_keys');
      if (rawSession) {
        const sKeys = JSON.parse(rawSession);
        keys = {
          geminiApiKey: sKeys.geminiApiKey || keys.geminiApiKey,
          claudeApiKey: sKeys.claudeApiKey || keys.claudeApiKey,
          openaiApiKey: sKeys.openaiApiKey || keys.openaiApiKey
        };
      }
    } catch {}
  }

  return { ...settings, ...keys };
}

export async function saveSettings({
  activeProvider,
  geminiModel,
  claudeModel,
  openaiModel,
  persistKeys,
  geminiApiKey,
  claudeApiKey,
  openaiApiKey
}) {
  const sessionStore = getStorage('session');
  const localStore = getStorage('local');

  const settingsToSave = {
    activeProvider: activeProvider || 'gemini',
    geminiModel: geminiModel || MODEL_REGISTRY.gemini.defaultModel,
    claudeModel: claudeModel || MODEL_REGISTRY.claude.defaultModel,
    openaiModel: openaiModel || MODEL_REGISTRY.openai.defaultModel,
    persistKeys: Boolean(persistKeys)
  };

  const keysToSave = {
    geminiApiKey: (geminiApiKey || '').trim(),
    claudeApiKey: (claudeApiKey || '').trim(),
    openaiApiKey: (openaiApiKey || '').trim()
  };

  // 1. 설정은 local에 보관
  if (localStore) {
    await new Promise(r => localStore.set({ settings: settingsToSave }, r));
    if (settingsToSave.persistKeys) {
      await new Promise(r => localStore.set({ keys: keysToSave }, r));
    } else {
      // 영구 저장 미선택 시 local에서 키 제거
      await new Promise(r => localStore.remove(['keys'], r));
    }
  } else {
    localStorage.setItem('bbm_settings', JSON.stringify(settingsToSave));
    if (settingsToSave.persistKeys) {
      localStorage.setItem('bbm_keys', JSON.stringify(keysToSave));
    } else {
      localStorage.removeItem('bbm_keys');
    }
  }

  // 2. 키는 항상 session에 보관 (브라우저 닫으면 삭제)
  if (sessionStore) {
    await new Promise(r => sessionStore.set({ keys: keysToSave }, r));
  } else {
    sessionStorage.setItem('bbm_session_keys', JSON.stringify(keysToSave));
  }
}

export async function deleteProviderKey(provider) {
  const current = await getSettings();
  const fieldMap = {
    gemini: 'geminiApiKey',
    claude: 'claudeApiKey',
    openai: 'openaiApiKey'
  };
  const targetField = fieldMap[provider];
  if (targetField) {
    current[targetField] = '';
    await saveSettings(current);
  }
}

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
