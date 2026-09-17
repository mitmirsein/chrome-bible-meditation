const GEMINI_MODEL = 'gemini-3.8-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function callGemini({ apiKey, systemInstruction, contents, isJson = false }) {
  if (!apiKey) {
    throw new Error('Gemini API 키가 등록되지 않았습니다. 상단의 [API 키 등록] 버튼을 눌러 키를 입력해 주십시오.');
  }

  const body = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 3500,
      thinkingConfig: {
        thinkingBudget: 2048
      }
    }
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  if (isJson) {
    body.generationConfig.responseMimeType = 'application/json';
  }

  const endpoint = `${BASE_URL}?key=${encodeURIComponent(apiKey.trim())}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `HTTP ${response.status} 오류가 발생했습니다.`;
    throw new Error(message);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.map(p => p.text).join('') || '';
  return text;
}
