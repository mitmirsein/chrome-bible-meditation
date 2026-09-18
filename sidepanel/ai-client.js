// Unified Multi-Provider AI Client (Gemini, Claude, OpenAI)

export async function callAI({ provider, apiKey, model, systemInstruction, contents, isJson = false }) {
  if (!apiKey) {
    const names = { gemini: 'Google Gemini', claude: 'Anthropic Claude', openai: 'OpenAI' };
    throw new Error(`${names[provider] || provider} API 키가 등록되지 않았습니다. 상단 설정(⚙️)에서 키를 입력해 주십시오.`);
  }

  if (provider === 'claude') {
    return callClaude({ apiKey, model, systemInstruction, contents, isJson });
  } else if (provider === 'openai') {
    return callOpenAI({ apiKey, model, systemInstruction, contents, isJson });
  } else {
    return callGemini({ apiKey, model, systemInstruction, contents, isJson });
  }
}

// 1. Google Gemini (3.8 Flash High / 3.7 Flash High / 3.1 Pro)
async function callGemini({ apiKey, model = 'gemini-3.8-flash', systemInstruction, contents, isJson }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API 오류 (HTTP ${res.status})`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
  return text;
}

// 2. Anthropic Claude (Sonnet 5 / Opus 5)
async function callClaude({ apiKey, model = 'claude-sonnet-5', systemInstruction, contents, isJson }) {
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
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Claude API 오류 (HTTP ${res.status})`);
  }

  const data = await res.json();
  const text = data.content?.map(c => c.text).join('') || '';
  return text;
}

// 3. OpenAI (5.6 Luna Max / 5.6 Sol Medium / 6 Astra Low)
async function callOpenAI({ apiKey, model = 'gpt-5.6-luna-max', systemInstruction, contents, isJson }) {
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

  // 모델별 추론 effort 파라미터 매핑
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
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API 오류 (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
