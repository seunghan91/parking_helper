# 09. DevOps / Deploy (Vercel / Supabase)

## 상단 체크리스트
- [x] Vercel 프로젝트 연결
- [x] 환경변수 설정(프로덕션/프리뷰)
- [x] Supabase 프로젝트 권한/키 관리
- [x] 프리뷰에서 E2E 체크

## 구현된 설정
- vercel.json: 배포 설정 및 보안 헤더
- GitHub Actions CI/CD 워크플로우
- 환경변수 예시 파일

## 환경 변수(예시)
| 환경 | 키 | 비고 |
|---|---|---|
| Preview/Prod | NEXT_PUBLIC_SUPABASE_URL | 클라이언트 공개 |
| Preview/Prod | NEXT_PUBLIC_SUPABASE_ANON_KEY | 클라이언트 공개 |
| Server only | SUPABASE_SERVICE_ROLE_KEY | 서버에서만 사용(Edge/Route) |

## 배포 흐름
- PR 생성 → 프리뷰 배포 → QA 체크리스트 통과 → main 병합 → 프로덕션 배포

## 백업/보안
- Supabase: 자동 백업 정책 확인, 주기/보관주기 설정
- RLS 정책은 SQL로 버전 관리, 비상 시 점검 모드 절차 정의

## 모니터링/관측성
- Vercel: 프로젝트 로그/에러 알림
- Supabase: 쿼리 성능/에러 로그
- (선택) Sentry: 프론트/확장 오류 추적

## 롤백
- 프론트: Vercel에서 이전 빌드로 Promote
- DB: 백업 스냅샷 복구 절차 문서화
