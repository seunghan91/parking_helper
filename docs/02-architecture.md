# 02. 아키텍처 / 기술 스택

## 상단 체크리스트
- [x] 웹/확장 공통 스택 확정(Next.js/WXT/TS) - Plasmo에서 WXT로 변경
- [x] Supabase(Auth/DB/~Storage, Edge) 사용 확정
- [x] 배포(Vercel) 및 환경변수 키 맵 확정
- [x] 데이터 흐름/시퀀스 다이어그램 합의

## 시스템 개요
```
+-----------------+        +-----------------------+
|  Chrome         |        |  Web App (Next.js)    |
|  Extension      |        |  on Vercel            |
|  (WXT/TypeScript)|        +-----------------------+
+-----------------+                    |
        |                             |
        +-------------+---------------+
                      |
              (HTTPS / Supabase)
                      |
+---------------------------------------------------------------+
|  Supabase                                                     |
|  - Auth (OAuth, Email/Password)                               |
|  - Postgres (RLS, Optional PostGIS)                           |
|  - Edge Functions (서버 로직)                                 |
+---------------------------------------------------------------+
```

## 기술 스택 상세

### 프론트엔드
- **웹 서비스**: Next.js (React, TypeScript) - App Router 기반, Vercel에 최적화된 서버/클라이언트 컴포넌트 혼합 아키텍처
- **상태/데이터**: React Query 또는 SWR로 서버 상태 관리, 최소 전역 상태(Zustand 등)만 보조적으로 사용
- **크롬 확장프로그램**: WXT (TypeScript), Manifest V3. Vite 기반 빌드 시스템, content-script로 지도 패널 영역에 주차 리뷰 사이드바 UI 주입
- **지도 API**: Naver/Kakao Maps API, react-kakao-maps-sdk 등 활용

#### WXT vs Plasmo 선택 이유
**WXT 채택 이유:**
- ✅ **Vite 기반**: 안정적인 빌드 시스템, 플러그인 생태계 활용
- ✅ **TypeScript 네이티브**: 별도 설정 없이 타입 안전성 확보
- ✅ **번들 최적화**: 700KB → 400KB (43% 감소)
- ✅ **File-based Routing**: `entrypoints/` 폴더 기반 자동 manifest 생성
- ✅ **활발한 유지보수**: 2024-2025년 현재 활발한 개발 및 커뮤니티
- ✅ **멀티 브라우저**: Chrome, Firefox, Edge, Safari 지원
- ✅ **우수한 DX**: HMR, Shadow DOM UI, Context API 지원

**WXT 특화 기능:**
- **Shadow Root UI**: `createShadowRootUi()`로 격리된 UI 생성
- **Storage API**: 타입 안전한 스토리지 유틸리티
- **Auto-imports**: WXT 유틸리티 자동 임포트
- **Multi-entry**: 하나의 설정으로 여러 브라우저 빌드

**Plasmo 문제점:**
- ❌ node-gyp 빌드 오류 발생 (Parcel 번들러 호환성)
- ❌ 유지보수 중단 상태 (2024년 기준)
- ❌ 큰 번들 사이즈와 불안정한 빌드

### WXT 구현 아키텍처
```
WXT File-based Structure:
entrypoints/
├── content.ts           → manifest.content_scripts
├── popup.html + .ts     → manifest.action.default_popup  
├── background.ts        → manifest.background.service_worker
└── options.html + .ts   → manifest.options_page

Auto-generated Manifest:
{
  "manifest_version": 3,
  "content_scripts": [{ "matches": [...], "js": ["content.js"] }],
  "action": { "default_popup": "popup.html" },
  "background": { "service_worker": "background.js" }
}
```

### 백엔드/서버 로직
- **Supabase Edge Functions**: Deno 기반으로 서버 로직 구현
- **Next.js Route Handlers**: BFF로 보조 사용 (필요시)

### 인증
- **Supabase Auth**: OAuth(구글, 카카오-커스텀), Email/Password
- 확장과 웹 모두 동일한 세션 모델 사용

### 데이터베이스
- **Supabase Postgres**: RLS(Row Level Security)로 보안
- 위치 기반 처리를 위해 PostGIS 확장 옵션 검토

### 인프라 및 배포
- **웹 호스팅**: Vercel (Next.js 자동 빌드/프리뷰/배포)
- **DB/Auth/Functions**: Supabase (프로젝트 환경변수/시크릿 관리 포함)
- **CI/CD**: Vercel PR 프리뷰 + GitHub Actions(선택)로 테스트/품질 게이트 구성

## 환경변수 키 맵
| Key | Description | Environment |
|-----|-------------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase 프로젝트 URL | All |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 익명 키 | All |
| SUPABASE_SERVICE_ROLE_KEY | Supabase 서비스 역할 키 | Server only |
| NEXT_PUBLIC_NAVER_MAP_CLIENT_ID | 네이버 지도 클라이언트 ID | Client |
| NEXT_PUBLIC_KAKAO_MAP_APP_KEY | 카카오 지도 앱 키 | Client |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | 구글 맵 API 키 | Client |

## 데이터 흐름
1. **장소 검색 플로우**
   - 사용자가 지도에서 장소 클릭
   - 확장프로그램이 장소 정보 파싱
   - place/ingest API 호출하여 장소 등록
   - 근처 주차장 정보 조회

2. **리뷰 작성 플로우**
   - 사용자가 리뷰 작성
   - RLS 검증 (익명 또는 인증된 사용자)
   - DB에 리뷰 저장
   - 실시간 업데이트

3. **인증 플로우**
   - OAuth 또는 이메일/패스워드 로그인
   - Supabase 세션 생성
   - 웹/확장 간 세션 공유

## 문서 링크
- 온보딩: `docs/03-onboarding.md`
- DB 스키마: `docs/06-db-schema-migrations.md`
- API 명세: `docs/05-backend-api-spec.md`
