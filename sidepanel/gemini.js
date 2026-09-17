const GEMINI_MODEL = 'gemini-3.8-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function callGemini({ token, systemInstruction, contents, isJson = false }) {
  if (!token) {
    throw new Error('인증 토큰이 없습니다. 먼저 상단의 Google 로그인 버튼을 눌러주십시오.');
  }

  const body = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 3000,
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

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
