# 주차장 데이터 소스 빠른 참조 (Quick Reference)

## 📊 데이터 소스 한눈에 보기

| 항목 | 한국교통안전공단 | 서울시 GetParkingInfo | 카카오맵 API | 네이버 지도 API |
|------|-------|-------|-------|-------|
| **커버리지** | 전국 13만+ | 서울만 1.4만 | 전국 | 전국 |
| **실시간 여부** | ✅ 예 (~20분) | ✅ 예 (5-10분) | ❌ 아니오 | ❌ 아니오 |
| **요금 정보** | ✅ 상세 | ✅ 상세 | ⚠️ 부분 | ⚠️ 부분 |
| **신청 필요** | ✅ 필수 (1-2주) | ❌ 불필요 | ✅ 필수 | ✅ 필수 |
| **비용** | 💰 무료 | 💰 무료 | 💰 무료 (30k/일 제한) | 💰 무료 (25k/일 제한) |
| **좌표 제공** | ✅ 있음 | ❌ 없음 | ✅ 있음 | ✅ 있음 |
| **사용자 리뷰** | ❌ 없음 | ❌ 없음 | ✅ 있음 (링크) | ✅ 있음 (링크) |
| **예상 개발 시간** | 1주 | 3-5일 | 1주 | 1주 |

---

## 🎯 선택 가이드

### Phase 1: MVP (첫 주차)
**→ 한국교통안전공단만 사용**

```
필수 정보:
- 주차장명, 주소, 위치 (위도/경도)
- 요금 (기본/추가/일최대)
- 현황 (가능 주차면수)

구현:
- Daily Batch (03:00 AM): 기본정보 동기화
- Hourly Cache (매 10분): 실시간 현황 갱신
- 응답 시간 < 2초

예상 개발: 40시간
```

### Phase 2: 고도화 (2-3주 후)
**→ 서울시 API 추가 + 캐시 최적화**

```
추가 이점:
- 서울시 실시간 데이터 (더 신선함)
- 데이터 정확성 향상
- 중복 제거 및 매칭

구현:
- 중복 감지 (좌표 기반)
- 데이터 병합 (선호도 설정)
- Redis 캐시 추가

예상 개발: 25시간
```

### Phase 3: 통합 (1개월 후)
**→ 지도 API + 신규 주차장 발견**

```
추가 기능:
- 신규 주차장 발견 (카카오맵)
- 사용자 리뷰 링크
- 지도 UI 연동

구현:
- Weekly 배치: 신규 주차장 검색
- 매칭 알고리즘: 중복 제거
- 외부 링크 저장

예상 개발: 35시간
```

---

## 📋 빠른 구현 체크리스트

### Pre-Implementation (1일)
```
☐ API 신청
  ☐ data.go.kr에서 한국교통안전공단 API 신청
  ☐ 인증키 메모
  ☐ 발급 예상 1-2주 대기

☐ 환경 설정
  ☐ .env.local 파일 생성
  ☐ PUBLIC_API_KEY 저장
  ☐ SUPABASE_SERVICE_ROLE_KEY 확인

☐ 데이터베이스
  ☐ parking_lot_realtime 테이블 생성
  ☐ 인덱스 생성
  ☐ 테스트 데이터 100개 준비
```

### Implementation (5-7일)

**Day 1-2: 기본 동기화**
```typescript
// 한국교통안전공단 API 연결
async function syncParkingDaily() {
  const response = await fetch(PUBLIC_API_URL, {
    params: {
      key: PUBLIC_API_KEY,
      type: 'json',
      pageNo: 1,
      numOfRows: 1000
    }
  })

  const items = response.data.response.body.items
  // 데이터 변환 후 upsert
  await supabase.from('parking_lots').upsert(items)
}
```

**Day 3: 배치 작업**
```typescript
// Vercel Cron 설정
// vercel.json
{
  "crons": [{
    "path": "/api/cron/parking-sync",
    "schedule": "0 3 * * *"  // 매일 3:00 AM
  }]
}
```

**Day 4-5: 검색 API**
```typescript
// /api/parking/search
export async function GET(request: NextRequest) {
  const { lat, lng, radius } = request.nextUrl.searchParams

  // 위치 기반 검색 + 실시간 데이터 병합
  const parkingLots = await findNearby(lat, lng, radius)
  const enriched = await enrichWithRealtime(parkingLots)

  return NextResponse.json(enriched)
}
```

**Day 6-7: 테스트 & 배포**
```bash
# 테스트
npm run test:integration

# Staging 배포
vercel deploy --prod

# 모니터링
# Vercel Dashboard → Cron Executions 확인
```

### Post-Implementation (지속)
```
☐ 모니터링
  ☐ API 응답 시간 (< 2초)
  ☐ 배치 작업 성공율 (> 95%)
  ☐ 캐시 히트율 (> 70%)

☐ 유지보수
  ☐ 월 1회: 데이터 품질 점검
  ☐ 주 1회: 에러 로그 검토
  ☐ 일 1회: 배치 실행 확인

☐ 확장 준비
  ☐ Phase 2 일정 계획
  ☐ 서울시 API 신청 (선택)
  ☐ 지역별 확장 로드맵 수립
```

---

## 🔑 API 인증키 발급

### 한국교통안전공단 (필수)
1. https://www.data.go.kr 접속
2. 로그인 (회원가입)
3. "한국교통안전공단_주차정보 제공 API" 검색
4. [활용신청] 버튼 클릭
5. 승인 대기 (1-2주)
6. 발급받은 API 키를 `.env.local`에 저장

```
PUBLIC_API_KEY=발급받은_키
```

### 서울시 (선택, 무료)
- 이미 공개 API 키: `5a414e69727468653836444b6f6949`
- 별도 신청 불필요

### 카카오맵 (선택)
1. https://developers.kakao.com 접속
2. [내 애플리케이션] → [애플리케이션 추가]
3. REST API 키 발급
4. `.env.local`에 저장

```
KAKAO_REST_API_KEY=발급받은_키
```

---

## 💾 데이터베이스 마이그레이션

```bash
# Supabase Migration 생성
npx supabase migration new add_parking_realtime

# 다음 내용을 마이그레이션 파일에 추가:

CREATE TABLE parking_lot_realtime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_lot_id BIGINT NOT NULL REFERENCES parking_lots(id),
  current_vehicles INT,
  available_spaces INT,
  occupancy_rate DECIMAL(5, 2),
  status TEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parking_lot_id ON parking_lot_realtime(parking_lot_id);
CREATE INDEX idx_recorded_at ON parking_lot_realtime(recorded_at DESC);

# 마이그레이션 적용
npx supabase db push
```

---

## 📈 성능 지표 (목표)

| 지표 | 목표 | 확인 방법 |
|------|------|---------|
| **API 응답 시간** | < 2초 | Chrome DevTools |
| **배치 실행 시간** | < 30분 | Vercel Logs |
| **캐시 히트율** | > 70% | Redis Stats |
| **데이터 신선도** | < 30분 | last_synced_at |
| **가용성** | > 99% | Uptime Monitor |

---

## 🚨 트러블슈팅 빠른 해결

### API 응답이 느림
```sql
-- 인덱스 추가
CREATE INDEX idx_parking_coords
ON parking_lots(latitude, longitude);
```

### 배치 작업이 실패
```typescript
// 재시도 로직 추가
async function syncWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await syncParkingDaily()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await sleep(Math.pow(2, i) * 1000)
    }
  }
}
```

### 중복 데이터
```sql
-- 공공 API ID 기반 중복 제거
DELETE FROM parking_lots p1
WHERE p1.id IN (
  SELECT p1.id FROM parking_lots p1
  INNER JOIN parking_lots p2
  ON p1.public_api_id = p2.public_api_id
  AND p1.id > p2.id
);
```

---

## 📚 참고 자료

### 공식 문서
- [공공데이터포털](https://www.data.go.kr/)
- [한국교통안전공단 API](https://www.data.go.kr/data/15099883/openapi.do)
- [서울 열린데이터광장](https://data.seoul.go.kr/)
- [카카오 Developers](https://developers.kakao.com/)

### 추가 자료
- PARKING_DATA_SOURCES_ANALYSIS.md - 상세 분석
- IMPLEMENTATION_GUIDE.md - 완전한 구현 예제

---

## 💡 자주 묻는 질문

**Q: API 승인이 안 나면?**
A: 서울시 공개 API로 서울만이라도 먼저 구현. 한국교통안전공단 API는 재신청 가능.

**Q: 실시간 데이터는 얼마나 자주 갱신?**
A: 10분마다 캐시 갱신. 사용자 요청 시 캐시된 데이터 제공 (< 2초).

**Q: 민간 주차장은 어떻게?**
A: 카카오맵 API로 신규 주차장 발견 후 수동 검증.

**Q: 다른 지역(경기도 등)은?**
A: Phase 3에서 지역별 공공 API 추가 (각각 별도 신청 필요).

**Q: 비용이 얼마?**
A: ~$70-150/월 (API 무료, 저장소만 유료).

---

## 🎬 다음 액션

1. **지금 바로**: API 신청 (data.go.kr)
2. **내일**: 데이터베이스 마이그레이션
3. **1주 내**: 기본 동기화 구현 및 테스트
4. **2주 내**: 실시간 캐시 추가
5. **1개월 내**: 다중소스 통합 (선택)

---

**생성일**: 2025-08-29
**최종 수정**: 2025-08-29
**상태**: ✅ 검토 완료
