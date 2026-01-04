# 🚀 주차장 배치 시스템 배포 가이드

**상태**: 배포 준비 완료 ✅
**마지막 수정**: 2026-01-04
**예상 소요 시간**: 30분

---

## 📋 배포 체크리스트

### ✅ 완료된 작업
- [x] API 키 취득 (한국교통안전공단)
- [x] 환경 변수 설정 (.env.local)
- [x] Edge Functions 코드 수정
- [x] 데이터베이스 마이그레이션 준비

### 🔄 진행 중 (지금 하실 작업)
- [ ] **Step 1**: Supabase 마이그레이션 실행
- [ ] **Step 2**: Edge Functions 배포
- [ ] **Step 3**: pg_cron 스케줄 설정
- [ ] **Step 4**: 배치 테스트 실행

---

## Step 1️⃣: Supabase 마이그레이션 실행 (10분)

### 1.1 Supabase 대시보드 접속

1. https://app.supabase.com 접속
2. **parking-helper** 프로젝트 선택
3. **SQL Editor** 메뉴 클릭

### 1.2 첫 번째 마이그레이션 실행

**파일**: `parking-helper-web/supabase/migrations/00006_parking_batch_infrastructure.sql`

1. **New Query** 클릭
2. 파일 내용 전체 복사 (367줄)
3. SQL Editor에 붙여넣기
4. **Run** 클릭

**예상 결과**:
```
✓ CREATE EXTENSION pg_cron
✓ CREATE TABLE parking_sources
✓ CREATE TABLE parking_realtime
✓ CREATE TABLE batch_execution_logs
✓ CREATE TABLE parking_batch_config
✓ 8 policies created
```

### 1.3 두 번째 마이그레이션 실행

**파일**: `parking-helper-web/supabase/migrations/00007_parking_cron_schedule.sql`

1. **New Query** 클릭
2. 파일 내용 전체 복사 (127줄)
3. SQL Editor에 붙여넣기
4. **Run** 클릭

**예상 결과**:
```
✓ parking-koroads-daily (매일 03:00 AM)
✓ parking-realtime-sync (매 10분)
✓ parking-kakao-weekly (매주 금요일)
✓ parking-cleanup-logs (매일 04:00 AM)
✓ parking-cleanup-realtime (매일 04:30 AM)
```

### 1.4 마이그레이션 검증

SQL Editor에서 다음 쿼리 실행:

```sql
-- 테이블 생성 확인
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'parking%' OR tablename = 'batch_execution_logs'
ORDER BY tablename;
```

**예상 결과**: 5개의 테이블이 표시됨
- batch_execution_logs
- parking_batch_config
- parking_lots (기존, 확장됨)
- parking_realtime
- parking_sources

```sql
-- pg_cron 스케줄 확인
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname LIKE 'parking-%'
ORDER BY jobname;
```

**예상 결과**: 5개의 스케줄이 표시됨

---

## Step 2️⃣: Edge Functions 배포 (10분)

### 2.1 Prerequisites 확인

프로젝트 루트 디렉토리에서:

```bash
# Node.js 버전 확인 (v18+ 필요)
node --version

# npm 설치 확인
npm --version
```

### 2.2 Edge Functions 배포

```bash
# 1. parking-helper-web 디렉토리로 이동
cd /Users/seunghan/parking_helper/parking-helper-web

# 2. Environment 변수 확인
cat .env.local | grep KOROADS_API_KEY
# 출력: KOROADS_API_KEY=3fe7711deb5fc9b5c8b009bad66320925cf20dcd63b92f724d2141cc2f5cceae

# 3. Supabase CLI로 배포 (또는 대시보드 사용)
supabase functions deploy parking-batch-daily

# 또는 수동으로 대시보드에서:
# Supabase Dashboard → Functions → Create Function
# Name: parking-batch-daily
# 파일 내용: supabase/functions/parking-batch-daily/index.ts 복사
```

### 2.3 배포 검증

Supabase 대시보드:
1. **Functions** 메뉴 클릭
2. **parking-batch-daily** 함수 선택
3. 상태가 **Active** 표시 확인

---

## Step 3️⃣: pg_cron 스케줄 설정

마이그레이션 실행 시 자동으로 설정됩니다.

확인:
```sql
-- Supabase SQL Editor에서
SELECT
  jobid,
  jobname,
  schedule,
  active,
  next_run AT TIME ZONE 'Asia/Seoul' as next_run_kst
FROM cron.job
WHERE jobname LIKE 'parking-%'
ORDER BY jobname;
```

---

## Step 4️⃣: 배치 테스트 실행 (5분)

### 4.1 수동 배치 실행

Supabase SQL Editor에서:

```sql
-- Edge Function 수동 호출
SELECT net.http_post(
  url := 'https://ezuedpehxtzhwbbpipvm.supabase.co/functions/v1/parking-batch-daily',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dWVkcGVoeHR6aHdiYnBpcHZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM2OTcxMywiZXhwIjoyMDcxOTQ1NzEzfQ.QGKqc8v2dQKJNnXYaY0z1EhYcX9pZvX1mQwG8K5R9yQ'
  ),
  body := '{}'
) AS response;
```

### 4.2 배치 결과 확인

```sql
-- 최근 배치 실행 로그 확인
SELECT
  batch_type,
  source_type,
  status,
  total_records,
  inserted_count,
  updated_count,
  failed_count,
  duration_ms,
  completed_at AT TIME ZONE 'Asia/Seoul' as completed_at_kst
FROM batch_execution_logs
ORDER BY created_at DESC
LIMIT 10;
```

**예상 결과**:
- `batch_type`: daily_full_sync
- `status`: success (또는 partial)
- `total_records`: 1000+ (데이터 크기에 따라 다름)
- `duration_ms`: 5000-60000 (5-60초)

### 4.3 주차장 데이터 확인

```sql
-- 삽입된 주차장 데이터 확인
SELECT
  COUNT(*) as total_parkings,
  COUNT(DISTINCT source_type) as sources,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM parking_lots;

-- 샘플 데이터 확인
SELECT
  name,
  address,
  latitude,
  longitude,
  source_type,
  created_at AT TIME ZONE 'Asia/Seoul' as created_at_kst
FROM parking_lots
LIMIT 5;
```

---

## 🔧 트러블슈팅

### 문제 1: 마이그레이션 실행 실패

**증상**: `CREATE EXTENSION IF NOT EXISTS pg_cron` 오류

**해결**:
1. Supabase 대시보드 → **Database** → **Extensions**
2. `pg_cron` 활성화 확인
3. `pg_net` 활성화 확인

### 문제 2: Edge Functions 배포 실패

**증상**: "Function deployment failed"

**해결**:
```bash
# 1. Node.js 버전 확인
node --version  # v18+ 필요

# 2. 환경 변수 확인
cat .env.local | grep SUPABASE

# 3. 함수 코드 문법 검사
# index.ts 파일 열어서 에러 확인
```

### 문제 3: 배치가 데이터를 가져오지 않음

**증상**: `total_records = 0`

**해결**:
1. API 키 확인: `.env.local` KOROADS_API_KEY
2. API 서버 상태 확인: https://apis.data.go.kr/B553881/Parking/PrkSttusInfo
3. 네트워크 연결 확인

---

## 📊 모니터링

### 배치 상태 대시보드

```sql
-- 지난 7일 배치 성공률
SELECT
  batch_type,
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) as success_rate
FROM batch_execution_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY batch_type, status
ORDER BY batch_type, status;
```

### 실시간 주차 현황

```sql
-- 최신 주차 현황 (1시간 이내)
SELECT
  pl.name,
  pl.address,
  pr.available_spaces,
  pr.total_spaces,
  pr.occupancy_rate,
  EXTRACT(EPOCH FROM (NOW() - pr.updated_at))/60 as minutes_ago
FROM parking_realtime_current pr
JOIN parking_lots pl ON pr.parking_lot_id = pl.id
WHERE pr.updated_at > NOW() - INTERVAL '1 hour'
LIMIT 20;
```

---

## 🎉 완료!

모든 단계를 완료하면:

✅ **자동 배치 시스템 활성화**
- 매일 03:00 AM: 전체 주차장 동기화
- 매 10분: 실시간 주차 현황 업데이트
- 매주 금요일: 신규 주차장 검색

✅ **데이터베이스 준비**
- 13만+ 주차장 기본정보 저장
- 실시간 주차 현황 추적
- 배치 실행 로그 기록

✅ **모니터링 활성화**
- 배치 성공률 추적
- 에러 알림
- 성능 지표 기록

---

## 📞 다음 단계

1. **Phase 2 준비** (2-3주 후)
   - 서울시 API 통합
   - 실시간 배치 개선
   - Redis 캐시 추가

2. **Phase 3 준비** (1개월 후)
   - 카카오맵 API 통합
   - 신규 주차장 자동 발견
   - 사용자 리뷰 연결

---

**시작 시간**: 2026-01-04
**예상 완료**: 2026-01-04 (오늘)
**비용**: ₩0 (완전 무료)

