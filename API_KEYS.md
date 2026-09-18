# 🔑 AI 공급자별 API 키 발급 가이드 (API_KEYS.md)

본 문서는 **성서 묵상 동반자**(Chrome Bible Meditation Companion)를 사용하기 위해 필요한 각 인공지능 공급자(Google Gemini, Anthropic Claude, OpenAI)의 공식 API 키 발급 방법과 안전한 관리 지침을 설명합니다.

---

## 🔒 BYOK(Bring Your Own Key) 보안 원칙

- **개발자 서버 Zero**: 본 확장 프로그램은 중간 프록시 서버나 중앙 데이터베이스를 일체 두지 않습니다.
- **직접 암호화 통신**: 사용자가 입력한 API 키는 브라우저 내부에서만 안전하게 보관되며, 오직 사용자가 선택한 AI 공급자의 공식 HTTPS 엔드포인트로만 직접 암호화 전송됩니다.
- **기본 세션 보관**: 브라우저를 닫으면 키가 메모리에서 자동 소멸(`chrome.storage.session`)되도록 설계되어 있어 공용 PC에서도 안전하게 이용하실 수 있습니다. (원하실 경우에만 '이 기기에 기억하기' 선택 가능)

---

## 1. Google Gemini API 키 발급 (100% 무료 티어 권장)

Google Gemini는 개인 개발 및 비상업적 용도에 대해 관대한 **무료 사용 한도(Free Tier)**를 제공합니다. 결제 수단 등록 없이 100% 무료로 이용하시려면 다음 안내를 따라 주십시오.

### 발급 절차
1. [**Google AI Studio API Keys 대시보드**](https://aistudio.google.com/apikey)에 접속하여 Google 계정으로 로그인합니다.
2. 화면 상단의 **[Create API key]**(API 키 만들기) 파란색 버튼을 클릭합니다.
3. **⚠️ 과금 방지 핵심 주의사항**:
   - 프로젝트 선택 팝업이 뜨면, 이미 신용카드가 연결된 기존 Google Cloud 프로젝트를 선택하지 마십시오. (기존 유료 프로젝트 선택 시 종량제 과금이 발생할 수 있습니다.)
   - 반드시 **[➕ Create project]**(새 프로젝트 만들기)를 선택하여 카드가 연결되지 않은 독립 프로젝트(예: `Bible-Meditation-Free`)를 새로 생성하십시오.
4. 생성이 완료되면 화면에 표시되는 `AIzaSy...` 형태의 API 키 문자열을 복사합니다.
5. 크롬 브라우저에서 확장 프로그램 사이드 패널 상단의 **설정(⚙️)**을 누르고, **Google Gemini API Key** 입력란에 붙여넣은 뒤 **[저장하기]**를 누릅니다.

---

## 2. Anthropic Claude API 키 발급

Anthropic Claude(Claude Sonnet 5, Opus 5)는 문학적 표현력과 신학적 문해력이 가장 뛰어난 엔진 중 하나입니다.

### 발급 절차
1. [**Anthropic Console API Keys 페이지**](https://console.anthropic.com/settings/keys)에 접속하여 가입 및 로그인합니다.
2. 상단 메뉴의 **[Settings]** ➔ **[Plans & Billing]**으로 이동하여 소액의 초기 크레딧(최소 $5 내외)을 충전합니다.
3. 좌측 메뉴의 **[API Keys]**로 이동한 뒤 **[Create Key]** 버튼을 클릭합니다.
4. 키 이름을 입력(예: `Bible-Meditation`)하고 생성을 완료합니다.
5. 화면에 표시되는 `sk-ant-...` 형태의 키 문자열을 복사하여 확장 프로그램 설정 모달에 등록합니다.

---

## 3. OpenAI API 키 발급

OpenAI(GPT 5.6 Luna Max, 5.6 Sol, 6 Astra)는 빠른 속도와 안정적인 추론 성능을 제공합니다.

### 발급 절차
1. [**OpenAI API Keys 대시보드**](https://platform.openai.com/api-keys)에 접속하여 로그인합니다.
2. 좌측 메뉴의 **[Settings]** ➔ **[Billing]**에서 사용 크레딧 잔액을 확인하고 필요 시 충전합니다.
3. [API Keys] 페이지 중앙의 **[Create new secret key]** 버튼을 클릭합니다.
4. 키 이름을 입력하고 권한을 기본값(All permissions)으로 둔 뒤 생성을 완료합니다.
5. 생성된 `sk-...` 형태의 키 문자열을 복사하여 확장 프로그램 설정 모달에 등록합니다.

---

## 🛠️ API 키 관리 및 삭제 방법

- **키 변경 및 갱신**: 언제든지 사이드 패널 상단 설정(⚙️) 창을 열어 새로운 키를 덮어써서 입력할 수 있습니다.
- **키 즉시 삭제**: 설정 창에서 해당 공급자의 입력란을 선택한 후 빈 칸 상태로 두거나 브라우저 캐시를 정리하면 저장된 키가 완전히 제거됩니다.
- **등록 상태 확인**: 설정 모달 내 초록색 배지(`등록됨 (마스킹)`)를 통해 현재 키가 정상 등록되었는지 확인할 수 있습니다.
