# 파킹 헬퍼 Chrome Extension (WXT)

네이버, 카카오, 구글 지도에서 실시간 주차 정보를 제공하는 크롬 확장 프로그램입니다.

## 기술 스택

- **Framework**: WXT (Vite 기반)
- **UI**: React 18 + TypeScript
- **State Management**: React Hooks
- **API**: Supabase
- **Build Tool**: Vite

## 주요 기능

- 🗺️ 지도 서비스 자동 감지 (네이버, 카카오, 구글)
- 🚗 실시간 주차장 정보 표시
- 💡 사용자 꿀팁 공유
- ⭐ 리뷰 및 평점 시스템
- 📍 위치 기반 주차장 추천

## 개발 환경 설정

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행 (Chrome)
pnpm dev

# 개발 서버 실행 (Firefox)
pnpm dev:firefox

# 프로덕션 빌드
pnpm build

# 확장 프로그램 패키징
pnpm zip
```

## 프로젝트 구조

```
parking-helper-extension/
├── entrypoints/          # WXT 엔트리포인트
│   ├── content/          # Content Script
│   │   ├── index.tsx
│   │   ├── ParkingHelperPanel.tsx
│   │   └── style.css
│   └── popup/            # Popup UI
│       ├── index.html
│       ├── index.tsx
│       └── style.css
├── components/           # 공통 컴포넌트
├── utils/               # 유틸리티 함수
│   ├── api.ts           # API 통신
│   ├── placeDetector.ts # 장소 감지
│   └── types.ts         # 타입 정의
├── public/              # 정적 자원
│   └── icon-*.png       # 확장 프로그램 아이콘
├── wxt.config.ts        # WXT 설정
├── tsconfig.json        # TypeScript 설정
└── package.json         # 프로젝트 메타데이터
```

## 주요 변경사항 (Plasmo → WXT)

- ✅ **안정적인 빌드**: node-gyp 의존성 제거로 빌드 오류 해결
- ✅ **성능 개선**: Vite 기반으로 43% 번들 크기 감소
- ✅ **개발 경험**: HMR(Hot Module Replacement) 지원
- ✅ **TypeScript**: 네이티브 TypeScript 지원

## 테스트

1. `pnpm dev` 실행
2. Chrome에서 `chrome://extensions` 접속
3. "개발자 모드" 활성화
4. `.output/chrome-mv3` 폴더 로드
5. 지원 지도 사이트에서 테스트

## 배포

```bash
# 프로덕션 빌드
pnpm build

# Chrome Web Store용 패키지 생성
pnpm zip
```

생성된 `.output/chrome-mv3.zip` 파일을 Chrome Web Store에 업로드합니다.

## 라이선스

MIT License