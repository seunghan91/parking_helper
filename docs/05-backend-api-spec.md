# 05. API 명세 (Supabase / Edge Functions / BFF)

## 상단 체크리스트
- [ ] 인증(JWT) 적용 확인
- [ ] 검색/상세 API 응답 스키마 동결
- [ ] 리뷰/팁 작성 권한/RLS 확인
- [ ] 장소 수집/중복해결 API 초안 구현

# API 명세 (Supabase / Edge Functions / BFF)

## 원칙
- 기본 데이터 접근은 Supabase 클라이언트 + RLS로 처리
- 복잡 로직/외부 API 연동은 Supabase Edge Function 혹은 Next.js Route Handler(BFF) 사용

## 인증
- Supabase 세션 토큰(JWT)을 헤더에 포함하여 호출

## 엔드포인트 (초기)

### GET /api/parking/search (BFF or Edge Function)
- 쿼리: `q`(키워드), `lat`, `lng`, `radius`
- 응답: 주차장 리스트(요약)
```json
{
  "items": [
    { "id": "uuid", "name": "B 공영주차장", "distance_m": 240, "price": {"unit":"10m","price":500} }
  ]
}
```

### GET /api/parking/:id
- 응답: 주차장 상세 + 리뷰, 팁 요약

### POST /api/reviews
- 바디: `{ parking_lot_id, rating, comment }`
- 권한: 로그인 필요, RLS로 user_id 강제
- 응답: 생성된 리뷰

### POST /api/tips
- 바디: `{ parking_lot_id, content, discount_info }`
- 권한: 로그인 필요, RLS로 user_id 강제

### POST /api/place/ingest
- 목적: 지도에서 사용자가 본 장소(좌표/장소ID/업체명 등)를 수집하고, 내부 place와 링크/중복 해결
- 바디 예시:
```json
{
  "external": { "provider": "naver|kakao|google", "place_id": "string" },
  "name": "OO 빌딩",
  "address": "서울...",
  "location": { "lat": 37.5, "lng": 127.0 }
}
```
- 응답: `{ place_id, deduped: boolean }`

### GET /api/place/:id
- 응답: 내부 place 상세(연결된 parking_lots/aliases 요약)

## 오류 규약
```json
{ "error": { "code": "BAD_REQUEST", "message": "..." } }
```

## 향후
- /api/parking/nearby 캐싱(Edge Cache)
- 리뷰 helpful_count 증가 API(멱등 보호)
