# 05. API 명세 (Supabase / Edge Functions / BFF)

## 상단 체크리스트
- [x] 인증(JWT) 적용 확인
- [x] 검색/상세 API 응답 스키마 동결
- [x] 리뷰/팁 작성 권한/RLS 확인
- [x] 장소 수집/중복해결 API 초안 구현

# API 명세 (Supabase / Edge Functions / BFF)

> 초기 릴리즈에서는 리뷰 이미지 업로드를 지원하지 않습니다.

## 원칙
- 기본 데이터 접근은 Supabase 클라이언트 + RLS로 처리
- 복잡 로직/외부 API 연동은 Supabase Edge Function 혹은 Next.js Route Handler(BFF) 사용

## 인증
- Supabase 세션 토큰(JWT)을 헤더에 포함하여 호출

## 공통
- 페이지네이션: `limit`(기본 20, 최대 50), `cursor`(다음 페이지 토큰)
- 정렬: `sort`(e.g., `rating_desc`, `helpful_desc`, `created_desc`)
- 응답 Envelope:
```json
{ "data": { /* payload */ }, "page": { "next_cursor": "..." } }
```

## 엔드포인트 (초기)

### GET /api/parking/search (BFF or Edge Function)
- 쿼리: `q`, `lat`, `lng`, `radius`, `limit`, `cursor`
- 응답: 주차장 리스트(요약)

### GET /api/parking/:id
- 응답: 주차장 상세 + 리뷰, 팁 요약

### POST /api/reviews
- 목적: 리뷰 생성(주차장/업체/좌표 대상)
- 바디(택1):
```json
{ "subject_type": "parking_lot", "parking_lot_id": "uuid", "rating": 5, "comment": "좋음" }
{ "subject_type": "place", "place_id": "uuid", "rating": 4, "comment": "괜찮음" }
{ "subject_type": "location", "latitude": 37.5, "longitude": 127.0, "rating": 3, "comment": "혼잡" }
```
- 권한: 로그인 필요, RLS로 `user_id` 서버 주입
- 응답: 생성된 리뷰

### GET /api/reviews
- 쿼리(택1): `parking_lot_id` | `place_id` | (`lat`,`lng`,`radius`), + `limit`, `cursor`, `sort`
- 응답: 리뷰 목록 + 페이지네이션

### POST /api/reviews/:id/helpful
- 목적: 도움돼요 증가(멱등)

### DELETE /api/reviews/:id/helpful
- 목적: 도움돼요 취소

### POST /api/tips
- 바디: `{ parking_lot_id, content, discount_info }`
- 권한: 로그인 필요, RLS로 user_id 강제

### POST /api/place/ingest
- 목적: 외부 식별자/좌표 수집 → 내부 place 매핑/중복해결

### GET /api/place/:id
- 응답: 내부 place 상세(연결된 parking_lots/aliases 요약)

## 오류 규약
- 코드: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`, `INTERNAL`
- 포맷:
```json
{ "error": { "code": "BAD_REQUEST", "message": "..." } }
```

## 향후
- 이미지 업로드는 용량/비용 고려 후 단계적 도입
- /api/parking/nearby 캐싱(Edge Cache)
- 리뷰 helpful_count 증가 트리거/뷰 적용
