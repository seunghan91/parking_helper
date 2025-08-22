# 04. 크롬 확장 MVP 가이드 (WXT + TypeScript + MV3)

## 상단 체크리스트
- [x] 지도 도메인 권한 설정
- [x] 패널 주입(세 지도 서비스) 동작
- [x] 장소 선택/좌표 파싱 로직
- [x] Supabase 근접 검색 연동
- [x] 빈 상태/오류 처리

## 개발 상태 업데이트
- ✅ **해결됨**: WXT 프레임워크로 변경하여 안정적인 빌드 환경 확보
- ✅ TypeScript 네이티브 지원으로 타입 안전성 확보
- ⚠️ **진행 중**: Supabase 프로젝트 설정 및 실제 API 연동 (현재 Mock 데이터)

# 크롬 확장 MVP 가이드 (WXT + TypeScript + MV3)

## 목표
- 네이버/카카오/구글 지도 페이지에 사이드바 패널을 주입해 주차 리뷰와 꿀팁을 보여준다.

## 스택
- **WXT Framework**: Vite 기반 빌드 시스템, TypeScript 네이티브 지원
- **Manifest V3**: 최신 Chrome Extension 표준
- **Supabase 클라이언트**: 읽기 전용 쿼리 (익명 키)

## DOM Hook 전략
- URL 감지: `history.pushState`/`popstate`와 `location.href` 변화 감시
- DOM 감지: `MutationObserver`로 장소 패널 영역의 타이틀/주소 노드 관찰
- 좌표 파싱: 지도 SDK 객체(노출 불가 시 DOM에 박힌 데이터-속성)에서 lat/lng 추출
- 디바운스: 장소 변경 감지 후 300ms 디바운스로 검색 호출
- 캐싱: 최근 10개 장소 질의 결과 메모리 캐시(5분 TTL)

## 타깃 도메인
- `https://map.naver.com/*`, `https://map.kakao.com/*`, `https://www.google.com/maps/*`

## 빠른 시작 (WXT)
```bash
# WXT 프로젝트 생성
mkdir parking-helper-extension && cd parking-helper-extension
npm init -y
npm install wxt typescript @types/chrome

# TypeScript 설정 및 WXT 준비
npm run postinstall

# 개발 서버 시작 (HMR 지원)
npm run dev

# 프로덕션 빌드
npm run build
```

### 프로젝트 구조 (WXT File-based Routing)
```
parking-helper-extension/
├── entrypoints/           # 자동으로 manifest 엔트리 생성
│   ├── content.ts        # Content script
│   ├── popup.html        # Popup HTML
│   ├── popup.ts          # Popup TypeScript
│   └── background.ts     # Service Worker (선택사항)
├── components/           # 재사용 가능한 컴포넌트
│   └── ParkingPanel.ts   # 파킹 패널 UI 로직
├── utils/                # 유틸리티 함수
│   ├── mapDetector.ts    # 지도 서비스 감지
│   ├── placeParser.ts    # 장소 정보 파싱
│   └── apiClient.ts      # API 호출 로직
├── assets/               # 정적 파일
│   └── icon-*.png        # 아이콘들
├── wxt.config.ts         # WXT 설정
└── tsconfig.json         # TypeScript 설정
```

### WXT 설정 (`wxt.config.ts`)
```ts
import { defineConfig } from 'wxt'

export default defineConfig({
  manifest: {
    name: '파킹 헬퍼',
    description: '네이버, 카카오, 구글 지도에서 주차 리뷰와 꿀팁 제공',
    version: '1.0.0',
    host_permissions: [
      'https://map.naver.com/*',
      'https://map.kakao.com/*',
      'https://www.google.com/maps/*',
      'https://maps.google.com/*'
    ],
    permissions: ['storage'],
    icons: {
      16: 'icon-16.png',
      48: 'icon-48.png', 
      128: 'icon-128.png'
    }
  },
  outDir: '.output'
})
```

### Content Script (`entrypoints/content.ts`)
```ts
export default defineContentScript({
  matches: [
    'https://map.naver.com/*',
    'https://map.kakao.com/*', 
    'https://www.google.com/maps/*'
  ],
  cssInjectionMode: 'ui',
  main(ctx) {
    // WXT의 콘텍스트 활용
    console.log('파킹 헬퍼 확장 프로그램 로드됨')
    
    // UI 생성 (WXT의 createShadowRootUi 활용)
    const ui = createShadowRootUi(ctx, {
      name: 'parking-helper-panel',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        // 파킹 헬퍼 패널 마운트
        initParkingHelper(container)
      }
    })
    
    ui.mount()
  }
})

function initParkingHelper(container: HTMLElement) {
  // 기존 ParkingHelperExtension 로직을 여기에 구현
  const parkingHelper = new ParkingHelperExtension(container)
}
```

## 성능 버짓
- 초기 패널 주입 < 150ms
- 검색 API 왕복 p95 < 800ms (프리뷰 환경 기준)
- 메인 스레드 장시간 블로킹 금지(>50ms 작업 쪼개기)

## 기본 구조
- content script: DOM 관찰/좌표 파싱/검색 트리거
- UI 컴포넌트: 패널 렌더링, 로딩/빈/오류 상태 관리
- background(service worker): 알림/컨텍스트 메뉴 등 확장

## 예시 흐름
1) 장소 클릭 → URL/DOM 변화 감지
2) 좌표/장소ID 파싱 → 캐시 조회 → 미스 시 검색 API 호출
3) 패널에 추천/리뷰 요약 표시

## DoD
- 세 지도 서비스에서 패널이 보이고 검색에 따라 내용이 갱신됨
- 오류 시 재시도/빈 상태(UI) 처리
