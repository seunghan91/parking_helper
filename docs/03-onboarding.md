# 03. 온보딩 가이드 (Supabase / Next.js / Vercel / Plasmo)

## 상단 체크리스트
- [x] Node/패키지 매니저 설치
- [ ] Supabase 프로젝트/키 설정
- [x] .env.local 구성
- [ ] 로컬 로그인/프로필 조회 성공
- [ ] Vercel 프리뷰 배포 확인

## 개발 중 이슈 (해결됨)
- ~~Plasmo 설치 시 node-gyp 빌드 오류 발생 (크롬 확장 프로그램)~~
- **해결**: WXT 프레임워크로 변경하여 빌드 안정성 확보

# 온보딩 가이드 (Supabase / Next.js / Vercel / WXT)

## 목적
- 로컬 개발 환경을 30분 내 구성하고 Next.js와 Supabase를 연동하며, Vercel 배포까지 끝낸다.
- WXT 프레임워크를 사용한 크롬 확장 프로그램 개발 환경 구성

## 선행 조건
- Node.js 20.x, pnpm 또는 npm
- GitHub, Vercel, Supabase 계정

## 빠른 시작
1) 저장소 클론
```bash
git clone <repo>
cd parking_helper
```
2) Next.js 초기화(프로젝트가 없다면)
```bash
pnpm create next-app@latest --typescript
```
3) 의존성 설치
```bash
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs @tanstack/react-query
```
4) 환경변수 생성
```bash
cp .env.example .env.local
# 필수
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
5) Supabase 클라이언트 `lib/supabaseClient.ts`
```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```
6) 개발 서버 실행
```bash
pnpm dev
```

## 인증(SSO)
- Supabase Dashboard → Authentication → Providers → Google 활성화
- 로컬 Redirect URL: `http://localhost:3000/auth/callback`
- 로그인/세션 관리는 `@supabase/auth-helpers-nextjs` 권장

## Vercel 배포
1) Vercel에서 GitHub 저장소 연결, Framework: Next.js 자동 인식
2) 환경변수에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가
3) Preview 배포 확인 후 Production Promote

## WXT 크롬 확장 프로그램 설정

### WXT 프로젝트 생성
```bash
cd parking_helper
mkdir parking-helper-extension
cd parking-helper-extension
npm init -y
npm install wxt typescript @types/chrome
```

### WXT 구성 파일 설정

1) `package.json` 스크립트 설정
```json
{
  "name": "parking-helper-extension",
  "version": "1.0.0",
  "scripts": {
    "dev": "wxt",
    "dev:firefox": "wxt -b firefox",
    "build": "wxt build",
    "build:firefox": "wxt build -b firefox",
    "zip": "wxt zip",
    "compile": "tsc --noEmit",
    "postinstall": "wxt prepare"
  },
  "dependencies": {
    "@types/chrome": "^0.1.4",
    "typescript": "^5.9.2", 
    "wxt": "^0.20.8"
  }
}
```

2) `wxt.config.ts` 설정
```ts
import { defineConfig } from 'wxt'

export default defineConfig({
  manifest: {
    name: '파킹 헬퍼',
    description: '네이버, 카카오, 구글 지도에서 주차 리뷰와 꿀팁을 제공하는 크롬 확장 프로그램',
    version: '1.0.0',
    host_permissions: [
      'https://map.naver.com/*',
      'https://map.kakao.com/*',
      'https://www.google.com/maps/*',
      'https://maps.google.com/*'
    ],
    permissions: ['storage']
  },
  outDir: '.output'
})
```

3) `tsconfig.json` 설정  
```json
{
  "extends": "wxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node"
  }
}
```

4) Content Script 생성 (`entrypoints/content.ts`)
```ts
export default defineContentScript({
  matches: [
    'https://map.naver.com/*',
    'https://map.kakao.com/*', 
    'https://www.google.com/maps/*'
  ],
  main() {
    // 파킹 헬퍼 로직 구현
    console.log('파킹 헬퍼 확장 프로그램 로드됨')
    initParkingHelper()
  }
})

function initParkingHelper() {
  // 기존 파킹 헬퍼 로직을 여기에 이식
  // ParkingHelperExtension 클래스 인스턴스 생성
}
```

5) Popup 생성 (`entrypoints/popup.html`)
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>파킹 헬퍼</title>
</head>
<body>
  <div id="app">
    <h1>🅿️ 파킹 헬퍼</h1>
    <p>지도에서 주차 정보를 확인하세요!</p>
  </div>
  <script type="module" src="./popup.ts"></script>
</body>
</html>
```

6) Popup Script (`entrypoints/popup.ts`)
```ts
// Popup 로직 구현
console.log('파킹 헬퍼 팝업 로드됨')
```

### WXT 개발 및 빌드
```bash
# WXT 준비 (types 생성)
npm run postinstall

# 개발 모드 (HMR 지원) - Chrome
npm run dev

# 개발 모드 - Firefox
npm run dev:firefox

# 프로덕션 빌드
npm run build

# ZIP 패키지 생성 (스토어 업로드용)
npm run zip

# TypeScript 컴파일 검사
npm run compile
```

### 크롬에서 테스트
```bash
# 1. chrome://extensions/ 접속
# 2. 개발자 모드 활성화
# 3. "압축해제된 확장 프로그램을 로드합니다" 클릭
# 4. .output/chrome-mv3 폴더 선택

# 개발 중에는 자동으로 리로드됨 (HMR)
```

### 디렉토리 구조
```
parking-helper-extension/
├── entrypoints/           # WXT entrypoints
│   ├── content.ts        # Content script
│   ├── popup.html        # Popup HTML
│   ├── popup.ts          # Popup script
│   └── background.ts     # Service worker (선택)
├── assets/              # 정적 파일
│   └── icon.png
├── wxt.config.ts        # WXT 설정
├── tsconfig.json        # TypeScript 설정
└── package.json         # 패키지 설정
```

### 환경 변수 설정 (.env.example 생성)
```bash
# Web App
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Map APIs
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_client_id
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=your_kakao_app_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## 체크리스트(DoD)
- [x] WXT 크롬 확장 프로그램 설정 완료
- [ ] 로컬/프리뷰에서 로그인 → 프로필 조회 성공
- [ ] Supabase SQL Editor에서 `profiles` 레코드 확인 가능
- [ ] 크롬 확장 프로그램 로드 및 기본 동작 확인
