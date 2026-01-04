# 주차장 데이터 배치 처리 설정 가이드

한국교통안전공단 API를 통한 주차장 정보 동기화 시스템 구축 방법

## 📋 개요

- **배치 방식**: Supabase pg_cron + Edge Functions
- **비용**: ₩0 (완전 무료)
- **신뢰성**: 95%+
- **정확도**: 초 단위

### 스케줄

| 작업 | 주기 | 목적 | 소요시간 |
|------|------|------|--------|
| **daily_full_sync** | 매일 03:00 AM | 전국 13만+ 주차장 기본정보 동기화 | 45-60분 |
| **hourly_realtime** | 매 10분 | 가능 주차면수, 점유율 업데이트 | 2-5분 |
| **weekly_new_parking** | 매주 금요일 정오 | 신규 주차장 검색 (카카오맵) | 10-15분 |

---

## 🔐 1단계: API 키 설정

### 1.1 한국교통안전공단 API 신청

**신청 사이트**: https://www.data.go.kr/

1. 회원가입 (또는 로그인)
2. 메뉴: **마이페이지 → 개인 활동**
3. **API 신청** 클릭
4. 검색: `한국교통안전공단_주차정보`
5. **이용신청** 클릭
6. 활용분야, 서비스명 등 입력
7. **신청** 클릭

**승인 시간**: 1-2주 (24시간 이내일 수 있음)

**승인 후**:
- 마이페이지 → 개인 활동 → API 이용현황
- API KEY 확인 및 복사

### 1.2 환경 변수 설정

`.env.local` 파일에 추가:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx...
SUPABASE_SERVICE_ROLE_KEY=xxxxx...  # Service Role Key

# 한국교통안전공단 API
KOROADS_API_KEY=xxxxx...  # API 신청 후 받은 키

# 카카오맵 API (Phase 3)
KAKAO_REST_API_KEY=xxxxx...

# Supabase Edge Functions 설정
SUPABASE_URL=https://xxxxx.supabase.co
```

---

## 🗄️ 2단계: Supabase 설정

### 2.1 마이그레이션 적용

```bash
# 1. 배치 인프라 마이그레이션
supabase migration up

# 또는 Supabase Dashboard에서:
# SQL Editor → New Query → 마이그레이션 파일 내용 복사 → Run
```

**필요한 마이그레이션 파일**:
- `00006_parking_batch_infrastructure.sql`
- `00007_parking_cron_schedule.sql`

### 2.2 Supabase Dashboard 확인

1. **Database → Extensions** 메뉴에서 다음 확장 활성화:
   - `pg_cron` (자동 활성화됨)
   - `pg_net` (HTTP 호출용)
   - `earthdistance` (좌표 거리 계산)

2. **Table Editor** 확인:
   - `parking_lots`
   - `parking_sources`
   - `parking_realtime`
   - `batch_execution_logs`
   - `parking_batch_config`

3. **Security → RLS** 확인:
   - 모든 테이블이 RLS 활성화되어 있는지 확인
   - 정책이 올바르게 설정되었는지 확인

---

## 🚀 3단계: Edge Functions 배포

### 3.1 함수 생성

```bash
# 프로젝트 루트에서
supabase functions new parking-batch-daily
```

### 3.2 함수 코드 작성

`supabase/functions/parking-batch-daily/index.ts` 수정:

- 제공된 코드를 복사

### 3.3 로컬 테스트

```bash
# Supabase 로컬 개발 환경 시작
supabase start

# 함수 로컬 테스트
supabase functions serve

# 다른 터미널에서
curl -X POST http://localhost:54321/functions/v1/parking-batch-daily \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 3.4 배포

```bash
# 프로덕션에 배포
supabase functions deploy parking-batch-daily

# 환경 변수 설정
supabase secrets set KOROADS_API_KEY="xxxxx"
```

---

## ⏰ 4단계: pg_cron 스케줄 설정

### 4.1 수동 설정 (권장)

**Supabase Dashboard** → **SQL Editor** → **New Query**:

```sql
-- 아래 마이그레이션 파일의 전체 내용 복사
-- supabase/migrations/00007_parking_cron_schedule.sql
```

### 4.2 스케줄 확인

**SQL Editor**에서 실행:

```sql
SELECT
  jobname,
  schedule,
  next_run AT TIME ZONE 'Asia/Seoul' as next_run_kst,
  active
FROM cron.job
WHERE jobname LIKE 'parking-%';
```

### 4.3 수동 테스트

**SQL Editor**에서 실행:

```sql
-- 한국교통안전공단 배치 수동 실행
SELECT net.http_post(
  url := concat(current_setting('app.supabase_url'), '/functions/v1/parking-batch-daily'),
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.service_role_key')
  ),
  body := '{}'
) AS result;
```

---

## 📊 5단계: 모니터링

### 5.1 배치 실행 로그 조회

**SQL Editor**:

```sql
-- 최근 배치 실행 결과
SELECT
  batch_type,
  status,
  total_records,
  inserted_count,
  updated_count,
  failed_count,
  duration_ms,
  created_at AT TIME ZONE 'Asia/Seoul' as created_at_kst
FROM public.batch_execution_logs
ORDER BY created_at DESC
LIMIT 20;
```

### 5.2 pg_cron 실행 히스토리

**SQL Editor**:

```sql
-- 최근 cron 실행 결과
SELECT
  jobname,
  start_time AT TIME ZONE 'Asia/Seoul' as start_time_kst,
  end_time AT TIME ZONE 'Asia/Seoul' as end_time_kst,
  succeeded,
  return_message,
  EXTRACT(EPOCH FROM (end_time - start_time))::INT as duration_sec
FROM cron.job_run_details
WHERE jobname LIKE 'parking-%'
ORDER BY jobid DESC, start_time DESC
LIMIT 30;
```

### 5.3 현재 주차 현황 조회

```sql
-- 최신 실시간 주차 현황 (서울시 기준 5개)
SELECT
  parking_lot_id,
  name,
  address,
  available_spaces,
  total_spaces,
  occupancy_rate,
  minutes_ago,
  updated_at AT TIME ZONE 'Asia/Seoul' as updated_at_kst
FROM public.parking_realtime_current
WHERE address LIKE '서울%'
LIMIT 5;
```

---

## 🔍 6단계: Next.js API Route 통합

### 6.1 API 라우트 생성

`src/app/api/parking/status/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('batch_execution_logs')
    .select('*')
    .eq('batch_type', 'daily_full_sync')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

### 6.2 배치 수동 트리거

`src/app/api/parking/batch/trigger/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // 인증 확인 (optional)
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.includes(process.env.ADMIN_SECRET_KEY || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Edge Function 호출
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/parking-batch-daily`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: '{}',
    }
  );

  const result = await response.json();
  return NextResponse.json(result);
}
```

---

## 🧪 7단계: 테스트

### 7.1 기본 기능 테스트

```bash
# 1. 데이터베이스 연결 확인
curl https://xxxxx.supabase.co/functions/v1/parking-batch-daily \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -X POST

# 2. 응답 확인
# {
#   "success": true,
#   "total_records": 130000,
#   "inserted_count": 1000,
#   "updated_count": 2000,
#   "failed_count": 0,
#   "duration_ms": 3456
# }
```

### 7.2 데이터 확인

```sql
-- 주차장 데이터 확인
SELECT COUNT(*) FROM public.parking_lots;

-- 데이터 소스 확인
SELECT source_type, COUNT(*)
FROM public.parking_sources
GROUP BY source_type;

-- 최근 배치 성공률
SELECT
  batch_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'success') as success_count,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*),
    2
  ) as success_rate
FROM public.batch_execution_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY batch_type;
```

### 7.3 성능 테스트

```sql
-- 평균 배치 실행 시간
SELECT
  batch_type,
  COUNT(*) as executions,
  ROUND(AVG(duration_ms)) as avg_duration_ms,
  ROUND(MAX(duration_ms)) as max_duration_ms,
  ROUND(MIN(duration_ms)) as min_duration_ms
FROM public.batch_execution_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY batch_type;
```

---

## 🚨 트러블슈팅

### 문제: pg_cron에서 Edge Function 호출 실패

**원인**: `app.service_role_key` 설정 누락

**해결책**:
1. Supabase Dashboard → Settings → API
2. Service Role Key 복사
3. 스케줄에서 `current_setting('app.service_role_key')` 확인

### 문제: API 키 인증 실패

**확인 사항**:
```sql
-- 환경 변수가 제대로 설정되었는지 확인
SELECT
  current_setting('app.supabase_url', true) as url,
  current_setting('app.service_role_key', true) as has_key
```

### 문제: 메모리 부족 (Large Batch)

**해결책**: 페이징 크기 줄이기

```typescript
// 기본값: 100
const pageSize = 50; // 50으로 줄임
```

### 문제: 중복 주차장 등록

**수동 병합**:
```sql
SELECT public.merge_parking_lots(
  p_primary_id := '주요-id',
  p_secondary_id := '중복-id'
);
```

---

## 📈 Phase별 로드맵

### Phase 1 (현재) ✅
- [x] 한국교통안전공단 API 통합
- [x] Daily 배치 (03:00 AM)
- [x] 기본 정보 동기화
- [x] 배치 로그 및 모니터링

**소요기간**: 1주

---

### Phase 2 (향후 2-3주) ⏳
- [ ] 서울시 API 통합
- [ ] 실시간 배치 (매 10분)
- [ ] Redis 캐시 추가
- [ ] 응답 시간 < 2초

**소요기간**: 2-3주

---

### Phase 3 (향후 1개월) ⏳
- [ ] 카카오맵 API 통합
- [ ] 신규 주차장 자동 발견
- [ ] 지역별 확장
- [ ] 사용자 리뷰 연결

**소요기간**: 3-4주

---

## 📚 참고 자료

- [공공데이터포털](https://www.data.go.kr/)
- [Supabase pg_cron 문서](https://supabase.com/docs/guides/cron)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [한국교통안전공단 API](https://api.koroad.or.kr/openapi)

---

## ✅ 체크리스트

배포 전 확인사항:

- [ ] 한국교통안전공단 API 키 취득
- [ ] `.env.local` 파일에 모든 API 키 설정
- [ ] Supabase 마이그레이션 실행
- [ ] Edge Functions 배포
- [ ] pg_cron 스케줄 설정
- [ ] 수동 테스트 성공
- [ ] 배치 실행 로그 확인
- [ ] 모니터링 대시보드 확인
- [ ] 프로덕션 배포

---

## 🎯 다음 단계

1. **지금**: API 신청 및 키 설정
2. **내일**: Supabase 마이그레이션 적용
3. **이번주**: Edge Functions 배포 및 테스트
4. **2주 내**: 프로덕션 배포
5. **1개월 후**: Phase 2 (서울시 API) 추가

질문이나 문제가 발생하면 배치 로그를 확인하세요!
