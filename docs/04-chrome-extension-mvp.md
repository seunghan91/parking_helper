# 04. 크롬 확장 MVP 가이드 (Plasmo + React + MV3)

## 상단 체크리스트
- [ ] 지도 도메인 권한 설정
- [ ] 패널 주입(세 지도 서비스) 동작
- [ ] 장소 선택/좌표 파싱 로직
- [ ] Supabase 근접 검색 연동
- [ ] 빈 상태/오류 처리

# 크롬 확장 MVP 가이드 (Plasmo + React + MV3)

## 목표
- 네이버/카카오/구글 지도 페이지에 사이드바 패널을 주입해 주차 정보 요약을 보여준다.

## 스택
- Plasmo Framework, React(TypeScript), Manifest V3
- Supabase 클라이언트로 읽기 전용 쿼리 (익명 키)

## DOM Hook 전략
- URL 감지: `history.pushState`/`popstate`와 `location.href` 변화 감시
- DOM 감지: `MutationObserver`로 장소 패널 영역의 타이틀/주소 노드 관찰
- 좌표 파싱: 지도 SDK 객체(노출 불가 시 DOM에 박힌 데이터-속성)에서 lat/lng 추출
- 디바운스: 장소 변경 감지 후 300ms 디바운스로 검색 호출
- 캐싱: 최근 10개 장소 질의 결과 메모리 캐시(5분 TTL)

## 타깃 도메인
- `https://map.naver.com/*`, `https://map.kakao.com/*`, `https://www.google.com/maps/*`

## 빠른 시작
```bash
pnpm dlx plasmo init parking-helper-ext
cd parking-helper-ext
pnpm i
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
