# 🚗 파킹 헬퍼 (Parking Helper)

> 대한민국 No.1 실사용자 기반 주차 정보 통합 플랫폼

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-username/parking-helper)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-yellow.svg)](https://chrome.google.com/webstore)

## 🎯 비전

국내 주요 지도 서비스(네이버, 카카오, 구글) 사용자에게 가장 정확하고 유용한 실사용자 기반 주차 정보를 제공하여, 목적지 주변 주차 스트레스를 완벽하게 해소하는 대한민국 No.1 주차 정보 통합 플랫폼

## ✨ 주요 기능

### 🗺️ 지도 서비스 통합
- **네이버 지도**: 실시간 주차장 정보 오버레이
- **카카오맵**: 주차 리뷰 사이드바 통합
- **구글 지도**: 주차 팁 자동 표시

### 📍 주차 정보 서비스
- **실시간 주차장 정보**: 위치, 요금, 운영시간
- **사용자 리뷰**: 별점 평가 및 상세 후기
- **주차 꿀팁**: 할인 정보, 숨은 주차장, 무료 주차 시간대
- **즐겨찾기**: 자주 가는 주차장 저장

### 💡 커뮤니티 기능
- **익명 리뷰 작성**: 간편한 주차 경험 공유
- **팁 공유**: 할인 쿠폰, 제휴 정보 등
- **유용함 투표**: 좋은 리뷰 추천 시스템

## 🏗️ 프로젝트 구조

```
parking-helper/
├── 📁 parking-helper-web/       # Next.js 웹 애플리케이션
│   ├── src/
│   │   ├── app/              # App Router 페이지
│   │   ├── components/       # React 컴포넌트
│   │   └── lib/             # 유틸리티 및 설정
│   └── supabase/            # DB 마이그레이션
│
├── 📁 parking-helper-extension/  # WXT 크롬 확장 프로그램
│   ├── entrypoints/         # 확장 프로그램 진입점
│   │   ├── content.ts       # 콘텐츠 스크립트
│   │   ├── background.ts    # 백그라운드 서비스 워커
│   │   └── popup/          # 팝업 UI
│   └── utils/              # 헬퍼 함수
│
└── 📁 docs/                     # 프로젝트 문서
    ├── 01-prd.md           # 제품 요구사항
    ├── 02-architecture.md   # 시스템 아키텍처
    └── ...                 # 기타 문서
```

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.0 Beta
- **State Management**: Zustand, React Query
- **Testing**: Vitest, Playwright

### Backend
- **Database**: Supabase Postgres with RLS
- **Authentication**: Supabase Auth (OAuth, Email/Password)
- **API**: Next.js Route Handlers + Supabase Edge Functions
- **Real-time**: Supabase Realtime subscriptions

### Chrome Extension
- **Framework**: WXT (Vite-based)
- **Manifest**: V3
- **Architecture**: Content Scripts + Service Worker
- **Build**: TypeScript + Vite

## 시작하기

### 사전 요구사항
- Node.js 20.x 이상
- npm 또는 pnpm
- Supabase 계정
- Vercel 계정 (배포용)

### 설치 및 실행

1. 저장소 클론
```bash
git clone https://github.com/your-username/parking-helper.git
cd parking-helper
```

2. 웹 애플리케이션 실행
```bash
cd parking-helper-web
npm install
cp .env.example .env.local
# .env.local에 Supabase 키 설정
npm run dev
```

3. 크롬 확장 프로그램 빌드
```bash
cd parking-helper-extension
./build.sh
# Chrome에서 chrome://extensions 접속
# 개발자 모드 활성화 후 'dist' 폴더 로드
```

## 개발 가이드

### 테스트 실행
```bash
# 단위 테스트
npm test

# E2E 테스트
npm run test:e2e
```

### 코드 스타일
```bash
npm run lint
```

## 배포

### Vercel 배포
1. Vercel에 GitHub 저장소 연결
2. 환경변수 설정 (Supabase 키, Map API 키 등)
3. main 브랜치 푸시 시 자동 배포

### 크롬 웹 스토어 배포
1. `npm run build` 실행
2. `dist` 폴더를 zip으로 압축
3. Chrome Web Store 개발자 대시보드에 업로드

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이센스

이 프로젝트는 MIT 라이센스 하에 있습니다.

## 문의

프로젝트에 대한 문의사항은 이슈를 생성해주세요.