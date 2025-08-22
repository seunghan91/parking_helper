# 04. 크롬 확장 MVP 가이드 (Plasmo + React + MV3)

## 상단 체크리스트
- [ ] 지도 도메인 권한 설정
- [ ] 패널 주입(3 지도 서비스) 동작
- [ ] 장소 선택/좌표 파싱 로직
- [ ] Supabase 근접 검색 연동
- [ ] 빈 상태/오류 처리

# 크롬 확장 MVP 가이드 (Plasmo + React + MV3)

## 목표
- 네이버/카카오/구글 지도 페이지에 사이드바 패널을 주입해 주차 정보 요약을 보여준다.

## 스택
- Plasmo Framework, React(TypeScript), Manifest V3
- Supabase 클라이언트로 읽기 전용 쿼리 (익명 키)

## 타깃 도메인
- `https://map.naver.com/*`, `https://map.kakao.com/*`, `https://www.google.com/maps/*`

## 빠른 시작
```bash
pnpm dlx plasmo init parking-helper-ext
cd parking-helper-ext
pnpm i
```

## 기본 구조
- content script: 지도 DOM을 관찰하고 패널 컨테이너를 삽입
- UI 컴포넌트: React로 패널 렌더링, 선택된 장소에 따라 Supabase에서 데이터 조회
- background(service worker): 향후 알림/컨텍스트 메뉴/트래킹 등 확장

## 예시 흐름
1) 사용자가 지도에서 장소를 클릭 → URL/DOM 변화를 content script가 감지
2) 장소명/좌표 파싱 → Supabase `parking_lots` 근접 검색
3) 결과를 패널에 요약 표시(추천 1~2개, 리뷰 스니펫)

## DoD
- 세 지도 서비스에서 패널이 보이고 검색에 따라 내용이 갱신됨
- 오류 시 재시도/빈 상태(UI) 처리
