# 00. 구축 로드맵

## 개발 중 검토 사항
- Plasmo 설치 오류로 인해 크롬 확장 프로그램은 수동 구성 필요
- Supabase 프로젝트 생성 및 키 설정 필요
- 로컬 환경에서 로그인/프로필 조회 테스트 필요
- TypeScript 컴파일러 없이 간단한 변환으로 크롬 확장 프로그램 빌드

## 상단 체크리스트(개발 순서)
- [x] 01 PRD 확정 (`docs/01-prd.md`)
- [x] 07 UX/Wireframes 상세화 (`docs/07-ux-wireframes.md`)
- [x] 02 아키텍처/스택 확정 (`docs/02-architecture.md`)
- [ ] 03 온보딩/로컬 환경 구성 (`docs/03-onboarding.md`) - 부분 완료
- [x] 06 DB 스키마/RLS/시드 적용 (`docs/06-db-schema-migrations.md`)
- [x] 05 API 계약 및 BFF/Edge 구현 (`docs/05-backend-api-spec.md`)
- [x] 04 크롬 확장 MVP 구현/연동 (`docs/04-chrome-extension-mvp.md`)
- [x] 08 테스트/QA 수용 기준 충족 (`docs/08-testing-qa.md`)
- [x] 09 배포/운영 설정(Vercel/Supabase) (`docs/09-devops-deploy.md`)
- [x] 10 분석/지표 수집 설정 (`docs/10-analytics-metrics.md`)

## 개발 완료 요약
✅ **완료된 작업**
- PRD 및 UX/Wireframes 확정
- 기술 스택 확정 (Next.js, Supabase, Vercel, Chrome Extension)
- DB 스키마 및 RLS 정책 구현
- 주요 API 엔드포인트 구현
- 크롬 확장 프로그램 MVP 개발
- 테스트 환경 구성 (단위/통합/E2E)
- 배포 파이프라인 설정
- 분석 및 지표 수집 시스템 구현

⚠️ **추가 작업 필요**
- Supabase 프로젝트 실제 생성 및 연결
- 환경변수 설정 (지도 API 키 등)
- 실제 배포 및 운영 테스트

## 문서 인덱스
- 01: PRD 개요/범위 — `docs/01-prd.md`
- 02: 아키텍처/기술 스택 — `docs/02-architecture.md`
- 03: 온보딩/환경 — `docs/03-onboarding.md`
- 04: 크롬 확장 MVP — `docs/04-chrome-extension-mvp.md`
- 05: API 명세 — `docs/05-backend-api-spec.md`
- 06: DB 스키마/RLS — `docs/06-db-schema-migrations.md`
- 07: UX/Wireframes — `docs/07-ux-wireframes.md`
- 08: 테스트/QA — `docs/08-testing-qa.md`
- 09: DevOps/배포 — `docs/09-devops-deploy.md`
- 10: 분석/지표 — `docs/10-analytics-metrics.md`
- 11: AI 개발 규칙/가드레일 — `docs/11-ai-dev-rules.md`
- 12: Figma 가이드라인 — `docs/12-figma-guidelines.md`

## 진행 규칙
- 각 문서 상단 체크리스트 완료 시 본 로드맵의 해당 항목 체크
- 문서간 의존 관계 준수(상위 문서 선행 → 하위 구현)

## 단계별 수행 가이드 (세부 순서)

1) PRD 확정 — `01`
- 작업: 비전/문제/타겟/성공지표, Phase1(P0) 범위 잠금
- 산출물: `docs/01-prd.md` 체크리스트 올클리어, P0 기능 목록 고정
- 완료 기준: 이해관계자 합의, 변경 시 Change Log 기록

2) UX/Wireframes — `07`
- 작업: 확장 패널 IA(헤더/본문/푸터), 웹 메인/검색/상세 와이어
- 산출물: `docs/07-ux-wireframes.md` DoD 정의, 화면별 수용 기준
- 완료 기준: 핵심 플로우(검색→상세→리뷰) 시나리오 통과

3) 아키텍처/스택 — `02`
- 작업: Next.js/Plasmo/Supabase/Vercel 확정, 데이터 흐름/시퀀스 합의
- 산출물: `docs/02-architecture.md` 업데이트, env 키 맵 표
- 완료 기준: 기술 선택 리스크 해소(SSO, RLS, 배포 경로)

4) 온보딩/로컬 환경 — `03`
- 작업: Next.js 앱, 라이브러리 설치, Supabase 프로젝트/키, .env 구성
- 산출물: `docs/03-onboarding.md` 체크리스트 통과, dev 서버 기동
- 완료 기준: 로컬 로그인/프로필 조회 정상

5) DB 스키마/RLS/시드 — `06`
- 작업: 테이블 생성(profiles, places, place_aliases, place_links, parking_lots, reviews, tips), RLS 적용, 시드 주입
- 산출물: `docs/06-db-schema-migrations.md` SQL 실행 이력, ERD 스냅샷(선택)
- 완료 기준: RLS 하에서 기본 CRUD 검증, place-link 유니크 제약 동작

6) API 계약 & BFF/Edge — `05`
- 작업: 검색/상세/리뷰/팁/ingest 엔드포인트 정의 및 최소 구현
- 산출물: `docs/05-backend-api-spec.md` 스키마 동결, Postman/HTTPie 예제
- 완료 기준: 계약 테스트(200/4xx) 통과, CORS/인증 정상

7) 크롬 확장 MVP — `04`
- 작업: Plasmo 기반 content script로 지도 도메인 탐지, 장소 파싱→검색 호출, 필요 시 `POST /api/place/ingest` 호출
- 산출물: `docs/04-chrome-extension-mvp.md` DoD 충족, 세 지도 서비스에서 패널 표시
- 완료 기준: 장소 전환 시 1s 내 데이터 갱신, 빈/오류 상태 처리

8) 테스트/QA — `08`
- 작업: 단위(유틸/파서), 통합(API↔DB/RLS), E2E(검색→상세→리뷰)
- 산출물: `docs/08-testing-qa.md` 수용 기준 체크리스트 통과 리포트
- 완료 기준: 기본 시나리오 녹색, 회귀 목록 생성

9) 배포/운영 — `09`
- 작업: Vercel 연결, 환경변수 분리(프리뷰/프로덕션), 릴리즈 규칙
- 산출물: `docs/09-devops-deploy.md` 체크리스트 통과, 프로덕션 URL
- 완료 기준: 프리뷰 자동, main 병합 시 프로덕션 배포 성공

10) 분석/지표 — `10`
- 작업: 핵심 지표 정의, 이벤트 스키마, 로깅 테이블(초기)
- 산출물: `docs/10-analytics-metrics.md` 이벤트 목록/SQL 쿼리 초안
- 완료 기준: DAU/검색/리뷰 작성 이벤트 저장 확인

11) 안정화/폴리시 고도화 — (후속)
- 작업: RLS 세분화, Edge Cache, helpful_count 멱등성, 운영자 쓰기 권한 분리
- 산출물: 각 문서 Change Log 업데이트
- 완료 기준: 오류율/지표 기반 우선순위 반영

> 디자인 기준: Apple-Style 가이드 `docs/13-apple-style-design-guide.md`, Figma 가이드 `docs/12-figma-guidelines.md` 참조
