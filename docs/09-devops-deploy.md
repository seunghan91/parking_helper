# 09. DevOps / Deploy (Vercel / Supabase)

## 상단 체크리스트
- [ ] Vercel 프로젝트 연결
- [ ] 환경변수 설정(프로덕션/프리뷰)
- [ ] Supabase 프로젝트 권한/키 관리
- [ ] 프리뷰에서 E2E 체크

## Vercel
- GitHub 연동 → Framework: Next.js 자동 인식
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Supabase
- Auth Provider 설정(구글)
- RLS 정책 배포 스크립트 관리(SQL)

## 배포 흐름
- PR 생성 → 프리뷰 배포 → QA 체크리스트 통과 → main 병합 → 프로덕션 배포
