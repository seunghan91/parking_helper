# 10. Analytics / Metrics

## 상단 체크리스트
- [ ] 핵심 지표 정의(DAU, 리뷰 수 등)
- [ ] 이벤트 스키마 정의
- [ ] 대시보드 초안(쿼리) 마련

## 성공 지표(초기)
- 확장 DAU, 리뷰 주간 합, 검색→리뷰 작성 전환율

## 이벤트(예시)
- `view_place`: { provider, external_place_id, place_id }
- `search_result_click`: { query, place_id }
- `review_created`: { parking_lot_id, rating }

## 구현 메모
- 초기엔 Supabase 테이블 로깅으로 시작 → 이후 3rd party 고려
