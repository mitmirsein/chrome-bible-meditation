# 기여 가이드 (Contributing Guide)

프로젝트 기여에 관심 가져주셔서 감사합니다! 본 가이드는 개발 환경 설정 및 코드 기여 절차를 설명합니다.

---

## 🛠️ 개발 환경 설정

1. 저장소 클론:
   ```bash
   git clone https://github.com/mitmirsein/chrome-bible-meditation.git
   cd chrome-bible-meditation
   ```
2. Chrome 브라우저에 언팩 로드:
   - `chrome://extensions` 접속 ➔ **[개발자 모드]** 켜기
   - **[압축해제된 확장 프로그램을 로드합니다]** ➔ 본 폴더 선택
3. 단위 테스트 실행:
   ```bash
   npm test
   ```

---

## 📐 코딩 및 보안 원칙

1. **절대 경로 금지**: 커밋되는 코드, 설정, 문서에 머신 종속적인 절대 경로(`/Users/...` 등)를 하드코딩하지 않습니다.
2. **BYOK 보안 원칙**: 중앙 서버를 도입하지 않으며, API 키는 항상 클라이언트 로컬/세션 샌드박스에만 격리 보관합니다.
3. **모델 레지스트리 단일 출처 (SSOT)**: 신규 모델 추가 시 `sidepanel/models.js`의 `MODEL_REGISTRY`에만 등록하여 중복을 방지합니다.
4. **마크다운 린트 무결성**: 묵상 에세이 출력물에 이탤릭(`*text*`), 엠대시(`—`), 부적합 URL 스킴이 포함되지 않도록 유지합니다.
