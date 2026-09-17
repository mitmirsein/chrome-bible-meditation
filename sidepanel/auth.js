// API Key Storage & Manager (chrome.storage.local)

export async function getApiKey() {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      const localKey = localStorage.getItem('gemini_api_key') || '';
      return resolve(localKey);
    }
    chrome.storage.local.get(['gemini_api_key'], (result) => {
      resolve(result.gemini_api_key || '');
    });
  });
}

export async function setApiKey(apiKey) {
  const cleanKey = (apiKey || '').trim();
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      localStorage.setItem('gemini_api_key', cleanKey);
      return resolve();
    }
    chrome.storage.local.set({ gemini_api_key: cleanKey }, () => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve();
    });
  });
}

export async function removeApiKey() {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      localStorage.removeItem('gemini_api_key');
      return resolve();
    }
    chrome.storage.local.remove(['gemini_api_key'], () => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve();
    });
  });
}
