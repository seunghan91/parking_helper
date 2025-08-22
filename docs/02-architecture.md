# 02. 아키텍처 / 기술 스택

## 상단 체크리스트
- [ ] 웹/확장 공통 스택 확정(Next.js/Plasmo/TS)
- [ ] Supabase(Auth/DB/~Storage, Edge) 사용 확정
- [ ] 배포(Vercel) 및 환경변수 키 맵 확정
- [ ] 데이터 흐름/시퀀스 다이어그램 합의

## 시스템 개요
- Web: Next.js on Vercel
- Extension: Plasmo + React(MV3)
- Backend: Supabase( Auth, Postgres+RLS, Edge Functions )

## 데이터 흐름(요약)
1) 확장/웹 → BFF(Next.js Route) 또는 Supabase 직접 쿼리
2) Edge Function에서 복잡 로직 처리(검색/중복해결/로그)
3) Postgres RLS로 권한 관리, (초기) 이미지/Storage는 미사용

## 문서 링크
- 온보딩: `docs/03-onboarding.md`
- DB 스키마: `docs/06-db-schema-migrations.md`
- API 명세: `docs/05-backend-api-spec.md`
