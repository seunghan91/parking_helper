# 03. 온보딩 가이드 (Supabase / Next.js / Vercel / Plasmo)

## 상단 체크리스트
- [x] Node/패키지 매니저 설치
- [ ] Supabase 프로젝트/키 설정
- [x] .env.local 구성
- [ ] 로컬 로그인/프로필 조회 성공
- [ ] Vercel 프리뷰 배포 확인

## 개발 중 이슈
- Plasmo 설치 시 node-gyp 빌드 오류 발생 (크롬 확장 프로그램)
- 해결 방안: 수동으로 크롬 확장 프로그램 구조 구성 필요

# 온보딩 가이드 (Supabase / Next.js / Vercel / Plasmo)

## 목적
- 로컬 개발 환경을 30분 내 구성하고 Next.js와 Supabase를 연동하며, Vercel 배포까지 끝낸다.

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

## 체크리스트(DoD)
- 로컬/프리뷰에서 로그인 → 프로필 조회 성공
- Supabase SQL Editor에서 `profiles` 레코드 확인 가능
