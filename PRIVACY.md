# 개인정보 처리방침 (Privacy Policy)

최종 갱신일: 2026-09-18

**성서 묵상 동반자**(Chrome Bible Meditation Companion)는 사용자의 개인정보와 신앙적 묵상 내용의 프라이버시를 절대적으로 존중하며, **개발자 서버가 존재하지 않는 100% 클라이언트 독립 구조**(Zero-Server Architecture)로 설계되었습니다.

---

## 1. 수집하는 정보

본 확장 프로그램은 개발자, 배포자 또는 제3자 서버로 **어떠한 개인정보, API 키, 묵상 본문, 사용 통계도 전송하거나 수집하지 않습니다.**

---

## 2. API 키 및 설정 정보의 저장

- **저장 위치**: 사용자가 입력한 API 키와 모델 설정은 사용자의 웹 브라우저 로컬 저장소(`chrome.storage.session` 및 명시적 동의 시 `chrome.storage.local`)에만 격리되어 저장됩니다.
- **기본 보관 정책 (Session)**: 기본적으로 브라우저 종료 시 메모리에서 키가 영구 삭제됩니다.
- **영구 보관 선택 (Local)**: 사용자가 "이 기기에 API 키 기억하기"를 직접 체크한 경우에만 로컬 브라우저 프로필에 저장됩니다.
- **삭제 방법**: 사이드 패널 상단 설정(⚙️) 창에서 언제든지 입력된 키를 즉시 삭제할 수 있습니다.

---

## 3. 제3자 AI 공급자로의 데이터 전송

사용자가 "대화 시작" 또는 "에세이 종합"을 실행할 때, 본문 구절과 묵상 메모는 오직 **사용자가 선택한 AI 공급자의 공식 HTTPS 엔드포인트**로만 직접 암호화 전송됩니다:

- **Google Gemini**: [Google API 서비스 사용자 데이터 정책](https://developers.google.com/terms/api-services-user-data-policy) 및 [Google 개인정보처리방침](https://policies.google.com/privacy)
- **Anthropic Claude**: [Anthropic 상업적 데이터 보호 정책](https://www.anthropic.com/privacy)
- **OpenAI**: [OpenAI Business Privacy Policy](https://openai.com/enterprise-privacy)

> **주의 사항**: 기밀 정보, 주민등록번호 등 민감한 개인 식별 정보는 묵상 메모에 입력하지 마십시오.

---

## 4. 권한 안내

- `sidePanel`: 브라우저 우측에 묵상 작업 패널을 표시하기 위해 사용됩니다.
- `storage`: 사용자가 등록한 API 키와 모델 설정을 사용자 기기에 로컬 보관하기 위해 사용됩니다.
- `host_permissions`: 선택한 공식 AI 공급자 엔드포인트와 통신하기 위해서만 사용됩니다.
