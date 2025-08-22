# 파킹 헬퍼 Chrome Extension 배포 가이드

## 배포 프로세스

### 1. 로컬 빌드 및 테스트

```bash
# 의존성 설치
pnpm install

# 타입 체크
pnpm compile

# 테스트 실행
pnpm test

# 프로덕션 빌드
pnpm build

# 배포용 ZIP 생성
pnpm zip
```

### 2. Chrome Web Store 수동 배포

1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) 접속
2. "새 항목" 또는 기존 항목 업데이트 선택
3. `.output/chrome-mv3.zip` 파일 업로드
4. 스토어 등록 정보 입력/업데이트:
   - 상세 설명
   - 스크린샷 (1280x800 권장)
   - 프로모션 이미지
   - 카테고리 선택
5. 검토 제출

### 3. GitHub Actions 자동 배포

#### 필요한 Secrets 설정

GitHub 저장소 Settings > Secrets and variables > Actions에서 설정:

- `PRODUCTION_API_URL`: 프로덕션 API URL
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY`: Supabase 익명 키
- `CHROME_EXTENSION_ID`: Chrome Web Store 확장 프로그램 ID
- `CHROME_CLIENT_ID`: Google API OAuth 클라이언트 ID
- `CHROME_CLIENT_SECRET`: Google API OAuth 클라이언트 시크릿
- `CHROME_REFRESH_TOKEN`: Google API OAuth 리프레시 토큰

#### Chrome Web Store API 설정

1. [Google Cloud Console](https://console.cloud.google.com)에서 프로젝트 생성
2. Chrome Web Store API 활성화
3. OAuth 2.0 클라이언트 ID 생성
4. 리프레시 토큰 획득 (한 번만 필요)

### 4. 버전 관리

1. `package.json`의 version 업데이트
2. `manifest.json`의 version은 자동으로 동기화됨
3. 시맨틱 버저닝 사용:
   - MAJOR.MINOR.PATCH (예: 1.2.3)
   - MAJOR: 호환성이 깨지는 변경
   - MINOR: 새로운 기능 추가
   - PATCH: 버그 수정

### 5. 배포 체크리스트

- [ ] 모든 테스트 통과
- [ ] 버전 번호 업데이트
- [ ] CHANGELOG.md 업데이트
- [ ] 환경 변수 확인
- [ ] 권한(permissions) 변경사항 검토
- [ ] 스크린샷 업데이트 (UI 변경 시)
- [ ] 개인정보 처리방침 업데이트 (필요 시)

### 6. 롤백 절차

1. Chrome Web Store에서 이전 버전으로 되돌리기:
   - Developer Dashboard > 버전 관리
   - 이전 버전 선택 > 프로덕션으로 승격

2. 긴급 패치:
   - 핫픽스 브랜치 생성
   - 수정 후 즉시 배포
   - 나중에 main 브랜치에 병합

### 7. 모니터링

- Chrome Web Store 리뷰 및 평점 모니터링
- 사용자 피드백 수집
- 크래시 리포트 확인
- 설치/제거 통계 추적

## 문제 해결

### 빌드 실패
- Node.js 버전 확인 (18.x 또는 20.x)
- pnpm 캐시 정리: `pnpm store prune`
- node_modules 재설치: `rm -rf node_modules && pnpm install`

### Chrome Web Store 거부
- 권한 사용 설명 명확히 작성
- 개인정보 처리방침 링크 확인
- 스크린샷과 실제 기능 일치 확인

### API 연동 문제
- 환경 변수 설정 확인
- CORS 설정 확인
- API 엔드포인트 접근성 확인