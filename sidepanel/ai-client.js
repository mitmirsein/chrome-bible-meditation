// Unified Multi-Provider AI Client (Gemini, Claude, OpenAI)
// Secure header-based authentication & AbortController support

const REQUEST_TIMEOUT_MS = 60000; // 60초 타임아웃

export async function callAI({ provider, apiKey, model, systemInstruction, contents, isJson = false, signal }) {
  if (!apiKey || !apiKey.trim()) {
    const names = { gemini: 'Google Gemini', claude: 'Anthropic Claude', openai: 'OpenAI' };
    throw new Error(`${names[provider] || provider} API 키가 등록되지 않았습니다. 상단 설정(⚙️)에서 키를 입력해 주십시오.`);
  }

  // 타임아웃 컨트롤러 결합
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort(new Error('요청 시간이 초과되었습니다 (60초 제한).'));
  }, REQUEST_TIMEOUT_MS);

  // 외부 signal이 제공된 경우 연결
  if (signal) {
    signal.addEventListener('abort', () => timeoutController.abort(signal.reason));
  }

  try {
    if (provider === 'claude') {
      return await callClaude({ apiKey, model, systemInstruction, contents, isJson, signal: timeoutController.signal });
    } else if (provider === 'openai') {
      return await callOpenAI({ apiKey, model, systemInstruction, contents, isJson, signal: timeoutController.signal });
    } else {
      return await callGemini({ apiKey, model, systemInstruction, contents, isJson, signal: timeoutController.signal });
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

// 1. Google Gemini (x-goog-api-key 헤더 전송: URL 쿼리 파라미터 노출 방지)
async function callGemini({ apiKey, model = 'gemini-3.8-flash', systemInstruction, contents, isJson, signal }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const isHighThinking = model.includes('3.8-flash') || model.includes('3.7-flash');

  const body = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 3500
    }
  };

  if (isHighThinking) {
    body.generationConfig.thinkingConfig = {
      thinkingBudget: 2048
    };
  }

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  if (isJson) {
    body.generationConfig.responseMimeType = 'application/json';
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey.trim()
    },
    body: JSON.stringify(body),
    signal
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const rawMsg = errorData.error?.message || `HTTP ${res.status} 오류`;
    throw new Error(cleanErrorMessage(rawMsg, apiKey));
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
  return text;
}

// 2. Anthropic Claude (Sonnet 5 / Opus 5)
async function callClaude({ apiKey, model = 'claude-sonnet-5', systemInstruction, contents, isJson, signal }) {
  const endpoint = 'https://api.anthropic.com/v1/messages';

  const messages = contents.map(item => ({
    role: item.role === 'model' ? 'assistant' : 'user',
    content: item.parts?.map(p => p.text).join('\n') || ''
  }));

  let system = systemInstruction || '';
  if (isJson) {
    system += '\n\nIMPORTANT: You must respond ONLY with valid JSON matching the requested schema. Do not include markdown code block tags, preamble, or commentary.';
  }

  const body = {
    model: model.trim(),
    system,
    messages,
    max_tokens: 3500,
    temperature: 0.7
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify(body),
    signal
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const rawMsg = errorData.error?.message || `HTTP ${res.status} 오류`;
    throw new Error(cleanErrorMessage(rawMsg, apiKey));
  }

  const data = await res.json();
  const text = data.content?.map(c => c.text).join('') || '';
  return text;
}

// 3. OpenAI (5.6 Luna Max / 5.6 Sol Medium / 6 Astra Low)
async function callOpenAI({ apiKey, model = 'gpt-5.6-luna-max', systemInstruction, contents, isJson, signal }) {
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }

  contents.forEach(item => {
    messages.push({
      role: item.role === 'model' ? 'assistant' : 'user',
      content: item.parts?.map(p => p.text).join('\n') || ''
    });
  });

  const body = {
    model: model.trim(),
    messages,
    temperature: 0.7,
    max_tokens: 3500
  };

  if (model.includes('sol')) {
    body.reasoning_effort = 'medium';
  } else if (model.includes('astra')) {
    body.reasoning_effort = 'low';
  }

  if (isJson) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify(body),
    signal
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const rawMsg = errorData.error?.message || `HTTP ${res.status} 오류`;
    throw new Error(cleanErrorMessage(rawMsg, apiKey));
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// 에러 메시지 내 API 키 유출 방지 새니타이저
export function cleanErrorMessage(msg, apiKey) {
  if (!msg) return '알 수 없는 오류가 발생했습니다.';
  if (apiKey && apiKey.length > 5) {
    return msg.replaceAll(apiKey.trim(), '[REDACTED_KEY]');
  }
  return msg;
}
