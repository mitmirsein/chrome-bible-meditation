# 📖 성서 묵상 동반자 (Chrome Bible Meditation Companion)

성경 읽기 웹사이트(대한성서공회 등)를 이용하면서 브라우저 우측 사이드 패널(Side Panel)을 통해 성경 본문과 1차 초안 메모를 작성하고, **돈 까밀로(Don Camillo)** 페르소나와의 신학적 대화를 거쳐 완성도 높은 묵상 에세이(C.S. Lewis × Eugene Peterson 스타일)를 정본 마크다운(`.md`) 파일로 다운로드할 수 있는 크롬 확장 프로그램입니다.

---

## ✨ 핵심 기능

1. **원페이지 스크롤형 사이드 패널 (Side Panel API)**
   - 브라우저 우측에 도킹되어 웹 서핑이나 성경 읽기 탭과 나란히 작업 가능
   - 1차 본문/초안 작성 ➔ 신학적 대화 ➔ 완성 에세이 및 내보내기가 단일 스크롤 캔버스로 이어지는 직관적 UI
2. **구글 OAuth 2.0 원클릭 로그인 (`chrome.identity`)**
   - 복잡한 API 키 관리 없이 구글 계정 인증으로 Gemini API 연동
   - 모델: `gemini-3.8-flash` (thinking budget: High / 2048)
3. **신학적 대화 프로토콜 (Phase 1: 돈 까밀로 페르소나)**
   - 형식적 칭찬과 상투적 감탄 배제
   - 본문 텍스트의 역사적·실존적 맥락을 파고드는 날카롭고 도전적인 질문 제시
   - 사용자와의 턴제 대화 지원
4. **최고급 묵상 에세이 종합 (Phase 2)**
   - C.S. Lewis(명료한 비유와 논리) × Eugene Peterson(시적 감각과 일상 언어) 하이브리드 문체
   - 소제목 없는 4~5문단의 단정한 산문
   - 핵심 사물/제의 요소와 실존의 1:1 대구로 응축된 제목 생성 (콜론 금지)
5. **마크다운 린트 무결성 검증 및 Export as MD**
   - 이탤릭(`*text*`, `_text_`) 일체 배제
   - 엠대시(`—`, `–`) 배제
   - 클릭 시 `yyyy-mm-dd_성경영문약어+chapter.md` (예: `2026-09-18_lev18.md`)로 자동 다운로드 및 클립보드 원클릭 복사

---

## 🛠️ 설치 및 설정 가이드

### 1. Chrome에 확장 프로그램 로드
1. 구글 크롬 브라우저를 열고 주소창에 `chrome://extensions`를 입력하여 이동합니다.
2. 우측 상단의 **[개발자 모드]** 토글을 켭니다.
3. 좌측 상단의 **[압축해제된 확장 프로그램을 로드합니다]** 버튼을 클릭합니다.
4. 파일 탐색기에서 본 프로젝트 폴더(`projects/chrome-bible-meditation/`)를 선택합니다.
5. 로드 완료 후 생성된 **확장 프로그램 ID**(예: `abcdefghijklmnop...`)를 확인합니다.

---

### 2. Google Cloud OAuth 2.0 Client ID 설정
Google 계정으로 Gemini API를 호출하기 위해 GCP 콘솔에서 클라이언트 ID를 설정합니다:

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속합니다.
2. 프로젝트를 생성하거나 기존 프로젝트를 선택합니다.
3. **[API 및 서비스]** ➔ **[라이브러리]**로 이동하여 **Generative Language API**를 검색하고 **[사용]**을 클릭합니다.
4. **[API 및 서비스]** ➔ **[OAuth 동의 화면]**에서 사용자 유형(외부)을 선택하고 기본 정보를 등록합니다.
   - 범위(Scope)에 `https://www.googleapis.com/auth/generative-language` 및 `userinfo.email`을 추가합니다.
   - 앱 게시 상태가 '테스트'인 경우, 본인의 구글 계정을 **테스트 사용자**에 등록합니다.
5. **[사용자 인증 정보]** ➔ **[사용자 인증 정보 만들기]** ➔ **[OAuth 클라이언트 ID]**를 선택합니다.
   - 애플리케이션 유형: **Chrome 확장 프로그램**
   - 항목 ID: 위 1단계에서 확인한 **확장 프로그램 ID**를 입력합니다.
6. 생성된 **클라이언트 ID**(예: `xxxxxx.apps.googleusercontent.com`)를 복사합니다.
7. `projects/chrome-bible-meditation/manifest.json` 파일을 열고 `oauth2.client_id` 항목에 붙여넣습니다:
   ```json
   "oauth2": {
     "client_id": "여기에_복사한_클라이언트_ID_입력.apps.googleusercontent.com",
     "scopes": [
       "https://www.googleapis.com/auth/generative-language",
       "https://www.googleapis.com/auth/userinfo.email"
     ]
   }
   ```
8. 크롬의 `chrome://extensions` 페이지에서 본 확장 프로그램의 새로고침(🔄) 버튼을 누릅니다.

---

## 🚀 사용 방법

1. 대한성서공회(`https://bible.bskorea.or.kr/bible/`) 등 성경 읽기 웹사이트에 접속합니다.
2. 브라우저 우측 상단 확장 프로그램 아이콘 바에서 **[성서 묵상 동반자]** 아이콘을 클릭합니다.
3. 우측에 열린 사이드 패널에서:
   - 상단 **Google 로그인** 버튼을 눌러 계정을 인증합니다.
   - 성경 약어(예: `Lev`)와 장(예: `18`)을 입력합니다.
   - 읽던 성경 구절과 본인의 거친 1차 초안 묵상 메모를 입력합니다.
   - **[🎭 돈 까밀로와 대화 시작]**을 클릭합니다.
4. 돈 까밀로의 날카로운 질문을 읽고 답변을 주고받으며 사유를 심화합니다.
5. 충분히 대화가 무르익으면 **[✍️ 에세이 종합하기]**를 클릭합니다.
6. 생성된 완성 에세이와 린트 통과 여부를 확인한 뒤, **[📥 Export as MD]** 버튼을 눌러 마크다운 파일로 다운로드합니다.

---

## 🧪 테스트 실행

```bash
npm test
```
모든 단위 테스트(파일명 포맷터, 마크다운 린터, 프롬프트 빌더)를 검증합니다.
