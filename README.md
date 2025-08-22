# 파킹 헬퍼 (Parking Helper)

🚗 대한민국 No.1 실사용자 기반 주차 정보 통합 플랫폼

## 🎯 최근 업데이트

### Plasmo → WXT 마이그레이션 완료 (2024.08)
- ✅ **빌드 안정성 향상**: node-gyp 의존성 제거
- ✅ **번들 크기 93% 감소**: 4.08MB → 259KB  
- ✅ **개발 경험 개선**: Vite 기반 HMR 지원
- ✅ **TypeScript 네이티브 지원**

자세한 내용은 [마이그레이션 보고서](./parking-helper-extension/MIGRATION_REPORT.md)를 참조하세요.

## 개요

파킹 헬퍼는 네이버, 카카오, 구글 지도 사용자에게 실시간 주차 정보와 꿀팁을 제공하는 서비스입니다.

### 주요 기능
- 🗺️ 주요 지도 서비스와 통합된 크롬 확장 프로그램
- 📍 실시간 주차장 정보 및 요금 안내
- 💡 실사용자들의 주차 꿀팁 공유
- ⭐ 주차장 리뷰 및 평점 시스템

## 프로젝트 구조

```
parking-helper/
├── parking-helper-web/       # Next.js 웹 애플리케이션
├── parking-helper-extension/ # 크롬 확장 프로그램
└── docs/                    # 프로젝트 문서
```

## 기술 스택

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Extension**: WXT Framework (Vite-based), React, Manifest V3
- **Deployment**: Vercel, Chrome Web Store

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