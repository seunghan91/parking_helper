# 12. Figma 가이드라인

## 상단 체크리스트
- [ ] 파일 구조/명명 규칙 정립
- [ ] 컴포넌트/Variants 규칙 수립
- [ ] 핸드오프 체크리스트 운영

> 비주얼 톤은 `docs/13-apple-style-design-guide.md`를 기준으로 합니다.

## 파일 구조
- Pages: 01_Foundations, 02_Components, 03_Patterns, 04_Screens, 99_Archive
- 커버: 프로젝트명/버전/날짜, 링크: `docs/07-ux-wireframes.md`

## Foundations
- 컬러/타입/그리드/아이콘 스타일을 라이브러리로 관리
- Tokens → Styles 매핑 유지

## 컴포넌트/Variants
- Button: size(sm,md), type(primary,secondary), state(default,hover,pressed,disabled)
- Card: parking-lot, review, tip; header/body/footer 슬롯 정의
- Input: text, rating selector(1~5), with validation states

## 패턴
- 패널 레이아웃(헤더/본문/푸터), 리스트/빈/오류/로딩 상태 패턴

## 화면
- 확장: 기본/빈/오류/로딩, 추천/리뷰 리스트 상태별 스냅샷
- 웹: 메인/결과/상세, 필터/정렬 오버레이

## 핸드오프
- Inspect로 spacing/typography 확인, 단위 px
- 내보내기 자산은 현재 릴리즈에서 미사용(이미지 제외 정책)
- 링크: JIRA/로드맵 티켓 참조, DoD 체크리스트 첨부
